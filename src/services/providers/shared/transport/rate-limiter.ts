export interface RateLimiterConfig {
  maxRequests: number;
  intervalMs: number;
}

export class TokenBucketRateLimiter {
  private tokens: number;
  private lastRefill: number;
  private queue: (() => void)[] = [];

  constructor(private config: RateLimiterConfig) {
    this.tokens = config.maxRequests;
    this.lastRefill = Date.now();
  }

  private refill() {
    const now = Date.now();
    const elapsed = now - this.lastRefill;
    if (elapsed > this.config.intervalMs) {
      this.tokens = this.config.maxRequests;
      this.lastRefill = now;
      while (this.queue.length > 0 && this.tokens > 0) {
        this.tokens--;
        const resolve = this.queue.shift();
        if (resolve) resolve();
      }
    }
  }

  public async acquire(): Promise<void> {
    this.refill();
    if (this.tokens > 0) {
      this.tokens--;
      return;
    }

    return new Promise<void>((resolve) => {
      this.queue.push(resolve);
      setTimeout(() => this.refill(), this.config.intervalMs + 50);
    });
  }
}
