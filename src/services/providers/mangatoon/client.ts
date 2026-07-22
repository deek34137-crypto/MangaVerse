import { Transport } from "../shared/transport/transport";
import { MANGATOON_CONSTANTS } from "./constants";
import { ProviderConfig } from "../shared/types";
import { cacheGet, cacheSet } from "@/services/cache";

export class MangaToonClient {
  private transport: Transport;

  constructor(config?: ProviderConfig) {
    this.transport = new Transport({
      id: MANGATOON_CONSTANTS.ID,
      displayName: MANGATOON_CONSTANTS.DISPLAY_NAME,
      network: config?.network ?? {
        baseUrl: MANGATOON_CONSTANTS.BASE_URL,
        timeoutMs: 10000,
        retries: 3,
        rateLimit: {
          maxRequests: 5,
          intervalMs: 1000,
        },
      },
    });
  }

  public async fetchSearchHtml(query: string): Promise<string> {
    const cacheKey = `mangatoon:search:${query.trim().toLowerCase()}`;
    const cached = await cacheGet<string>(cacheKey);
    if (cached) return cached;

    const url = `${MANGATOON_CONSTANTS.BASE_URL}${MANGATOON_CONSTANTS.ENDPOINTS.SEARCH}?word=${encodeURIComponent(query)}`;
    const html = await this.transport.requestText(url, {
      headers: MANGATOON_CONSTANTS.DEFAULT_HEADERS,
    });

    await cacheSet(cacheKey, html, 300000); // 5 min TTL
    return html;
  }

  public async fetchDetailHtml(providerMangaId: string): Promise<string> {
    const cacheKey = `mangatoon:detail:${providerMangaId}`;
    const cached = await cacheGet<string>(cacheKey);
    if (cached) return cached;

    const targetUrl = providerMangaId.startsWith("http")
      ? providerMangaId
      : providerMangaId.startsWith("en/")
        ? `${MANGATOON_CONSTANTS.BASE_URL}/${providerMangaId}`
        : `${MANGATOON_CONSTANTS.BASE_URL}/en/${providerMangaId.startsWith("/") ? providerMangaId.slice(1) : providerMangaId}`;

    const html = await this.transport.requestText(targetUrl, {
      headers: MANGATOON_CONSTANTS.DEFAULT_HEADERS,
    });

    await cacheSet(cacheKey, html, 3600000); // 1 hr TTL
    return html;
  }

  public async fetchChapterHtml(providerChapterId: string): Promise<string> {
    const cacheKey = `mangatoon:chapter:${providerChapterId}`;
    const cached = await cacheGet<string>(cacheKey);
    if (cached) return cached;

    const targetUrl = providerChapterId.startsWith("http")
      ? providerChapterId
      : providerChapterId.startsWith("watch/")
        ? `${MANGATOON_CONSTANTS.BASE_URL}/en/${providerChapterId}`
        : providerChapterId.startsWith("en/watch/")
          ? `${MANGATOON_CONSTANTS.BASE_URL}/${providerChapterId}`
          : `${MANGATOON_CONSTANTS.BASE_URL}${MANGATOON_CONSTANTS.ENDPOINTS.CHAPTER}/${providerChapterId.startsWith("/") ? providerChapterId.slice(1) : providerChapterId}`;

    const html = await this.transport.requestText(targetUrl, {
      headers: MANGATOON_CONSTANTS.DEFAULT_HEADERS,
    });

    await cacheSet(cacheKey, html, 1800000); // 30 min TTL
    return html;
  }

  public async fetchPing(): Promise<{ status: number; durationMs: number; html: string }> {
    const start = Date.now();
    const html = await this.transport.requestText(`${MANGATOON_CONSTANTS.BASE_URL}/en`, {
      headers: MANGATOON_CONSTANTS.DEFAULT_HEADERS,
    });
    return {
      status: 200,
      durationMs: Date.now() - start,
      html,
    };
  }
}
