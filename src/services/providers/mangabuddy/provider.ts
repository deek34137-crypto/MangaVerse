import { BaseProvider } from "../shared/base-provider";
import {
  ProviderCapabilities,
  ProviderHealth,
  RawProviderManga,
  RawProviderChapter,
  RawProviderPage,
  SearchOptions,
} from "../shared/types";
import { MangaBuddyClient } from "./client";
import {
  parseSearchJsonResponse,
  parseSearchHtmlResponse,
  parseDetailResponse,
  parseChapterList,
  parsePageList,
  checkAntiBotChallenge,
} from "./parser";
import { mapMangaData, mapChaptersData, mapPagesData } from "./mapping";
import manifest from "./provider.json";
import { ProviderBlocked } from "../shared/errors";

export class MangaBuddyProvider extends BaseProvider {
  public readonly name = "MangaBuddy";
  public readonly version = manifest.providerVersion;

  private client: MangaBuddyClient;

  constructor() {
    const capabilities: ProviderCapabilities = {
      search: manifest.capabilities.search,
      latest: manifest.capabilities.latest,
      trending: manifest.capabilities.trending,
      merge: manifest.capabilities.merge,
      reader: manifest.capabilities.reader,
    };
    super(manifest, capabilities);
    this.client = new MangaBuddyClient(this.config);
  }

  public async searchManga(
    query: string,
    options?: SearchOptions
  ): Promise<RawProviderManga[]> {
    const searchRes = await this.client.fetchSearch(query);
    const rawResults = searchRes.isJson
      ? parseSearchJsonResponse(searchRes.data)
      : parseSearchHtmlResponse(searchRes.data);

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
    const formatted = rawChapters.map((ch) => ({
      ...ch,
      id: ch.id.includes("/") ? ch.id : `${providerMangaId}/${ch.id}`,
    }));
    return mapChaptersData(formatted);
  }

  public async getChapterPages(providerChapterId: string): Promise<RawProviderPage[]> {
    const parts = providerChapterId.split("/");
    const mangaId = parts.length > 1 ? parts[0] : providerChapterId;
    const chapterId = parts.length > 1 ? parts.slice(1).join("/") : providerChapterId;

    const html = await this.client.fetchChapterHtml(mangaId, chapterId);
    const pages = parsePageList(html, providerChapterId);
    return mapPagesData(pages);
  }

  /**
   * Dual-layer health check verifying:
   * - HTML reader home page load
   * - JSON search API response
   * - Latency measurement
   * - Anti-bot & Cloudflare challenge detection (mapping to BLOCKED/DEGRADED)
   */
  public async healthCheck(): Promise<ProviderHealth> {
    const start = Date.now();
    try {
      const ping = await this.client.fetchPing();
      checkAntiBotChallenge(ping.html);

      const latencyMs = Date.now() - start;
      const status = !ping.apiOk ? "DEGRADED" : latencyMs > 2500 ? "DEGRADED" : "ONLINE";

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
