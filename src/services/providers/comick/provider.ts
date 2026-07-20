/* eslint-disable @typescript-eslint/no-explicit-any */
// NOTE: ComicK is currently DISABLED.
// api.comick.io returns a Cloudflare Managed Challenge (Turnstile) for all
// programmatic HTTP requests. This scraper is preserved for future re-enablement.
// See provider.json for the full reason.

import { BaseProvider } from "../shared/base-provider";
import { ProviderCapabilities, ProviderHealth, RawProviderManga, RawProviderChapter, RawProviderPage } from "../shared/types";
import manifest from "./provider.json";

export class ComicKProvider extends BaseProvider {
  public readonly name = "ComicK";
  public readonly version = manifest.providerVersion;

  private readonly API_BASE  = manifest.baseUrl;
  private readonly IMAGE_BASE = "https://meo.comick.pictures";

  constructor() {
    const capabilities: ProviderCapabilities = {
      search:   manifest.capabilities.search,
      latest:   manifest.capabilities.latest,
      trending: manifest.capabilities.trending,
      merge:    manifest.capabilities.merge,
      reader:   manifest.capabilities.reader,
    };
    super(manifest, capabilities);
  }

  public async searchManga(query: string, options?: Record<string, unknown>): Promise<RawProviderManga[]> {
    const url = `${this.API_BASE}/v1.0/search?q=${encodeURIComponent(query)}&limit=${options?.limit || 20}`;
    const data = await this.transport.request<any[]>(url);
    return data.map((item) => this.mapManga(item));
  }

  public async getMangaDetail(providerMangaId: string): Promise<RawProviderManga> {
    const url = `${this.API_BASE}/comic/${providerMangaId}`;
    const data = await this.transport.request<any>(url);
    return this.mapMangaDetail(data);
  }

  public async getChapters(providerMangaId: string): Promise<RawProviderChapter[]> {
    const allChapters: RawProviderChapter[] = [];
    let page = 1;
    const limit = 100;

    while (true) {
      const url = `${this.API_BASE}/comic/${providerMangaId}/chapters?lang=en&limit=${limit}&page=${page}`;
      const data = await this.transport.request<{ chapters: any[] }>(url);

      if (!data?.chapters?.length) break;

      for (const ch of data.chapters) {
        const rawChNum = ch.chap;
        const number = rawChNum && !isNaN(parseFloat(rawChNum)) ? parseFloat(rawChNum) : null;
        let type = "regular";
        if (number === null) {
          const titleLower = (ch.title || "").toLowerCase();
          if (titleLower.includes("oneshot") || titleLower.includes("one-shot")) type = "oneshot";
          else if (titleLower.includes("extra")) type = "extra";
          else if (titleLower.includes("omake")) type = "omake";
          else if (titleLower.includes("bonus")) type = "bonus";
          else type = "special";
        }
        allChapters.push({
          id: ch.hid,
          number,
          type,
          volume: ch.vol ? parseInt(ch.vol) : undefined,
          title: ch.title || undefined,
          language: ch.lang || "en",
          displayNumber: ch.chap || "0",
          publishedAt: ch.created_at ? new Date(ch.created_at) : new Date(),
          scanlatorGroups: ch.group_name || [],
          rawMetadata: ch,
        });
      }

      if (data.chapters.length < limit) break;
      page++;
    }

    return allChapters;
  }

  public async getChapterPages(providerChapterId: string): Promise<RawProviderPage[]> {
    const url = `${this.API_BASE}/chapter/${providerChapterId}`;
    const data = await this.transport.request<{ chapter: { images: any[] } }>(url);
    const images = data.chapter.images || [];
    return images.map((img: any, index: number) => ({
      number: index + 1,
      url: `${this.IMAGE_BASE}/${img.b2key}`,
      width: img.w || undefined,
      height: img.h || undefined,
    }));
  }

  public async healthCheck(): Promise<ProviderHealth> {
    const start = Date.now();
    try {
      await this.transport.request(`${this.API_BASE}/v1.0/search?q=one+piece&limit=1`);
      return {
        status: "ONLINE",
        latencyMs: Date.now() - start,
        lastSuccessAt: new Date(),
        errorRate: 0,
        consecutiveFailures: 0,
      };
    } catch {
      return {
        status: "BLOCKED",
        latencyMs: Date.now() - start,
        lastSuccessAt: new Date(0),
        errorRate: 1.0,
        consecutiveFailures: 1,
      };
    }
  }

  private mapManga(item: any): RawProviderManga {
    const coverKey = item.md_covers?.[0]?.b2key || "";
    const coverImage = coverKey ? `${this.IMAGE_BASE}/${coverKey}` : "";
    return {
      id: item.hid,
      title: item.title,
      altTitles: item.md_titles || [],
      description: item.desc || "",
      coverImage,
      status: this.mapStatus(item.status),
      type: item.country === "ko" ? "manhwa" : item.country === "zh" ? "manhua" : "manga",
      demographic: this.mapDemographic(item.demographic),
      genres: item.genres || [],
      tags: [],
      authors: [],
      artists: [],
      year: item.year || undefined,
      rawMetadata: item,
    };
  }

  private mapMangaDetail(data: any): RawProviderManga {
    const comic = data.comic;
    const coverKey = comic.md_covers?.[0]?.b2key || "";
    const coverImage = coverKey ? `${this.IMAGE_BASE}/${coverKey}` : "";
    const authors = (data.authors || []).map((a: any) => a.name);
    const artists = (data.artists || []).map((a: any) => a.name);
    const genres  = (data.genres  || []).map((g: any) => g.name);
    return {
      id: comic.hid,
      title: comic.title,
      altTitles: comic.md_titles || [],
      description: comic.desc || "",
      coverImage,
      status: this.mapStatus(comic.status),
      type: comic.country === "ko" ? "manhwa" : comic.country === "zh" ? "manhua" : "manga",
      demographic: this.mapDemographic(comic.demographic),
      genres,
      tags: [],
      authors,
      artists,
      year: comic.year || undefined,
      rawMetadata: data,
    };
  }

  private mapStatus(statusNum: number): string {
    switch (statusNum) {
      case 1: return "ongoing";
      case 2: return "completed";
      case 3: return "hiatus";
      case 4: return "cancelled";
      default: return "ongoing";
    }
  }

  private mapDemographic(demoNum: number | string): string | undefined {
    const val = Number(demoNum);
    switch (val) {
      case 1: return "shounen";
      case 2: return "shoujo";
      case 3: return "seinen";
      case 4: return "josei";
      default: return undefined;
    }
  }
}

export default ComicKProvider;
