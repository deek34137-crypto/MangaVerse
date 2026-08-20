import {
  ChapterPageCountItem,
  PageCountResolution,
  ProviderAdapter,
  ProviderReference,
} from "../../types";
import { adapterRegistry } from "../adapters";
import { edgeCache } from "../cache/edge-cache";

const PAGE_COUNT_RESOLVED_TTL = 14 * 24 * 3600; // 14 days
const PAGE_COUNT_UNAVAILABLE_TTL = 3600; // 1 hour

export class PageCountResolver {
  /**
   * Resolve page count for a single chapter reference.
   */
  public async resolve(
    chapter: ProviderReference,
    adapter?: ProviderAdapter
  ): Promise<PageCountResolution> {
    const cacheKey = `mangahub:pagecount:${chapter.provider}:${chapter.id}`;

    // 1. Check Edge Cache
    const cached = await edgeCache.get<PageCountResolution>(cacheKey);
    if (cached && (cached.status === "resolved" || cached.status === "unavailable")) {
      return cached;
    }

    const effectiveAdapter = adapter || adapterRegistry.get(chapter.provider);
    if (!effectiveAdapter) {
      return { status: "unavailable" };
    }

    try {
      const pages = await effectiveAdapter.getPages({
        provider: chapter.provider,
        id: chapter.id,
      });

      if (pages && pages.length > 0) {
        const resolution: PageCountResolution = {
          status: "resolved",
          count: pages.length,
        };
        // Cache successful resolution for 14-30 days
        await edgeCache.set(cacheKey, resolution, PAGE_COUNT_RESOLVED_TTL);
        return resolution;
      } else {
        const resolution: PageCountResolution = { status: "unavailable" };
        // Short-lived cache for unavailable (1 hour)
        await edgeCache.set(cacheKey, resolution, PAGE_COUNT_UNAVAILABLE_TTL);
        return resolution;
      }
    } catch (err: any) {
      // Never cache transient provider failures!
      return { status: "failed", error: err?.message || "Scrape timeout" };
    }
  }

  /**
   * Bounded batch page count resolution for up to 30 chapters with max 4 concurrency.
   */
  public async resolveBatch(
    items: ChapterPageCountItem[],
    maxBatchSize = 30,
    maxConcurrency = 4
  ): Promise<{ chapterId: string; provider: string; pageCount: number | null }[]> {
    const safeItems = items.slice(0, maxBatchSize);
    const results: { chapterId: string; provider: string; pageCount: number | null }[] = [];

    // Worker pool for bounded concurrency
    let currentIndex = 0;
    const worker = async () => {
      while (currentIndex < safeItems.length) {
        const index = currentIndex++;
        const item = safeItems[index];
        if (!item) break;

        try {
          const adapter = adapterRegistry.get(item.provider);
          const resolution = await this.resolve(
            { provider: item.provider, id: item.id },
            adapter
          );

          results[index] = {
            chapterId: item.id,
            provider: item.provider,
            pageCount: resolution.status === "resolved" ? resolution.count : null,
          };
        } catch {
          results[index] = {
            chapterId: item.id,
            provider: item.provider,
            pageCount: null,
          };
        }
      }
    };

    const pool = Array.from(
      { length: Math.min(maxConcurrency, safeItems.length) },
      () => worker()
    );
    await Promise.all(pool);

    return results;
  }
}

export const pageCountResolver = new PageCountResolver();
