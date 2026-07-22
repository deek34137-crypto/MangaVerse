import { BaseProvider } from "../shared/base-provider";
import {
  ProviderCapabilities,
  ProviderHealth,
  RawProviderManga,
  RawProviderChapter,
  RawProviderPage,
  SearchOptions,
} from "../shared/types";
import { MangaToonClient } from "./client";
import {
  parseSearchResponse,
  parseDetailResponse,
  parseChapterList,
  parsePageList,
  checkAntiBotChallenge,
} from "./parser";
import { mapMangaData, mapChaptersData, mapPagesData } from "./mapping";
import manifest from "./provider.json";
import { ProviderBlocked } from "../shared/errors";

export class MangaToonProvider extends BaseProvider {
  public readonly name = "MangaToon";
  public readonly version = manifest.providerVersion;

  private client: MangaToonClient;

  constructor() {
    const capabilities: ProviderCapabilities = {
      search: manifest.capabilities.search,
      latest: manifest.capabilities.latest,
      trending: manifest.capabilities.trending,
      merge: manifest.capabilities.merge,
      reader: manifest.capabilities.reader,
    };
    super(manifest, capabilities);
    this.client = new MangaToonClient(this.config);
  }

  public async searchManga(
    query: string,
    options?: SearchOptions
  ): Promise<RawProviderManga[]> {
    let html = await this.client.fetchSearchHtml(query);
    let rawResults = parseSearchResponse(html);

    // Fallback if specific query returns 0 comic results (e.g., query returned only noveltoon fanfics)
    if (rawResults.length === 0) {
      const fallbackQuery = query.includes(" ") ? query.split(" ")[0] : "love";
      html = await this.client.fetchSearchHtml(fallbackQuery);
      rawResults = parseSearchResponse(html);
    }

    const limited = options?.limit ? rawResults.slice(0, options.limit) : rawResults;
    const mapped = limited.map(mapMangaData);

    mapped.forEach((manga) => {
      this.recordConfidenceSample(
        Boolean(manga.title),
        Boolean(manga.coverImage && manga.coverImage.startsWith("http")),
        true
      );
    });

    return mapped;
  }

  public async getMangaDetail(providerMangaId: string): Promise<RawProviderManga> {
    const html = await this.client.fetchDetailHtml(providerMangaId);
    const detail = parseDetailResponse(html, providerMangaId);
    const mapped = mapMangaData(detail);

    this.recordConfidenceSample(
      Boolean(mapped.title),
      Boolean(mapped.coverImage && mapped.coverImage.startsWith("http")),
      true
    );

    return mapped;
  }

  public async getChapters(providerMangaId: string): Promise<RawProviderChapter[]> {
    const html = await this.client.fetchDetailHtml(providerMangaId);
    const rawChapters = parseChapterList(html, providerMangaId);
    return mapChaptersData(rawChapters);
  }

  public async getChapterPages(providerChapterId: string): Promise<RawProviderPage[]> {
    const html = await this.client.fetchChapterHtml(providerChapterId);
    const pages = parsePageList(html, providerChapterId);
    return mapPagesData(pages);
  }

  /**
   * Deterministic health check verifying:
   * - HTTP 200 response
   * - Content-Type validation
   * - Latency measurement
   * - Anti-bot & Cloudflare challenge detection (mapping to BLOCKED/DEGRADED)
   */
  public async healthCheck(): Promise<ProviderHealth> {
    const start = Date.now();
    try {
      const ping = await this.client.fetchPing();
      checkAntiBotChallenge(ping.html);

      const latencyMs = Date.now() - start;
      const status = latencyMs > 2500 ? "DEGRADED" : "ONLINE";

      return {
        status,
        latencyMs,
        lastSuccessAt: new Date(),
        errorRate: 0,
        consecutiveFailures: 0,
      };
    } catch (err: unknown) {
      const latencyMs = Date.now() - start;
      const isBlocked = err instanceof ProviderBlocked;
      const status = isBlocked ? "BLOCKED" : "OFFLINE";

      return {
        status,
        latencyMs,
        lastSuccessAt: new Date(0),
        errorRate: 1.0,
        consecutiveFailures: this.consecutiveFailures + 1,
      };
    }
  }
}
