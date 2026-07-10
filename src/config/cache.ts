export const CACHE_VERSION = "v1";

export const CACHE_KEY_PREFIX = "home";

export const cacheTTL = {
  featured: 3600,
  latest: 120,
  trending: 300,
  popular: 900,
  continueReading: 300,
  recommendations: 1800,
} as const;

export type CacheSection = keyof typeof cacheTTL;

export type CacheNamespace = CacheSection;

export function getTTL(section: CacheSection): number {
  return cacheTTL[section] ?? 300;
}

export function buildCacheKey(section: CacheSection, limit: number): string {
  return `${CACHE_VERSION}:${CACHE_KEY_PREFIX}:${section}:${limit}`;
}

export function buildUserCacheKey(section: "continueReading" | "recommendations", userId: string, limit: number): string {
  return `${CACHE_VERSION}:${CACHE_KEY_PREFIX}:user:${section}:${userId}:${limit}`;
}