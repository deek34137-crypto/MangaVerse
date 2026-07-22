import { aggregator } from "../../aggregation/aggregator";
import { SearchResultViewModel, toSearchViewModel } from "../search.viewmodel";

export async function loadSearchPage(query: string = ""): Promise<SearchResultViewModel> {
  try {
    const canonicals = await aggregator.search(query, { limit: 24 });
    return toSearchViewModel(query, canonicals);
  } catch (error: any) {
    return {
      type: "ERROR",
      errorMessage: error?.message || "Search failed.",
      cachedResults: [],
    };
  }
}
