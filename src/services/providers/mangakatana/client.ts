import { Transport } from "../transport";
import { BASE_URL, CACHE_TTL } from "./constants";
import { cacheGet, cacheSet } from "@/services/cache";

export class MangaKatanaClient {
  private transport: Transport;

  constructor() {
    this.transport = new Transport({
      providerName: "MangaKatana",
      timeoutMs: 15000,
      retries: 3,
      backoffMs: 1000,
      circuitBreaker: { failureThreshold: 5, cooldownMs: 30000 },
      rateLimit: { maxRequests: 5, intervalMs: 2000 },
    });
  }

  private hashKey(key: string): string {
    return encodeURIComponent(key);
  }

  public async fetchSearch(query: string): Promise<string> {
    const rawKey = `mangakatana:search:${query.trim().toLowerCase()}`;
    const cacheKey = this.hashKey(rawKey);
    const cached = await cacheGet<string>(cacheKey);
    if (cached) return cached;

    // Verify search route with correct encoding
    const url = `${BASE_URL}/?search=${encodeURIComponent(query)}`;
    const html = await this.transport.requestText(url);
    await cacheSet(cacheKey, html, CACHE_TTL.SEARCH);
    return html;
  }

  public async fetchDetail(mangaId: string): Promise<string> {
    const rawKey = `mangakatana:detail:${mangaId}`;
    const cacheKey = this.hashKey(rawKey);
    const cached = await cacheGet<string>(cacheKey);
    if (cached) return cached;

    const url = `${BASE_URL}/manga/${mangaId}`;
    const html = await this.transport.requestText(url);
    await cacheSet(cacheKey, html, CACHE_TTL.DETAIL);
    return html;
  }

  public async fetchPages(chapterRelativePath: string): Promise<string> {
    const rawKey = `mangakatana:pages:${chapterRelativePath}`;
    const cacheKey = this.hashKey(rawKey);
    const cached = await cacheGet<string>(cacheKey);
    if (cached) return cached;

    const url = `${BASE_URL}/${chapterRelativePath}`;
    const html = await this.transport.requestText(url);
    await cacheSet(cacheKey, html, CACHE_TTL.PAGES);
    return html;
  }

  public async pingBase(): Promise<string> {
    return this.transport.requestText(BASE_URL);
  }
}
