export const DEFAULT_CACHE_TTL = {
  SEARCH: 600,         // 10 minutes (seconds)
  DETAIL: 86400,       // 24 hours (seconds)
  CHAPTERS: 1800,      // 30 minutes (seconds)
  PAGES: 86400,        // 24 hours (seconds)
} as const;

export function msToSeconds(ms: number): number {
  return Math.ceil(ms / 1000);
}
