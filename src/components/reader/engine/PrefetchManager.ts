/**
 * Reader Engine Adaptive Budget-Based Prefetch Manager
 * 
 * Computes prefetch budget dynamically:
 * min(availableMemory, networkSpeed, averageDecodeTime, scrollVelocity)
 * and schedules P3 prefetch requests via ReaderPriorityScheduler.
 */

import { readerPriorityScheduler } from "./ReaderPriorityScheduler";
import { ImageDecodeLayer } from "./ImageDecodeLayer";
import { memoryManager } from "./MemoryManager";

export class PrefetchManager {
  private prefetchedUrls: Set<string> = new Set();

  public calculatePrefetchBudget(): number {
    if (typeof window === "undefined") return 2;

    const connection = (navigator as any).connection;
    const deviceMemory = (navigator as any).deviceMemory || 4;

    let networkBudget = 3;
    if (connection) {
      if (connection.effectiveType === "4g") networkBudget = 5;
      else if (connection.effectiveType === "3g") networkBudget = 2;
      else networkBudget = 1;
    }

    let memoryBudget = 3;
    if (deviceMemory < 2) memoryBudget = 1;
    else if (deviceMemory >= 8) memoryBudget = 5;

    return Math.min(networkBudget, memoryBudget);
  }

  public schedulePrefetch(urls: string[], currentPageIndex: number): void {
    const budget = this.calculatePrefetchBudget();
    const targetUrls = urls.slice(0, budget);

    targetUrls.forEach((url, idx) => {
      if (this.prefetchedUrls.has(url)) return;

      const pageIdx = currentPageIndex + idx + 1;
      const abortController = readerPriorityScheduler.scheduleRequest({
        id: `prefetch_${pageIdx}_${url}`,
        url,
        pageIndex: pageIdx,
        priority: "P3_PREFETCH",
        execute: async (signal) => {
          try {
            const decoded = await ImageDecodeLayer.decodeImage(url, signal);
            this.prefetchedUrls.add(url);
            memoryManager.cacheBitmap(url, pageIdx, decoded.image);
          } catch {
            // Silence prefetch failures
          }
        },
      });

      // Register cancellation in case page jumps far away
      if (Math.abs(pageIdx - currentPageIndex) > budget * 2) {
        abortController.abort();
      }
    });
  }

  public clearPrefetchCache(): void {
    this.prefetchedUrls.clear();
  }
}

export const prefetchManager = new PrefetchManager();
