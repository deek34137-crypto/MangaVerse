import { CacheBackend } from "./interface";
import { InMemoryCache, memoryCache } from "./memory";
import { RedisCache } from "./redis";
import { buildCacheKey, getTTL, CacheNamespace } from "@/config/cache";

let backend: CacheBackend | null = null;

export function getCacheBackend(): CacheBackend {
  if (backend) return backend;

  const hasRedis = process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN;

  if (hasRedis) {
    try {
      const url = process.env.UPSTASH_REDIS_REST_URL!;
      const token = process.env.UPSTASH_REDIS_REST_TOKEN!;
      backend = new RedisCache(url, token);
      console.log("[cache] Using Redis backend (Upstash)");
    } catch (e) {
      console.warn("[cache] Redis init failed, falling back to memory:", e);
      backend = memoryCache;
    }
  } else {
    backend = memoryCache;
    console.log("[cache] Using in-memory backend");
  }

  return backend;
}

export async function cacheSet<T>(key: string, value: T, ttlSeconds: number): Promise<void> {
  const backend = getCacheBackend();
  await backend.set(key, value, ttlSeconds);
}

export async function cacheDelete(key: string): Promise<void> {
  const backend = getCacheBackend();
  await backend.delete(key);
}

export function buildKey(namespace: CacheNamespace, options: { limit?: number; userId?: string } = {}): string {
  return buildCacheKey(namespace, options.limit ?? 10);
}

export function getTtlForNamespace(namespace: CacheNamespace): number {
  return getTTL(namespace);
}

export function clearCache(): Promise<void> {
  const backend = getCacheBackend();
  return backend.clear();
}