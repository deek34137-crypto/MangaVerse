import { InMemoryCache } from "./memory";
import { RedisCache } from "./redis";
import type { CacheBackend } from "./interface";
import { buildCacheKey, buildUserCacheKey, getTTL, cacheTTL, CacheNamespace, CacheSection } from "@/config/cache";

let cacheBackend: CacheBackend | null = null;

function createCacheBackend(): CacheBackend {
  const redisUrl = process.env.UPSTASH_REDIS_REST_URL;
  const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN;

  if (redisUrl && redisToken) {
    console.log("[cache] Using Upstash Redis backend");
    return new RedisCache(redisUrl, redisToken);
  }

  console.log("[cache] Using InMemory cache backend (no Redis configured)");
  return new InMemoryCache();
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

export async function cacheGet<T>(key: string): Promise<T | null> {
  return getBackend().get<T>(key);
}

export async function cacheSet<T>(key: string, value: T, ttlSeconds: number): Promise<void> {
  await getBackend().set(key, value, ttlSeconds);
}

export async function cacheDel(key: string): Promise<void> {
  return getBackend().delete(key);
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
export { recordCacheHit, recordCacheMiss, recordCacheError, getCacheMetrics, getCacheHitRatio, resetCacheMetrics } from "./metrics";