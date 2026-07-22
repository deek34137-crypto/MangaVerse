import { RawProviderPage } from "../providers/shared/types";
import { getProviderBadgeInfo, ProviderBadgeInfo } from "./shared/badges";

export interface ReaderViewModel {
  type: "SUCCESS";
  chapterId: string;
  chapterTitle: string;
  mangaTitle: string;
  pages: Array<{ pageNumber: number; url: string; fallbackUrl?: string }>;
  totalPages: number;
  winningProviderBadge: ProviderBadgeInfo;
  hedgedRequestLaunched: boolean;
  nextChapterId?: string;
  prevChapterId?: string;
  preloadPagesCount: number;
  showBackupBanner: boolean;
  backupBannerText?: string;
}

export interface ReaderErrorViewModel {
  type: "ERROR";
  errorMessage: string;
  chapterId: string;
  alternativeProviders: string[];
}

export type ReaderResultViewModel = ReaderViewModel | ReaderErrorViewModel;

export function computeMemoryAwarePreloadDepth(): number {
  if (typeof window === "undefined") return 3;

  const nav = window.navigator as any;
  const saveData = nav.connection?.saveData === true;
  const deviceMemory = nav.deviceMemory || 4; // GB

  if (saveData || deviceMemory <= 2) {
    return 1; // Low memory / data-saver: 1 page
  }
  if (deviceMemory >= 8) {
    return 5; // High memory: 5 pages
  }
  return 3; // Standard: 3 pages
}

export function toReaderViewModel(
  chapterId: string,
  mangaTitle: string,
  chapterTitle: string,
  pages: RawProviderPage[],
  winningProviderId: string,
  hedgedRequestLaunched: boolean,
  nextChapterId?: string,
  prevChapterId?: string
): ReaderViewModel {
  const badge = getProviderBadgeInfo(winningProviderId, true);
  const preloadPagesCount = computeMemoryAwarePreloadDepth();

  return {
    type: "SUCCESS",
    chapterId,
    mangaTitle,
    chapterTitle,
    pages: pages.map((p, idx) => ({
      pageNumber: p.pageNumber || idx + 1,
      url: p.url,
      fallbackUrl: p.fallbackUrl,
    })),
    totalPages: pages.length,
    winningProviderBadge: badge,
    hedgedRequestLaunched,
    nextChapterId,
    prevChapterId,
    preloadPagesCount,
    showBackupBanner: hedgedRequestLaunched,
    backupBannerText: hedgedRequestLaunched
      ? `Streaming from backup provider (${badge.name}) due to primary provider latency.`
      : undefined,
  };
}
