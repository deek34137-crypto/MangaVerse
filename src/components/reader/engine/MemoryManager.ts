/**
 * Reader Engine Centralized Memory Cache & Disposer
 * 
 * Manages active bitmap memory lifetimes (`±3 pages` window) to trigger
 * browser garbage collection and prevent RAM leaks during long reading sessions.
 */

export interface CachedImageRecord {
  url: string;
  pageIndex: number;
  image: HTMLImageElement | ImageBitmap;
  lastAccessed: number;
}

export class MemoryManager {
  private cache = new Map<string, CachedImageRecord>();
  private activeBufferWindow = 3; // ±3 pages window

  public cacheBitmap(url: string, pageIndex: number, image: HTMLImageElement | ImageBitmap): void {
    this.cache.set(url, {
      url,
      pageIndex,
      image,
      lastAccessed: Date.now(),
    });
  }

  public getCachedBitmap(url: string): HTMLImageElement | ImageBitmap | undefined {
    const record = this.cache.get(url);
    if (record) {
      record.lastAccessed = Date.now();
      return record.image;
    }
    return undefined;
  }

  public evaluateEviction(candidate: { pageIndex: number; isActive: boolean; isBookmarked?: boolean; lastViewedAt?: number }, currentPage: number, bufferSize: number): boolean {
    if (candidate.isActive) return false;
    const distance = Math.abs(candidate.pageIndex - currentPage);
    return distance > bufferSize;
  }

  public pruneInactiveBitmaps(currentPageIndex: number, customBuffer?: number): void {
    const buffer = customBuffer ?? this.activeBufferWindow;

    for (const [url, record] of this.cache.entries()) {
      const distance = Math.abs(record.pageIndex - currentPageIndex);

      if (distance > buffer) {
        // Close ImageBitmap if supported to release GPU/RAM memory immediately
        if ("close" in record.image && typeof record.image.close === "function") {
          try {
            record.image.close();
          } catch {
            // Ignore close errors
          }
        }
        this.cache.delete(url);
      }
    }
  }

  public clearAll(): void {
    for (const record of this.cache.values()) {
      if ("close" in record.image && typeof record.image.close === "function") {
        try {
          record.image.close();
        } catch {
          // Ignore
        }
      }
    }
    this.cache.clear();
  }

  public getCacheSize(): number {
    return this.cache.size;
  }
}

export const memoryManager = new MemoryManager();
