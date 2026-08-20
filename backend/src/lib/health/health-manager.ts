import { ProviderHealth, ProviderStatus } from "../../types";

export class HealthManager {
  private healthMap = new Map<string, ProviderHealth>();
  private readonly FAILURE_THRESHOLD_DEGRADED = 2;
  private readonly FAILURE_THRESHOLD_DOWN = 5;

  public recordSuccess(provider: string, latencyMs: number): void {
    const existing = this.healthMap.get(provider) || {
      provider,
      status: "healthy",
      lastChecked: Date.now(),
      consecutiveFailures: 0,
    };

    existing.status = "healthy";
    existing.latencyMs = latencyMs;
    existing.lastChecked = Date.now();
    existing.consecutiveFailures = 0;
    existing.lastError = undefined;

    this.healthMap.set(provider, existing);
  }

  public recordFailure(provider: string, error: string): void {
    const existing = this.healthMap.get(provider) || {
      provider,
      status: "unknown",
      lastChecked: Date.now(),
      consecutiveFailures: 0,
    };

    existing.consecutiveFailures += 1;
    existing.lastChecked = Date.now();
    existing.lastError = error;

    if (existing.consecutiveFailures >= this.FAILURE_THRESHOLD_DOWN) {
      existing.status = "down";
    } else if (existing.consecutiveFailures >= this.FAILURE_THRESHOLD_DEGRADED) {
      existing.status = "degraded";
    }

    this.healthMap.set(provider, existing);
  }

  public getHealth(provider: string): ProviderHealth {
    return (
      this.healthMap.get(provider) || {
        provider,
        status: "healthy",
        lastChecked: Date.now(),
        consecutiveFailures: 0,
      }
    );
  }

  public getAllHealth(): Record<string, ProviderStatus> {
    const result: Record<string, ProviderStatus> = {};
    for (const [provider, record] of this.healthMap.entries()) {
      result[provider] = record.status;
    }
    return result;
  }
}

export const healthManager = new HealthManager();
