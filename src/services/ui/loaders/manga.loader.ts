import { aggregator } from "../../aggregation/aggregator";
import { MangaDetailResultViewModel, toMangaDetailViewModel } from "../manga.viewmodel";

export async function loadMangaDetailPage(canonicalId: string): Promise<MangaDetailResultViewModel> {
  try {
    const manga = await aggregator.getManga(canonicalId);
    if (!manga) {
      return {
        type: "ERROR",
        errorMessage: "Manga series not found or unavailable.",
        retryActionText: "Back to Home",
      };
    }

    const [chapters, recs] = await Promise.all([
      aggregator.getChapters(canonicalId),
      aggregator.getRecommendations(canonicalId, 10).catch(() => []),
    ]);

    return toMangaDetailViewModel(manga, chapters, recs);
  } catch (error: any) {
    return {
      type: "ERROR",
      errorMessage: error?.message || "Failed to load manga detail page.",
      retryActionText: "Retry",
    };
  }
}
