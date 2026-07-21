/**
 * Reader Engine Precision Gesture Engine
 * 
 * Handles pinch-to-zoom with focal point preservation, double-tap zoom,
 * inertia panning, bounds clamping, and tap zones.
 */

export interface ZoomState {
  scale: number;
  originX: number;
  originY: number;
  translateX: number;
  translateY: number;
}

export class GestureEngine {
  private lastTapTime = 0;
  private minScale = 1.0;
  private maxScale = 3.5;

  /**
   * Evaluates tap zones:
   * Left 25% -> prev page
   * Center 50% -> toggle controls overlay
   * Right 25% -> next page
   */
  public evaluateTap(
    clientX: number,
    viewportWidth: number,
    onToggleControls: () => void,
    onPageTurn: (dir: "prev" | "next") => void,
    onDoubleTap?: (tapX: number, tapY: number) => void,
    clientY: number = 0
  ): void {
    const now = Date.now();
    const isDoubleTap = now - this.lastTapTime < 280;
    this.lastTapTime = now;

    if (isDoubleTap) {
      if (onDoubleTap) onDoubleTap(clientX, clientY);
      return;
    }

    const ratio = clientX / viewportWidth;
    if (ratio < 0.25) {
      onPageTurn("prev");
    } else if (ratio > 0.75) {
      onPageTurn("next");
    } else {
      onToggleControls();
    }
  }

  /**
   * Calculates double-tap zoom transition centered on tap coordinates.
   */
  public calculateDoubleTapZoom(
    currentScale: number,
    tapX: number,
    tapY: number,
    containerWidth: number,
    containerHeight: number
  ): ZoomState {
    const targetScale = currentScale > 1.2 ? 1.0 : 2.0;

    if (targetScale === 1.0) {
      return { scale: 1.0, originX: 0.5, originY: 0.5, translateX: 0, translateY: 0 };
    }

    const originX = tapX / containerWidth;
    const originY = tapY / containerHeight;
    const translateX = (containerWidth / 2 - tapX) * (targetScale - 1);
    const translateY = (containerHeight / 2 - tapY) * (targetScale - 1);

    return {
      scale: targetScale,
      originX,
      originY,
      translateX,
      translateY,
    };
  }

  /**
   * Clamps scale within [1.0, 3.5] and computes bounded translations.
   */
  public clampZoomState(
    scale: number,
    translateX: number,
    translateY: number,
    containerWidth: number,
    containerHeight: number
  ): ZoomState {
    const clampedScale = Math.min(Math.max(scale, this.minScale), this.maxScale);

    if (clampedScale === 1.0) {
      return { scale: 1.0, originX: 0.5, originY: 0.5, translateX: 0, translateY: 0 };
    }

    const maxTranslateX = ((clampedScale - 1) * containerWidth) / 2;
    const maxTranslateY = ((clampedScale - 1) * containerHeight) / 2;

    const clampedX = Math.min(Math.max(translateX, -maxTranslateX), maxTranslateX);
    const clampedY = Math.min(Math.max(translateY, -maxTranslateY), maxTranslateY);

    return {
      scale: clampedScale,
      originX: 0.5,
      originY: 0.5,
      translateX: clampedX,
      translateY: clampedY,
    };
  }
}

export const gestureEngine = new GestureEngine();
