import { AggregationPipeline } from "./pipeline";
import { fetchReaderPagesWithHedge, ReaderStreamResult } from "./reader-failover";
import { CanonicalManga, CanonicalChapter, BusinessMetrics, InfrastructureMetrics } from "./types";
import { SearchOptions } from "../providers/shared/types";
import { metricsCollector } from "./metrics-collector";
import { snapshotStorage } from "./snapshot-engine";
import { refreshQueue } from "./refresh-queue";
import { recommendationEngine } from "./recommendation-engine";

import { acquireLock, releaseLock } from "@/lib/lock";

export class AggregatorFacade {
  private pipeline: AggregationPipeline;

  constructor() {
    this.pipeline = new AggregationPipeline();
  }

  public async search(query: string, options?: SearchOptions): Promise<CanonicalManga[]> {
    return this.pipeline.executeSearch(query, options?.limit ?? 20);
  }

  public async getManga(canonicalId: string): Promise<CanonicalManga | null> {
    return this.pipeline.executeGetManga(canonicalId);
  }

  public async getChapters(canonicalId: string): Promise<CanonicalChapter[]> {
    const manga = await this.getManga(canonicalId);
    if (!manga) return [];
    return this.pipeline.executeGetChapters(manga);
  }

  public async getReader(
    chapterSources: CanonicalChapter["sources"],
    options?: { p50Ms?: number; p95Ms?: number }
  ): Promise<ReaderStreamResult> {
    const result = await fetchReaderPagesWithHedge(chapterSources, options);
    metricsCollector.recordReaderFailover(result.hedgedRequestLaunched);
    return result;
  }

  public async refresh(canonicalId: string): Promise<CanonicalManga | null> {
    const lockKey = `agg:refresh:${canonicalId}`;
    const locked = await acquireLock(lockKey, 30);
    if (!locked) {
      const existing = await this.getManga(canonicalId);
      if (existing) return existing;
    }
    try {
      await this.pipeline.invalidateCache(canonicalId);
      return await this.getManga(canonicalId);
    } finally {
      if (locked) await releaseLock(lockKey);
    }
  }

  public async invalidate(canonicalId: string): Promise<string[]> {
    return this.pipeline.invalidateCache(canonicalId);
  }

  public async getRecommendations(canonicalId: string, limit: number = 10) {
    const target = await this.getManga(canonicalId);
    if (!target) return [];
    const candidates = await this.search("", { limit: 50 });
    return recommendationEngine.rankRecommendations(target, candidates, limit);
  }

  public getBusinessMetrics(): BusinessMetrics {
    return metricsCollector.getBusinessMetrics();
  }

  public getInfrastructureMetrics(): InfrastructureMetrics {
    return metricsCollector.getInfrastructureMetrics();
  }

  public getSnapshotEngine(): typeof snapshotStorage {
    return snapshotStorage;
  }

  public getRefreshQueue(): typeof refreshQueue {
    return refreshQueue;
  }
}

export const aggregator = new AggregatorFacade();
