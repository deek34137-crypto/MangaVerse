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

export function hitRatio(metrics: CacheMetrics): number {
  const total = metrics.hits + metrics.misses;
  return total > 0 ? metrics.hits / total : 0;
}

const metrics = createMetrics();

export function recordCacheHit(): void {
  recordHit(metrics);
}

export function recordCacheMiss(): void {
  recordMiss(metrics);
}

export function recordCacheError(): void {
  recordError(metrics);
}

export function getCacheMetrics(): CacheMetrics {
  return { ...metrics };
}

export function getCacheHitRatio(): number {
  const total = metrics.hits + metrics.misses;
  return total > 0 ? metrics.hits / total : 0;
}

export function resetCacheMetrics(): void {
  metrics.hits = 0;
  metrics.misses = 0;
  metrics.errors = 0;
}