import { aggregator } from "../../aggregation/aggregator";
import { HomeResultViewModel, toHomeViewModel } from "../home.viewmodel";

export async function loadHomePage(): Promise<HomeResultViewModel> {
  try {
    const canonicals = await aggregator.search("", { limit: 30 });
    return toHomeViewModel(canonicals, []);
  } catch (error: any) {
    return {
      type: "ERROR",
      errorMessage: error?.message || "Failed to load homepage sections.",
      retryActionText: "Reload Page",
      fallbackItems: [],
    };
  }
}
