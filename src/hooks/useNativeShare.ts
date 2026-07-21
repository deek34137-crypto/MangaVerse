"use client";

import { useCallback } from "react";
import { useHaptic } from "./useHaptic";

export interface ShareData {
  title: string;
  text?: string;
  url: string;
}

export function useNativeShare() {
  const { triggerHaptic } = useHaptic();

  const share = useCallback(async (data: ShareData): Promise<boolean> => {
    triggerHaptic("light");
    if (typeof window !== "undefined" && navigator.share) {
      try {
        await navigator.share(data);
        return true;
      } catch (err) {
        if ((err as Error).name !== "AbortError") {
          console.error("Web Share failed:", err);
        }
      }
    }

    // Fallback to clipboard
    try {
      await navigator.clipboard.writeText(data.url);
      triggerHaptic("success");
      return true;
    } catch {
      return false;
    }
  }, [triggerHaptic]);

  const isShareSupported = typeof window !== "undefined" && Boolean(navigator.share);

  return { share, isShareSupported };
}
