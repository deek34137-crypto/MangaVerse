import { BaseProvider } from "../shared/base-provider";
import { ProviderCapabilities, ProviderHealth, RawProviderManga, RawProviderChapter, RawProviderPage } from "../shared/types";
import { getManga, searchManga as sdkSearchManga, getMangaFeed, getChapterImages } from "../../mangadex/manga";
import type { MangaDexMangaAttributes, MangaDexEntity } from "../../mangadex/types";
import { buildMangaDexCoverUrl } from "@/lib/cover-url";
import manifest from "./provider.json";

export class MangaDexProvider extends BaseProvider {
  public readonly name = "MangaDex";
  public readonly version = manifest.providerVersion;

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
    const response = await sdkSearchManga({
      title: query,
      limit: (options?.limit as number) || 20,
      offset: (options?.offset as number) || 0,
      includes: ["cover_art", "author", "artist"],
      contentRating: options?.nsfw ? ["safe", "suggestive", "erotica", "pornographic"] : ["safe", "suggestive"],
    });
    return response.data.map((m) => this.mapToRawManga(m));
  }

  public async getMangaDetail(providerMangaId: string): Promise<RawProviderManga> {
    const mangaEntity = await getManga(providerMangaId);
    return this.mapToRawManga(mangaEntity);
  }

  public async getChapters(providerMangaId: string): Promise<RawProviderChapter[]> {
    const allChapters: RawProviderChapter[] = [];
    let offset = 0;
    const limit = 100;

    while (true) {
      const response = await getMangaFeed(providerMangaId, {
        limit,
        offset,
        translatedLanguage: ["en"],
        order: { chapter: "asc" },
      });

      if (!response.data || response.data.length === 0) break;

      for (const entity of response.data) {
        const groupNames: string[] = [];
        for (const rel of entity.relationships || []) {
          if (rel.type === "scanlation_group" && rel.attributes) {
            const attr = rel.attributes as { name?: string };
            if (attr.name) groupNames.push(attr.name);
          }
        }

        const rawChNum = entity.attributes.chapter;
        const number = rawChNum && !isNaN(parseFloat(rawChNum)) ? parseFloat(rawChNum) : null;
        let type = "regular";
        if (number === null) {
          const titleLower = (entity.attributes.title || "").toLowerCase();
          if (titleLower.includes("oneshot") || titleLower.includes("one-shot")) type = "oneshot";
          else if (titleLower.includes("extra")) type = "extra";
          else if (titleLower.includes("omake")) type = "omake";
          else if (titleLower.includes("bonus")) type = "bonus";
          else type = "special";
        }

        allChapters.push({
          id: entity.id,
          number,
          type,
          volume: entity.attributes.volume ? parseInt(entity.attributes.volume) : undefined,
          title: entity.attributes.title || undefined,
          language: entity.attributes.translatedLanguage || "en",
          displayNumber: entity.attributes.chapter || "0",
          pageCount: entity.attributes.pages || 0,
          publishedAt: entity.attributes.publishAt
            ? new Date(entity.attributes.publishAt)
            : new Date(entity.attributes.createdAt),
          scanlatorGroups: groupNames,
          rawMetadata: entity,
        });
      }

      if (response.data.length < limit) break;
      offset += limit;
    }

    return allChapters;
  }

  public async getChapterPages(providerChapterId: string): Promise<RawProviderPage[]> {
    const imagesResponse = await getChapterImages(providerChapterId);
    const host = imagesResponse.baseUrl;
    const hash = imagesResponse.chapter?.hash;
    const dataFilenames = imagesResponse.chapter?.data || [];
    const dataSaverFilenames = imagesResponse.chapter?.dataSaver || [];

    if (dataFilenames.length > 0) {
      return dataFilenames.map((filename, index) => ({
        number: index + 1,
        url: `${host}/data/${hash}/${filename}`,
      }));
    }

    if (dataSaverFilenames.length > 0) {
      console.log(`[MangaDexProvider] Standard data images empty for ${providerChapterId}, falling back to dataSaver images`);
      return dataSaverFilenames.map((filename, index) => ({
        number: index + 1,
        url: `${host}/data-saver/${hash}/${filename}`,
      }));
    }

    console.warn(`[MangaDexProvider] 0 page images returned from MangaDex @at-home API for chapter ${providerChapterId}`);
    return [];
  }

  public async healthCheck(): Promise<ProviderHealth> {
    const start = Date.now();
    try {
      await sdkSearchManga({ limit: 1 });
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

  private mapToRawManga(m: MangaDexEntity<MangaDexMangaAttributes>): RawProviderManga {
    const titleObj = m.attributes.title;
    const title = titleObj.en || titleObj.ja || Object.values(titleObj)[0] || "Unknown";
    const altTitles = (m.attributes.altTitles || []).map((t) => Object.values(t)[0]);
    const description =
      m.attributes.description.en ||
      m.attributes.description.ja ||
      Object.values(m.attributes.description)[0] ||
      "";

    const coverArt = m.relationships.find((r) => r.type === "cover_art");
    const coverFileName =
      coverArt?.attributes && "fileName" in coverArt.attributes
        ? (coverArt.attributes.fileName as string)
        : "";
    const coverImage = coverFileName
      ? buildMangaDexCoverUrl(m.id, coverFileName, 512)
      : "";

    const genres: string[] = [];
    const tags: string[] = [];
    for (const tag of m.attributes.tags || []) {
      const name = tag.attributes.name.en || Object.values(tag.attributes.name)[0];
      if (tag.attributes.group === "genre") genres.push(name);
      else tags.push(name);
    }

    const authors: string[] = [];
    const artists: string[] = [];
    for (const rel of m.relationships) {
      if (rel.type === "author" && rel.attributes && "name" in rel.attributes)
        authors.push(rel.attributes.name as string);
      if (rel.type === "artist" && rel.attributes && "name" in rel.attributes)
        artists.push(rel.attributes.name as string);
    }

    return {
      id: m.id,
      title,
      altTitles,
      description,
      coverImage,
      status: m.attributes.status,
      type:
        m.attributes.originalLanguage === "ko"
          ? "manhwa"
          : m.attributes.originalLanguage === "zh"
          ? "manhua"
          : "manga",
      demographic: m.attributes.publicationDemographic || undefined,
      genres,
      tags,
      authors,
      artists,
      year: m.attributes.year || undefined,
      rawMetadata: m,
    };
  }
}

export default MangaDexProvider;
