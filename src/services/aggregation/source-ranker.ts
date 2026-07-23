import { ChapterSource, SourceRankingPolicy } from "./types";
import { computeEffectiveConfidence } from "./confidence-model";
import { providerRegistry } from "../providers";

export interface SourceRankingMetrics {
  providerId: string;
  latencyMs?: number;
  availability?: number; // 0.0 to 1.0
  imageSuccessRate?: number; // 0.0 to 1.0
  completeness?: number; // 0.0 to 1.0
  isCached?: boolean;
}

export const DEFAULT_RANKING_POLICY: SourceRankingPolicy = {
  providerHealthWeight: 0.35,
  latencyWeight: 0.25,
  successWeight: 0.20,
  cacheWeight: 0.10,
  imageValidationWeight: 0.10,
};

export function computeSourceScore(
  source: ChapterSource,
  metrics?: SourceRankingMetrics,
  policy: SourceRankingPolicy = DEFAULT_RANKING_POLICY
): number {
  const confidence = computeEffectiveConfidence(source.providerId, {
    latencyMs: metrics?.latencyMs,
  });

  const latency = metrics?.latencyMs ?? 400;
  const latencyScore = Math.max(0.0, Math.min(1.0, 1.0 - latency / 2000));
  const availability = metrics?.availability ?? 0.99;
  const imageSuccess = metrics?.imageSuccessRate ?? 0.98;
  const cacheLocality = metrics?.isCached ? 1.0 : 0.0;

  const score =
    policy.providerHealthWeight * confidence +
    policy.latencyWeight * latencyScore +
    policy.successWeight * availability +
    policy.imageValidationWeight * imageSuccess +
    policy.cacheWeight * cacheLocality;

  return parseFloat(score.toFixed(4));
}

export function rankChapterSources(
  sources: ChapterSource[],
  metricsMap?: Record<string, SourceRankingMetrics>,
  policy: SourceRankingPolicy = DEFAULT_RANKING_POLICY
): ChapterSource[] {
  // Circuit Breaker Isolation: Filter out disabled or open circuit providers
  const validSources = sources.filter((src) => {
    try {
      const provider = providerRegistry.get(src.providerId);
      if (!provider) return false;
      const base = provider as any;
      const isEnabled = base.manifest?.enabled ?? provider.config.flags?.enabled ?? provider.config.enabled ?? true;
      if (!isEnabled) return false;
      return true;
    } catch {
      return true; // Fallback if provider registry not initialized
    }
  });

  const targetList = validSources.length > 0 ? validSources : sources;

  const scored = targetList.map((src) => {
    const metrics = metricsMap?.[src.providerId];
    const score = computeSourceScore(src, metrics, policy);
    return { ...src, sourceScore: score };
  });

  return scored.sort((a, b) => b.sourceScore - a.sourceScore);
}
