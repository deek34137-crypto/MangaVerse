import { ChapterSource } from "./types";
import { providerRegistry } from "../providers";
import { RawProviderPage } from "../providers/shared/types";
import { rankChapterSources } from "./source-ranker";

export interface ReaderStreamResult {
  pages: RawProviderPage[];
  winningProviderId: string;
  hedgedRequestLaunched: boolean;
  latencyMs: number;
  traceId: string;
}

export function computeAdaptiveHedgeDelay(
  providerId: string,
  p50Ms: number = 200,
  p95Ms: number = 500
): number {
  const rawDelay = Math.max(p50Ms, Math.round(0.5 * p95Ms));
  return Math.min(750, Math.max(150, rawDelay));
}

export async function fetchReaderPagesWithHedge(
  sources: ChapterSource[],
  options?: { p50Ms?: number; p95Ms?: number }
): Promise<ReaderStreamResult> {
  if (sources.length === 0) {
    throw new Error("[ReaderFailover] No chapter sources available for reader stream.");
  }

  const ranked = rankChapterSources(sources);
  const primarySource = ranked[0];
  const secondarySource = ranked[1];

  const primaryHedgeDelay = computeAdaptiveHedgeDelay(
    primarySource.providerId,
    options?.p50Ms,
    options?.p95Ms
  );

  const start = Date.now();
  const traceId = `trace_reader_${Date.now()}`;

  let hedgedRequestLaunched = false;

  const fetchFromSource = async (src: ChapterSource): Promise<RawProviderPage[]> => {
    const provider = providerRegistry.get(src.providerId);
    if (!provider) throw new Error(`Provider ${src.providerId} not found in registry.`);
    const pages = await provider.getChapterPages(src.providerChapterId);
    if (!pages || pages.length === 0) {
      throw new Error(`Zero pages returned from provider ${src.providerId}`);
    }
    return pages;
  };

  try {
    if (!secondarySource) {
      const pages = await fetchFromSource(primarySource);
      return {
        pages,
        winningProviderId: primarySource.providerId,
        hedgedRequestLaunched: false,
        latencyMs: Date.now() - start,
        traceId,
      };
    }

    // Hedged request execution
    const primaryPromise = fetchFromSource(primarySource);

    const secondaryPromise = new Promise<RawProviderPage[]>((resolve, reject) => {
      const timer = setTimeout(async () => {
        hedgedRequestLaunched = true;
        try {
          const pages = await fetchFromSource(secondarySource);
          resolve(pages);
        } catch (e) {
          reject(e);
        }
      }, primaryHedgeDelay);

      primaryPromise
        .then(() => clearTimeout(timer))
        .catch(() => {
          // If primary fails early before timer, launch secondary immediately
          clearTimeout(timer);
          hedgedRequestLaunched = true;
          fetchFromSource(secondarySource).then(resolve).catch(reject);
        });
    });

    // Race primary vs secondary
    const pages = await Promise.race([primaryPromise, secondaryPromise]);
    const winnerId = hedgedRequestLaunched ? secondarySource.providerId : primarySource.providerId;

    return {
      pages,
      winningProviderId: winnerId,
      hedgedRequestLaunched,
      latencyMs: Date.now() - start,
      traceId,
    };
  } catch (err) {
    // Ultimate fallback: try secondary directly if primary failed
    if (secondarySource) {
      const pages = await fetchFromSource(secondarySource);
      return {
        pages,
        winningProviderId: secondarySource.providerId,
        hedgedRequestLaunched: true,
        latencyMs: Date.now() - start,
        traceId,
      };
    }
    throw err;
  }
}
