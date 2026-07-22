import { providerPolicyRegistry } from "../providers/shared/provider-policy";

export interface ConfidenceMetrics {
  circuitState?: "CLOSED" | "HALF-OPEN" | "OPEN";
  latencyMs?: number;
  latencyP95Ms?: number;
  latencyStdDevMs?: number;
  cacheAgeMs?: number;
  selectorCoverageRatio?: number;
  historicalSuccessRate?: number;
}

export function computeEffectiveConfidence(
  providerId: string,
  metrics?: ConfidenceMetrics
): number {
  const desc = providerPolicyRegistry.getDescriptor(providerId);
  const trustScore = desc?.quality.trustScore ?? 0.70;

  // 1. Health Score (0.0 to 1.0)
  const circuit = metrics?.circuitState ?? "CLOSED";
  const healthScore = circuit === "CLOSED" ? 1.0 : circuit === "HALF-OPEN" ? 0.6 : 0.0;

  // 2. Historical Success Score
  const successScore = metrics?.historicalSuccessRate ?? 0.95;

  // 3. Latency Score (P95)
  const p95 = metrics?.latencyP95Ms ?? metrics?.latencyMs ?? 500;
  const latencyScore = Math.max(0.0, Math.min(1.0, 1.0 - (p95 - 300) / 2700));

  // 4. Freshness Score
  const age = metrics?.cacheAgeMs ?? 0;
  const freshnessScore = Math.max(0.2, Math.exp(-age / (1000 * 3600 * 6))); // 6 hr half-life

  // 5. Selector Coverage Score
  const selectorScore = metrics?.selectorCoverageRatio ?? 0.95;

  // Weighted Linear Base
  const baseLinear =
    0.30 * trustScore +
    0.20 * healthScore +
    0.15 * successScore +
    0.15 * latencyScore +
    0.10 * freshnessScore +
    0.10 * selectorScore;

  // 5. Volatility Multiplier (Penalize high standard deviation)
  const stdDev = metrics?.latencyStdDevMs ?? 50;
  const volatilityMultiplier = Math.max(0.5, Math.min(1.0, 1.0 - stdDev / (p95 || 500)));

  const finalScore = baseLinear * volatilityMultiplier;
  return Math.max(0.0, Math.min(1.0, parseFloat(finalScore.toFixed(4))));
}

export function computeOverallMergeConfidence(
  providerMappings: Array<{ trustScore: number }>,
  candidateMergeCount: number = 0
): number {
  if (providerMappings.length === 0) return 0.0;

  const avgTrust =
    providerMappings.reduce((sum, p) => sum + p.trustScore, 0) / providerMappings.length;

  // Multiple corroborating provider sources boost overall confidence
  const sourceMultipler = 1.0 + 0.1 * Math.min(4, providerMappings.length - 1);

  // Candidate merges without strict author match incur a small 5% penalty
  const candidatePenalty = candidateMergeCount > 0 ? 0.95 : 1.0;

  const overall = avgTrust * sourceMultipler * candidatePenalty;
  return parseFloat(Math.min(1.0, Math.max(0.0, overall)).toFixed(4));
}
