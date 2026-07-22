import { RawProviderManga, RawProviderChapter, RawProviderPage } from "../shared/types";

const GENRE_MAP: Record<string, string> = {
  romance: "Romance",
  fantasy: "Fantasy",
  action: "Action",
  comedy: "Comedy",
  drama: "Drama",
  "slice of life": "Slice of Life",
  shoujo: "Shoujo",
  shounen: "Shounen",
  isekai: "Isekai",
  supernatural: "Supernatural",
  adventure: "Adventure",
};

export function normalizeGenres(rawGenres: string[] = []): string[] {
  return rawGenres
    .map((g) => g.trim().toLowerCase())
    .map((g) => GENRE_MAP[g] || g.charAt(0).toUpperCase() + g.slice(1))
    .filter((g, index, self) => self.indexOf(g) === index);
}

export function normalizeStatus(rawStatus?: string): "ongoing" | "completed" | "hiatus" | "cancelled" {
  if (!rawStatus) return "ongoing";
  const lower = rawStatus.toLowerCase();
  if (lower.includes("completed") || lower.includes("finish") || lower.includes("ended")) return "completed";
  if (lower.includes("hiatus")) return "hiatus";
  if (lower.includes("cancel")) return "cancelled";
  return "ongoing";
}

export function mapMangaData(raw: RawProviderManga): RawProviderManga {
  return {
    ...raw,
    genres: normalizeGenres(raw.genres),
    status: normalizeStatus(raw.status),
  };
}

export function mapChaptersData(rawChapters: RawProviderChapter[]): RawProviderChapter[] {
  return rawChapters.map((ch) => ({
    ...ch,
    number: ch.number === null || isNaN(ch.number) ? null : ch.number,
    language: ch.language || "en",
  }));
}

export function mapPagesData(rawPages: RawProviderPage[]): RawProviderPage[] {
  return rawPages.map((pg) => ({
    ...pg,
    url: pg.url.startsWith("//") ? `https:${pg.url}` : pg.url,
  }));
}
