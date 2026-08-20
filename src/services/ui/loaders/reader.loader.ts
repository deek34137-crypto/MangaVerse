import { backendClient } from "@/lib/backend-client";
import { ReaderResultViewModel, toReaderViewModel } from "../reader.viewmodel";
import { ReaderTelemetry } from "../../aggregation/types";
import { parseProviderAndId } from "@/services/manga";

export async function loadReaderPage(
  canonicalId: string,
  chapterId: string
): Promise<ReaderResultViewModel & { telemetry?: ReaderTelemetry }> {
  const start = Date.now();
  const { provider: mangaProvider, id: parsedMangaId } = parseProviderAndId(canonicalId);
  const { provider: chProvider, id: parsedChapterId } = parseProviderAndId(chapterId);

  let provider = chProvider || mangaProvider || "weebcentral";
  let targetChapterId = parsedChapterId || chapterId;
  let chapterUrl: string | undefined = undefined;

  try {
    // If chapterId is a simple number, resolve real chapterId from provider's chapter list
    if (/^\d+(\.\d+)?$/.test(targetChapterId)) {
      try {
        const rawChapters = await backendClient.getChapters(provider, parsedMangaId);
        if (rawChapters && rawChapters.length > 0) {
          const match = rawChapters.find(
            (c) =>
              c.number === targetChapterId ||
              String(c.numberValue) === targetChapterId ||
              c.id === targetChapterId
          );
          if (match) {
            targetChapterId = match.id;
            chapterUrl = match.url;
            provider = match.provider || provider;
          }
        }
      } catch {
        // ignore fallback
      }
    }

    const pages = await backendClient.getPages(provider, targetChapterId, chapterUrl);

    if (!pages || pages.length === 0) {
      return {
        type: "ERROR",
        errorMessage: `Reader Unavailable: No valid pages found for chapter ${chapterId} from provider ${provider}.`,
        chapterId,
        alternativeProviders: [],
        telemetry: {
          chapterId,
          canonicalId,
          resolvedCanonicalId: canonicalId,
          recoveryTierUsed: "TIER_1_DIRECT",
          providerCount: 0,
          healthyProviders: [],
          failedProviders: [provider],
          latencyMs: Date.now() - start,
          cacheHit: false,
          recovered: false,
          refreshTriggered: false,
        },
      };
    }

    const proxiedPages = pages.map((p) => ({
      number: p.index,
      url: backendClient.getImageProxyUrl(p.provider || provider, p.url),
    }));

    const viewModel = toReaderViewModel(
      chapterId,
      parsedMangaId || "Manga",
      `Chapter ${chapterId}`,
      proxiedPages as any,
      provider,
      false
    );

    const telemetry: ReaderTelemetry = {
      chapterId,
      canonicalId,
      resolvedCanonicalId: canonicalId,
      recoveryTierUsed: "TIER_1_DIRECT",
      providerCount: 1,
      healthyProviders: [provider],
      failedProviders: [],
      winningProviderId: provider,
      latencyMs: Date.now() - start,
      cacheHit: true,
      recovered: false,
      refreshTriggered: false,
    };

    return { ...viewModel, telemetry };
  } catch (error: any) {
    return {
      type: "ERROR",
      errorMessage: error?.message || "Failed to load reader stream.",
      chapterId,
      alternativeProviders: [],
      telemetry: {
        chapterId,
        canonicalId,
        resolvedCanonicalId: canonicalId,
        recoveryTierUsed: "TIER_1_DIRECT",
        providerCount: 0,
        healthyProviders: [],
        failedProviders: [provider],
        latencyMs: Date.now() - start,
        cacheHit: false,
        recovered: false,
        refreshTriggered: false,
      },
    };
  }
}
