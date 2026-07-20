import type { Manga } from "@/types";

// ---------------------------------------------------------------------------
// Score Breakdown
// ---------------------------------------------------------------------------

export interface ScoreBreakdown {
  popularity: number;
  freshness: number;
  rating: number;
  providerBoost: number;
  personalization: number;
  modifierBoost: number;        // Sum of all RankingModifier deltas
  modifierTrace: Array<{ id: string; delta: number; reason: string }>; // Per-modifier record
  penalties: {
    genre: number;
    author: number;
    provider: number;
    franchise: number;
    demographic: number;
    status: number;
  };
  noise: number;
  final: number;
}

// ---------------------------------------------------------------------------
// Candidate
// ---------------------------------------------------------------------------

export interface HomepageCandidate extends Manga {
  /** Provider slugs this manga is available on (e.g. ["mangadex", "webtoon"]) */
  providers: string[];

  /**
   * Which candidate pools this manga appeared in.
   * Uses `Record<string, true>` (not a fixed enum) so future pools
   * (editors, featured, ai, seasonal…) simply add a new key.
   * O(1) membership check: `candidate.candidateSources?.trending === true`
   */
  candidateSources?: Record<string, true>;

  /** Attached after scoring. */
  scoreBreakdown?: ScoreBreakdown;
}

// ---------------------------------------------------------------------------
// Hero
// ---------------------------------------------------------------------------

export interface HomepageHero {
  manga: Manga;
  editorial?: { slug: string; title: string };
  scoreBreakdown?: ScoreBreakdown;
}

// ---------------------------------------------------------------------------
// Section
// ---------------------------------------------------------------------------

export interface HomepageSection {
  type: "hero" | "carousel" | "continue-reading" | "recently-viewed" | "genres" | "announcements";
  id?: string;
  title?: string;
  priority: number;
  data: Manga[] | HomepageHero | any[];
}

// ---------------------------------------------------------------------------
// Layout (sections only — diagnostics live in EngineResult)
// ---------------------------------------------------------------------------

export interface HomepageLayout {
  sections: HomepageSection[];
}

// ---------------------------------------------------------------------------
// Rejection
// ---------------------------------------------------------------------------

/**
 * Hard rejection reasons only.
 *
 * - "duplicate"      — blocked by globalUsedMangaIds (already on the page)
 * - "pool_exhausted" — all constraint levels failed; no valid slot existed
 * - "not_selected"   — present in pool, not a duplicate, simply outscored
 *
 * Soft penalty classifications (same_author, genre_overlap, provider_heavy)
 * are score adjustments captured in ScoreBreakdown.penalties — NOT rejections.
 */
export type HardRejectionReason = "duplicate" | "pool_exhausted" | "not_selected";

export interface RejectionEntry {
  id: string;
  title: string;
  reason: HardRejectionReason;
  score?: number;
  sources?: Record<string, true>;
}

// ---------------------------------------------------------------------------
// Noise Generator
// ---------------------------------------------------------------------------

export interface NoiseGenerator {
  /**
   * Returns a deterministic score in [0, 100] for the given candidate + seed.
   * Named `compute` (not `generate`) to reflect that this is deterministic,
   * not random. Implementations may use candidate.id, provider, genre, year, etc.
   */
  compute(seed: string, candidate: Readonly<HomepageCandidate>): number;
}

// ---------------------------------------------------------------------------
// Ranking Modifier
// ---------------------------------------------------------------------------

export interface ModifierResult {
  /** Signed score delta. Positive = boost, negative = penalty. */
  delta: number;
  /** Human-readable label for diagnostics (e.g. "seasonal", "editorial", "staff-pick"). */
  reason: string;
}

/**
 * Context available to a RankingModifier at selection time.
 * All fields are Readonly — modifiers must never mutate shared state.
 */
export interface EngineSelectionContext {
  seed: string;
  section: string;
  providerCounts: Readonly<Record<string, number>>;
  selectedCards: ReadonlyArray<HomepageCandidate>;
  hero: Readonly<HomepageHero> | null;
}

export interface RankingModifier {
  id: string;
  /** Lower priority number executes first (10 before 20 before 30). */
  priority: number;
  apply(
    candidate: Readonly<HomepageCandidate>,
    context: Readonly<EngineSelectionContext>
  ): ModifierResult;
}

// ---------------------------------------------------------------------------
// Engine Context
// ---------------------------------------------------------------------------

/** Tunable values — algorithm knobs, not infrastructure. */
export interface HomepageEngineOptions {
  personalizationBoosts?: Record<string, number>;  // mangaId → signed delta
}

/**
 * Injectable dependencies.
 * Adding future capabilities (analytics, featureFlags) goes here
 * without changing call sites that don't need them.
 */
export interface HomepageEngineDependencies {
  noiseGenerator?: NoiseGenerator;       // Defaults to built-in FNV-1a implementation
  rankingModifiers?: RankingModifier[];   // Empty by default
  /**
   * High-resolution clock. Defaults to `performance.now()`.
   * Injectable for deterministic test timing.
   */
  clock?: () => number;
  logger?: (msg: string) => void;
}

export interface HomepageEngineContext {
  seed: string;
  options?: HomepageEngineOptions;
  services?: HomepageEngineDependencies;
}

// ---------------------------------------------------------------------------
// Engine Stats & Timings
// ---------------------------------------------------------------------------

export interface EngineTimings {
  unionMs: number;
  normalizeMs: number;
  scoringMs: number;
  heroMs: number;
  sectionFillMs: number;
  metricsMs: number;
  totalMs: number;
}

export interface EngineStats {
  layoutVersion: string;
  totalCandidates: number;    // Raw pool entries including cross-pool duplicates
  uniqueCandidates: number;   // After union deduplication
  selected: number;           // Cards placed on the homepage
  rejected: number;           // Hard rejections (duplicate + pool_exhausted + not_selected)
  duplicatePct: number;       // (totalCandidates - uniqueCandidates) / totalCandidates
  averageScore: number;
  medianScore: number;
  heroConfidence: number;     // heroScore / avg(top5Scores); >1 = clearly dominant
  poolExhaustion: Record<string, number>;     // section → uniqueAvailable / rawPoolSize
  providerDistribution: Record<string, number>; // provider → share (0–1)
  genreDistribution: Record<string, number>;   // genre → count
}

// ---------------------------------------------------------------------------
// Engine Result (frozen at construction)
// ---------------------------------------------------------------------------

export interface HomepageEngineResult {
  readonly layout: HomepageLayout;
  readonly stats: Readonly<EngineStats>;
  readonly timings: Readonly<EngineTimings>;
  readonly rejections: ReadonlyArray<RejectionEntry>;
}

// ---------------------------------------------------------------------------
// Strategy Interface
// ---------------------------------------------------------------------------

/**
 * Implement this interface to provide a complete homepage layout algorithm.
 * HomepageContentEngine ships as the default implementation.
 *
 * Future strategies (HolidayStrategy, EditorialStrategy, NewUserStrategy)
 * implement this interface without any branching logic in the core engine.
 */
export interface HomepageStrategy {
  buildLayout(
    pools: {
      trending: HomepageCandidate[];
      latest: HomepageCandidate[];
      popular: HomepageCandidate[];
    },
    context: HomepageEngineContext
  ): HomepageEngineResult;
}

export type ConstraintLevel = "STRICT" | "BALANCED" | "RELAXED" | "UNCONSTRAINED";
