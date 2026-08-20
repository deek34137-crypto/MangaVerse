import { NormalizedSearchResult, SearchApiResponse } from "../../types";
import { adapterRegistry } from "../adapters";
import { healthManager } from "../health/health-manager";
import { edgeCache, CACHE_TTL } from "../cache/edge-cache";

const DISCRIMINATOR_KEYWORDS = [
  "ragnarok",
  "side story",
  "gaiden",
  "prequel",
  "sequel",
  "remake",
  "reboot",
  "season 2",
  "season 3",
  "season 4",
  "part 2",
  "part 3",
  "alternative",
  "spin-off",
  "spinoff",
  "academy",
  "anthology",
];

function normalizeTitle(rawTitle: string): string {
  return rawTitle
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function extractDiscriminators(rawTitle: string): string[] {
  const lower = rawTitle.toLowerCase();
  return DISCRIMINATOR_KEYWORDS.filter((keyword) => lower.includes(keyword));
}

function areTitlesEquivalent(titleA: string, titleB: string): boolean {
  const normA = normalizeTitle(titleA);
  const normB = normalizeTitle(titleB);

  if (normA === normB) return true;

  // Check if discriminators conflict
  const discA = extractDiscriminators(titleA);
  const discB = extractDiscriminators(titleB);

  // If one has a discriminator that the other does not have, they are NOT equivalent
  if (discA.length !== discB.length) return false;
  for (const d of discA) {
    if (!discB.includes(d)) return false;
  }

  // Exact word boundary containment if title lengths are close
  if (normA.length > 5 && normB.length > 5) {
    if (normA.startsWith(normB) || normB.startsWith(normA)) {
      const lenDiff = Math.abs(normA.length - normB.length);
      return lenDiff <= 4;
    }
  }

  return false;
}

export async function executeBoundedSearch(
  query: string,
  targetSource?: string,
  limit: number = 24
): Promise<SearchApiResponse> {
  const cacheKey = `search:${targetSource || "all"}:${query.trim().toLowerCase()}:${limit}`;
  const cached = await edgeCache.get<SearchApiResponse>(cacheKey);
  if (cached) return cached;

  const completedSources: string[] = [];
  const failedSources: string[] = [];
  const skippedSources: string[] = [];

  // Single source search
  if (targetSource && targetSource !== "all") {
    const adapter = adapterRegistry.get(targetSource);
    if (!adapter) {
      return {
        results: [],
        totalResults: 0,
        sources: {
          completed: [],
          failed: [targetSource],
          skipped: [],
        },
      };
    }

    const tStart = Date.now();
    try {
      const results = await adapter.search(query, { limit });
      healthManager.recordSuccess(adapter.id, Date.now() - tStart);
      const response: SearchApiResponse = {
        results,
        totalResults: results.length,
        sources: {
          completed: [adapter.id],
          failed: [],
          skipped: [],
        },
      };
      await edgeCache.set(cacheKey, response, CACHE_TTL.SEARCH);
      return response;
    } catch (err: any) {
      healthManager.recordFailure(adapter.id, err.message);
      return {
        results: [],
        totalResults: 0,
        sources: {
          completed: [],
          failed: [adapter.id],
          skipped: [],
        },
      };
    }
  }

  // Multi-source Bounded Aggregation
  // Order: Tier 1 first, then Tier 2
  const tier1 = adapterRegistry.getTier1();
  const tier2 = adapterRegistry.getTier2();
  const allTargetAdapters = [...tier1, ...tier2];

  const rawResults: NormalizedSearchResult[] = [];
  const CONCURRENCY_LIMIT = 4;
  const MIN_PROVIDERS_RESPONDED = 3;
  const MIN_RESULTS_COUNT = limit;

  let activeIndex = 0;

  async function worker(): Promise<void> {
    while (activeIndex < allTargetAdapters.length) {
      // Early exit check
      if (
        completedSources.length >= MIN_PROVIDERS_RESPONDED &&
        rawResults.length >= MIN_RESULTS_COUNT
      ) {
        break;
      }

      const currentIndex = activeIndex++;
      if (currentIndex >= allTargetAdapters.length) break;

      const adapter = allTargetAdapters[currentIndex];
      const tStart = Date.now();

      try {
        const results = await adapter.search(query, { limit: 12 });
        healthManager.recordSuccess(adapter.id, Date.now() - tStart);
        completedSources.push(adapter.id);
        rawResults.push(...results);
      } catch (err: any) {
        healthManager.recordFailure(adapter.id, err.message);
        failedSources.push(adapter.id);
      }
    }
  }

  // Launch bounded worker pool
  const workers = Array.from({ length: CONCURRENCY_LIMIT }, () => worker());
  await Promise.all(workers);

  // Track skipped adapters
  allTargetAdapters.forEach((a) => {
    if (!completedSources.includes(a.id) && !failedSources.includes(a.id)) {
      skippedSources.push(a.id);
    }
  });

  // Layered Deduplication & Merging
  const deduplicatedResults: NormalizedSearchResult[] = [];

  for (const item of rawResults) {
    const existingIndex = deduplicatedResults.findIndex((existing) =>
      areTitlesEquivalent(existing.title, item.title)
    );

    if (existingIndex >= 0) {
      const existing = deduplicatedResults[existingIndex];
      // Merge alt titles
      const mergedAlt = Array.from(
        new Set([...(existing.altTitles || []), ...(item.altTitles || []), item.title])
      );
      existing.altTitles = mergedAlt;
      // Prefer cover image if missing
      if (!existing.coverImage && item.coverImage) {
        existing.coverImage = item.coverImage;
      }
    } else {
      deduplicatedResults.push({
        ...item,
        altTitles: item.altTitles || [],
      });
    }
  }

  const finalResults = deduplicatedResults.slice(0, limit);

  const response: SearchApiResponse = {
    results: finalResults,
    totalResults: finalResults.length,
    sources: {
      completed: completedSources,
      failed: failedSources,
      skipped: skippedSources,
    },
  };

  await edgeCache.set(cacheKey, response, CACHE_TTL.SEARCH);
  return response;
}
