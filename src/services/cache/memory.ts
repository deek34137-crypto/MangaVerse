import { CacheBackend, CacheMetrics, createMetrics, recordHit, recordMiss, recordError, getHitRatio } from "./interface";

export interface MemoryCacheEntry<T> {
  value: T;
  expiresAt: number;
}

export class InMemoryCache implements CacheBackend {
  private store = new Map<string, MemoryCacheEntry<any>>();
  private metrics: CacheMetrics;
  private cleanupInterval: ReturnType<typeof setInterval> | null = null;

  constructor(private maxEntries = 1000, private cleanupIntervalMs = 60000) {
    this.metrics = createMetrics();
    this.startCleanup();
  }

  async get<T>(key: string): Promise<T | null> {
    const entry = this.store.get(key);
    if (!entry) {
      return null;
    }

    if (Date.now() > entry.expiresAt) {
      this.store.delete(key);
      recordMiss(this.metrics);
      return null;
    }

    return entry.value as T;
  }

  async set<T>(key: string, value: T, ttlSeconds: number): Promise<void> {
    if (this.store.size >= this.maxEntries) {
      this.evictOldest();
    }

    this.store.set(key, {
      value,
      expiresAt: Date.now() + ttlSeconds * 1000,
    });
  }

  async delete(key: string): Promise<void> {
    this.store.delete(key);
  }

  async getMetrics(): Promise<CacheMetrics | null> {
    return { ...this.metrics };
  }

  getHitRatio(): number {
    return getHitRatio(this.metrics);
  }

  getSize(): number {
    return this.store.size;
  }

  private evictOldest(): void {
    let oldestKey: string | null = null;
    let oldestTime = Infinity;

    for (const [key, entry] of this.store.entries()) {
      if (entry.expiresAt < oldestTime) {
        oldestTime = entry.expiresAt;
        oldestKey = key;
      }
    }

    if (oldestKey) {
      this.store.delete(oldestKey);
    }
  }

  private startCleanup(): void {
    this.cleanupInterval = setInterval(() => {
      const now = Date.now();
      for (const [key, entry] of this.store.entries()) {
        if (now > entry.expiresAt) {
          this.store.delete(key);
        }
      }
    }, this.cleanupIntervalMs);
  }

  stop(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
  }

  async clear(): Promise<void> {
    this.store.clear();
  }
}

export const memoryCache = new InMemoryCache();