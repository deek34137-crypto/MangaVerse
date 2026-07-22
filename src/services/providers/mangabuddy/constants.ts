export const MANGABUDDY_CONSTANTS = {
  ID: "mangabuddy",
  DISPLAY_NAME: "MangaBuddy",
  BASE_URL: "https://mangabuddy1.co.uk",
  ENDPOINTS: {
    SEARCH_API: "/api/search",
    SEARCH_FALLBACK: "/series",
    DETAIL: "/series",
    CHAPTER: "/series",
  },
  CDN_HOSTS: [
    "mangabuddy1.co.uk",
    "cdn1.love4awalk.xyz",
    "cdn2.love4awalk.xyz",
  ],
  DEFAULT_HEADERS: {
    "User-Agent":
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
    "Accept":
      "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
    "Accept-Language": "en-US,en;q=0.9",
    "Referer": "https://mangabuddy1.co.uk/",
  },
  ANTI_BOT_SIGNATURES: [
    "just a moment...",
    "enable javascript and cookies to continue",
    "attention required! | cloudflare",
    "ddos-guard",
    "cloudflare-nginx",
    "security check",
  ],
};
