/**
 * Reader Engine Main Controller & Formal State Machine
 * 
 * Governance & State Flow:
 * Idle -> LoadingChapter -> LoadingImages -> Ready -> Reading -> Paused -> Recovering -> Finished
 */

import { prefetchManager } from "./PrefetchManager";
import { memoryManager } from "./MemoryManager";
import { recoveryManager } from "./RecoveryManager";
import { readerLifecycleManager } from "./ReaderLifecycle";
import { categorizedEventBus } from "./ReaderEventBus";
import { readerPriorityScheduler } from "./ReaderPriorityScheduler";

export type ReaderState = 
  | "Idle"
  | "LoadingChapter"
  | "LoadingImages"
  | "Ready"
  | "Reading"
  | "Paused"
  | "Recovering"
  | "Finished";

export class ReaderController {
  private state: ReaderState = "Idle";

  public getState(): ReaderState {
    return this.state;
  }

  public setState(newState: ReaderState): void {
    if (this.state === newState) return;
    const previousState = this.state;
    this.state = newState;

    categorizedEventBus.emit("READER_STATE_CHANGED", {
      from: previousState,
      to: newState,
      timestamp: Date.now(),
    });

    // Handle Paused state (background tab / mobile app switch)
    if (newState === "Paused") {
      readerPriorityScheduler.cancelAll();
    }
  }

  public initialize(mangaId: string, chapterId: string): void {
    this.setState("LoadingChapter");
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
      this.setState("LoadingImages");
    });
  }

  public markImagesReady(): void {
    if (this.state === "LoadingImages" || this.state === "Recovering") {
      this.setState("Ready");
      this.setState("Reading");
    }
  }

  public pause(): void {
    if (this.state === "Reading" || this.state === "Ready") {
      this.setState("Paused");
    }
  }

  public resume(): void {
    if (this.state === "Paused") {
      this.setState("Reading");
    }
  }

  public onPageChanged(
    mangaId: string,
    chapterId: string,
    pageNumber: number,
    totalPages: number,
    pages: string[],
    prefetchDepth: number,
    readingMode: string = "vertical"
  ): void {
    if (this.state === "Paused") return;

    categorizedEventBus.emit("READER_PAGE_CHANGED", { pageNumber, totalPages });

    // Save exact reading session
    recoveryManager.saveSession({
      version: "1.0.0",
      mangaId,
      chapterId,
      pageNumber,
      zoomScale: 1.0,
      scrollOffset: typeof window !== "undefined" ? window.scrollY : 0,
      readingMode: readingMode as any,
      updatedAt: Date.now(),
    });

    // Enforce memory window cleanup (±3 pages)
    memoryManager.pruneInactiveBitmaps(pageNumber, 3);

    // Schedule background prefetch
    const remainingPages = pages.slice(pageNumber);
    prefetchManager.schedulePrefetch(remainingPages, prefetchDepth);

    if (pageNumber >= totalPages - 1) {
      this.setState("Finished");
    }
  }

  public destroy(): void {
    this.setState("Idle");
    readerPriorityScheduler.cancelAll();
    readerLifecycleManager.setStage("DESTROY");
    categorizedEventBus.clear();
  }
}

export const readerController = new ReaderController();
