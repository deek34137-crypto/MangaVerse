import { ChapterSource } from "./types";
import { computeEffectiveConfidence } from "./confidence-model";

export interface SourceRankingMetrics {
  providerId: string;
  latencyMs?: number;
  availability?: number; // 0.0 to 1.0
  imageSuccessRate?: number; // 0.0 to 1.0
  completeness?: number; // 0.0 to 1.0
  isCached?: boolean;
}

export function computeSourceScore(
  source: ChapterSource,
  metrics?: SourceRankingMetrics
): number {
  const confidence = computeEffectiveConfidence(source.providerId, {
    latencyMs: metrics?.latencyMs,
  });

  const latency = metrics?.latencyMs ?? 400;
  const latencyScore = Math.max(0.0, Math.min(1.0, 1.0 - latency / 2000));
  const availability = metrics?.availability ?? 0.99;
  const imageSuccess = metrics?.imageSuccessRate ?? 0.98;
  const completeness = metrics?.completeness ?? 1.0;
  const cacheLocality = metrics?.isCached ? 1.0 : 0.0;

  const score =
    0.30 * confidence +
    0.20 * latencyScore +
    0.20 * availability +
    0.15 * imageSuccess +
    0.10 * completeness +
    0.05 * cacheLocality;

  return parseFloat(score.toFixed(4));
}

export function rankChapterSources(
  sources: ChapterSource[],
  metricsMap?: Record<string, SourceRankingMetrics>
): ChapterSource[] {
  const scored = sources.map((src) => {
    const metrics = metricsMap?.[src.providerId];
    const score = computeSourceScore(src, metrics);
    return { ...src, sourceScore: score };
  });

  return scored.sort((a, b) => b.sourceScore - a.sourceScore);
}
