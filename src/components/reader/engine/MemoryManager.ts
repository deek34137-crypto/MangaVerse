/**
 * Reader Engine v2 Memory Manager & Eviction Policy
 *
 * DETERMINISTIC EVICTION POLICY:
 * 1. Distance > Buffer Window
 * 2. Least Recently Viewed (LRU) timestamp
 * 3. Not Bookmarked / Saved
 * 4. Not Active Viewport Node
 */

export interface EvictionCandidate {
  pageIndex: number;
  lastViewedAt: number;
  isBookmarked: boolean;
  isActive: boolean;
}

export class MemoryManager {
  public computeEvictionBounds(currentPage: number, bufferSize: number, totalPages: number): { min: number; max: number } {
    return {
      min: Math.max(1, currentPage - bufferSize),
      max: Math.min(totalPages, currentPage + bufferSize),
    };
  }

  /**
   * Deterministic Eviction Evaluation
   */
  public evaluateEviction(candidate: EvictionCandidate, currentPage: number, bufferSize: number): boolean {
    // 1. Rule 1: Never evict currently active page
    if (candidate.isActive) return false;

    // 2. Rule 2: Evict if outside distance buffer
    const distance = Math.abs(candidate.pageIndex - currentPage);
    if (distance > bufferSize) {
      // 3. Rule 3: Preserve bookmarked pages unless buffer is critically exceeded
      if (candidate.isBookmarked && distance <= bufferSize * 2) {
        return false;
      }
      return true;
    }

    return false;
  }
}

export const memoryManager = new MemoryManager();
