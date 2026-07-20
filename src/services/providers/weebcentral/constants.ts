export const BASE_URL = "https://weebcentral.com";
export const SEARCH_PATH = "/search/data";
export const CHAPTERS_PATH_SUFFIX = "/full-chapter-list";
export const IMAGES_PATH_SUFFIX = "/images";

export const CACHE_TTL = {
  SEARCH: 600,         // 10 minutes
  DETAIL: 86400,       // 24 hours
  CHAPTERS: 1800,      // 30 minutes
  PAGES: 86400,        // 24 hours
} as const;
