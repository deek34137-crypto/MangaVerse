import { InMemoryCache } from "./memory";
import { RedisCache } from "./redis";
import type { CacheBackend } from "./interface";
import { buildCacheKey, buildUserCacheKey, getTTL, cacheTTL, CacheNamespace, CacheSection } from "@/config/cache";
import { recordL1Hit, recordL2Hit, recordDbMiss, recordInvalidation, getTieredMetrics } from "./metrics";

let cacheBackend: CacheBackend | null = null;
const l1Cache = new InMemoryCache();

function createCacheBackend(): CacheBackend {
  const redisUrl = process.env.UPSTASH_REDIS_REST_URL;
  const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN;

  if (redisUrl && redisToken) {
    console.log("[cache] Using Upstash Redis backend (L2)");
    return new RedisCache(redisUrl, redisToken);
  }

  console.log("[cache] Using InMemory cache backend (L1 only)");
  return l1Cache;
}

function getBackend(): CacheBackend {
  if (!cacheBackend) {
    cacheBackend = createCacheBackend();
  }
  return cacheBackend;
}

export function getCacheBackend(): CacheBackend {
  return getBackend();
}

/**
 * Two-Tier Cache GET (L1 In-Memory -> L2 Redis -> DB)
 */
export async function cacheGet<T>(key: string): Promise<T | null> {
  const l1Hit = await l1Cache.get<T>(key);
  if (l1Hit !== null) {
    recordL1Hit();
    return l1Hit;
  }
  const l2Backend = getBackend();
  if (l2Backend === l1Cache) {
    recordDbMiss();
    return null;
  }

  const l2Hit = await l2Backend.get<T>(key);
  if (l2Hit !== null) {
    recordL2Hit();
    await l1Cache.set(key, l2Hit, 60); // Store in L1 for 60s
    return l2Hit;
  }
  recordDbMiss();
  return null;
}

/**
 * Two-Tier Cache SET (L1 In-Memory + L2 Redis)
 */
export async function cacheSet<T>(key: string, value: T, ttlSeconds: number): Promise<void> {
  await l1Cache.set(key, value, Math.min(ttlSeconds, 60));
  const l2Backend = getBackend();
  if (l2Backend !== l1Cache) {
    await l2Backend.set(key, value, ttlSeconds);
  }
}

/**
 * Two-Tier Cache DELETE (L1 + L2)
 */
export async function cacheDel(key: string): Promise<void> {
  recordInvalidation();
  await l1Cache.delete(key);
  const l2Backend = getBackend();
  if (l2Backend !== l1Cache) {
    await l2Backend.delete(key);
  }
}

/**
 * Centralized Cache Invalidation Helpers
 */
export async function invalidateMangaCache(mangaId: string, slug?: string): Promise<void> {
  await cacheDel(`manga:detail:${mangaId}`);
  if (slug) await cacheDel(`manga:detail:${slug}`);
  await cacheDel(`manga:chapters:${mangaId}`);
}

export async function invalidateChapterCache(chapterId: string): Promise<void> {
  await cacheDel(`chapter:detail:${chapterId}`);
}

export function buildFeaturedKey(limit: number): string {
  return buildCacheKey("featured", limit);
}

export function buildLatestKey(limit: number): string {
  return buildCacheKey("latest", limit);
}

export function buildTrendingKey(limit: number): string {
  return buildCacheKey("trending", limit);
}

export function buildPopularKey(limit: number): string {
  return buildCacheKey("popular", limit);
}

export function buildContinueReadingKey(userId: string, limit: number): string {
  return buildUserCacheKey("continueReading", userId, limit);
}

export function buildRecommendationsKey(userId: string, limit: number): string {
  return buildUserCacheKey("recommendations", userId, limit);
}

export function getCacheTTL(namespace: CacheNamespace): number {
  return cacheTTL[namespace] ?? 300;
}

export { buildCacheKey, buildUserCacheKey, getTTL, cacheTTL } from "@/config/cache";
export type { CacheNamespace, CacheSection } from "@/config/cache";
export { withDeduplication, clearDeduplication, getInflightCount } from "./dedupe";
export { recordL1Hit, recordL2Hit, recordDbMiss, recordInvalidation, getTieredMetrics, resetCacheMetrics } from "./metrics";