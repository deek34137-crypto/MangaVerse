import { BaseProvider } from "../shared/base-provider";
import { ProviderCapabilities, ProviderHealth, RawProviderManga, RawProviderChapter, RawProviderPage, SearchOptions } from "../shared/types";
import { WeebCentralClient } from "./client";
import { WeebCentralParser } from "./parser";
import { WeebCentralMapper } from "./mapping";
import manifest from "./provider.json";

export class WeebCentralProvider extends BaseProvider {
  public readonly name = "WeebCentral";
  public readonly version = manifest.providerVersion;

  private client: WeebCentralClient;
  private parser: WeebCentralParser;

  constructor() {
    const capabilities: ProviderCapabilities = {
      search:   manifest.capabilities.search,
      latest:   manifest.capabilities.latest,
      trending: manifest.capabilities.trending,
      merge:    manifest.capabilities.merge,
      reader:   manifest.capabilities.reader,
    };
    super(manifest, capabilities);

    this.client = new WeebCentralClient();
    this.parser = new WeebCentralParser();
  }

  public async searchManga(query: string, options?: SearchOptions): Promise<RawProviderManga[]> {
    const includeAdult = options?.nsfw ?? false;
    const html = await this.client.fetchSearch(query, includeAdult);
    const parsedItems = this.parser.parseSearch(html);
    
    const items = options?.limit ? parsedItems.slice(0, options.limit) : parsedItems;
    return items.map(item => WeebCentralMapper.mapSearchItem(item));
  }

  public async getMangaDetail(providerMangaId: string): Promise<RawProviderManga> {
    const html = await this.client.fetchDetail(providerMangaId);
    const parsedDetail = this.parser.parseDetail(html);
    return WeebCentralMapper.mapDetail(providerMangaId, parsedDetail);
  }

  public async getChapters(providerMangaId: string): Promise<RawProviderChapter[]> {
    const html = await this.client.fetchChapters(providerMangaId);
    const parsedChapters = this.parser.parseChapters(html);
    
    // WeebCentral returns newest chapters first. We reverse to return ascending order.
    const ascChapters = parsedChapters.reverse();
    return ascChapters.map(ch => WeebCentralMapper.mapChapter(ch));
  }

  public async getChapterPages(providerChapterId: string): Promise<RawProviderPage[]> {
    const html = await this.client.fetchPages(providerChapterId);
    const parsedPages = this.parser.parsePages(html);
    return WeebCentralMapper.mapPages(parsedPages);
  }

  public async healthCheck(): Promise<ProviderHealth> {
    const start = Date.now();
    try {
      await this.client.pingBase();
      return {
        status: "ONLINE",
        latencyMs: Date.now() - start,
        lastSuccessAt: new Date(),
        errorRate: 0,
        consecutiveFailures: 0,
      };
    } catch {
      return {
        status: "OFFLINE",
        latencyMs: Date.now() - start,
        lastSuccessAt: new Date(0),
        errorRate: 1.0,
        consecutiveFailures: 1,
      };
    }
  }
}
