"use client";

import { useState, useEffect } from "react";

export type HardwareTier = "TIER_A" | "TIER_B" | "TIER_C" | "TIER_D";

export interface HardwareCapabilityProfile {
  tier: HardwareTier;
  enableBlur: boolean;
  enableComplexAnimations: boolean;
  maxDomNodes: number;
  evictionWindowSize: number;
}

export function useCapabilityTier(): HardwareCapabilityProfile {
  const [profile, setProfile] = useState<HardwareCapabilityProfile>({
    tier: "TIER_A",
    enableBlur: true,
    enableComplexAnimations: true,
    maxDomNodes: 50,
    evictionWindowSize: 3,
  });

  useEffect(() => {
    if (typeof window === "undefined") return;

    const deviceMemory = (navigator as unknown as { deviceMemory?: number }).deviceMemory || 8;
    const hardwareConcurrency = navigator.hardwareConcurrency || 8;

    let tier: HardwareTier = "TIER_A";
    let enableBlur = true;
    let enableComplexAnimations = true;
    let evictionWindowSize = 3;

    if (deviceMemory <= 2 || hardwareConcurrency <= 2) {
      tier = "TIER_D";
      enableBlur = false;
      enableComplexAnimations = false;
      evictionWindowSize = 1;
    } else if (deviceMemory <= 4 || hardwareConcurrency <= 4) {
      tier = "TIER_C";
      enableBlur = false;
      enableComplexAnimations = false;
      evictionWindowSize = 1;
    } else if (deviceMemory <= 6) {
      tier = "TIER_B";
      enableBlur = true;
      enableComplexAnimations = true;
      evictionWindowSize = 2;
    } else {
      tier = "TIER_A";
      enableBlur = true;
      enableComplexAnimations = true;
      evictionWindowSize = 3;
    }

    setProfile({
      tier,
      enableBlur,
      enableComplexAnimations,
      maxDomNodes: tier === "TIER_D" ? 20 : 50,
      evictionWindowSize,
    });
  }, []);

  return profile;
}
