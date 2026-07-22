import { Transport } from "../shared/transport/transport";
import { MANGATOWN_CONSTANTS } from "./constants";
import {
  parseSearchHtmlResponse,
  parseDetailResponse,
  parseChapterList,
  parsePageList,
  checkAntiBotChallenge,
} from "./parser";
import { RawProviderManga, RawProviderChapter, RawProviderPage } from "../shared/types";
import { cacheGet, cacheSet } from "@/services/cache";

export class MangaTownClient {
  private transport: Transport;

  constructor() {
    this.transport = new Transport({
      id: MANGATOWN_CONSTANTS.ID,
      displayName: MANGATOWN_CONSTANTS.DISPLAY_NAME,
      network: {
        timeoutMs: 12000,
        retries: 3,
        rateLimit: { maxRequests: 30, intervalMs: 10000 },
      },
    });
  }

  public async searchManga(query: string): Promise<RawProviderManga[]> {
    const cacheKey = `mangatown:search:${query.trim().toLowerCase()}`;
    const cached = await cacheGet<RawProviderManga[]>(cacheKey);
    if (cached) return cached;

    const url = `${MANGATOWN_CONSTANTS.SEARCH_URL}?name=${encodeURIComponent(query)}`;
    try {
      const html = await this.transport.requestText(url, { headers: MANGATOWN_CONSTANTS.DEFAULT_HEADERS });
      const parsed = parseSearchHtmlResponse(html);
      await cacheSet(cacheKey, parsed, 300000); // 5 min TTL
      return parsed;
    } catch {
      return [];
    }
  }

  public async getMangaDetail(providerMangaId: string): Promise<RawProviderManga> {
    const cacheKey = `mangatown:detail:${providerMangaId}`;
    const cached = await cacheGet<RawProviderManga>(cacheKey);
    if (cached) return cached;

    const cleanId = providerMangaId.startsWith("manga/") ? providerMangaId : `manga/${providerMangaId}`;
    const url = `${MANGATOWN_CONSTANTS.BASE_URL}/${cleanId}/`;
    const html = await this.transport.requestText(url, { headers: MANGATOWN_CONSTANTS.DEFAULT_HEADERS });
    const detail = parseDetailResponse(html, providerMangaId);
    await cacheSet(cacheKey, detail, 3600000); // 1 hr TTL
    return detail;
  }

  public async getChapters(providerMangaId: string): Promise<RawProviderChapter[]> {
    const cacheKey = `mangatown:chapters:${providerMangaId}`;
    const cached = await cacheGet<RawProviderChapter[]>(cacheKey);
    if (cached) return cached;

    const cleanId = providerMangaId.startsWith("manga/") ? providerMangaId : `manga/${providerMangaId}`;
    const url = `${MANGATOWN_CONSTANTS.BASE_URL}/${cleanId}/`;
    const html = await this.transport.requestText(url, { headers: MANGATOWN_CONSTANTS.DEFAULT_HEADERS });
    const chapters = parseChapterList(html, providerMangaId);
    await cacheSet(cacheKey, chapters, 1800000); // 30 min TTL
    return chapters;
  }

  public async getChapterPages(providerChapterId: string): Promise<RawProviderPage[]> {
    const cacheKey = `mangatown:pages:${providerChapterId}`;
    const cached = await cacheGet<RawProviderPage[]>(cacheKey);
    if (cached) return cached;

    const cleanSubpath = providerChapterId.replace(/^\/?manga\//, "").replace(/^\//, "");
    const targetUrl = providerChapterId.startsWith("http")
      ? providerChapterId
      : `${MANGATOWN_CONSTANTS.BASE_URL}/manga/${cleanSubpath}`;

    const html = await this.transport.requestText(targetUrl, { headers: MANGATOWN_CONSTANTS.DEFAULT_HEADERS });
    const pages = parsePageList(html, providerChapterId);
    await cacheSet(cacheKey, pages, 3600000);
    return pages;
  }

  public async fetchPing(): Promise<{ htmlOk: boolean; latencyMs: number; html: string }> {
    const start = Date.now();
    const html = await this.transport.requestText(`${MANGATOWN_CONSTANTS.BASE_URL}/`, {
      headers: MANGATOWN_CONSTANTS.DEFAULT_HEADERS,
    });

    return {
      htmlOk: html.length > 500,
      latencyMs: Date.now() - start,
      html,
    };
  }
}
