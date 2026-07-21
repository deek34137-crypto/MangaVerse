"use client";

import { useCallback } from "react";

export type HapticPattern = "light" | "medium" | "heavy" | "success" | "warning" | "error";

export function useHaptic() {
  const triggerHaptic = useCallback((pattern: HapticPattern = "light") => {
    if (typeof window === "undefined" || !("vibrate" in navigator)) {
      return;
    }

    try {
      switch (pattern) {
        case "light":
          navigator.vibrate(10);
          break;
        case "medium":
          navigator.vibrate(20);
          break;
        case "heavy":
          navigator.vibrate(40);
          break;
        case "success":
          navigator.vibrate([10, 30, 20]);
          break;
        case "warning":
          navigator.vibrate([20, 40, 20]);
          break;
        case "error":
          navigator.vibrate([40, 50, 40, 50, 40]);
          break;
      }
    } catch {
      // Ignore vibration errors on unsupported devices
    }
  }, []);

  return { triggerHaptic };
}
