"use client";

import { useState, useEffect } from "react";

export type NetworkTier = "2g" | "3g" | "4g" | "wifi";

export interface NetworkPolicy {
  tier: NetworkTier;
  imageQuality: "low" | "medium" | "high" | "original";
  prefetchDepth: number; // pages ahead to prefetch
  allowBackgroundDownloads: boolean;
  isSaveData: boolean;
}

export function useNetworkPolicy(): NetworkPolicy {
  const [policy, setPolicy] = useState<NetworkPolicy>({
    tier: "4g",
    imageQuality: "high",
    prefetchDepth: 3,
    allowBackgroundDownloads: true,
    isSaveData: false,
  });

  useEffect(() => {
    if (typeof window === "undefined") return;

    const updatePolicy = () => {
      const conn = (navigator as unknown as { connection?: { effectiveType?: string; saveData?: boolean } }).connection;
      const effectiveType = conn?.effectiveType || "4g";
      const isSaveData = Boolean(conn?.saveData);

      let tier: NetworkTier = "4g";
      let imageQuality: "low" | "medium" | "high" | "original" = "high";
      let prefetchDepth = 3;
      let allowBackgroundDownloads = true;

      if (isSaveData || effectiveType === "2g") {
        tier = "2g";
        imageQuality = "low";
        prefetchDepth = 0;
        allowBackgroundDownloads = false;
      } else if (effectiveType === "3g") {
        tier = "3g";
        imageQuality = "medium";
        prefetchDepth = 1;
        allowBackgroundDownloads = false;
      } else if (effectiveType === "4g") {
        tier = "4g";
        imageQuality = "high";
        prefetchDepth = 3;
        allowBackgroundDownloads = true;
      } else {
        tier = "wifi";
        imageQuality = "original";
        prefetchDepth = 5;
        allowBackgroundDownloads = true;
      }

      setPolicy({
        tier,
        imageQuality,
        prefetchDepth,
        allowBackgroundDownloads,
        isSaveData,
      });
    };

    updatePolicy();

    const conn = (navigator as unknown as { connection?: EventTarget }).connection;
    conn?.addEventListener?.("change", updatePolicy);
    return () => conn?.removeEventListener?.("change", updatePolicy);
  }, []);

  return policy;
}
