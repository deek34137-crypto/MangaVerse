import {
  ProviderError,
  ProviderTimeout,
  ProviderRateLimited,
  ProviderUnavailable,
  ProviderBlocked,
  ProviderNotFound
} from "@/services/providers/shared/errors";
import { CircuitBreaker, CircuitBreakerConfig } from "./circuit-breaker";
import { TokenBucketRateLimiter, RateLimiterConfig } from "./rate-limiter";
import { getDefaultHeaders } from "./headers";
import type { ProviderMetricsCollector } from "@/services/providers/shared/metrics";
import type { ProviderSnapshotWriter } from "@/services/providers/shared/snapshots";

export interface TransportConfig {
  /** Used by the old flat-config style */
  providerName?: string;
  timeoutMs?: number;
  retries?: number;
  backoffMs?: number;
  circuitBreaker?: CircuitBreakerConfig;
  rateLimit?: RateLimiterConfig;

  /** Optional fields accepted from ProviderManifestInput / ProviderConfig */
  id?: string;
  displayName?: string;
  network?: {
    timeoutMs?: number;
    retries?: number;
    backoffMs?: number;
    rateLimit?: RateLimiterConfig;
    circuitBreaker?: CircuitBreakerConfig;
  };
}

export class Transport {
  private circuitBreaker: CircuitBreaker;
  private rateLimiter?: TokenBucketRateLimiter;
  private providerName: string;
  private timeoutMs: number;
  private retries: number;
  private backoffMs: number;
  private metricsCollector?: ProviderMetricsCollector;
  private snapshotWriter?: ProviderSnapshotWriter;

  constructor(
    config: TransportConfig,
    opts?: {
      metrics?: ProviderMetricsCollector;
      snapshots?: ProviderSnapshotWriter;
    }
  ) {
    this.providerName = config.providerName || config.displayName || config.id || "UnknownProvider";
    this.metricsCollector = opts?.metrics;
    this.snapshotWriter   = opts?.snapshots;

    // Detect if this is the new nested ProviderConfig / ProviderManifest structure
    const isNewConfig = config.network !== undefined;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const network: any = isNewConfig ? config.network! : config;

    this.timeoutMs = network.timeoutMs || 8000;
    this.retries = network.retries !== undefined ? network.retries : 3;
    this.backoffMs = network.backoffMs || 1000;

    const cbConfig = network.circuitBreaker || { failureThreshold: 5, cooldownMs: 30000 };
    this.circuitBreaker = new CircuitBreaker(cbConfig, this.providerName);

    const rlConfig = network.rateLimit;
    if (rlConfig) {
      this.rateLimiter = new TokenBucketRateLimiter(rlConfig);
    }
  }

  private async executeRequest(
    url: string,
    options: RequestInit,
    responseType: "json" | "text" | "buffer"
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ): Promise<any> {
    this.circuitBreaker.check();

    if (this.rateLimiter) {
      await this.rateLimiter.acquire();
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let lastError: any = null;
    const attemptStart = Date.now();

    for (let attempt = 0; attempt <= this.retries; attempt++) {
      try {
        if (attempt > 0) {
          const delay = this.backoffMs * Math.pow(2, attempt - 1);
          console.log(`[Transport] Retry attempt ${attempt}/${this.retries} for ${url} in ${delay}ms`);
          await new Promise((r) => setTimeout(r, delay));
        }

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), this.timeoutMs);

        const mergedHeaders = getDefaultHeaders(responseType, options.headers);

        const response = await fetch(url, {
          ...options,
          signal: controller.signal,
          headers: mergedHeaders,
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          if (response.status === 404) {
            throw new ProviderNotFound(this.providerName, `${response.statusText} (${url})`);
          }
          if (response.status === 403) {
            throw new ProviderBlocked(this.providerName, `${response.statusText} (${url})`);
          }
          if (response.status === 429) {
            const retryAfter = response.headers.get("retry-after");
            const parsed = retryAfter ? parseInt(retryAfter) * 1000 : undefined;
            throw new ProviderRateLimited(this.providerName, parsed);
          }
          if (response.status >= 500) {
            throw new ProviderUnavailable(this.providerName, `Server Error ${response.status}: ${response.statusText}`);
          }
          throw new ProviderError(
            this.providerName,
            `HTTP error ${response.status}: ${response.statusText}`,
            `HTTP_${response.status}`
          );
        }

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        let data: any;
        if (responseType === "json") {
          data = await response.json();
        } else if (responseType === "text") {
          data = await response.text();
        } else {
          const arrayBuffer = await response.arrayBuffer();
          data = Buffer.from(arrayBuffer);
        }

        this.circuitBreaker.onSuccess();
        this.metricsCollector?.record("success", Date.now() - attemptStart);
        return data;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } catch (err: any) {
        lastError = err;

        const isTimeout = err.name === "AbortError";
        if (isTimeout) {
          lastError = new ProviderTimeout(this.providerName, this.timeoutMs);
          this.metricsCollector?.record("timeout", Date.now() - attemptStart);
        } else if (attempt < this.retries) {
          this.metricsCollector?.record("retry", Date.now() - attemptStart);
        }

        console.error(
          `[Transport] Attempt ${attempt} failed for ${url}: ${
            lastError.message || lastError
          }`
        );

        if (lastError instanceof ProviderError && !lastError.retryable) {
          break; // Stop retrying non-retryable errors
        }
      }
    }

    this.circuitBreaker.onFailure();
    this.metricsCollector?.record("failure", Date.now() - attemptStart);

    // Write debug snapshot for failed request (if enabled)
    void this.snapshotWriter?.write({
      providerId: this.providerName,
      providerVersion: "unknown",
      manifestSchemaVersion: "1.0",
      url,
      timestamp: new Date().toISOString(),
      requestDurationMs: Date.now() - attemptStart,
      retryCount: this.retries,
      errorMessage: lastError?.message,
    });

    throw lastError || new ProviderError(this.providerName, "Request failed", "FETCH_ERROR");
  }

  public async requestJson<T>(url: string, options: RequestInit = {}): Promise<T> {
    return this.executeRequest(url, options, "json");
  }

  public async requestText(url: string, options: RequestInit = {}): Promise<string> {
    return this.executeRequest(url, options, "text");
  }

  public async requestBuffer(url: string, options: RequestInit = {}): Promise<Buffer> {
    return this.executeRequest(url, options, "buffer");
  }

  public async request<T>(url: string, options: RequestInit = {}): Promise<T> {
    return this.requestJson<T>(url, options);
  }
}
