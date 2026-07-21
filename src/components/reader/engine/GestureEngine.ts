/**
 * Reader Engine v2 Gesture Engine
 * Handles touch gestures: tap zones (left 30%, right 30%, center 40%), pinch zoom, double tap zoom.
 */

import { categorizedEventBus } from "./ReaderEventBus";

export class GestureEngine {
  private lastTapTime = 0;

  public handleTap(clientX: number, viewportWidth: number, onToggleControls: () => void, onPageTurn: (dir: "prev" | "next") => void): void {
    const now = Date.now();
    const isDoubleTap = now - this.lastTapTime < 300;
    this.lastTapTime = now;

    if (isDoubleTap) {
      return; // Handled by double tap zoom
    }

    const ratio = clientX / viewportWidth;
    if (ratio < 0.3) {
      onPageTurn("prev");
    } else if (ratio > 0.7) {
      onPageTurn("next");
    } else {
      onToggleControls();
    }
  }
}

export const gestureEngine = new GestureEngine();
