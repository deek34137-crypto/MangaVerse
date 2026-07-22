import { CanonicalManga, CanonicalChapter } from "../aggregation/types";
import { formatRatingLabel, formatRelativeDate, formatChapterLabel } from "./shared/formatters";
import { getProviderBadgeInfo, ProviderBadgeInfo } from "./shared/badges";

export interface ProviderMatrixItem {
  providerId: string;
  name: string;
  status: "ONLINE" | "DEGRADED" | "MISSING";
  statusText: string;
  badge: ProviderBadgeInfo;
}

export interface ChapterItemViewModel {
  chapterId: string;
  chapterNumber: string;
  chapterLabel: string;
  releasedAtLabel: string;
  sourcesCount: number;
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

export function toMangaDetailViewModel(
  manga: CanonicalManga,
  chapters: CanonicalChapter[] = [],
  recs: any[] = []
): MangaDetailViewModel {
  const providerMatrix: ProviderMatrixItem[] = manga.providerMappings.map((pm) => ({
    providerId: pm.providerId,
    name: pm.providerId.toUpperCase(),
    status: "ONLINE",
    statusText: "Available",
    badge: getProviderBadgeInfo(pm.providerId, true),
  }));

  const chapterItems: ChapterItemViewModel[] = chapters.map((ch) => ({
    chapterId: ch.canonicalChapterId,
    chapterNumber: ch.chapterNumber?.toString() || "1",
    chapterLabel: formatChapterLabel(ch.chapterNumber, ch.title),
    releasedAtLabel: formatRelativeDate(ch.releasedAt),
    sourcesCount: ch.sources.length,
  }));

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
    genres: manga.genres?.value || [],
    alternativeTitles: manga.alternativeTitles?.value || [],
    publicationYear: "2024",
    totalChapters: chapters.length,
    lastUpdatedLabel: formatRelativeDate(manga.updatedAt),
    providerMatrix,
    chapters: chapterItems,
    recommendations: recs,
    showRating: true,
    showAuthors: (manga.authors?.value || []).length > 0,
    showProviderMatrix: providerMatrix.length > 0,
    showRecommendations: recs.length > 0,
    showChapters: chapterItems.length > 0,
  };
}
