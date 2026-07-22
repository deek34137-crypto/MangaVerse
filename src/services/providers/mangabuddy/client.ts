import { Transport } from "../shared/transport/transport";
import { MANGABUDDY_CONSTANTS } from "./constants";
import { ProviderConfig } from "../shared/types";
import { cacheGet, cacheSet } from "@/services/cache";

export class MangaBuddyClient {
  private transport: Transport;

  constructor(config?: ProviderConfig) {
    this.transport = new Transport({
      id: MANGABUDDY_CONSTANTS.ID,
      displayName: MANGABUDDY_CONSTANTS.DISPLAY_NAME,
      network: config?.network ?? {
        baseUrl: MANGABUDDY_CONSTANTS.BASE_URL,
        timeoutMs: 10000,
        retries: 3,
        rateLimit: {
          maxRequests: 5,
          intervalMs: 1000,
        },
      },
    });
  }

  /**
   * Primary JSON API Search with fallback to HTML Catalog Search if JSON endpoint is unavailable.
   */
  public async fetchSearch(query: string): Promise<{ data: string; isJson: boolean }> {
    const cacheKey = `mangabuddy:search:${query.trim().toLowerCase()}`;
    const cached = await cacheGet<{ data: string; isJson: boolean }>(cacheKey);
    if (cached) return cached;

    const jsonUrl = `${MANGABUDDY_CONSTANTS.BASE_URL}${MANGABUDDY_CONSTANTS.ENDPOINTS.SEARCH_API}?q=${encodeURIComponent(query)}`;
    try {
      const jsonRes = await this.transport.requestText(jsonUrl, {
        headers: {
          ...MANGABUDDY_CONSTANTS.DEFAULT_HEADERS,
          "Accept": "application/json, text/plain, */*",
          "X-Requested-With": "XMLHttpRequest",
        },
      });

      if (jsonRes.includes("comics") || jsonRes.includes("slug_hash")) {
        const result = { data: jsonRes, isJson: true };
        await cacheSet(cacheKey, result, 300000); // 5 min TTL
        return result;
      }
    } catch {}

    // Fallback: HTML Catalog Search
    const fallbackUrl = `${MANGABUDDY_CONSTANTS.BASE_URL}${MANGABUDDY_CONSTANTS.ENDPOINTS.SEARCH_FALLBACK}?search=${encodeURIComponent(query)}`;
    const htmlRes = await this.transport.requestText(fallbackUrl, {
      headers: MANGABUDDY_CONSTANTS.DEFAULT_HEADERS,
    });

    const result = { data: htmlRes, isJson: false };
    await cacheSet(cacheKey, result, 300000);
    return result;
  }

  public async fetchDetailHtml(providerMangaId: string): Promise<string> {
    const cacheKey = `mangabuddy:detail:${providerMangaId}`;
    const cached = await cacheGet<string>(cacheKey);
    if (cached) return cached;

    const targetUrl = providerMangaId.startsWith("http")
      ? providerMangaId
      : providerMangaId.startsWith("series/")
        ? `${MANGABUDDY_CONSTANTS.BASE_URL}/${providerMangaId}`
        : `${MANGABUDDY_CONSTANTS.BASE_URL}${MANGABUDDY_CONSTANTS.ENDPOINTS.DETAIL}/${providerMangaId.startsWith("/") ? providerMangaId.slice(1) : providerMangaId}`;

    const html = await this.transport.requestText(targetUrl, {
      headers: MANGABUDDY_CONSTANTS.DEFAULT_HEADERS,
    });

    await cacheSet(cacheKey, html, 3600000); // 1 hr TTL
    return html;
  }

  public async fetchChapterHtml(providerMangaId: string, providerChapterId: string): Promise<string> {
    const cacheKey = `mangabuddy:chapter:${providerMangaId}:${providerChapterId}`;
    const cached = await cacheGet<string>(cacheKey);
    if (cached) return cached;

    const targetUrl = providerChapterId.startsWith("http")
      ? providerChapterId
      : providerChapterId.includes("/series/")
        ? `${MANGABUDDY_CONSTANTS.BASE_URL}${providerChapterId.startsWith("/") ? "" : "/"}${providerChapterId}`
        : `${MANGABUDDY_CONSTANTS.BASE_URL}/series/${providerMangaId}/chapter-${providerChapterId.replace(/^chapter-/, "")}`;

    const html = await this.transport.requestText(targetUrl, {
      headers: {
        ...MANGABUDDY_CONSTANTS.DEFAULT_HEADERS,
        Referer: `${MANGABUDDY_CONSTANTS.BASE_URL}/series/${providerMangaId}`,
      },
    });

    await cacheSet(cacheKey, html, 1800000); // 30 min TTL
    return html;
  }

  /**
   * Dual-layer ping verifying both JSON search API and HTML reader home page.
   */
  public async fetchPing(): Promise<{ apiOk: boolean; htmlOk: boolean; latencyMs: number; html: string }> {
    const start = Date.now();
    const htmlPing = await this.transport.requestText(`${MANGABUDDY_CONSTANTS.BASE_URL}/home`, {
      headers: MANGABUDDY_CONSTANTS.DEFAULT_HEADERS,
    });

    let apiOk = false;
    try {
      const apiPing = await this.transport.requestText(
        `${MANGABUDDY_CONSTANTS.BASE_URL}${MANGABUDDY_CONSTANTS.ENDPOINTS.SEARCH_API}?q=a`,
        { headers: MANGABUDDY_CONSTANTS.DEFAULT_HEADERS }
      );
      apiOk = apiPing.includes("comics");
    } catch {}

    return {
      apiOk,
      htmlOk: htmlPing.length > 500,
      latencyMs: Date.now() - start,
      html: htmlPing,
    };
  }
}
