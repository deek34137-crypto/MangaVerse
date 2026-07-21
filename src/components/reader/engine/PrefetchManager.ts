/**
 * Reader Engine v2 Prefetch Manager
 * Schedules background prefetching of upcoming pages & chapters based on network policy.
 */

import { readerPriorityScheduler } from "./ReaderPriorityScheduler";
import { ImageDecodeLayer } from "./ImageDecodeLayer";

export class PrefetchManager {
  private prefetchedUrls: Set<string> = new Set();

  public schedulePrefetch(urls: string[], depth: number): void {
    const targets = urls.slice(0, depth);

    targets.forEach((url, idx) => {
      if (this.prefetchedUrls.has(url)) return;

      readerPriorityScheduler.scheduleTask({
        id: `prefetch_${idx}_${url}`,
        priority: "HIGH",
        execute: async () => {
          try {
            await ImageDecodeLayer.decodeImage(url);
            this.prefetchedUrls.add(url);
          } catch {
            // Ignore prefetch failures
          }
        },
      });
    });
  }
}

export const prefetchManager = new PrefetchManager();
