/**
 * Reader Engine v2 Main Controller
 * Orchestrates GestureEngine, PrefetchManager, MemoryManager, RecoveryManager,
 * DownloadBridge, TelemetryBridge, and LifecycleManager.
 */

import { gestureEngine } from "./GestureEngine";
import { prefetchManager } from "./PrefetchManager";
import { memoryManager } from "./MemoryManager";
import { recoveryManager } from "./RecoveryManager";
import { readerLifecycleManager } from "./ReaderLifecycle";
import { categorizedEventBus } from "./ReaderEventBus";

export class ReaderController {
  public initialize(mangaId: string, chapterId: string): void {
    readerLifecycleManager.setStage("INITIALIZE");
    readerLifecycleManager.setStage("LOAD_SETTINGS");
    readerLifecycleManager.setStage("RESTORE_SESSION");

    recoveryManager.restoreSession(mangaId).then((session) => {
      if (session) {
        categorizedEventBus.emit("STORAGE_SESSION_RESTORED", {
          pageNumber: session.pageNumber,
          zoomScale: session.zoomScale,
        });
      }
      readerLifecycleManager.setStage("BUILD_RENDERER");
      readerLifecycleManager.setStage("BEGIN_READING");
    });
  }

  public onPageChanged(mangaId: string, chapterId: string, pageNumber: number, totalPages: number, pages: string[], prefetchDepth: number): void {
    categorizedEventBus.emit("READER_PAGE_CHANGED", { pageNumber, totalPages });

    // Save session with version v1.0.0
    recoveryManager.saveSession({
      version: "1.0.0",
      mangaId,
      chapterId,
      pageNumber,
      zoomScale: 1.0,
      scrollOffset: typeof window !== "undefined" ? window.scrollY : 0,
      readingMode: "vertical",
      updatedAt: Date.now(),
    });

    // Schedule background prefetch via PrefetchManager
    const remainingPages = pages.slice(pageNumber);
    prefetchManager.schedulePrefetch(remainingPages, prefetchDepth);
  }

  public destroy(): void {
    readerLifecycleManager.setStage("DESTROY");
    categorizedEventBus.clear();
  }
}

export const readerController = new ReaderController();
