export interface CacheBackend {
  get<T>(key: string): Promise<T | null>;
  set<T>(key: string, value: T, ttlSeconds: number): Promise<void>;
  delete(key: string): Promise<void>;
  clear(): Promise<void>;
}

export interface CacheBackendFactory {
  create(): CacheBackend;
}

export interface CacheMetrics {
  hits: number;
  misses: number;
  errors: number;
}

export function createMetrics(): CacheMetrics {
  return { hits: 0, misses: 0, errors: 0 };
}

export function recordHit(metrics: CacheMetrics): void {
  metrics.hits++;
}

export function recordMiss(metrics: CacheMetrics): void {
  metrics.misses++;
}

export function recordError(metrics: CacheMetrics): void {
  metrics.errors++;
}

export function getHitRatio(metrics: CacheMetrics): number {
  const total = metrics.hits + metrics.misses;
  return total > 0 ? metrics.hits / total : 0;
}