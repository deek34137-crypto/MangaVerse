interface CacheEntry<T> {
  value: T;
  expiresAt: number;
}

export class EdgeCacheManager {
  private memoryCache = new Map<string, CacheEntry<any>>();
  private maxMemoryEntries = 500;

  public async get<T>(key: string): Promise<T | null> {
    const now = Date.now();
    const entry = this.memoryCache.get(key);

    if (entry) {
      if (entry.expiresAt > now) {
        return entry.value as T;
      }
      this.memoryCache.delete(key);
    }

    return null;
  }

  public async set<T>(key: string, value: T, ttlSeconds: number): Promise<void> {
    const now = Date.now();
    const expiresAt = now + ttlSeconds * 1000;

    // Prune oldest if oversized
    if (this.memoryCache.size >= this.maxMemoryEntries) {
      const oldestKey = this.memoryCache.keys().next().value;
      if (oldestKey) this.memoryCache.delete(oldestKey);
    }

    this.memoryCache.set(key, { value, expiresAt });
  }

  public async delete(key: string): Promise<void> {
    this.memoryCache.delete(key);
  }

  public async clear(): Promise<void> {
    this.memoryCache.clear();
  }
}

export const edgeCache = new EdgeCacheManager();

export const CACHE_TTL = {
  FRONTPAGE: 600,     // 10 minutes
  SEARCH: 900,        // 15 minutes
  MANGA_DETAIL: 7200, // 2 hours
  CHAPTERS: 900,      // 15 minutes
  PAGES: 7200,        // 2 hours
  HEALTH: 300,        // 5 minutes
};
