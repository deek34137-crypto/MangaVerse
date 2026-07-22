import { aggregator } from "../../aggregation/aggregator";
import { ReaderResultViewModel, toReaderViewModel } from "../reader.viewmodel";

export async function loadReaderPage(
  canonicalId: string,
  chapterId: string
): Promise<ReaderResultViewModel> {
  try {
    const chapters = await aggregator.getChapters(canonicalId);
    const targetChapter = chapters.find((c) => (c.canonicalChapterId || c.id) === chapterId) || chapters[0];

    if (!targetChapter || targetChapter.sources.length === 0) {
      return {
        type: "ERROR",
        errorMessage: "No valid provider sources available for this chapter.",
        chapterId,
        alternativeProviders: [],
      };
    }

    const streamResult = await aggregator.getReader(targetChapter.sources);

    const targetIdx = chapters.findIndex((c) => (c.canonicalChapterId || c.id) === (targetChapter.canonicalChapterId || targetChapter.id));
    const nextChapterId = targetIdx > 0 ? (chapters[targetIdx - 1].canonicalChapterId || chapters[targetIdx - 1].id) : undefined;
    const prevChapterId = targetIdx < chapters.length - 1 ? (chapters[targetIdx + 1].canonicalChapterId || chapters[targetIdx + 1].id) : undefined;

    return toReaderViewModel(
      chapterId,
      "Manga Title",
      targetChapter.title || `Chapter ${targetChapter.chapterNumber}`,
      streamResult.pages,
      streamResult.winningProviderId,
      streamResult.hedgedRequestLaunched,
      nextChapterId,
      prevChapterId
    );
  } catch (error: any) {
    return {
      type: "ERROR",
      errorMessage: error?.message || "Failed to load reader stream.",
      chapterId,
      alternativeProviders: [],
    };
  }
}
