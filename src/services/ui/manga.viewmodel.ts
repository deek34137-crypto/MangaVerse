import { CanonicalManga, CanonicalChapter } from "../aggregation/types";
import { formatRatingLabel, formatRelativeDate, formatChapterLabel } from "./shared/formatters";

export interface ProviderMatrixItem {
  providerId: string;
  name: string;
  status: "ONLINE" | "DEGRADED" | "OFFLINE";
  statusText: string;
  badge: {
    label: string;
    variant: "tier1" | "tier2" | "tier3" | "default";
  };
}

export interface ChapterItemViewModel {
  chapterId: string;
  chapterNumber: string;
  chapterLabel: string;
  releasedAtLabel: string;
  sourcesCount: number;
  pageCount?: number | null;
  pageCountLabel?: string;
}

export interface MangaDetailViewModel {
  type: "SUCCESS";
  canonicalId: string;
  title: string;
  description: string;
  coverImage: string;
  bannerImage: string;
  ratingLabel: string;
  statusLabel: string;
  authorsLabel: string;
  genres: string[];
  alternativeTitles: string[];
  publicationYear: string;
  totalChapters: number;
  lastUpdatedLabel: string;
  providerMatrix: ProviderMatrixItem[];
  chapters: ChapterItemViewModel[];
  recommendations: any[];
  showRating: boolean;
  showAuthors: boolean;
  showProviderMatrix: boolean;
  showRecommendations: boolean;
  showChapters: boolean;
}

export interface MangaErrorViewModel {
  type: "ERROR";
  errorMessage: string;
  retryActionText: string;
}

export type MangaDetailResultViewModel = MangaDetailViewModel | MangaErrorViewModel;

const HIDDEN_SOURCE_NAMES = new Set([
  "weebcentral",
  "mangadex",
  "mangakatana",
  "comick",
  "asurascan",
  "flamecomics",
  "mgeko",
  "mangaread",
  "bato",
  "demonicscans",
  "kaliscan",
  "webtoon",
  "novelcool",
  "provider",
  "sources",
]);

export function toMangaDetailViewModel(
  manga: CanonicalManga,
  chapters: CanonicalChapter[] = [],
  recs: any[] = []
): MangaDetailViewModel {
  const chapterItems: ChapterItemViewModel[] = chapters.map((ch) => {
    const rawPageCount = (ch as any).pageCount;
    const validCount = rawPageCount && rawPageCount > 0 ? rawPageCount : null;

    return {
      chapterId: ch.canonicalChapterId || ch.id,
      chapterNumber: ch.chapterNumber?.toString() || ch.key?.chapter?.toString() || "1",
      chapterLabel: formatChapterLabel(ch.chapterNumber || ch.key?.chapter, ch.title),
      releasedAtLabel: formatRelativeDate(ch.releasedAt),
      sourcesCount: 1,
      pageCount: validCount,
      pageCountLabel: validCount ? `${validCount} pages` : undefined,
    };
  });

  const rawGenres: string[] = manga.genres?.value || [];
  const cleanGenres = rawGenres.filter(
    (g: string) => !HIDDEN_SOURCE_NAMES.has(g.trim().toLowerCase())
  );

  return {
    type: "SUCCESS",
    canonicalId: manga.canonicalId,
    title: manga.title.value,
    description: manga.description?.value || "No description available.",
    coverImage: manga.coverImage?.value || "/placeholders/cover.jpg",
    bannerImage: manga.coverImage?.value || "/placeholders/banner.jpg",
    ratingLabel: formatRatingLabel(manga.rating),
    statusLabel: manga.status?.value || "ONGOING",
    authorsLabel: (manga.authors?.value || []).join(", ") || "Unknown Author",
    genres: cleanGenres.length > 0 ? cleanGenres : ["Manga"],
    alternativeTitles: manga.alternativeTitles?.value || [],
    publicationYear: "2024",
    totalChapters: chapters.length,
    lastUpdatedLabel: formatRelativeDate(manga.updatedAt),
    providerMatrix: [],
    chapters: chapterItems,
    recommendations: recs,
    showRating: true,
    showAuthors: (manga.authors?.value || []).length > 0,
    showProviderMatrix: false,
    showRecommendations: recs.length > 0,
    showChapters: chapterItems.length > 0,
  };
}
