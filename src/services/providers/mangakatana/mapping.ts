import { RawProviderManga, RawProviderChapter, RawProviderPage } from "../types";
import { RawParsedMangaKatanaSearch, RawParsedMangaKatanaDetail, RawParsedMangaKatanaChapter } from "./parser";

export class MangaKatanaMapper {
  public static mapSearchItem(item: RawParsedMangaKatanaSearch): RawProviderManga {
    return {
      id: item.id,
      title: item.title,
      altTitles: [],
      description: "",
      coverImage: item.coverUrl,
      status: "ongoing",
      type: "manga",
      genres: [],
      tags: [],
      authors: [],
      artists: [],
      rawMetadata: item,
    };
  }

  public static mapDetail(mangaId: string, item: RawParsedMangaKatanaDetail): RawProviderManga {
    return {
      id: mangaId,
      title: item.title,
      altTitles: [],
      description: item.description,
      coverImage: item.coverUrl,
      status: item.status.includes("completed") ? "completed" : "ongoing",
      type: "manga",
      genres: item.genres,
      tags: [],
      authors: item.authors,
      artists: [],
      rawMetadata: item,
    };
  }

  public static mapChapter(ch: RawParsedMangaKatanaChapter): RawProviderChapter {
    return {
      id: ch.id,
      number: ch.number,
      title: ch.title,
      language: "en",
      displayNumber: ch.number !== null ? ch.number.toString() : "0.00",
      publishedAt: ch.publishedAt,
      scanlatorGroups: [],
      rawMetadata: ch,
    };
  }

  public static mapPages(pages: string[]): RawProviderPage[] {
    return pages.map((url, idx) => ({
      number: idx + 1,
      url,
    }));
  }
}
