/** Base URL and request constants for the WEBTOON provider. */
export const BASE_URL = "https://www.webtoons.com";

/** Headers required for all WEBTOON requests.
 *  - User-Agent: mimic a desktop browser to avoid bot detection
 *  - Referer:    required by webtoon-phinf CDN to serve page images
 *  - Accept-Language: ensures English-language responses
 */
export const BASE_HEADERS: Record<string, string> = {
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
  "Referer": "https://www.webtoons.com/",
  "Accept-Language": "en-US,en;q=0.9",
  "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
};

/** Cache time-to-live constants (milliseconds).
 *  Search results change frequently; pages are permanent once published.
 */
export const CACHE_TTL = {
  SEARCH:   5  * 60 * 1000,   //  5 minutes
  DETAIL:   24 * 60 * 60 * 1000,  // 24 hours
  CHAPTERS: 30 * 60 * 1000,   // 30 minutes
  PAGES:    24 * 60 * 60 * 1000,  // 24 hours
} as const;
