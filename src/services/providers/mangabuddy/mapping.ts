import {
  RawProviderManga,
  RawProviderChapter,
  RawProviderPage,
} from "../shared/types";

export function mapMangaData(raw: RawProviderManga): RawProviderManga {
  return {
    id: raw.id,
    title: raw.title ? raw.title.trim() : "Untitled Manga",
    description: raw.description ? raw.description.trim() : "",
    coverImage: raw.coverImage || "",
    authors: raw.authors || [],
    genres: raw.genres || [],
    status: raw.status || "ongoing",
  };
}

export function mapChaptersData(raw: RawProviderChapter[]): RawProviderChapter[] {
  return raw.map((chapter) => ({
    id: chapter.id,
    number: chapter.number,
    title: chapter.title ? chapter.title.trim() : `Chapter ${chapter.number ?? ""}`,
    language: chapter.language || "en",
  }));
}

export function mapPagesData(raw: RawProviderPage[]): RawProviderPage[] {
  return raw.map((page, index) => ({
    number: page.number || index + 1,
    url: page.url,
  }));
}
