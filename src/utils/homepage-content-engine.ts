import type {
  HomepageCandidate,
  HomepageHero,
  HomepageLayout,
  HomepageSection,
  HomepageEngineResult,
  HomepageEngineContext,
  HomepageStrategy,
  NoiseGenerator,
  RankingModifier,
  ModifierResult,
  EngineSelectionContext,
  EngineTimings,
  EngineStats,
  ScoreBreakdown,
  ConstraintLevel,
  RejectionEntry,
  HardRejectionReason,
} from "@/types/homepage-engine";
import { HOMEPAGE_RANKING_CONFIG } from "@/config/homepage-ranking-config";
import { HomepageEngineConfig } from "@/config/homepage-engine-config";
import type { Manga } from "@/types";

// ---------------------------------------------------------------------------
// FNV-1a — internal hash primitive
// ---------------------------------------------------------------------------

function fnv1a(str: string): number {
  let hash = 2166136261 >>> 0;
  for (let i = 0; i < str.length; i++) {
    hash ^= str.charCodeAt(i);
    hash = Math.imul(hash, 16777619) >>> 0;
  }
  return hash;
}

/**
 * Standalone utility kept for backward test compatibility.
 * The engine internally routes through `NoiseGenerator.compute()`.
 */
export function getNoiseScore(seed: string, mangaId: string): number {
  return (fnv1a(seed + mangaId) % 10001) / 100;
}

/**
 * Built-in FNV-1a NoiseGenerator implementation.
 * Uses only `candidate.id` — deterministic, non-random.
 */
export const fnv1aNoiseGenerator: NoiseGenerator = {
  compute(seed, candidate) {
    return getNoiseScore(seed, candidate.id);
  },
};

// ---------------------------------------------------------------------------
// Franchise key
// ---------------------------------------------------------------------------

export function getFranchiseKey(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, "")
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .join(" ");
}

// ---------------------------------------------------------------------------
// Timing helper
// ---------------------------------------------------------------------------

function makeTimer(clock: () => number) {
  return function time<T>(fn: () => T): { result: T; ms: number } {
    const t0 = clock();
    const result = fn();
    return { result, ms: Math.round((clock() - t0) * 100) / 100 };
  };
}

// ---------------------------------------------------------------------------
// Median helper
// ---------------------------------------------------------------------------

function median(values: number[]): number {
  if (!values.length) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0
    ? Math.round(((sorted[mid - 1] + sorted[mid]) / 2) * 100) / 100
    : Math.round(sorted[mid] * 100) / 100;
}

// ---------------------------------------------------------------------------
// HomepageContentEngine — default HomepageStrategy implementation
// ---------------------------------------------------------------------------

export class HomepageContentEngine implements HomepageStrategy {
  // -------------------------------------------------------------------------
  // Public: scoreCandidates
  // -------------------------------------------------------------------------

  public static scoreCandidates(
    candidates: HomepageCandidate[],
    seed: string,
    options?: {
      noiseGenerator?: NoiseGenerator;
      modifiers?: RankingModifier[];
      personalizationBoosts?: Record<string, number>;
      selectionContext?: EngineSelectionContext;
    }
  ): HomepageCandidate[] {
    if (!candidates.length) return [];

    const noise = options?.noiseGenerator ?? fnv1aNoiseGenerator;
    const modifiers = [...(options?.modifiers ?? [])].sort((a, b) => a.priority - b.priority);
    const boosts = options?.personalizationBoosts ?? {};
    const selCtx = options?.selectionContext;

    const now = Date.now();
    const maxFollows = Math.max(...candidates.map((c) => c.followCount), 1);
    const maxRating = Math.max(...candidates.map((c) => Number(c.rating || 0)), 1);
    const config = HOMEPAGE_RANKING_CONFIG;

    return candidates.map((m) => {
      // 1. Popularity — logarithmic scaling
      const popularity =
        maxFollows > 0
          ? (Math.log10(m.followCount + 1) / Math.log10(maxFollows + 1)) * 100
          : 0;

      // 2. Freshness — linear decay over 30 days
      const daysSinceUpdate = m.updatedAt
        ? (now - new Date(m.updatedAt).getTime()) / (24 * 60 * 60 * 1000)
        : 30;
      const freshness = Math.max(0, 100 - daysSinceUpdate * (100 / 30));

      // 3. Rating — linear scale relative to pool max
      const ratingVal = Number(m.rating || 0);
      const rating = maxRating > 0 ? (ratingVal / maxRating) * 100 : 0;

      // 4. Noise — deterministic via NoiseGenerator
      const noiseVal = noise.compute(seed, m);
      const noiseScore = noiseVal * config.weights.noise;

      // 5. Personalization
      const personalization = boosts[m.id] ?? 0;

      // 6. Ranking modifiers — sorted by priority, each returns ModifierResult.
      // Always run modifiers unconditionally. If no selection context was supplied
      // (e.g. in direct test calls or the initial scoring pass), provide a minimal
      // default so the apply(candidate, context) interface is always satisfied.
      const effectiveCtx: EngineSelectionContext = options?.selectionContext ?? {
        seed,
        section: "scoring",
        providerCounts: {},
        selectedCards: [],
        hero: null,
      };
      const modifierTrace: Array<{ id: string; delta: number; reason: string }> = [];
      let modifierBoostTotal = 0;
      for (const mod of modifiers) {
        const mr: ModifierResult = mod.apply(m, effectiveCtx);
        modifierTrace.push({ id: mod.id, delta: mr.delta, reason: mr.reason });
        modifierBoostTotal += mr.delta;
      }

      // 7. Base score
      const baseScore =
        popularity * config.weights.popularity +
        freshness * config.weights.freshness +
        rating * config.weights.rating;

      const initialFinal =
        baseScore + personalization + modifierBoostTotal + noiseScore;

      const scoreBreakdown: ScoreBreakdown = {
        popularity: Math.round(popularity * 100) / 100,
        freshness: Math.round(freshness * 100) / 100,
        rating: Math.round(rating * 100) / 100,
        providerBoost: 0,
        personalization: Math.round(personalization * 100) / 100,
        modifierBoost: Math.round(modifierBoostTotal * 100) / 100,
        modifierTrace,
        penalties: { genre: 0, author: 0, provider: 0, franchise: 0, demographic: 0, status: 0 },
        noise: Math.round(noiseScore * 100) / 100,
        final: Math.round(initialFinal * 100) / 100,
      };

      return { ...m, scoreBreakdown };
    });
  }

  // -------------------------------------------------------------------------
  // Public: selectHero
  // -------------------------------------------------------------------------

  public static selectHero(
    candidates: HomepageCandidate[],
    seed: string
  ): { hero: HomepageHero | null; remaining: HomepageCandidate[]; heroConfidence: number } {
    if (!candidates.length) return { hero: null, remaining: [], heroConfidence: 0 };

    const sorted = [...candidates].sort(
      (a, b) => (b.scoreBreakdown?.final ?? 0) - (a.scoreBreakdown?.final ?? 0)
    );

    const top5 = sorted.slice(0, 5);
    const rest = sorted.slice(5);

    // Seeded weighted pick among Top 5: [50%, 25%, 15%, 7%, 3%]
    const rand = (fnv1a(seed + "hero_pick") % 10001) / 10000;
    const weights = [0.5, 0.25, 0.15, 0.07, 0.03].slice(0, top5.length);
    const weightSum = weights.reduce((s, w) => s + w, 0);
    const normalised = weights.map((w) => w / weightSum);

    let acc = 0;
    let idx = 0;
    for (let i = 0; i < top5.length; i++) {
      acc += normalised[i];
      if (rand <= acc) { idx = i; break; }
    }

    const heroManga = top5[idx];
    const hero: HomepageHero = {
      manga: heroManga,
      editorial: { slug: "editors-choice", title: "Daily Spotlight" },
      scoreBreakdown: heroManga.scoreBreakdown,
    };

    // Hero confidence: heroScore / average of top5 scores
    const top5Scores = top5.map((c) => c.scoreBreakdown?.final ?? 0);
    const avgTop5 = top5Scores.reduce((s, v) => s + v, 0) / top5Scores.length;
    const heroConfidence =
      avgTop5 > 0
        ? Math.round(((heroManga.scoreBreakdown?.final ?? 0) / avgTop5) * 100) / 100
        : 0;

    // Put non-selected top5 back into the pool
    const remaining = [...rest];
    for (let i = 0; i < top5.length; i++) {
      if (i !== idx) remaining.push(top5[i]);
    }

    return { hero, remaining, heroConfidence };
  }

  // -------------------------------------------------------------------------
  // HomepageStrategy implementation
  // -------------------------------------------------------------------------

  buildLayout(
    pools: { trending: HomepageCandidate[]; latest: HomepageCandidate[]; popular: HomepageCandidate[] },
    context: HomepageEngineContext
  ): HomepageEngineResult {
    return HomepageContentEngine.buildLayout(pools, context);
  }

  // -------------------------------------------------------------------------
  // Public static: buildLayout
  // -------------------------------------------------------------------------

  public static buildLayout(
    pools: { trending: HomepageCandidate[]; latest: HomepageCandidate[]; popular: HomepageCandidate[] },
    context: HomepageEngineContext
  ): HomepageEngineResult {
    const clock = context.services?.clock ?? (() => performance.now());
    const noise = context.services?.noiseGenerator ?? fnv1aNoiseGenerator;
    const modifiers = [...(context.services?.rankingModifiers ?? [])].sort(
      (a, b) => a.priority - b.priority
    );
    const logger = context.services?.logger;
    const boosts = context.options?.personalizationBoosts ?? {};
    const { seed } = context;

    const timer = makeTimer(clock);
    const totalStart = clock();
    const timings: EngineTimings = {
      unionMs: 0, normalizeMs: 0, scoringMs: 0,
      heroMs: 0, sectionFillMs: 0, metricsMs: 0, totalMs: 0,
    };

    // -----------------------------------------------------------------------
    // Stage 1: Union with candidateSources tagging
    // -----------------------------------------------------------------------
    const { result: unionMap, ms: unionMs } = timer(() => {
      const map = new Map<string, HomepageCandidate>();
      const poolEntries = Object.entries(pools) as [string, HomepageCandidate[]][];
      for (const [poolName, pool] of poolEntries) {
        for (const c of pool) {
          if (map.has(c.id)) {
            // Merge sources — same manga in multiple pools
            map.get(c.id)!.candidateSources![poolName] = true;
          } else {
            const tagged: HomepageCandidate = {
              ...c,
              candidateSources: { [poolName]: true } as Record<string, true>,
            };
            map.set(c.id, tagged);
          }
        }
      }
      return map;
    });
    timings.unionMs = unionMs;

    const totalCandidates = Object.values(pools).reduce((s, p) => s + p.length, 0);
    const uniqueCandidates = Array.from(unionMap.values());
    logger?.(`[Engine] Union: ${totalCandidates} raw → ${uniqueCandidates.length} unique`);

    // -----------------------------------------------------------------------
    // Stage 2: Normalise (compute pool-level maxima for scoring)
    // Already implicit in scoreCandidates — we time the full scoring pass.
    // -----------------------------------------------------------------------

    // -----------------------------------------------------------------------
    // Stage 3: Score
    // -----------------------------------------------------------------------
    const { result: scoredCandidates, ms: scoringMs } = timer(() =>
      HomepageContentEngine.scoreCandidates(uniqueCandidates, seed, { noiseGenerator: noise, modifiers, personalizationBoosts: boosts })
    );
    timings.scoringMs = scoringMs;
    timings.normalizeMs = 0; // Merged into scoring stage

    // -----------------------------------------------------------------------
    // Stage 4: Hero selection
    // -----------------------------------------------------------------------
    const { result: heroResult, ms: heroMs } = timer(() =>
      HomepageContentEngine.selectHero(scoredCandidates, seed)
    );
    timings.heroMs = heroMs;

    const { hero, heroConfidence } = heroResult;

    // -----------------------------------------------------------------------
    // Stage 5: Section fill
    // -----------------------------------------------------------------------
    const { result: fillResult, ms: sectionFillMs } = timer(() => {
      const globalUsedIds = new Set<string>();
      if (hero) globalUsedIds.add(hero.manga.id);

      const providerCounts: Record<string, number> = {};
      const genreCounts: Record<string, number> = {};

      const registerSelected = (manga: HomepageCandidate) => {
        globalUsedIds.add(manga.id);
        manga.providers.forEach((p) => { providerCounts[p] = (providerCounts[p] ?? 0) + 1; });
        manga.genres.forEach((g) => { genreCounts[g.name] = (genreCounts[g.name] ?? 0) + 1; });
      };

      const sectionConfigs = [
        { id: "trending", title: "Trending Now", priority: 30 },
        { id: "latest",   title: "Latest Updates", priority: 40 },
        { id: "popular",  title: "Popular This Week", priority: 50 },
      ];

      const sections: HomepageSection[] = [];
      const poolExhaustion: Record<string, number> = {};

      for (const sec of sectionConfigs) {
        // Pool for this section = all scored candidates filtered to those originally in this pool
        const sectionPool = scoredCandidates.filter(
          (c) => c.candidateSources?.[sec.id] === true
        );
        const rawPoolSize = (pools as any)[sec.id]?.length ?? sectionPool.length;

        const { selected, poolUniqueCount } = buildSection(
          sec.id, sectionPool, 8, globalUsedIds, providerCounts,
          genreCounts, hero, modifiers, seed, noise, boosts
        );

        selected.forEach(registerSelected);
        poolExhaustion[sec.id] = rawPoolSize > 0
          ? Math.round((poolUniqueCount / rawPoolSize) * 100) / 100
          : 0;

        sections.push({
          type: "carousel" as const,
          id: sec.id,
          title: sec.title,
          priority: sec.priority,
          data: selected,
        });
      }

      return { sections, globalUsedIds, providerCounts, genreCounts, poolExhaustion };
    });
    timings.sectionFillMs = sectionFillMs;

    const { sections, globalUsedIds, providerCounts, genreCounts, poolExhaustion } = fillResult;

    // Add hero section at top
    if (hero) {
      sections.unshift({ type: "hero" as const, priority: 10, data: hero });
    }

    // -----------------------------------------------------------------------
    // Stage 6: Metrics + Rejections
    // -----------------------------------------------------------------------
    const { result: diagnostics, ms: metricsMs } = timer(() => {
      // Collect all selected card ids
      const selectedIds = new Set(globalUsedIds);
      if (hero) selectedIds.add(hero.manga.id);

      // Build rejection list
      const rejections: RejectionEntry[] = [];
      for (const c of uniqueCandidates) {
        if (!globalUsedIds.has(c.id)) {
          const reason: HardRejectionReason = "not_selected";
          rejections.push({
            id: c.id,
            title: c.title,
            reason,
            score: c.scoreBreakdown?.final,
            sources: c.candidateSources,
          });
        }
      }
      // Candidates that were in original pools but not in the union (cross-pool dupes)
      // are implicitly "duplicate" but we track uniqueCandidates so no separate loop needed.

      // Score stats for selected cards
      const selectedCandidates = scoredCandidates.filter((c) => globalUsedIds.has(c.id));
      const scores = selectedCandidates.map((c) => c.scoreBreakdown?.final ?? 0);
      const averageScore =
        scores.length > 0
          ? Math.round((scores.reduce((s, v) => s + v, 0) / scores.length) * 100) / 100
          : 0;

      // Provider & genre distribution
      const totalSelected = selectedCandidates.length;
      const providerDist: Record<string, number> = {};
      Object.entries(providerCounts).forEach(([p, cnt]) => {
        providerDist[p] = Math.round((cnt / Math.max(totalSelected, 1)) * 100) / 100;
      });

      const stats: EngineStats = {
        layoutVersion: HomepageEngineConfig.layoutVersion,
        totalCandidates,
        uniqueCandidates: uniqueCandidates.length,
        selected: totalSelected,
        rejected: rejections.length,
        duplicatePct: totalCandidates > 0
          ? Math.round(((totalCandidates - uniqueCandidates.length) / totalCandidates) * 10000) / 10000
          : 0,
        averageScore,
        medianScore: median(scores),
        heroConfidence,
        poolExhaustion,
        providerDistribution: providerDist,
        genreDistribution: { ...genreCounts },
      };

      return { stats, rejections };
    });
    timings.metricsMs = metricsMs;
    timings.totalMs = Math.round((clock() - totalStart) * 100) / 100;

    logger?.(
      `[Engine] Done in ${timings.totalMs}ms — ` +
      `${diagnostics.stats.selected} selected, ${diagnostics.stats.rejected} rejected`
    );

    const layout: HomepageLayout = { sections };

    const result: HomepageEngineResult = Object.freeze({
      layout,
      stats: Object.freeze(diagnostics.stats),
      timings: Object.freeze(timings),
      rejections: Object.freeze(diagnostics.rejections),
    });

    return result;
  }
}

// ---------------------------------------------------------------------------
// Internal: section fill with multi-pass constraint relaxation
// ---------------------------------------------------------------------------

function buildSection(
  sectionId: string,
  pool: HomepageCandidate[],
  slots: number,
  globalUsedIds: Set<string>,
  providerCounts: Record<string, number>,
  genreCounts: Record<string, number>,
  hero: HomepageHero | null,
  modifiers: RankingModifier[],
  seed: string,
  noise: NoiseGenerator,
  boosts: Record<string, number>
): { selected: HomepageCandidate[]; poolUniqueCount: number } {
  const selected: HomepageCandidate[] = [];
  const sectionSeenAuthors = new Set<string>();
  const sectionSeenGenres = new Set<string>();
  const sectionSeenFranchises = new Set<string>();
  const sectionSeenDemographics = new Set<string>();
  const sectionSeenStatuses = new Set<string>();

  const poolUniqueCount = pool.filter((c) => !globalUsedIds.has(c.id)).length;

  const levels: ConstraintLevel[] = ["STRICT", "BALANCED", "RELAXED", "UNCONSTRAINED"];

  for (let slot = 0; slot < slots; slot++) {
    let slotFilled = false;

    for (const level of levels) {
      let bestCandidate: HomepageCandidate | null = null;
      let bestScore = -Infinity;
      let bestBreakdown: ScoreBreakdown | null = null;

      const selCtx: EngineSelectionContext = {
        seed,
        section: sectionId,
        providerCounts: { ...providerCounts },
        selectedCards: selected,
        hero,
      };

      for (const candidate of pool) {
        // Hard constraint at ALL levels — globalUsedIds is never relaxed
        if (globalUsedIds.has(candidate.id)) continue;

        const penalties = calculatePenalties(
          candidate, level,
          sectionSeenAuthors, sectionSeenGenres, sectionSeenFranchises,
          sectionSeenDemographics, sectionSeenStatuses, providerCounts
        );

        const providerBoost = calculateProviderBoost(candidate.providers, providerCounts);

        const base = candidate.scoreBreakdown!;
        const totalPenalty =
          penalties.genre + penalties.author + penalties.provider +
          penalties.franchise + penalties.demographic + penalties.status;

        // Re-run modifiers with live selection context
        let modifierDelta = 0;
        const modifierTrace: ScoreBreakdown["modifierTrace"] = [];
        for (const mod of modifiers) {
          const mr = mod.apply(candidate, selCtx);
          modifierDelta += mr.delta;
          modifierTrace.push({ id: mod.id, delta: mr.delta, reason: mr.reason });
        }

        const finalScore =
          base.popularity * HOMEPAGE_RANKING_CONFIG.weights.popularity +
          base.freshness * HOMEPAGE_RANKING_CONFIG.weights.freshness +
          base.rating * HOMEPAGE_RANKING_CONFIG.weights.rating +
          base.noise +
          base.personalization +
          providerBoost +
          modifierDelta -
          totalPenalty;

        if (finalScore > bestScore) {
          bestScore = finalScore;
          bestCandidate = candidate;
          bestBreakdown = {
            ...base,
            providerBoost: Math.round(providerBoost * 100) / 100,
            modifierBoost: Math.round(modifierDelta * 100) / 100,
            modifierTrace,
            penalties: {
              genre: -Math.round(penalties.genre * 100) / 100,
              author: -Math.round(penalties.author * 100) / 100,
              provider: -Math.round(penalties.provider * 100) / 100,
              franchise: -Math.round(penalties.franchise * 100) / 100,
              demographic: -Math.round(penalties.demographic * 100) / 100,
              status: -Math.round(penalties.status * 100) / 100,
            },
            final: Math.round(finalScore * 100) / 100,
          };
        }
      }

      if (bestCandidate) {
        const picked = { ...bestCandidate, scoreBreakdown: bestBreakdown! };
        selected.push(picked);

        // Update section diversity tracking
        if (picked.demographic) sectionSeenDemographics.add(picked.demographic);
        if (picked.status) sectionSeenStatuses.add(picked.status);
        picked.authors.forEach((a) => sectionSeenAuthors.add(a.name));
        picked.genres.forEach((g) => sectionSeenGenres.add(g.name));
        sectionSeenFranchises.add(getFranchiseKey(picked.title));

        slotFilled = true;
        break;
      }
    }

    if (!slotFilled) break; // Pool exhausted
  }

  return { selected, poolUniqueCount };
}

// ---------------------------------------------------------------------------
// Internal: penalty calculation
// ---------------------------------------------------------------------------

function calculatePenalties(
  candidate: HomepageCandidate,
  level: ConstraintLevel,
  seenAuthors: Set<string>,
  seenGenres: Set<string>,
  seenFranchises: Set<string>,
  seenDemographics: Set<string>,
  seenStatuses: Set<string>,
  providerCounts: Record<string, number>
): ScoreBreakdown["penalties"] {
  const config = HOMEPAGE_RANKING_CONFIG.penalties;
  const scale =
    level === "BALANCED" ? 0.6 :
    level === "RELAXED"  ? 0.2 :
    level === "UNCONSTRAINED" ? 0.0 : 1.0;

  let genreOverlap = 0;
  candidate.genres.forEach((g) => { if (seenGenres.has(g.name)) genreOverlap++; });

  let authorOverlap = false;
  candidate.authors.forEach((a) => { if (seenAuthors.has(a.name)) authorOverlap = true; });

  let providerOverlapSum = 0;
  candidate.providers.forEach((p) => { providerOverlapSum += providerCounts[p] ?? 0; });
  const providerCount = candidate.providers.length || 1;

  const franchiseKey = getFranchiseKey(candidate.title);

  return {
    genre:       genreOverlap * config.genre * scale,
    author:      (authorOverlap ? config.author : 0) * scale,
    provider:    (providerOverlapSum / providerCount) * config.provider * scale,
    franchise:   (seenFranchises.has(franchiseKey) ? config.franchise : 0) * scale,
    demographic: (candidate.demographic && seenDemographics.has(candidate.demographic) ? config.demographic : 0) * scale,
    status:      (candidate.status && seenStatuses.has(candidate.status) ? config.status : 0) * scale,
  };
}

// ---------------------------------------------------------------------------
// Internal: dynamic provider boost
// ---------------------------------------------------------------------------

function calculateProviderBoost(providers: string[], providerCounts: Record<string, number>): number {
  if (!providers.length) return 0;
  const boostSum = providers.reduce((sum, p) => {
    const count = providerCounts[p] ?? 0;
    return sum + (1 / Math.sqrt(count + 1)) * 10;
  }, 0);
  return boostSum / providers.length;
}
