export interface RateLimitConfig {
  windowMs: number;
  maxRequests: number;
  keyPrefix: string;
}

export const defaultRateLimitConfig: RateLimitConfig = {
  windowMs: 60000,
  maxRequests: 60,
  keyPrefix: "default",
};

export const rateLimitConfigs: Record<string, RateLimitConfig> = {
  "/api/search": { windowMs: 60000, maxRequests: 120, keyPrefix: "search" },
  "/api/home": { windowMs: 60000, maxRequests: 120, keyPrefix: "home" },
  "/api/manga": { windowMs: 60000, maxRequests: 60, keyPrefix: "manga" },
  "/api/chapter": { windowMs: 60000, maxRequests: 120, keyPrefix: "chapter" },
  "/api/auth": { windowMs: 60000, maxRequests: 10, keyPrefix: "auth" },
  "/api/cron": { windowMs: 60000, maxRequests: 1000, keyPrefix: "cron" },
};

export function getConfigForPath(path: string): RateLimitConfig {
  for (const [prefix, config] of Object.entries(rateLimitConfigs)) {
    if (path.startsWith(prefix)) {
      return config;
    }
  }
  return { windowMs: 60000, maxRequests: 60, keyPrefix: "default" };
}