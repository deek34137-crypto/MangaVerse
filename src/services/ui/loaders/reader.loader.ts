import { backendClient } from "@/lib/backend-client";
import { ReaderResultViewModel, toReaderViewModel } from "../reader.viewmodel";
import { ReaderTelemetry } from "../../aggregation/types";

function parseProviderAndId(rawStr: string): { provider: string; id: string } {
  if (rawStr.includes("_")) {
    const parts = rawStr.split("_");
    const provider = parts[0];
    const id = parts.slice(1).join("_");
    return { provider, id };
  }
  return { provider: "weebcentral", id: rawStr };
}

export async function loadReaderPage(
  canonicalId: string,
  chapterId: string
): Promise<ReaderResultViewModel & { telemetry?: ReaderTelemetry }> {
  const start = Date.now();
  const { provider: mangaProvider, id: parsedMangaId } = parseProviderAndId(canonicalId);
  const { provider: chProvider, id: parsedChapterId } = parseProviderAndId(chapterId);

  const provider = chProvider || mangaProvider || "weebcentral";
  const targetChapterId = parsedChapterId || chapterId;

  try {
    const pages = await backendClient.getPages(provider, targetChapterId);

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
