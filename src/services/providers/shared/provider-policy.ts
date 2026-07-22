/**
 * Centralized Provider Descriptor & Policy Registry (V1 / V2 Descriptor)
 *
 * Single source of truth for provider identity, capabilities, network policies,
 * static quality weights, and dynamic runtime telemetry across all 8 providers.
 */

export interface ProviderDescriptor {
  identity: {
    id: string;
    displayName: string;
    languages: string[];
    official: boolean;
  };
  quality: {
    trustScore: number;       // Base static trust score (0.0 to 1.0)
    mergePriority: number;    // Priority weight for metadata collision resolution
    chapterPriority: number;  // Priority weight for chapter sorting
    imagePriority: number;    // Priority weight for cover/page stream selection
  };
  capabilities: {
    search: boolean;
    latest: boolean;
    trending: boolean;
    reader: boolean;
    recommendations: boolean;
    officialTranslations: boolean;
    highResCover: boolean;
  };
  network: {
    allowedHosts: readonly string[];
    referer: string;
    timeoutMs: number;
    cacheTTL: number; // in seconds
    retries: number;
    headers: Record<string, string>;
    supportsStreaming: boolean;
  };
}

export interface ProviderRuntimeState {
  providerId: string;
  circuitState: "CLOSED" | "HALF-OPEN" | "OPEN";
  health: "ONLINE" | "DEGRADED" | "RATE_LIMITED" | "BLOCKED" | "OFFLINE";
  consecutiveFailures: number;
  lastSuccessAt: Date;
  lastFailureAt?: Date;
}

export interface ProviderMetrics {
  providerId: string;
  latencyMs: number;
  latencyP95Ms: number;
  latencyStdDevMs: number;
  availabilityRatio: number;
  selectorCoverageRatio: number;
  totalRequests: number;
  failedRequests: number;
  imageSuccessRate: number;
}

// Backward-compatibility alias
export interface ProviderPolicyV1 {
  version: 1;
  id: string;
  displayName: string;
  referer: string;
  allowedHosts: readonly string[];
  timeoutMs: number;
  cacheTTL: number;
  retries: number;
  headers: Record<string, string>;
  supportsStreaming: boolean;
}

const DESCRIPTORS: Record<string, ProviderDescriptor> = {
  mangadex: {
    identity: {
      id: "mangadex",
      displayName: "MangaDex",
      languages: ["en", "ja", "es", "fr"],
      official: false,
    },
    quality: {
      trustScore: 0.95,
      mergePriority: 1,
      chapterPriority: 1,
      imagePriority: 1,
    },
    capabilities: {
      search: true,
      latest: true,
      trending: true,
      reader: true,
      recommendations: true,
      officialTranslations: true,
      highResCover: true,
    },
    network: {
      referer: "https://mangadex.org/",
      allowedHosts: [
        "uploads.mangadex.org",
        "mangadex.org",
        "mangadex.network",
        "cmdgd.org",
      ],
      timeoutMs: 10000,
      cacheTTL: 300,
      retries: 3,
      headers: { "User-Agent": "MangaHub/1.0" },
      supportsStreaming: true,
    },
  },
  comick: {
    identity: {
      id: "comick",
      displayName: "ComicK",
      languages: ["en"],
      official: false,
    },
    quality: {
      trustScore: 0.92,
      mergePriority: 2,
      chapterPriority: 2,
      imagePriority: 2,
    },
    capabilities: {
      search: true,
      latest: true,
      trending: true,
      reader: true,
      recommendations: true,
      officialTranslations: false,
      highResCover: true,
    },
    network: {
      referer: "https://comick.io/",
      allowedHosts: [
        "comick.app",
        "comick.cc",
        "comick.fun",
        "comick.io",
        "comick.pictures",
      ],
      timeoutMs: 10000,
      cacheTTL: 300,
      retries: 3,
      headers: { "User-Agent": "MangaHub/1.0" },
      supportsStreaming: true,
    },
  },
  weebcentral: {
    identity: {
      id: "weebcentral",
      displayName: "WeebCentral",
      languages: ["en"],
      official: false,
    },
    quality: {
      trustScore: 0.88,
      mergePriority: 3,
      chapterPriority: 3,
      imagePriority: 3,
    },
    capabilities: {
      search: true,
      latest: true,
      trending: true,
      reader: true,
      recommendations: false,
      officialTranslations: false,
      highResCover: false,
    },
    network: {
      referer: "https://weebcentral.com/",
      allowedHosts: ["weebcentral.com", "planeptune.us", "compsci88.com"],
      timeoutMs: 12000,
      cacheTTL: 600,
      retries: 3,
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
      },
      supportsStreaming: true,
    },
  },
  mangakatana: {
    identity: {
      id: "mangakatana",
      displayName: "MangaKatana",
      languages: ["en"],
      official: false,
    },
    quality: {
      trustScore: 0.85,
      mergePriority: 4,
      chapterPriority: 4,
      imagePriority: 4,
    },
    capabilities: {
      search: true,
      latest: true,
      trending: true,
      reader: true,
      recommendations: false,
      officialTranslations: false,
      highResCover: false,
    },
    network: {
      referer: "https://mangakatana.com/",
      allowedHosts: ["mangakatana.com"],
      timeoutMs: 12000,
      cacheTTL: 600,
      retries: 3,
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
      },
      supportsStreaming: true,
    },
  },
  webtoon: {
    identity: {
      id: "webtoon",
      displayName: "WEBTOON",
      languages: ["en"],
      official: true,
    },
    quality: {
      trustScore: 0.98,
      mergePriority: 1,
      chapterPriority: 1,
      imagePriority: 1,
    },
    capabilities: {
      search: true,
      latest: true,
      trending: true,
      reader: true,
      recommendations: true,
      officialTranslations: true,
      highResCover: true,
    },
    network: {
      referer: "https://www.webtoons.com/",
      allowedHosts: [
        "pstatic.net",
        "webtoon-phinf.pstatic.net",
        "webtoons-static.pstatic.net",
        "webtoons.com",
      ],
      timeoutMs: 10000,
      cacheTTL: 600,
      retries: 3,
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
      },
      supportsStreaming: true,
    },
  },
  mangatoon: {
    identity: {
      id: "mangatoon",
      displayName: "MangaToon",
      languages: ["en"],
      official: true,
    },
    quality: {
      trustScore: 0.90,
      mergePriority: 5,
      chapterPriority: 5,
      imagePriority: 5,
    },
    capabilities: {
      search: true,
      latest: true,
      trending: true,
      reader: true,
      recommendations: false,
      officialTranslations: true,
      highResCover: false,
    },
    network: {
      referer: "https://mangatoon.mobi/",
      allowedHosts: [
        "mangatoon.mobi",
        "cdn.mangatoon.mobi",
        "mangatoon.net",
        "mktoon.com",
      ],
      timeoutMs: 10000,
      cacheTTL: 600,
      retries: 3,
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
      },
      supportsStreaming: true,
    },
  },
  mangabuddy: {
    identity: {
      id: "mangabuddy",
      displayName: "MangaBuddy",
      languages: ["en"],
      official: false,
    },
    quality: {
      trustScore: 0.78,
      mergePriority: 7,
      chapterPriority: 7,
      imagePriority: 7,
    },
    capabilities: {
      search: true,
      latest: true,
      trending: true,
      reader: true,
      recommendations: false,
      officialTranslations: false,
      highResCover: false,
    },
    network: {
      referer: "https://mangabuddy1.co.uk/",
      allowedHosts: [
        "mangabuddy1.co.uk",
        "cdn1.love4awalk.xyz",
        "cdn2.love4awalk.xyz",
      ],
      timeoutMs: 10000,
      cacheTTL: 600,
      retries: 3,
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
      },
      supportsStreaming: true,
    },
  },
  mangatown: {
    identity: {
      id: "mangatown",
      displayName: "MangaTown",
      languages: ["en"],
      official: false,
    },
    quality: {
      trustScore: 0.82,
      mergePriority: 6,
      chapterPriority: 6,
      imagePriority: 6,
    },
    capabilities: {
      search: true,
      latest: true,
      trending: false,
      reader: true,
      recommendations: false,
      officialTranslations: false,
      highResCover: false,
    },
    network: {
      referer: "https://www.mangatown.com/",
      allowedHosts: [
        "mangatown.com",
        "www.mangatown.com",
        "fmcdn.mangahere.com",
        "zjcdn.mangahere.org",
        "mangahere.com",
        "mangahere.org",
      ],
      timeoutMs: 12000,
      cacheTTL: 600,
      retries: 3,
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
      },
      supportsStreaming: true,
    },
  },
};

const GLOBAL_ALLOWED_HOSTS = [
  "wp.com",
  "blogspot.com",
  "bp.blogspot.com",
  "cloudinary.com",
  "imgur.com",
  "catbox.moe",
  "cubari.moe",
  "manganato.com",
  "chapmanganato.to",
  "chapmanganato.com",
  "chapmanganato.org",
  "manganato.info",
  "mangasee123.com",
  "mangalifeus.com",
];

export function validateProviderPolicies(): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  for (const [id, desc] of Object.entries(DESCRIPTORS)) {
    if (!desc.identity || desc.identity.id !== id) {
      errors.push(`Provider [${id}] ID mismatch in identity`);
    }
    if (desc.quality.trustScore < 0 || desc.quality.trustScore > 1.0) {
      errors.push(`Provider [${id}] has invalid trustScore: ${desc.quality.trustScore}`);
    }
    if (!desc.network.allowedHosts || desc.network.allowedHosts.length === 0) {
      errors.push(`Provider [${id}] must define at least one allowed host`);
    }
  }
  return { valid: errors.length === 0, errors };
}

const RUNTIME_STATES = new Map<string, ProviderRuntimeState>();
const RUNTIME_METRICS = new Map<string, ProviderMetrics>();

export const providerPolicyRegistry = {
  getDescriptor(providerId: string): ProviderDescriptor | undefined {
    return DESCRIPTORS[providerId.toLowerCase()];
  },

  getAllDescriptors(): ProviderDescriptor[] {
    return Object.values(DESCRIPTORS);
  },

  getRuntimeState(providerId: string): ProviderRuntimeState {
    const id = providerId.toLowerCase();
    if (!RUNTIME_STATES.has(id)) {
      RUNTIME_STATES.set(id, {
        providerId: id,
        circuitState: "CLOSED",
        health: "ONLINE",
        consecutiveFailures: 0,
        lastSuccessAt: new Date(),
      });
    }
    return RUNTIME_STATES.get(id)!;
  },

  updateRuntimeState(providerId: string, update: Partial<ProviderRuntimeState>): void {
    const current = this.getRuntimeState(providerId);
    RUNTIME_STATES.set(providerId.toLowerCase(), { ...current, ...update });
  },

  getMetrics(providerId: string): ProviderMetrics {
    const id = providerId.toLowerCase();
    if (!RUNTIME_METRICS.has(id)) {
      RUNTIME_METRICS.set(id, {
        providerId: id,
        latencyMs: 250,
        latencyP95Ms: 450,
        latencyStdDevMs: 40,
        availabilityRatio: 1.0,
        selectorCoverageRatio: 0.95,
        totalRequests: 100,
        failedRequests: 0,
        imageSuccessRate: 0.98,
      });
    }
    return RUNTIME_METRICS.get(id)!;
  },

  updateMetrics(providerId: string, update: Partial<ProviderMetrics>): void {
    const current = this.getMetrics(providerId);
    RUNTIME_METRICS.set(providerId.toLowerCase(), { ...current, ...update });
  },

  // Legacy Policy accessor for route.ts compatibility
  get(providerId: string): ProviderPolicyV1 | undefined {
    const desc = this.getDescriptor(providerId);
    if (!desc) return undefined;
    return {
      version: 1,
      id: desc.identity.id,
      displayName: desc.identity.displayName,
      referer: desc.network.referer,
      allowedHosts: desc.network.allowedHosts,
      timeoutMs: desc.network.timeoutMs,
      cacheTTL: desc.network.cacheTTL,
      retries: desc.network.retries,
      headers: desc.network.headers,
      supportsStreaming: desc.network.supportsStreaming,
    };
  },

  getAll(): ProviderPolicyV1[] {
    return Object.keys(DESCRIPTORS).map((id) => this.get(id)!);
  },

  getAllAllowedHosts(): string[] {
    const set = new Set<string>(GLOBAL_ALLOWED_HOSTS);
    for (const desc of Object.values(DESCRIPTORS)) {
      for (const host of desc.network.allowedHosts) {
        set.add(host);
      }
    }
    return Array.from(set);
  },

  isHostAllowed(hostname: string): boolean {
    const lowerHost = hostname.toLowerCase();
    const allAllowed = this.getAllAllowedHosts();
    return allAllowed.some((allowed) => lowerHost === allowed || lowerHost.endsWith("." + allowed));
  },

  getRefererForHost(hostname: string, protocol: string = "https:"): string {
    const lowerHost = hostname.toLowerCase();
    for (const desc of Object.values(DESCRIPTORS)) {
      for (const host of desc.network.allowedHosts) {
        if (lowerHost === host || lowerHost.endsWith("." + host)) {
          return desc.network.referer;
        }
      }
    }
    return `${protocol}//${hostname}/`;
  },
};
