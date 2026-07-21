import { eventBus } from "../infrastructure/event-bus";
import { healthService } from "../providers/health-service";
import type { RawProviderChapter } from "../providers/shared/types";

export interface CanonicalChapterMirror {
  providerChapterId: string;
  providerId: string;
  displayNumber?: string;
  title?: string;
}

export interface MergedCanonicalChapter {
  canonicalChapterId: string;
  canonicalMangaId: string;
  chapterNumber: number | null;
  displayNumber: string;
  title?: string;
  preferredSource: string;
  preferredProviderChapterId: string;
  alternativeSources: CanonicalChapterMirror[];
}

export class ChapterMerger {
  private static instance: ChapterMerger;

  private constructor() {}

  public static getInstance(): ChapterMerger {
    if (!ChapterMerger.instance) {
      ChapterMerger.instance = new ChapterMerger();
    }
    return ChapterMerger.instance;
  }

  /**
   * Merges multi-provider chapter lists into a single deduplicated canonical timeline.
   */
  public mergeChapterLists(
    canonicalMangaId: string,
    providerChapterMap: Map<string, RawProviderChapter[]> // providerId -> RawProviderChapter[]
  ): MergedCanonicalChapter[] {
    const chapterMap = new Map<string, { primary: RawProviderChapter & { providerId: string }; mirrors: CanonicalChapterMirror[] }>();

    for (const [providerId, rawChapters] of providerChapterMap.entries()) {
      for (const chapter of rawChapters) {
        const numberKey = chapter.number !== null && !isNaN(chapter.number)
          ? `num_${chapter.number}`
          : `title_${(chapter.title || "special").toLowerCase().replace(/\s+/g, "_")}`;

        const existing = chapterMap.get(numberKey);

        if (!existing) {
          chapterMap.set(numberKey, {
            primary: { ...chapter, providerId },
            mirrors: [],
          });
        } else {
          // Compare health score of existing primary vs incoming provider to assign preferredSource
          const existingScore = healthService.getReadingScore(existing.primary.providerId);
          const incomingScore = healthService.getReadingScore(providerId);

          if (incomingScore > existingScore) {
            // Demote existing primary to mirrors
            existing.mirrors.push({
              providerChapterId: existing.primary.id,
              providerId: existing.primary.providerId,
              displayNumber: existing.primary.displayNumber,
              title: existing.primary.title,
            });
            existing.primary = { ...chapter, providerId };
          } else {
            // Add incoming to mirrors
            existing.mirrors.push({
              providerChapterId: chapter.id,
              providerId,
              displayNumber: chapter.displayNumber,
              title: chapter.title,
            });
          }
        }
      }
    }

    const mergedList: MergedCanonicalChapter[] = [];

    for (const [numberKey, data] of chapterMap.entries()) {
      const canonicalChapterId = `ch_${canonicalMangaId}_${numberKey}`;
      const merged: MergedCanonicalChapter = {
        canonicalChapterId,
        canonicalMangaId,
        chapterNumber: data.primary.number,
        displayNumber: data.primary.displayNumber || (data.primary.number !== null ? `Ch. ${data.primary.number}` : "Special"),
        title: data.primary.title,
        preferredSource: data.primary.providerId,
        preferredProviderChapterId: data.primary.id,
        alternativeSources: data.mirrors,
      };

      mergedList.push(merged);

      eventBus.emit("chapter:merged", {
        version: 1,
        canonicalMangaId,
        canonicalChapterId,
        primarySource: data.primary.providerId,
        mirrorsCount: data.mirrors.length,
        timestamp: Date.now(),
      });
    }

    // Sort chapters by chapterNumber ascending
    return mergedList.sort((a, b) => {
      if (a.chapterNumber === null) return 1;
      if (b.chapterNumber === null) return -1;
      return a.chapterNumber - b.chapterNumber;
    });
  }
}

export const chapterMerger = ChapterMerger.getInstance();
export default chapterMerger;
