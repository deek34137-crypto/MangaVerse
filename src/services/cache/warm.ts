import {
  cacheSet,
  buildFeaturedKey,
  buildTrendingKey,
  buildPopularKey,
  buildLatestKey,
} from "@/services/cache";
import { getFeatured, getTrending, getPopular, getLatest } from "@/services/home";

export async function warmHomepageCache(): Promise<void> {
  console.log("[cache-warming] Starting homepage cache warming...");

  const sections = [
    { key: "featured", limit: 6, fetchFn: () => getFeatured(6), ttl: 3600, cacheKey: buildFeaturedKey(6) },
    { key: "trending", limit: 10, fetchFn: () => getTrending(10), ttl: 300, cacheKey: buildTrendingKey(10) },
    { key: "popular", limit: 10, fetchFn: () => getPopular(10), ttl: 900, cacheKey: buildPopularKey(10) },
    { key: "latest", limit: 10, fetchFn: () => getLatest(10), ttl: 120, cacheKey: buildLatestKey(10) },
  ];

  const results = await Promise.allSettled(
    sections.map(async ({ key, fetchFn, ttl, cacheKey }) => {
      try {
        const data = await fetchFn();
        if (data.manga.length > 0) {
          await cacheSet(cacheKey, { manga: data.manga, total: data.total }, ttl);
          return { key, success: true, count: data.manga.length };
        }
        return { key, success: false, count: 0 };
      } catch (error) {
        console.error(`[cache-warming] Failed to warm ${key}:`, error);
        return { key, success: false, error: String(error) };
      }
    })
  );

  const summary = results.map(r => 
    r.status === "fulfilled" ? r.value : { key: "unknown", success: false, reason: r.reason }
  );

  console.log("[cache-warming] Completed", summary);
}

export async function warmCacheForManga(mangaId: string): Promise<void> {
  const { cacheDel } = await import("@/services/cache");
  await cacheDel(`manga:${mangaId}`);
}

export async function invalidateHomepageCache(): Promise<void> {
  const { cacheDel } = await import("@/services/cache");
  await cacheDel(buildFeaturedKey(6));
  await cacheDel(buildTrendingKey(10));
  await cacheDel(buildPopularKey(10));
  await cacheDel(buildLatestKey(10));
}