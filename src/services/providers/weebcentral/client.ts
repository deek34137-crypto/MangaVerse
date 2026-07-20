import { Transport } from "../transport";
import { BASE_URL, SEARCH_PATH, CHAPTERS_PATH_SUFFIX, IMAGES_PATH_SUFFIX, CACHE_TTL } from "./constants";
import { cacheGet, cacheSet } from "@/services/cache";

export class WeebCentralClient {
  private transport: Transport;

  constructor() {
    this.transport = new Transport({
      providerName: "WeebCentral",
      timeoutMs: 15000, // 15 seconds to be robust
      retries: 3,
      backoffMs: 1500,
      circuitBreaker: { failureThreshold: 5, cooldownMs: 30000 },
      rateLimit: { maxRequests: 5, intervalMs: 2000 },
    });
  }

  public async fetchSearch(query: string, includeAdult: boolean): Promise<string> {
    const cacheKey = `weebcentral:search:${query.trim().toLowerCase()}:${includeAdult}`;
    const cached = await cacheGet<string>(cacheKey);
    if (cached) return cached;

    // WeebCentral requires display_mode=Full+Display for complete search details.
    const adultVal = includeAdult ? "Any" : "False";
    const url = `${BASE_URL}${SEARCH_PATH}?text=${encodeURIComponent(query)}&display_mode=Full+Display&adult=${adultVal}`;
    
    const html = await this.transport.requestText(url, {
      headers: {
        "HX-Request": "true",
      },
    });
    await cacheSet(cacheKey, html, CACHE_TTL.SEARCH);
    return html;
  }

  public async fetchDetail(mangaId: string): Promise<string> {
    const cacheKey = `weebcentral:detail:${mangaId}`;
    const cached = await cacheGet<string>(cacheKey);
    if (cached) return cached;

    const url = `${BASE_URL}/series/${mangaId}`;
    const html = await this.transport.requestText(url);
    await cacheSet(cacheKey, html, CACHE_TTL.DETAIL);
    return html;
  }

  public async fetchChapters(mangaId: string): Promise<string> {
    const cacheKey = `weebcentral:chapters:${mangaId}`;
    const cached = await cacheGet<string>(cacheKey);
    if (cached) return cached;

    const url = `${BASE_URL}/series/${mangaId}${CHAPTERS_PATH_SUFFIX}`;
    const html = await this.transport.requestText(url);
    await cacheSet(cacheKey, html, CACHE_TTL.CHAPTERS);
    return html;
  }

  public async fetchPages(chapterId: string): Promise<string> {
    const cacheKey = `weebcentral:pages:${chapterId}`;
    const cached = await cacheGet<string>(cacheKey);
    if (cached) return cached;

    // is_prev=False&current_page=1&reading_style=long_strip loads all pages
    const url = `${BASE_URL}/chapters/${chapterId}${IMAGES_PATH_SUFFIX}?is_prev=False&current_page=1&reading_style=long_strip`;
    
    // WeebCentral backend requires HX-Request header for this endpoint to return pages instead of 400.
    const html = await this.transport.requestText(url, {
      headers: {
        "HX-Request": "true",
        "Referer": `${BASE_URL}/chapters/${chapterId}`,
      },
    });
    
    await cacheSet(cacheKey, html, CACHE_TTL.PAGES);
    return html;
  }

  public async pingBase(): Promise<string> {
    return this.transport.requestText(BASE_URL);
  }
}
