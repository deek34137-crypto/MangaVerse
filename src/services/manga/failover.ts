/**
 * Provider Automatic Failover & Health Manager (RFC-002)
 * Handles provider degradation, fallback ordering, and synthetic health evaluation.
 */

import { DEFAULT_PROVIDER_CAPABILITIES, ProviderCapabilities } from "./domain";
import { logger } from "@/lib/observability";

export interface ProviderHealth {
  providerId: string;
  isOnline: boolean;
  latencyMs: number;
  confidenceScore: number;
  lastCheckedAt: string;
}

const HEALTH_CACHE = new Map<string, ProviderHealth>();

export function getProviderHealth(providerId: string): ProviderHealth {
  const existing = HEALTH_CACHE.get(providerId);
  if (existing && Date.now() - new Date(existing.lastCheckedAt).getTime() < 60000) {
    return existing;
  }

  const caps: ProviderCapabilities = DEFAULT_PROVIDER_CAPABILITIES[providerId] || {
    supportsSearch: true,
    supportsLatest: true,
    supportsCovers: true,
    supportsWebP: false,
    supportsMetadata: true,
    supportsPagination: true,
    confidenceScore: 80,
  };

  const health: ProviderHealth = {
    providerId,
    isOnline: true,
    latencyMs: providerId === "mangadex" ? 120 : 240,
    confidenceScore: caps.confidenceScore,
    lastCheckedAt: new Date().toISOString(),
  };

  HEALTH_CACHE.set(providerId, health);
  return health;
}

/**
 * Ranks available provider mappings by confidence score and latency.
 */
export function rankProviders(providers: string[]): string[] {
  return [...providers].sort((a, b) => {
    const healthA = getProviderHealth(a);
    const healthB = getProviderHealth(b);
    return healthB.confidenceScore - healthA.confidenceScore;
  });
}

/**
 * Executes a function with automatic failover across ranked providers.
 */
export async function executeWithFailover<T>(
  providers: string[],
  fetcher: (provider: string) => Promise<T | null>
): Promise<{ result: T | null; providerUsed: string }> {
  const ranked = rankProviders(providers.length > 0 ? providers : ["mangadex", "comick", "mangasee"]);

  for (const provider of ranked) {
    try {
      const startTime = Date.now();
      const result = await fetcher(provider);
      if (result != null) {
        logger.info(`Provider fetch succeeded via ${provider} (${Date.now() - startTime}ms)`, { provider }, "PROVIDER");
        return { result, providerUsed: provider };
      }
    } catch (err) {
      logger.warn(`Provider fetch failed for ${provider}, attempting failover...`, { provider, error: err }, "PROVIDER");
    }
  }

  return { result: null, providerUsed: "none" };
}
