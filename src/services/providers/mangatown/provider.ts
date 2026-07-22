import { BaseProvider } from "../shared/base-provider";
import { MangaTownClient } from "./client";
import { checkAntiBotChallenge } from "./parser";
import { mapMangaTownDetail, mapMangaTownChapter, mapMangaTownPages } from "./mapping";
import { ProviderCapabilities, ProviderHealth, RawProviderManga, RawProviderChapter, RawProviderPage } from "../shared/types";
import { ProviderBlocked } from "../shared/errors";
import manifest from "./provider.json";

export class MangaTownProvider extends BaseProvider {
  public readonly name = "MangaTown";
  public readonly version = manifest.providerVersion;

  private client: MangaTownClient;

  constructor() {
    const capabilities: ProviderCapabilities = {
      search: manifest.capabilities.search,
      latest: manifest.capabilities.latest,
      trending: manifest.capabilities.trending,
      merge: manifest.capabilities.merge,
      reader: manifest.capabilities.reader,
    };
    super(manifest, capabilities);
    this.client = new MangaTownClient();
  }

  public async searchManga(query: string, options?: { limit?: number }): Promise<RawProviderManga[]> {
    const rawResults = await this.client.searchManga(query);
    const mapped = rawResults.map((r) => mapMangaTownDetail(r));
    return options?.limit ? mapped.slice(0, options.limit) : mapped;
  }

  public async getMangaDetail(providerMangaId: string): Promise<RawProviderManga> {
    const raw = await this.client.getMangaDetail(providerMangaId);
    return mapMangaTownDetail(raw);
  }

  public async getChapters(providerMangaId: string): Promise<RawProviderChapter[]> {
    const raw = await this.client.getChapters(providerMangaId);
    return raw.map((c) => mapMangaTownChapter(c));
  }

  public async getChapterPages(providerChapterId: string): Promise<RawProviderPage[]> {
    const rawPages = await this.client.getChapterPages(providerChapterId);
    return mapMangaTownPages(rawPages);
  }

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
