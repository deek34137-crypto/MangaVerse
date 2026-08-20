import { backendClient, NormalizedSearchResult } from "@/lib/backend-client";
import { HomeResultViewModel, HomeViewModel, MangaCardViewModel } from "../home.viewmodel";
import { formatRatingLabel } from "../shared/formatters";
import { uiSectionConfig } from "@/config/ui-sections";

function mapSearchResultToCard(item: NormalizedSearchResult): MangaCardViewModel {
  const rawRating = item.rating != null ? parseFloat(String(item.rating)) : null;
  const validRating = rawRating && rawRating > 0 ? rawRating : null;

  return {
    canonicalId: `${item.provider}_${item.id}`,
    title: item.title,
    coverImage: backendClient.getImageProxyUrl(item.provider, item.coverImage || ""),
    ratingLabel: formatRatingLabel(validRating),
    rating: validRating,
    latestChapterLabel: item.latestChapter ? `Chapter ${item.latestChapter}` : "Chapter 1",
    statusLabel: "ONGOING",
    qualityTier: "TIER_A_PRODUCTION",
    genres: [item.provider.toUpperCase()],
  };
}

export async function loadHomePage(): Promise<HomeResultViewModel> {
  try {
    let items: NormalizedSearchResult[] = [];

    // Attempt to load frontpage section
    const frontpage = await backendClient.getFrontpage("weebcentral", "popular", 30);
    if (frontpage?.section?.items && frontpage.section.items.length > 0) {
      items = frontpage.section.items;
    } else {
      // Fallback to bounded search across Tier 1 sources
      const searchRes = await backendClient.search("a", "all", 30);
      items = searchRes.results || [];
    }

    const cards = items.map(mapSearchResultToCard);

    const heroSpotlight = cards.slice(0, uiSectionConfig.featuredLimit);
    const trendingRows = cards.slice(0, uiSectionConfig.trendingMax);
    const latestUpdates = cards.slice(uiSectionConfig.featuredLimit, uiSectionConfig.featuredLimit + uiSectionConfig.latestCount);
    const recommendations = cards.slice(0, uiSectionConfig.recommendationsLimit);

    const result: HomeViewModel = {
      type: "SUCCESS",
      heroSpotlight,
      trendingRows,
      latestUpdates,
      recommendations,
      continueReading: [],
      showHero: heroSpotlight.length > 0,
      showTrending: trendingRows.length >= uiSectionConfig.trendingMin,
      showLatest: latestUpdates.length > 0,
      showRecommendations: recommendations.length > 0,
      showContinueReading: false,
    };

    return result;
  } catch (error: any) {
    return {
      type: "ERROR",
      errorMessage: error?.message || "Failed to load homepage catalog.",
      retryActionText: "Reload Page",
      fallbackItems: [],
    };
  }
}
