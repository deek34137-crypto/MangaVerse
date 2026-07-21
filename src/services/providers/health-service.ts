import { eventBus, SystemEventBus } from "../infrastructure/event-bus";

export interface MetricWindow {
  requests: number;
  successes: number;
  failures: number;
  blocks: number;
  totalLatencyMs: number;
  imageSuccesses: number;
  imageFailures: number;
}

export interface AdaptiveProviderHealth {
  providerId: string;
  availabilityRate: number; // 0.0 to 1.0 (5m window)
  averageLatencyMs: number; // exponential moving average
  imageSuccessRate: number; // 0.0 to 1.0
  cloudflareBlockRate: number; // 0.0 to 1.0
  consecutiveFailures: number;
  circuitState: "CLOSED" | "OPEN" | "HALF_OPEN";
  lastUpdated: number;
}

export class HealthService {
  private static instance: HealthService;
  private windows = new Map<string, MetricWindow>();
  private healthStates = new Map<string, AdaptiveProviderHealth>();

  private constructor() {
    this.subscribeToTelemetry();
  }

  public static getInstance(): HealthService {
    if (!HealthService.instance) {
      HealthService.instance = new HealthService();
    }
    return HealthService.instance;
  }

  private subscribeToTelemetry(): void {
    eventBus.on("provider:succeeded", (evt) => {
      this.recordSuccess(evt.providerId, evt.durationMs);
    });

    eventBus.on("provider:failed", (evt) => {
      this.recordFailure(evt.providerId, evt.durationMs);
    });

    eventBus.on("provider:blocked", (evt) => {
      this.recordBlock(evt.providerId, evt.durationMs);
    });
  }

  public recordSuccess(providerId: string, durationMs: number): void {
    const window = this.getOrCreateWindow(providerId);
    window.requests++;
    window.successes++;
    window.totalLatencyMs += durationMs;

    const state = this.getOrCreateState(providerId);
    state.consecutiveFailures = 0;
    state.averageLatencyMs = Math.round(state.averageLatencyMs * 0.7 + durationMs * 0.3);
    state.lastUpdated = Date.now();
    this.recomputeRates(providerId);
  }

  public recordFailure(providerId: string, durationMs: number): void {
    const window = this.getOrCreateWindow(providerId);
    window.requests++;
    window.failures++;
    window.totalLatencyMs += durationMs;

    const state = this.getOrCreateState(providerId);
    state.consecutiveFailures++;
    state.lastUpdated = Date.now();
    if (state.consecutiveFailures >= 5) {
      state.circuitState = "OPEN";
      eventBus.emit("circuit:opened", { version: 1, providerId, reason: "5 consecutive failures", timestamp: Date.now() });
    }
    this.recomputeRates(providerId);
  }

  public recordBlock(providerId: string, durationMs: number): void {
    const window = this.getOrCreateWindow(providerId);
    window.requests++;
    window.failures++;
    window.blocks++;
    window.totalLatencyMs += durationMs;

    const state = this.getOrCreateState(providerId);
    state.consecutiveFailures++;
    state.lastUpdated = Date.now();
    state.circuitState = "OPEN";
    eventBus.emit("circuit:opened", { version: 1, providerId, reason: "WAF/Cloudflare Block 403", timestamp: Date.now() });
    this.recomputeRates(providerId);
  }

  public getReadingScore(providerId: string): number {
    const state = this.getOrCreateState(providerId);
    if (state.circuitState === "OPEN") return 0;
    
    const latencyPenalty = Math.max(0, (state.averageLatencyMs - 500) / 3000);
    const score = (state.availabilityRate * 0.6) + (state.imageSuccessRate * 0.4) - latencyPenalty;
    return Math.max(0, Math.min(1.0, score));
  }

  public getDiscoveryScore(providerId: string): number {
    const state = this.getOrCreateState(providerId);
    if (state.circuitState === "OPEN") return 0;

    const score = state.availabilityRate * 0.8 + (state.cloudflareBlockRate === 0 ? 0.2 : 0);
    return Math.max(0, Math.min(1.0, score));
  }

  public getHealth(providerId: string): AdaptiveProviderHealth {
    return { ...this.getOrCreateState(providerId) };
  }

  private getOrCreateWindow(providerId: string): MetricWindow {
    if (!this.windows.has(providerId)) {
      this.windows.set(providerId, {
        requests: 0,
        successes: 0,
        failures: 0,
        blocks: 0,
        totalLatencyMs: 0,
        imageSuccesses: 0,
        imageFailures: 0,
      });
    }
    return this.windows.get(providerId)!;
  }

  private getOrCreateState(providerId: string): AdaptiveProviderHealth {
    if (!this.healthStates.has(providerId)) {
      this.healthStates.set(providerId, {
        providerId,
        availabilityRate: 1.0,
        averageLatencyMs: 250,
        imageSuccessRate: 1.0,
        cloudflareBlockRate: 0.0,
        consecutiveFailures: 0,
        circuitState: "CLOSED",
        lastUpdated: Date.now(),
      });
    }
    return this.healthStates.get(providerId)!;
  }

  private recomputeRates(providerId: string): void {
    const window = this.getOrCreateWindow(providerId);
    const state = this.getOrCreateState(providerId);

    if (window.requests > 0) {
      state.availabilityRate = parseFloat((window.successes / window.requests).toFixed(4));
      state.cloudflareBlockRate = parseFloat((window.blocks / window.requests).toFixed(4));
    }
  }
}

export const healthService = HealthService.getInstance();
export default healthService;
