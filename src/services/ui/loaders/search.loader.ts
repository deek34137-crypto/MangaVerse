import { backendClient, NormalizedSearchResult } from "@/lib/backend-client";
import { SearchResultViewModel, SearchSuggestionItem } from "../search.viewmodel";
import { MangaCardViewModel } from "../home.viewmodel";
import { formatRatingLabel } from "../shared/formatters";

export async function loadSearchPage(query: string = ""): Promise<SearchResultViewModel> {
  try {
    const trimmed = query.trim();
    let results: NormalizedSearchResult[] = [];

    if (!trimmed) {
      // Load trending / popular catalog when no search query is specified
      const frontpage = await backendClient.getFrontpage("weebcentral", "popular", 30);
      if (frontpage?.section?.items && frontpage.section.items.length > 0) {
        results = frontpage.section.items;
      } else {
        const searchRes = await backendClient.search("a", "all", 24);
        results = searchRes.results || [];
      }
    } else {
      const searchResponse = await backendClient.search(trimmed, "all", 24);
      results = searchResponse.results || [];
    }

    const cards: MangaCardViewModel[] = results.map((item) => {
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
        genres: ["MANGA"],
      };
    });

    const suggestions: SearchSuggestionItem[] = results.slice(0, 5).map((m) => ({
      canonicalId: `${m.provider}_${m.id}`,
      title: m.title,
      coverImage: backendClient.getImageProxyUrl(m.provider, m.coverImage || ""),
    }));

    const isZero = cards.length === 0 && trimmed.length > 0;

    return {
      type: "SUCCESS",
      query: trimmed,
      suggestions,
      results: cards,
      totalResults: cards.length,
      showSuggestions: suggestions.length > 0,
      showResults: cards.length > 0,
      showZeroResults: isZero,
      zeroResultsSuggestionText: isZero
        ? `No exact matches found for "${trimmed}". Try searching with alternate titles or keywords.`
        : undefined,
    };
  } catch (error: any) {
    return {
      type: "ERROR",
      errorMessage: error?.message || "Search index service temporarily unavailable.",
      cachedResults: [],
    };
  }
}
