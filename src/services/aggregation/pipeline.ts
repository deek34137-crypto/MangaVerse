import { providerRegistry } from "../providers";
import { RawProviderManga, RawProviderChapter } from "../providers/shared/types";
import { mergeMangaEntities, ProviderMangaInput } from "./merge-engine";
import { evaluateMergeDecision, buildMangaFingerprint } from "./entity-engine";
import { aggregateChapters } from "./chapter-aggregator";
import { CanonicalManga, CanonicalChapter } from "./types";
import { cacheGet, cacheSet } from "@/services/cache";
import { snapshotStorage } from "./snapshot-engine";
import { refreshQueue } from "./refresh-queue";
import { metricsCollector } from "./metrics-collector";

export class AggregationPipeline {
  /**
   * Internal pipeline: Multi-provider search and canonical grouping
   */
  public async executeSearch(query: string, limit: number = 20): Promise<CanonicalManga[]> {
    const cacheKey = `agg:search:${query.trim().toLowerCase()}`;
    const cached = await cacheGet<CanonicalManga[]>(cacheKey);
    if (cached) {
      metricsCollector.recordRequest(true);
      return cached;
    }

    metricsCollector.recordRequest(false);
    const providers = providerRegistry.getEnabled();

    // Query all enabled providers in parallel
    const searchPromises = providers.map(async (provider) => {
      const start = Date.now();
      try {
        const results = await provider.searchManga(query, { limit: 5 });
        return {
          providerId: provider.name,
          results,
          latencyMs: Date.now() - start,
          circuitState: "CLOSED" as const,
        };
      } catch {
        return {
          providerId: provider.name,
          results: [] as RawProviderManga[],
          latencyMs: Date.now() - start,
          circuitState: "OPEN" as const,
        };
      }
    });

    const providerOutputs = await Promise.all(searchPromises);

    // Group raw results into candidate clusters using 3-tier merge decision
    const clusters: ProviderMangaInput[][] = [];

    providerOutputs.forEach((out) => {
      out.results.forEach((manga) => {
        const inputItem: ProviderMangaInput = {
          providerId: out.providerId,
          data: manga,
          latencyMs: out.latencyMs,
          circuitState: out.circuitState,
        };

        const currentFp = buildMangaFingerprint(manga);
        let matchedCluster: ProviderMangaInput[] | undefined;

        for (const cluster of clusters) {
          const repFp = buildMangaFingerprint(cluster[0].data);
          const decision = evaluateMergeDecision(currentFp, repFp);
          if (decision === "AUTO_MERGE" || decision === "CANDIDATE_MERGE") {
            matchedCluster = cluster;
            break;
          }
        }

        if (matchedCluster) {
          matchedCluster.push(inputItem);
        } else {
          clusters.push([inputItem]);
        }
      });
    });

    // Merge each cluster into a CanonicalManga and record metrics
    const canonicals: CanonicalManga[] = clusters
      .map((cluster) => {
        const { canonical } = mergeMangaEntities(cluster);

        metricsCollector.recordMergeEvent({
          canonicalId: canonical.canonicalId,
          decision: cluster.length > 1 ? "AUTO_MERGE" : "SEPARATE_SERIES",
          providerCount: cluster.length,
          providerIds: cluster.map((c) => c.providerId),
        });

        // Asynchronously store snapshot
        snapshotStorage.saveMangaSnapshot(canonical).catch(() => {});
        return canonical;
      })
      .filter((c) => c.qualityTier !== "TIER_C_HIDDEN");

    const finalResult = canonicals.slice(0, limit);
    await cacheSet(cacheKey, finalResult, 300000); // 5 min TTL
    return finalResult;
  }

  /**
   * Internal pipeline: Detail fetching with Snapshot & SWR refresh
   */
  public async executeGetManga(canonicalId: string): Promise<CanonicalManga | null> {
    const snap = await snapshotStorage.getMangaSnapshot(canonicalId);
    if (snap) {
      metricsCollector.recordRequest(true);

      // SWR Non-Blocking Refresh Trigger: If snapshot is STALE, enqueue background refresh!
      if (snap.state === "STALE") {
        metricsCollector.recordSWRRefresh("ENQUEUED");
        refreshQueue.enqueueRefresh(canonicalId, async (id) => {
          const fresh = await this.executeSearch("", 50);
          return fresh.find((c) => c.canonicalId === id) || null;
        }).then((enqueued) => {
          if (enqueued) metricsCollector.recordSWRRefresh("COMPLETED");
        }).catch(() => {
          metricsCollector.recordSWRRefresh("FAILED");
        });
      }

      return snap.data;
    }

    metricsCollector.recordRequest(false);
    // Search fallback to resolve canonical ID
    const searchRes = await this.executeSearch("", 50);
    const targetNorm = canonicalId.trim().toLowerCase().replace(/[^a-z0-9]/g, "");
    const found = searchRes.find((c) => {
      if (c.canonicalId === canonicalId) return true;
      const titleNorm = c.title.value.toLowerCase().replace(/[^a-z0-9]/g, "");
      return titleNorm === targetNorm || c.canonicalId.replace(/[^a-z0-9]/g, "") === targetNorm;
    });

    if (found) {
      await snapshotStorage.saveMangaSnapshot(found);
      return found;
    }

    return null;
  }

  /**
   * Internal pipeline: Cross-provider chapter aggregation with snapshot caching
   */
  public async executeGetChapters(canonical: CanonicalManga): Promise<CanonicalChapter[]> {
    const snap = await snapshotStorage.getChaptersSnapshot(canonical.canonicalId);
    if (snap) {
      metricsCollector.recordRequest(true);
      return snap.data;
    }

    metricsCollector.recordRequest(false);
    const chapterPromises = canonical.providerMappings.map(async (mapping) => {
      const provider = providerRegistry.get(mapping.providerId);
      if (!provider) return { providerId: mapping.providerId, chapters: [] as RawProviderChapter[] };

      try {
        const chapters = await provider.getChapters(mapping.providerMangaId);
        return { providerId: mapping.providerId, chapters };
      } catch {
        return { providerId: mapping.providerId, chapters: [] as RawProviderChapter[] };
      }
    });

    const providerChapters = await Promise.all(chapterPromises);
    const canonicalChapters = aggregateChapters(canonical.canonicalId, providerChapters);

    canonicalChapters.forEach((ch) => {
      metricsCollector.recordChapterMerge(ch.sources.length);
    });

    await snapshotStorage.saveChaptersSnapshot(canonical.canonicalId, canonicalChapters);
    return canonicalChapters;
  }

  public async invalidateCache(canonicalId: string): Promise<string[]> {
    return snapshotStorage.invalidateCascade(canonicalId);
  }
}
