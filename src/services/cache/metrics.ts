export interface TieredCacheMetrics {
  l1Hits: number;
  l2Hits: number;
  dbMisses: number;
  invalidations: number;
  evictions: number;
  errors: number;
}

const metrics: TieredCacheMetrics = {
  l1Hits: 0,
  l2Hits: 0,
  dbMisses: 0,
  invalidations: 0,
  evictions: 0,
  errors: 0,
};

export function recordL1Hit(): void {
  metrics.l1Hits++;
}

export function recordL2Hit(): void {
  metrics.l2Hits++;
}

export function recordDbMiss(): void {
  metrics.dbMisses++;
}

export function recordInvalidation(): void {
  metrics.invalidations++;
}

export function recordEviction(): void {
  metrics.evictions++;
}

export function recordCacheError(): void {
  metrics.errors++;
}

export function getTieredMetrics() {
  const total = metrics.l1Hits + metrics.l2Hits + metrics.dbMisses;
  return {
    ...metrics,
    totalRequests: total,
    l1HitRatio: total > 0 ? Number((metrics.l1Hits / total).toFixed(3)) : 0,
    l2HitRatio: total > 0 ? Number((metrics.l2Hits / total).toFixed(3)) : 0,
    dbMissRatio: total > 0 ? Number((metrics.dbMisses / total).toFixed(3)) : 0,
    overallHitRatio: total > 0 ? Number(((metrics.l1Hits + metrics.l2Hits) / total).toFixed(3)) : 0,
  };
}

export function resetCacheMetrics(): void {
  metrics.l1Hits = 0;
  metrics.l2Hits = 0;
  metrics.dbMisses = 0;
  metrics.invalidations = 0;
  metrics.evictions = 0;
  metrics.errors = 0;
}