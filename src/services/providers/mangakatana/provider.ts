import { BaseProvider } from "../shared/base-provider";
import { ProviderCapabilities, ProviderHealth, RawProviderManga, RawProviderChapter, RawProviderPage, SearchOptions } from "../shared/types";
import { MangaKatanaClient } from "./client";
import { MangaKatanaParser } from "./parser";
import { MangaKatanaMapper } from "./mapping";
import manifest from "./provider.json";

export class MangaKatanaProvider extends BaseProvider {
  public readonly name = "MangaKatana";
  public readonly version = manifest.providerVersion;

  private client: MangaKatanaClient;
  private parser: MangaKatanaParser;

  constructor() {
    const capabilities: ProviderCapabilities = {
      search:   manifest.capabilities.search,
      latest:   manifest.capabilities.latest,
      trending: manifest.capabilities.trending,
      merge:    manifest.capabilities.merge,
      reader:   manifest.capabilities.reader,
    };
    super(manifest, capabilities);

    this.client = new MangaKatanaClient();
    this.parser = new MangaKatanaParser();
  }

  public async searchManga(query: string, options?: SearchOptions): Promise<RawProviderManga[]> {
    const html = await this.client.fetchSearch(query);
    const parsed = this.parser.parseSearch(html);
    const items = options?.limit ? parsed.slice(0, options.limit) : parsed;
    return items.map(item => MangaKatanaMapper.mapSearchItem(item));
  }

  public async getMangaDetail(providerMangaId: string): Promise<RawProviderManga> {
    const html = await this.client.fetchDetail(providerMangaId);
    const parsed = this.parser.parseDetail(html);
    return MangaKatanaMapper.mapDetail(providerMangaId, parsed);
  }

  public async getChapters(providerMangaId: string): Promise<RawProviderChapter[]> {
    const html = await this.client.fetchDetail(providerMangaId);
    const parsed = this.parser.parseChapters(html, providerMangaId);
    
    // Sort numerically to prevent site-order layout assumptions
    const sorted = parsed.sort((a, b) => (a.number ?? 99999) - (b.number ?? 99999));
    return sorted.map(ch => MangaKatanaMapper.mapChapter(ch));
  }

  public async getChapterPages(providerChapterId: string): Promise<RawProviderPage[]> {
    // E.g. providerChapterId: 'manga/one-piece.49/c1188'
    const html = await this.client.fetchPages(providerChapterId);
    const parsed = this.parser.parsePages(html);
    return MangaKatanaMapper.mapPages(parsed);
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
export default MangaKatanaProvider;
