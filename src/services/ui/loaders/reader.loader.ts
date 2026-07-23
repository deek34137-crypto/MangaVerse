import { aggregator } from "../../aggregation/aggregator";
import { snapshotStorage } from "../../aggregation/snapshot-engine";
import { ReaderResultViewModel, toReaderViewModel } from "../reader.viewmodel";
import { CanonicalChapter, ChapterSource, ReaderTelemetry, ProviderFingerprint } from "../../aggregation/types";

// Refresh Request Coalescing (Inflight Promise Deduplication)
const inflightRefreshes = new Map<string, Promise<any>>();

export async function loadReaderPage(
  canonicalId: string,
  chapterId: string
): Promise<ReaderResultViewModel & { telemetry?: ReaderTelemetry }> {
  const start = Date.now();
  let recoveryTier: ReaderTelemetry["recoveryTierUsed"] = "TIER_1_DIRECT";
  let resolvedMangaId = canonicalId;
  let targetChapter: CanonicalChapter | undefined = undefined;
  let chapters: CanonicalChapter[] = [];

  try {
    // --- TIER 1: Direct canonicalId Snapshot Search ---
    if (canonicalId && canonicalId !== "manga_default") {
      chapters = await aggregator.getChapters(canonicalId);
      targetChapter = chapters.find((c) => (c.canonicalChapterId || c.id) === chapterId);
    }

    // --- TIER 2: Reverse Lookup Index Search (chapter_lookup:{chapterId}) ---
    if ((!targetChapter || targetChapter.sources.length === 0) && chapterId) {
      const lookup = await snapshotStorage.getChapterLookup(chapterId);
      if (lookup) {
        recoveryTier = "TIER_2_REVERSE_LOOKUP";
        resolvedMangaId = lookup.canonicalMangaId;
        chapters = await aggregator.getChapters(resolvedMangaId);
        targetChapter = chapters.find((c) => (c.canonicalChapterId || c.id) === chapterId);

        // If targetChapter still missing from array but fingerprints exist, reconstruct chapter sources directly
        if (!targetChapter && lookup.providerFingerprints && lookup.providerFingerprints.length > 0) {
          const reconstructedSources: ChapterSource[] = lookup.providerFingerprints.map((fp: ProviderFingerprint) => ({
            providerId: fp.providerId,
            providerChapterId: fp.sourceId,
            sourceScore: 0.90,
            url: fp.chapterUrl,
          }));

          targetChapter = {
            id: chapterId,
            canonicalChapterId: chapterId,
            aggregationVersion: "1.0",
            canonicalMangaId: resolvedMangaId,
            chapterNumber: lookup.chapterNumber,
            key: { chapter: lookup.chapterNumber || 1, key: `c${(lookup.chapterNumber || 1).toString().padStart(4, "0")}` },
            title: lookup.title || `Chapter ${lookup.chapterNumber || 1}`,
            sources: reconstructedSources,
            providerIds: Array.from(new Set(reconstructedSources.map((s) => s.providerId))),
            updatedAt: lookup.updatedAt,
            lastValidated: lookup.updatedAt,
            traceId: `trace_rec_${chapterId}`,
          };
        }

        if (targetChapter && targetChapter.sources.length > 0) {
          // Trigger Event-Driven Asynchronous Background Repair
          snapshotStorage.triggerAsyncRepair(resolvedMangaId, chapterId);
        }
      }
    }

    // --- TIER 3: Global Snapshot Cluster Search ---
    if (!targetChapter || targetChapter.sources.length === 0) {
      const candidates = await aggregator.search("", { limit: 20 });
      for (const cand of candidates) {
        const candChs = await aggregator.getChapters(cand.canonicalId);
        const match = candChs.find((c) => (c.canonicalChapterId || c.id) === chapterId);
        if (match && match.sources.length > 0) {
          recoveryTier = "TIER_3_CLUSTER_SEARCH";
          resolvedMangaId = cand.canonicalId;
          chapters = candChs;
          targetChapter = match;
          snapshotStorage.triggerAsyncRepair(resolvedMangaId, chapterId);
          break;
        }
      }
    }

    // --- TIER 4: Deduplicated Pipeline Refresh (Inflight Promise Coalescing) ---
    if (!targetChapter || targetChapter.sources.length === 0) {
      recoveryTier = "TIER_4_COALESCED_REFRESH";
      const refreshKey = `refresh:${resolvedMangaId}:${chapterId}`;

      let refreshPromise = inflightRefreshes.get(refreshKey);
      if (!refreshPromise) {
        refreshPromise = aggregator.refresh(resolvedMangaId).finally(() => {
          inflightRefreshes.delete(refreshKey);
        });
        inflightRefreshes.set(refreshKey, refreshPromise);
      }

      await refreshPromise;
      chapters = await aggregator.getChapters(resolvedMangaId);
      targetChapter = chapters.find((c) => (c.canonicalChapterId || c.id) === chapterId);
    }

    // --- FINAL EVALUATION & READER STREAM FETCH ---
    if (!targetChapter || targetChapter.sources.length === 0) {
      const telemetry: ReaderTelemetry = {
        chapterId,
        canonicalId,
        resolvedCanonicalId: resolvedMangaId,
        recoveryTierUsed: recoveryTier,
        providerCount: 0,
        healthyProviders: [],
        failedProviders: [],
        latencyMs: Date.now() - start,
        cacheHit: false,
        recovered: false,
        refreshTriggered: true,
      };

      return {
        type: "ERROR",
        errorMessage: `Reader Unavailable: No valid provider sources found for chapter ${chapterId} (Resolved Manga: ${resolvedMangaId}).`,
        chapterId,
        alternativeProviders: [],
        telemetry,
      };
    }

    const streamResult = await aggregator.getReader(targetChapter.sources);

    const targetIdx = chapters.findIndex((c) => (c.canonicalChapterId || c.id) === (targetChapter!.canonicalChapterId || targetChapter!.id));
    const nextChapterId = targetIdx > 0 ? (chapters[targetIdx - 1].canonicalChapterId || chapters[targetIdx - 1].id) : undefined;
    const prevChapterId = targetIdx < chapters.length - 1 ? (chapters[targetIdx + 1].canonicalChapterId || chapters[targetIdx + 1].id) : undefined;

    const viewModel = toReaderViewModel(
      chapterId,
      "Manga Title",
      targetChapter.title || `Chapter ${targetChapter.chapterNumber}`,
      streamResult.pages,
      streamResult.winningProviderId,
      streamResult.hedgedRequestLaunched,
      nextChapterId,
      prevChapterId
    );

    const telemetry: ReaderTelemetry = {
      chapterId,
      canonicalId,
      resolvedCanonicalId: resolvedMangaId,
      recoveryTierUsed: recoveryTier,
      providerCount: targetChapter.sources.length,
      healthyProviders: Array.from(new Set(targetChapter.sources.map((s) => s.providerId))),
      failedProviders: [],
      winningProviderId: streamResult.winningProviderId,
      latencyMs: Date.now() - start,
      cacheHit: recoveryTier === "TIER_1_DIRECT",
      recovered: recoveryTier !== "TIER_1_DIRECT",
      refreshTriggered: recoveryTier === "TIER_4_COALESCED_REFRESH",
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
        resolvedCanonicalId: resolvedMangaId,
        recoveryTierUsed: recoveryTier,
        providerCount: 0,
        healthyProviders: [],
        failedProviders: [],
        latencyMs: Date.now() - start,
        cacheHit: false,
        recovered: false,
        refreshTriggered: true,
      },
    };
  }
}
