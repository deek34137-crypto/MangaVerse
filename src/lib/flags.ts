/**
 * Feature Flag Manager (src/lib/flags.ts)
 * Enterprise feature flags with runtime override capabilities.
 */

export interface FeatureFlags {
  slugRouting: boolean;
  smartHeroCTA: boolean;
  providerCards: boolean;
  genreRedesign: boolean;
  interactive404: boolean;
  securityHeaders: boolean;
  heuristicPrefetch: boolean;
}

const DEFAULT_FLAGS: FeatureFlags = {
  slugRouting: true,
  smartHeroCTA: true,
  providerCards: true,
  genreRedesign: true,
  interactive404: true,
  securityHeaders: true,
  heuristicPrefetch: true,
};

export function getFeatureFlags(): FeatureFlags {
  if (typeof process === "undefined" || !process.env) {
    return DEFAULT_FLAGS;
  }

  return {
    slugRouting: process.env.NEXT_PUBLIC_FF_SLUG_ROUTING !== "false",
    smartHeroCTA: process.env.NEXT_PUBLIC_FF_SMART_HERO_CTA !== "false",
    providerCards: process.env.NEXT_PUBLIC_FF_PROVIDER_CARDS !== "false",
    genreRedesign: process.env.NEXT_PUBLIC_FF_GENRE_REDESIGN !== "false",
    interactive404: process.env.NEXT_PUBLIC_FF_INTERACTIVE_404 !== "false",
    securityHeaders: process.env.NEXT_PUBLIC_FF_SECURITY_HEADERS !== "false",
    heuristicPrefetch: process.env.NEXT_PUBLIC_FF_HEURISTIC_PREFETCH !== "false",
  };
}

export function isFeatureEnabled(flagKey: keyof FeatureFlags): boolean {
  const flags = getFeatureFlags();
  return flags[flagKey] ?? true;
}
