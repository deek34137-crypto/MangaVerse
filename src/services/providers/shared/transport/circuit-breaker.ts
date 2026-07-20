import { ProviderUnavailable } from "@/services/providers/shared/errors";

export interface CircuitBreakerConfig {
  failureThreshold: number;
  cooldownMs: number;
}

export class CircuitBreaker {
  private status: "closed" | "open" | "half-open" = "closed";
  private consecutiveFailures = 0;
  private openTime?: number;

  constructor(private config: CircuitBreakerConfig, private providerName: string) {}

  public check(): void {
    if (this.status === "open") {
      const elapsed = Date.now() - (this.openTime || 0);
      if (elapsed > this.config.cooldownMs) {
        this.status = "half-open";
        console.log(`[CircuitBreaker] ${this.providerName} entering half-open state`);
      } else {
        throw new ProviderUnavailable(this.providerName, "Circuit breaker is open");
      }
    }
  }

  public onSuccess(): void {
    this.status = "closed";
    this.consecutiveFailures = 0;
  }

  public onFailure(): void {
    this.consecutiveFailures++;
    if (this.consecutiveFailures >= this.config.failureThreshold) {
      this.status = "open";
      this.openTime = Date.now();
      console.warn(`[CircuitBreaker] ${this.providerName} tripped. Circuit is open.`);
    }
  }
}
