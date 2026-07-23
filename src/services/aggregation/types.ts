export const AGGREGATION_VERSION = "1.0" as const;

export interface FieldProvenance<T> {
  value: T;
  provider: string;
  confidence: number;
  mergedAt: string;
  traceId: string;
}

export interface ProviderMapping {
  providerId: string;
  providerMangaId: string;
  trustScore: number;
}

export type QualityTier = "TIER_A_PRODUCTION" | "TIER_B_PARTIAL" | "TIER_C_HIDDEN";

export interface QualityMetricsComponent {
  metadata: number;
  reader: number;
  images: number;
  chapters: number;
  overall: number;
}

export type SnapshotFailureReason =
  | "NO_CHAPTERS"
  | "NO_PAGES"
  | "NO_COVER"
  | "PARSER_FAILED"
  | "PROVIDER_BLOCKED"
  | "LOW_CONFIDENCE"
  | "LOW_METADATA"
  | "RATE_LIMITED"
  | "INTEGRITY_REGRESSION";

export interface FallbackCover {
  provider: string;
  url: string;
  priority: number;
  verifiedAt?: string;
  healthy?: boolean;
}

export interface CanonicalManga {
  canonicalId: string;
  aggregationVersion: typeof AGGREGATION_VERSION;
  title: FieldProvenance<string>;
  description?: FieldProvenance<string>;
  coverImage: FieldProvenance<string>;
  fallbackCovers?: FallbackCover[];
  status: FieldProvenance<"ONGOING" | "COMPLETED" | "HIATUS" | "CANCELLED" | "UNKNOWN">;
  authors: FieldProvenance<string[]>;
  genres: FieldProvenance<string[]>;
  alternativeTitles: FieldProvenance<string[]>;
  providerMappings: ProviderMapping[];
  rating?: number | null;
  formattedRating: string;
  quality: QualityMetricsComponent;
  qualityTier: QualityTier;
  mergeConfidence: number;
  candidateMergeCount: number;
  createdAt: string;
  updatedAt: string;
  traceId: string;
}

export type SnapshotLifecycleState = "CREATING" | "READY" | "STALE" | "REPAIRING" | "FAILED" | "INVALIDATED";

export interface ProviderFingerprint {
  providerId: string;
  sourceId: string;
  chapterUrl: string;
}

export interface ChapterLookupPayload {
  canonicalMangaId: string;
  canonicalChapterId: string;
  chapterNumber?: number;
  title?: string;
  providerFingerprints: ProviderFingerprint[];
  snapshotSchemaVersion: number;
  adapterVersion: string;
  aggregationVersion: string;
  lifecycleState: SnapshotLifecycleState;
  updatedAt: string;
}

export interface SourceRankingPolicy {
  providerHealthWeight: number;
  latencyWeight: number;
  successWeight: number;
  cacheWeight: number;
  imageValidationWeight: number;
}

export interface ReaderTelemetry {
  chapterId: string;
  canonicalId: string;
  resolvedCanonicalId?: string;
  recoveryTierUsed?: "TIER_1_DIRECT" | "TIER_2_REVERSE_LOOKUP" | "TIER_3_CLUSTER_SEARCH" | "TIER_4_COALESCED_REFRESH";
  snapshotAgeMs?: number;
  snapshotSchemaVersion?: number;
  adapterVersion?: string;
  aggregationVersion?: string;
  providerCount: number;
  healthyProviders: string[];
  failedProviders: string[];
  winningProviderId?: string;
  latencyMs: number;
  cacheHit: boolean;
  recovered: boolean;
  refreshTriggered: boolean;
  parserConfidence?: number;
}

export type SnapshotState = "FRESH" | "STALE" | "REFRESHING" | "EXPIRED" | "FAILED";

export interface CanonicalSnapshot<T> {
  snapshotId: string;
  entityId: string;
  schemaVersion: number;
  snapshotSchemaVersion?: number;
  adapterVersion?: string;
  aggregationVersion?: string;
  contentVersion: number;
  state: SnapshotState;
  lifecycleState?: SnapshotLifecycleState;
  failureReason?: SnapshotFailureReason;
  data: T;
  qualityTier: QualityTier;
  qualityScore: number;
  mergeConfidence: number;
  candidateMergeCount: number;
  createdAt: string;
  staleAt: string;
  expiresAt: string;
}

export interface StructuredChapterKey {
  volume?: number;
  chapter: number;
  part?: number;
  isSpecial?: boolean;
  isExtra?: boolean;
  key: string; // Sortable string, e.g. "v03_c010_p01"
}

export interface ChapterSource {
  providerId: string;
  providerChapterId: string;
  sourceScore: number;
  url: string;
  publishedAt?: string;
}

export interface CanonicalChapter {
  id: string;
  canonicalChapterId: string;
  aggregationVersion: typeof AGGREGATION_VERSION;
  canonicalMangaId: string;
  chapterNumber?: number;
  key: StructuredChapterKey;
  title: string;
  sources: ChapterSource[];
  providerIds: string[];
  releasedAt?: string;
  updatedAt: string;
  lastValidated: string;
  traceId: string;
}

export interface AggregationDecisionTrace {
  traceId: string;
  entityId: string;
  timestamp: string;
  fieldDecisions: Record<string, {
    winner: string;
    reason: string;
    alternatives: Array<{ provider: string; confidence: number; value: any }>;
  }>;
  sourceRanking?: Array<{
    providerId: string;
    score: number;
    metrics: { confidence: number; latencyMs: number; availability: number; imageSuccessRate: number };
  }>;
}

export interface MangaFingerprint {
  normalizedTitle: string;
  normalizedAliases: string[];
  primaryAuthor?: string;
  status?: string;
  year?: number;
}

export interface BusinessMetrics {
  totalMerges: number;
  successfulMerges: number;
  autoMerges: number;
  candidateMerges: number;
  separateSeries: number;
  mergeSuccessRate: number;
  mergeDriftRate: number;
  averageProvidersPerEntity: number;
  averageSourcesPerChapter: number;
  providerContributionPercentage: Record<string, number>;
}

export interface InfrastructureMetrics {
  totalRequests: number;
  cacheHits: number;
  cacheMisses: number;
  cacheHitRate: number;
  swrRefreshesEnqueued: number;
  swrRefreshesCompleted: number;
  swrRefreshesFailed: number;
  readerFailoverRate: number;
  averageSnapshotAgeMs: number;
  p95RefreshDurationMs: number;
  providerLatencyMs: Record<string, number>;
}
