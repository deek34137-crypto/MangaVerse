import { Transport } from "../transport";
import { BASE_URL, BASE_HEADERS, CACHE_TTL } from "./constants";
import { cacheGet, cacheSet } from "@/services/cache";

/**
 * HTTP client for WEBTOON.
 * All requests include browser-like headers (User-Agent + Referer)
 * to satisfy CDN hotlink protection and bot detection.
 */
export class WebtoonClient {
  private transport: Transport;

  constructor() {
    this.transport = new Transport({
      providerName: "WEBTOON",
      timeoutMs: 12000,
      retries: 2,
      backoffMs: 2000,
      circuitBreaker: { failureThreshold: 4, cooldownMs: 60000 },
      rateLimit: { maxRequests: 2, intervalMs: 1000 },
    });
  }

  /** Search WEBTOON for series matching query. */
  public async fetchSearch(query: string): Promise<string> {
    const cacheKey = `webtoon:search:${query.trim().toLowerCase()}`;
    const cached = await cacheGet<string>(cacheKey);
    if (cached) return cached;

    const url = `${BASE_URL}/en/search?keyword=${encodeURIComponent(query)}`;
    const html = await this.transport.requestText(url, { headers: BASE_HEADERS });
    await cacheSet(cacheKey, html, CACHE_TTL.SEARCH);
    return html;
  }

  /**
   * Fetch the series detail page by full constructed URL.
   * URL format: /en/{genre}/{slug}/list?title_no={titleNo}
   */
  public async fetchDetailByUrl(detailUrl: string, titleNo: string): Promise<string> {
    const cacheKey = `webtoon:detail:${titleNo}`;
    const cached = await cacheGet<string>(cacheKey);
    if (cached) return cached;

    const html = await this.transport.requestText(detailUrl, { headers: BASE_HEADERS });
    await cacheSet(cacheKey, html, CACHE_TTL.DETAIL);
    return html;
  }

  /**
   * Fetch a single page of the episode list.
   * Page numbering starts at 1. Caller should stop when parseEpisodesFromPage().count === 0.
   */
  public async fetchChapterPage(
    titleNo: string,
    genre: string,
    slug: string,
    page: number
  ): Promise<string> {
    const cacheKey = `webtoon:chapters:${titleNo}:page:${page}`;
    const cached = await cacheGet<string>(cacheKey);
    if (cached) return cached;

    const url = `${BASE_URL}/en/${genre}/${slug}/list?title_no=${titleNo}&page=${page}`;
    const html = await this.transport.requestText(url, { headers: BASE_HEADERS });
    await cacheSet(cacheKey, html, CACHE_TTL.CHAPTERS);
    return html;
  }

  /**
   * Fetch the episode viewer page using the stored viewerUrl.
   * viewerUrl is always the full URL from the episode anchor href —
   * never reconstructed to avoid URL format breakage.
   */
  public async fetchPages(viewerUrl: string, titleNo: string, episodeNo: string): Promise<string> {
    const cacheKey = `webtoon:pages:${titleNo}:${episodeNo}`;
    const cached = await cacheGet<string>(cacheKey);
    if (cached) return cached;

    // Viewer requires Referer to be the series list page
    const referer = `${BASE_URL}/en/`;
    const html = await this.transport.requestText(viewerUrl, {
      headers: { ...BASE_HEADERS, Referer: referer },
    });
    await cacheSet(cacheKey, html, CACHE_TTL.PAGES);
    return html;
  }

  /** Lightweight ping for healthCheck(). */
  public async pingBase(): Promise<string> {
    return this.transport.requestText(BASE_URL, { headers: BASE_HEADERS });
  }
}
