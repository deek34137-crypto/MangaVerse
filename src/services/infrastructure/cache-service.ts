import { memoryCache, InMemoryCache } from "../cache/memory";
import { getCacheBackend } from "../cache/factory";
import type { CacheBackend } from "../cache/interface";
import { eventBus } from "./event-bus";
import type { RequestContext } from "./request-context";

export type CacheLevel = "L1" | "L2" | "L3" | "MISS";

export interface CacheGetOptions {
  ttlSeconds?: number;
  skipL1?: boolean;
  skipL2?: boolean;
}

export class MultiTierCacheService {
  private memoryCache: InMemoryCache;
  private backendCache: CacheBackend;
  private static instance: MultiTierCacheService;

  private constructor() {
    this.memoryCache = memoryCache;
    this.backendCache = getCacheBackend();
  }

  public static getInstance(): MultiTierCacheService {
    if (!MultiTierCacheService.instance) {
      MultiTierCacheService.instance = new MultiTierCacheService();
    }
    return MultiTierCacheService.instance;
  }

  /**
   * Retrieves an item from multi-tier cache.
   * Order: L1 (In-Memory LRU) -> L2 (Redis / Backend Cache) -> L3 / Fallback loader function.
   */
  public async get<T>(
    key: string,
    loader?: () => Promise<T | null>,
    options: CacheGetOptions = {},
    ctx?: RequestContext
  ): Promise<{ data: T | null; level: CacheLevel }> {
    // 1. Check L1 Memory Cache
    if (!options.skipL1) {
      const memoryValue = await this.memoryCache.get<T>(key);
      if (memoryValue !== null) {
        return { data: memoryValue, level: "L1" };
      }
    }

    // 2. Check L2 Backend Cache (Redis or fallback)
    if (!options.skipL2) {
      try {
        const redisValue = await this.backendCache.get<T>(key);
        if (redisValue !== null) {
          // Populate L1 cache for fast subsequent reads
          if (!options.skipL1) {
            await this.memoryCache.set(key, redisValue, Math.min(options.ttlSeconds || 300, 60));
          }
          return { data: redisValue, level: "L2" };
        }
      } catch (err) {
        console.warn(`[MultiTierCache] L2 Redis fetch failed for key: ${key}`, err);
      }
    }

    // 3. Fallback / Loader invocation if provided
    if (loader) {
      try {
        const freshData = await loader();
        if (freshData !== null) {
          await this.set(key, freshData, options.ttlSeconds || 300);
          return { data: freshData, level: "L3" };
        }
      } catch (err) {
        console.error(`[MultiTierCache] Loader failed for key: ${key}`, err);
      }
    }

    return { data: null, level: "MISS" };
  }

  /**
   * Writes data across L1 Memory and L2 Backend Cache.
   */
  public async set<T>(key: string, data: T, ttlSeconds: number = 300): Promise<void> {
    // Write L1 Memory (capped at 60s max for memory safety)
    const memoryTtl = Math.min(ttlSeconds, 60);
    await this.memoryCache.set(key, data, memoryTtl);

    // Write L2 Backend Cache
    try {
      await this.backendCache.set(key, data, ttlSeconds);
    } catch (err) {
      console.warn(`[MultiTierCache] L2 Redis write failed for key: ${key}`, err);
    }
  }

  /**
   * Invalidates key across L1 Memory and L2 Backend Cache.
   */
  public async del(key: string): Promise<void> {
    await this.memoryCache.delete(key);
    try {
      await this.backendCache.delete(key);
    } catch (err) {
      console.warn(`[MultiTierCache] L2 Redis delete failed for key: ${key}`, err);
    }
  }
}

export const multiTierCache = MultiTierCacheService.getInstance();
export default multiTierCache;
