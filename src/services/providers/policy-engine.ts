import { providerRegistry } from "./shared/normalization/registry";
import { healthService } from "./health-service";
import type { RequestContext } from "../infrastructure/request-context";
import type { IMangaProvider } from "./shared/types";

export type ProfileEnvironment = "development" | "staging" | "production" | "chaos";
export type OperationTask = "reading" | "discovery" | "metadata";

export interface PolicyProfileConfig {
  environment: ProfileEnvironment;
  minHealthThreshold: number; // 0.0 to 1.0
  fallbackAllowed: boolean;
  maxFailoverAttempts: number;
}

export class PolicyEngine {
  private static instance: PolicyEngine;
  private currentProfile: PolicyProfileConfig = {
    environment: (process.env.NODE_ENV as ProfileEnvironment) || "development",
    minHealthThreshold: 0.2,
    fallbackAllowed: true,
    maxFailoverAttempts: 3,
  };

  public static getInstance(): PolicyEngine {
    if (!PolicyEngine.instance) {
      PolicyEngine.instance = new PolicyEngine();
    }
    return PolicyEngine.instance;
  }

  public setProfile(profile: Partial<PolicyProfileConfig>): void {
    this.currentProfile = { ...this.currentProfile, ...profile };
  }

  public getProfile(): PolicyProfileConfig {
    return { ...this.currentProfile };
  }

  /**
   * Ranks and selects the best providers for a given task based on context & health.
   */
  public selectProviders(task: OperationTask, ctx?: RequestContext): IMangaProvider[] {
    const enabledProviders = providerRegistry.getEnabled();
    if (enabledProviders.length === 0) return [];

    // Filter out providers with OPEN circuit breakers or below minHealthThreshold
    const candidates = enabledProviders.filter((provider) => {
      const health = healthService.getHealth(provider.name.toLowerCase());
      if (health.circuitState === "OPEN") return false;
      const score = task === "reading" 
        ? healthService.getReadingScore(provider.name.toLowerCase()) 
        : healthService.getDiscoveryScore(provider.name.toLowerCase());
      return score >= this.currentProfile.minHealthThreshold;
    });

    // If context specifies a preferred source, prioritize it first
    const preferredSource = ctx?.preferredSource?.toLowerCase();
    
    return candidates.sort((a, b) => {
      const nameA = a.name.toLowerCase();
      const nameB = b.name.toLowerCase();

      if (preferredSource) {
        if (nameA === preferredSource) return -1;
        if (nameB === preferredSource) return 1;
      }

      const scoreA = task === "reading" ? healthService.getReadingScore(nameA) : healthService.getDiscoveryScore(nameA);
      const scoreB = task === "reading" ? healthService.getReadingScore(nameB) : healthService.getDiscoveryScore(nameB);

      return scoreB - scoreA; // Highest score first
    });
  }
}

export const policyEngine = PolicyEngine.getInstance();
export default policyEngine;
