export const MANGATOON_CONSTANTS = {
  ID: "mangatoon",
  DISPLAY_NAME: "MangaToon",
  BASE_URL: "https://mangatoon.mobi",
  API_BASE_URL: "https://mangatoon.mobi/en",
  DEFAULT_HEADERS: {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
    "Accept-Language": "en-US,en;q=0.9",
    "Referer": "https://mangatoon.mobi/en",
  },
  ENDPOINTS: {
    SEARCH: "/en/search",
    DETAIL: "/en/detail",
    CHAPTER: "/en/watch",
    LATEST: "/en/genre/comic",
  },
  ANTI_BOT_SIGNATURES: [
    "cf-browser-verification",
    "challenge-running",
    "cloudflare-static",
    "just a moment...",
    "enable javascript and cookies to continue",
    "attention required! | cloudflare",
    "captcha-delivery",
    "access denied",
  ],
};
