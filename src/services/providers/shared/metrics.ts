import type { ProviderMetrics, ProviderMetricsWindow, ProviderHealth } from "./types";

// ---------------------------------------------------------------------------
// Rolling window event record
// ---------------------------------------------------------------------------
interface RequestEvent {
  ts:        number;     // epoch ms
  latencyMs: number;
  success:   boolean;
  retry:     boolean;
  timeout:   boolean;
}

// ---------------------------------------------------------------------------
// ProviderMetricsCollector
// ---------------------------------------------------------------------------

/**
 * Tracks per-provider request metrics with two views:
 *   - `lifetime`  accumulates from process start (or last reset)
 *   - `rolling`   reflects only the last ROLLING_WINDOW_MS (default 15 min)
 *
 * Instantiated once per provider inside BaseProvider and passed to Transport,
 * which calls record() on every request outcome automatically.
 */
export class ProviderMetricsCollector {
  private readonly ROLLING_WINDOW_MS: number;

  // Lifetime counters
  private ltRequests  = 0;
  private ltSuccesses = 0;
  private ltFailures  = 0;
  private ltRetries   = 0;
  private ltTimeouts  = 0;
  private ltLatencyMs = 0;
  private ltPages     = 0;
  private ltImages    = 0;
  private ltLastRequestAt?: Date;
  private ltLastSuccessAt?: Date;
  private ltLastFailureAt?: Date;

  // Rolling window ring buffer
  private window: RequestEvent[] = [];

  // Circuit breaker integration
  private consecutiveFailures = 0;

  constructor(rollingWindowMs = 15 * 60 * 1000) {
    this.ROLLING_WINDOW_MS = rollingWindowMs;
  }

  // ---------------------------------------------------------------------------
  // Record a completed request
  // ---------------------------------------------------------------------------

  record(
    outcome: "success" | "failure" | "retry" | "timeout",
    latencyMs: number
  ): void {
    const now = Date.now();
    const success  = outcome === "success";
    const failure  = outcome === "failure" || outcome === "timeout";
    const retry    = outcome === "retry";
    const timeout  = outcome === "timeout";

    // Lifetime
    this.ltRequests++;
    this.ltLatencyMs += latencyMs;
    this.ltLastRequestAt = new Date(now);
    if (success) {
      this.ltSuccesses++;
      this.ltLastSuccessAt  = new Date(now);
      this.consecutiveFailures = 0;
    }
    if (failure)  { this.ltFailures++;  this.ltLastFailureAt = new Date(now); this.consecutiveFailures++; }
    if (retry)    { this.ltRetries++; }
    if (timeout)  { this.ltTimeouts++; }

    // Rolling window
    this.window.push({ ts: now, latencyMs, success, retry, timeout });
    this.pruneWindow(now);
  }

  recordPages(count: number): void  { this.ltPages  += count; }
  recordImages(count: number): void { this.ltImages += count; }

  // ---------------------------------------------------------------------------
  // Snapshot
  // ---------------------------------------------------------------------------

  snapshot(): ProviderMetrics {
    const now = Date.now();
    this.pruneWindow(now);

    return {
      lifetime: {
        requestCount:     this.ltRequests,
        successCount:     this.ltSuccesses,
        failureCount:     this.ltFailures,
        retryCount:       this.ltRetries,
        timeoutCount:     this.ltTimeouts,
        averageLatencyMs: this.ltRequests > 0 ? Math.round(this.ltLatencyMs / this.ltRequests) : 0,
        successRate:      this.ltRequests > 0 ? this.ltSuccesses / this.ltRequests : 1,
        throughputRpm:    0,  // not meaningful for lifetime
        pagesScraped:     this.ltPages,
        imagesScraped:    this.ltImages,
        lastRequestAt:    this.ltLastRequestAt,
        lastSuccessAt:    this.ltLastSuccessAt,
        lastFailureAt:    this.ltLastFailureAt,
      },
      rolling: this.buildRollingWindow(now),
    };
  }

  getConsecutiveFailures(): number {
    return this.consecutiveFailures;
  }

  /**
   * Compute health status from rolling window metrics.
   * Health is derived from observed behavior — never set manually.
   */
  computeHealth(blockedSignal = false): ProviderHealth["status"] {
    const w = this.buildRollingWindow(Date.now());

    if (blockedSignal)                    return "BLOCKED";
    if (this.consecutiveFailures >= 5)    return "OFFLINE";
    if (w.requestCount > 0 && w.successRate < 0.3) return "OFFLINE";
    if (w.requestCount > 0 && (w.successRate < 0.75 || w.averageLatencyMs > 3000)) return "DEGRADED";
    return "ONLINE";
  }

  reset(): void {
    this.ltRequests = this.ltSuccesses = this.ltFailures = 0;
    this.ltRetries  = this.ltTimeouts  = this.ltLatencyMs = 0;
    this.ltPages    = this.ltImages    = 0;
    this.ltLastRequestAt = this.ltLastSuccessAt = this.ltLastFailureAt = undefined;
    this.consecutiveFailures = 0;
    this.window = [];
  }

  // ---------------------------------------------------------------------------
  // Private helpers
  // ---------------------------------------------------------------------------

  private pruneWindow(now: number): void {
    const cutoff = now - this.ROLLING_WINDOW_MS;
    this.window = this.window.filter((e) => e.ts >= cutoff);
  }

  private buildRollingWindow(now: number): ProviderMetricsWindow {
    this.pruneWindow(now);
    const w = this.window;
    if (w.length === 0) {
      return {
        requestCount: 0, successCount: 0, failureCount: 0,
        retryCount: 0,   timeoutCount: 0, averageLatencyMs: 0,
        successRate: 1,  throughputRpm: 0,
      };
    }

    const successes = w.filter((e) => e.success).length;
    const failures  = w.filter((e) => !e.success && !e.retry).length;
    const retries   = w.filter((e) => e.retry).length;
    const timeouts  = w.filter((e) => e.timeout).length;
    const totalLat  = w.reduce((s, e) => s + e.latencyMs, 0);
    const spanMs    = now - w[0].ts;
    const rpm       = spanMs > 0 ? Math.round((w.length / spanMs) * 60_000) : 0;

    return {
      requestCount:     w.length,
      successCount:     successes,
      failureCount:     failures,
      retryCount:       retries,
      timeoutCount:     timeouts,
      averageLatencyMs: Math.round(totalLat / w.length),
      successRate:      successes / w.length,
      throughputRpm:    rpm,
    };
  }
}
