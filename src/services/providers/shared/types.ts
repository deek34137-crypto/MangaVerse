/* eslint-disable @typescript-eslint/no-unused-vars */
import type { Manga, Chapter, ChapterPage, SearchFilters } from "@/types";

// ---------------------------------------------------------------------------
// Capability Model
// ---------------------------------------------------------------------------

/**
 * Typed capability object for a provider.
 * Replaces the previous Set<ProviderCapability> / ProviderCapability enum.
 */
export interface ProviderCapabilities {
  search:   boolean;
  latest:   boolean;
  trending: boolean;
  merge:    boolean;
  reader:   boolean;
}

// ---------------------------------------------------------------------------
// Health Model (5 operational states, computed from metrics)
// ---------------------------------------------------------------------------

/**
 * Operational health of a provider.
 * Status is computed by the platform from observed metrics — never set manually
 * by provider implementations.
 *
 *  ONLINE       — all systems normal
 *  DEGRADED     — high latency or elevated error rate
 *  RATE_LIMITED — rate limit signals received recently
 *  BLOCKED      — 403 / bot-detection / challenge page returned
 *  OFFLINE      — consecutive failures exceed threshold
 */
export interface ProviderHealth {
  status:               "ONLINE" | "DEGRADED" | "RATE_LIMITED" | "BLOCKED" | "OFFLINE";
  latencyMs:            number;
  lastSuccessAt:        Date;
  errorRate:            number;
  consecutiveFailures:  number;
  rateLimitRemaining?:  number;
  rateLimitResetMs?:    number;
}

// ---------------------------------------------------------------------------
// Metrics Model (lifetime + rolling window)
// ---------------------------------------------------------------------------

/** Shared shape for both lifetime and rolling metric windows. */
export interface ProviderMetricsWindow {
  requestCount:     number;
  successCount:     number;
  failureCount:     number;
  retryCount:       number;
  timeoutCount:     number;
  averageLatencyMs: number;
  /** Success rate 0–1 */
  successRate:      number;
  /** Requests per minute */
  throughputRpm:    number;
}

/**
 * Full metrics snapshot for a provider.
 *
 * - `lifetime` accumulates since process start (or last reset).
 * - `rolling`  reflects only the last 15 minutes — used for health decisions.
 */
export interface ProviderMetrics {
  lifetime: ProviderMetricsWindow & {
    pagesScraped:   number;
    imagesScraped:  number;
    lastRequestAt?: Date;
    lastSuccessAt?: Date;
    lastFailureAt?: Date;
  };
  rolling: ProviderMetricsWindow;
}

// ---------------------------------------------------------------------------
// Metadata & State (static vs dynamic separation)
// ---------------------------------------------------------------------------

/**
 * Static metadata for a provider — derived from provider.json manifest.
 * Does not change at runtime.
 */
export interface ProviderMetadata {
  id:                    string;
  displayName:           string;
  providerVersion:       string;
  manifestSchemaVersion: string;
  priority:              number;
  capabilities:          ProviderCapabilities;
  enabled:               boolean;
  /** Populated when enabled = false to explain why. */
  disabledReason?:       string;
}

/**
 * Dynamic runtime state for a provider — computed from observed metrics.
 * Changes continuously during operation.
 */
export interface ProviderState {
  health:       ProviderHealth;
  metrics:      ProviderMetrics;
  /**
   * Data quality score 0–1, sampled from recent responses.
   * null until enough samples have been collected.
   */
  confidence:   number | null;
  lastChecked?: Date;
}

// ---------------------------------------------------------------------------
// Provider Config (backward-compatible, consumed by Transport)
// ---------------------------------------------------------------------------

export interface ProviderConfig {
  // Legacy fields (backward-compatible shim)
  enabled?: boolean;
  priority: number;
  timeoutMs?: number;

  // Current fields
  id?: string;
  displayName?: string;
  versions?: {
    provider: string;
    parser:   string;
    schema:   string;
  };
  network?: {
    baseUrl:   string;
    timeoutMs: number;
    retries:   number;
    rateLimit: {
      maxRequests: number;
      intervalMs:  number;
    };
  };
  cache?: {
    ttlSearchMs:   number;
    ttlMangaMs:    number;
    ttlChaptersMs: number;
    ttlPagesMs:    number;
  };
  flags?: {
    enabled:       boolean;
    searchEnabled: boolean;
    readerEnabled: boolean;
    mergeEnabled:  boolean;
  };
}

// ---------------------------------------------------------------------------
// Raw provider data models
// ---------------------------------------------------------------------------

export interface SearchOptions {
  limit?:    number;
  offset?:   number;
  language?: string[];
  nsfw?:     boolean;
}

export interface RawProviderManga {
  id:           string;
  title:        string;
  altTitles?:   string[];
  description?: string;
  coverImage?:  string;
  bannerImage?: string;
  status?:      string;
  type?:        string;
  demographic?: string;
  genres?:      string[];
  tags?:        string[];
  authors?:     string[];
  artists?:     string[];
  year?:        number;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  rawMetadata?: any;
}

export interface RawProviderChapter {
  id:              string;
  number:          number | null;
  volume?:         number;
  type?:           string;
  title?:          string;
  language:        string;
  displayNumber?:  string;
  pageCount?:      number;
  publishedAt?:    Date;
  scanlatorGroups?: string[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  rawMetadata?:    any;
}

export interface RawProviderPage {
  number:  number;
  url:     string;
  width?:  number;
  height?: number;
  size?:   number;
}

// ---------------------------------------------------------------------------
// Provider Interface
// ---------------------------------------------------------------------------

export interface IMangaProvider {
  name:         string;
  version:      string;
  config:       ProviderConfig;
  capabilities: ProviderCapabilities;

  initialize?(): Promise<void>;
  shutdown?():   Promise<void>;
  reload?():     Promise<void>;

  searchManga(query: string, options?: SearchOptions): Promise<RawProviderManga[]>;
  getMangaDetail(providerMangaId: string): Promise<RawProviderManga>;
  getChapters(providerMangaId: string): Promise<RawProviderChapter[]>;
  getChapterPages(providerChapterId: string): Promise<RawProviderPage[]>;

  healthCheck(): Promise<ProviderHealth>;
}
