import { CanonicalManga } from "../aggregation/types";
import { formatRatingLabel, formatRelativeDate } from "./shared/formatters";
import { uiSectionConfig } from "@/config/ui-sections";

export interface MangaCardViewModel {
  canonicalId: string;
  title: string;
  coverImage: string;
  ratingLabel: string;
  latestChapterLabel: string;
  statusLabel: string;
  qualityTier: string;
  genres: string[];
}

export interface HomeViewModel {
  type: "SUCCESS";
  heroSpotlight: MangaCardViewModel[];
  trendingRows: MangaCardViewModel[];
  latestUpdates: MangaCardViewModel[];
  recommendations: MangaCardViewModel[];
  continueReading: Array<{ canonicalId: string; title: string; coverImage: string; chapterId: string; chapterLabel: string; progress: number }>;
  showHero: boolean;
  showTrending: boolean;
  showLatest: boolean;
  showRecommendations: boolean;
  showContinueReading: boolean;
}

export interface HomeErrorViewModel {
  type: "ERROR";
  errorMessage: string;
  retryActionText: string;
  fallbackItems: MangaCardViewModel[];
}

export type HomeResultViewModel = HomeViewModel | HomeErrorViewModel;

export function toMangaCardViewModel(manga: CanonicalManga): MangaCardViewModel {
  return {
    canonicalId: manga.canonicalId,
    title: manga.title.value,
    coverImage: manga.coverImage?.value || "/placeholders/cover.jpg",
    ratingLabel: formatRatingLabel(manga.rating),
    latestChapterLabel: "Latest Chapter",
    statusLabel: manga.status?.value || "ONGOING",
    qualityTier: manga.qualityTier || "TIER_A_PRODUCTION",
    genres: (manga.genres?.value || []).slice(0, 3),
  };
}

export function toHomeViewModel(
  mangas: CanonicalManga[],
  continueReadingHistory: any[] = []
): HomeViewModel {
  const cards = mangas.map(toMangaCardViewModel);

  const heroSpotlight = cards.slice(0, uiSectionConfig.featuredLimit);
  const trendingRows = cards.slice(0, uiSectionConfig.trendingMax);
  const latestUpdates = cards.slice(0, uiSectionConfig.latestCount);
  const recommendations = cards.slice(0, uiSectionConfig.recommendationsLimit);

  return {
    type: "SUCCESS",
    heroSpotlight,
    trendingRows,
    latestUpdates,
    recommendations,
    continueReading: continueReadingHistory.slice(0, uiSectionConfig.continueReadingLimit),
    showHero: heroSpotlight.length > 0,
    showTrending: trendingRows.length >= uiSectionConfig.trendingMin,
    showLatest: latestUpdates.length > 0,
    showRecommendations: recommendations.length > 0,
    showContinueReading: continueReadingHistory.length > 0,
  };
}
