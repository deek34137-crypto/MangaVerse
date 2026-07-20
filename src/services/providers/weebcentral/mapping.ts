import type { RawProviderManga, RawProviderChapter, RawProviderPage } from "../types";
import type { RawParsedSearchItem, RawParsedDetail, RawParsedChapterItem } from "./parser";

export class WeebCentralMapper {
  public static mapSearchItem(item: RawParsedSearchItem): RawProviderManga {
    return {
      id: item.id,
      title: item.title,
      altTitles: item.slug ? [item.slug.replace(/-/g, " ")] : [],
      description: "",
      coverImage: item.coverUrl,
      status: this.normalizeStatus(item.status),
      type: this.normalizeType(item.type),
      genres: item.genres,
      tags: [],
      authors: item.authors,
      artists: [],
      year: item.releasedYear,
      rawMetadata: item,
    };
  }

  public static mapDetail(mangaId: string, item: RawParsedDetail): RawProviderManga {
    return {
      id: mangaId,
      title: item.title,
      altTitles: item.altTitles,
      description: item.description,
      coverImage: item.coverUrl,
      status: this.normalizeStatus(item.status),
      type: this.normalizeType(item.type),
      genres: item.genres,
      tags: [],
      authors: item.authors,
      artists: item.artists,
      year: item.releasedYear,
      rawMetadata: item,
    };
  }

  public static mapChapter(item: RawParsedChapterItem): RawProviderChapter {
    return {
      id: item.id,
      number: item.number,
      title: item.title,
      language: "en",
      displayNumber: item.number !== null ? item.number.toString() : "0.00",
      publishedAt: item.publishedAt ? new Date(item.publishedAt) : new Date(),
      scanlatorGroups: item.scanlatorGroups,
      rawMetadata: item,
    };
  }

  public static mapPages(urls: string[]): RawProviderPage[] {
    return urls.map((url, index) => ({
      number: index + 1,
      url,
    }));
  }

  private static normalizeStatus(status: string): string {
    const s = status.toLowerCase().trim();
    if (s.includes("ongoing")) return "ongoing";
    if (s.includes("complete") || s.includes("completed")) return "completed";
    if (s.includes("hiatus")) return "hiatus";
    if (s.includes("cancel") || s.includes("cancelled") || s.includes("canceled")) return "cancelled";
    return "ongoing";
  }

  private static normalizeType(type: string): string {
    const t = type.toLowerCase().trim();
    if (t.includes("manhwa")) return "manhwa";
    if (t.includes("manhua")) return "manhua";
    return "manga";
  }
}
