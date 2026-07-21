import { randomUUID } from "crypto";

export type CachePolicy = "cache-first" | "network-first" | "cache-only";

export interface RequestContextOptions {
  requestId?: string;
  traceId?: string;
  timeoutMs?: number;
  retryBudget?: number;
  preferredLanguage?: string;
  cachePolicy?: CachePolicy;
  preferredSource?: string;
}

export class RequestContext {
  public readonly requestId: string;
  public readonly traceId: string;
  public readonly timeoutMs: number;
  public readonly retryBudget: number;
  public readonly startTime: number;
  public readonly preferredLanguage: string;
  public readonly cachePolicy: CachePolicy;
  public readonly preferredSource?: string;
  private currentRetriesUsed: number = 0;

  constructor(options: RequestContextOptions = {}) {
    this.requestId = options.requestId || randomUUID();
    this.traceId = options.traceId || this.requestId;
    this.timeoutMs = options.timeoutMs ?? 8000;
    this.retryBudget = options.retryBudget ?? 2;
    this.startTime = Date.now();
    this.preferredLanguage = options.preferredLanguage || "en";
    this.cachePolicy = options.cachePolicy || "cache-first";
    this.preferredSource = options.preferredSource;
  }

  public elapsedMs(): number {
    return Date.now() - this.startTime;
  }

  public remainingMs(): number {
    return Math.max(0, this.timeoutMs - this.elapsedMs());
  }

  public isExpired(): boolean {
    return this.elapsedMs() >= this.timeoutMs;
  }

  public hasRemainingRetryBudget(): boolean {
    return this.currentRetriesUsed < this.retryBudget && !this.isExpired();
  }

  public consumeRetry(): boolean {
    if (this.hasRemainingRetryBudget()) {
      this.currentRetriesUsed++;
      return true;
    }
    return false;
  }

  public getRetriesUsed(): number {
    return this.currentRetriesUsed;
  }

  public createChild(overrides: Partial<RequestContextOptions> = {}): RequestContext {
    return new RequestContext({
      requestId: randomUUID(),
      traceId: this.traceId,
      timeoutMs: overrides.timeoutMs ?? this.remainingMs(),
      retryBudget: overrides.retryBudget ?? Math.max(0, this.retryBudget - this.currentRetriesUsed),
      preferredLanguage: overrides.preferredLanguage ?? this.preferredLanguage,
      cachePolicy: overrides.cachePolicy ?? this.cachePolicy,
      preferredSource: overrides.preferredSource ?? this.preferredSource,
    });
  }

  public toLogMeta(): Record<string, unknown> {
    return {
      requestId: this.requestId,
      traceId: this.traceId,
      elapsedMs: this.elapsedMs(),
      remainingMs: this.remainingMs(),
      retriesUsed: this.currentRetriesUsed,
      retryBudget: this.retryBudget,
      preferredLanguage: this.preferredLanguage,
      cachePolicy: this.cachePolicy,
    };
  }
}

export default RequestContext;
