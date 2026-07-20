import { CacheBackend } from "./interface";
import { Redis } from "@upstash/redis";

const MAX_CONSECUTIVE_ERRORS = 3;

export class RedisCache implements CacheBackend {
  private client: Redis;
  private hits = 0;
  private misses = 0;
  private errors = 0;
  private consecutiveErrors = 0;
  private circuitOpen = false; // true = skip Redis, behave as no-op

  constructor(url: string, token: string) {
    this.client = new Redis({ url, token, retry: { retries: 1, backoff: () => 200 } });
  }

  async get<T>(key: string): Promise<T | null> {
    if (this.circuitOpen) { this.misses++; return null; }
    try {
      const raw = await this.client.get<string>(key);
      this.consecutiveErrors = 0;
      if (raw === null || raw === undefined) { this.misses++; return null; }
      this.hits++;
      return typeof raw === "string" ? JSON.parse(raw) as T : raw as T;
    } catch (e) {
      this.errors++;
      this.consecutiveErrors++;
      if (this.consecutiveErrors >= MAX_CONSECUTIVE_ERRORS) {
        console.warn('[cache] Redis circuit open — falling back to no-cache mode');
        this.circuitOpen = true;
      }
      return null;
    }
  }

  async set<T>(key: string, value: T, ttlSeconds: number): Promise<void> {
    if (this.circuitOpen) return;
    try {
      const serialized = JSON.stringify(value);
      await this.client.set(key, serialized, { ex: ttlSeconds });
      this.consecutiveErrors = 0;
    } catch (e) {
      this.errors++;
      this.consecutiveErrors++;
      if (this.consecutiveErrors >= MAX_CONSECUTIVE_ERRORS) {
        this.circuitOpen = true;
      }
    }
  }

  async delete(key: string): Promise<void> {
    try {
      await this.client.del(key);
    } catch (e) {
      this.errors++;
    }
  }

  async clear(): Promise<void> {
    try {
      await this.client.flushall();
    } catch (e) {
      this.errors++;
    }
  }

  async getMetrics(): Promise<{ hits: number; misses: number; errors: number; hitRatio: number } | null> {
    const total = this.hits + this.misses;
    return {
      hits: this.hits,
      misses: this.misses,
      errors: this.errors,
      hitRatio: total > 0 ? this.hits / total : 0,
    };
  }
}