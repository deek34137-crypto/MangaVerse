import { ProviderAdapter, SourcesApiResponse } from "../../types";
import { healthManager } from "../health/health-manager";

// Tier 1
import { WeebCentralAdapter } from "./tier1/weebcentral";
import { MangaKatanaAdapter } from "./tier1/mangakatana";
import { MangaDexAdapter } from "./tier1/mangadex";
import { ComicKAdapter } from "./tier1/comick";
import { AsuraScanAdapter } from "./tier1/asurascan";
import { FlameComicsAdapter } from "./tier1/flamecomics";
import { MGekoAdapter } from "./tier1/mgeko";

// Tier 2
import { MangaReadAdapter } from "./tier2/mangaread";
import { BatoAdapter } from "./tier2/bato";
import { DemonicScansAdapter } from "./tier2/demonicscans";
import { KaliScanAdapter } from "./tier2/kaliscan";
import { WebtoonAdapter } from "./tier2/webtoon";
import { NovelCoolAdapter } from "./tier2/novelcool";

class AdapterRegistry {
  private adapters = new Map<string, ProviderAdapter>();

  constructor() {
    // Register Tier 1 Core
    this.register(new WeebCentralAdapter());
    this.register(new MangaKatanaAdapter());
    this.register(new MangaDexAdapter());
    this.register(new ComicKAdapter());
    this.register(new AsuraScanAdapter());
    this.register(new FlameComicsAdapter());
    this.register(new MGekoAdapter());

    // Register Tier 2 Secondary
    this.register(new MangaReadAdapter());
    this.register(new BatoAdapter());
    this.register(new DemonicScansAdapter());
    this.register(new KaliScanAdapter());
    this.register(new WebtoonAdapter());
    this.register(new NovelCoolAdapter());
  }

  public register(adapter: ProviderAdapter): void {
    this.adapters.set(adapter.id.toLowerCase(), adapter);
  }

  public get(id: string): ProviderAdapter | undefined {
    return this.adapters.get(id.toLowerCase());
  }

  public getAll(): ProviderAdapter[] {
    return Array.from(this.adapters.values());
  }

  public getTier1(): ProviderAdapter[] {
    return this.getAll().filter((a) => a.tier === 1);
  }

  public getTier2(): ProviderAdapter[] {
    return this.getAll().filter((a) => a.tier === 2);
  }

  public getSourcesList(): SourcesApiResponse["sources"] {
    const healthMap = healthManager.getAllHealth();
    return this.getAll().map((adapter) => ({
      id: adapter.id,
      name: adapter.name,
      baseUrl: adapter.baseUrl,
      tier: adapter.tier,
      capabilities: adapter.capabilities,
      status: healthMap[adapter.id] || "healthy",
    }));
  }
}

export const adapterRegistry = new AdapterRegistry();
