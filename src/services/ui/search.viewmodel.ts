import { CanonicalManga } from "../aggregation/types";
import { MangaCardViewModel, toMangaCardViewModel } from "./home.viewmodel";

export interface SearchSuggestionItem {
  canonicalId: string;
  title: string;
  matchedAlias?: string;
  coverImage: string;
}

export interface SearchViewModel {
  type: "SUCCESS";
  query: string;
  suggestions: SearchSuggestionItem[];
  results: MangaCardViewModel[];
  totalResults: number;
  showSuggestions: boolean;
  showResults: boolean;
  showZeroResults: boolean;
  zeroResultsSuggestionText?: string;
}

export interface SearchErrorViewModel {
  type: "ERROR";
  errorMessage: string;
  cachedResults: MangaCardViewModel[];
}

export type SearchResultViewModel = SearchViewModel | SearchErrorViewModel;

export function toSearchViewModel(
  query: string,
  rawResults: CanonicalManga[]
): SearchViewModel {
  const cards = rawResults.map(toMangaCardViewModel);

  const suggestions: SearchSuggestionItem[] = rawResults.slice(0, 5).map((m) => ({
    canonicalId: m.canonicalId,
    title: m.title.value,
    coverImage: m.coverImage?.value || "/placeholders/cover.jpg",
  }));

  const isZero = cards.length === 0 && query.trim().length > 0;

  return {
    type: "SUCCESS",
    query,
    suggestions,
    results: cards,
    totalResults: cards.length,
    showSuggestions: suggestions.length > 0 && query.trim().length > 0,
    showResults: cards.length > 0,
    showZeroResults: isZero,
    zeroResultsSuggestionText: isZero
      ? `No exact matches found for "${query}". Try searching by Japanese title, author, or alias.`
      : undefined,
  };
}
