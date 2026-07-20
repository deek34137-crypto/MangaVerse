import {
  HomepageContentEngine,
  getNoiseScore,
  getFranchiseKey,
  fnv1aNoiseGenerator,
} from "../src/utils/homepage-content-engine";
import type {
  HomepageCandidate,
  NoiseGenerator,
  RankingModifier,
  HomepageEngineContext,
  HomepageStrategy,
  ModifierResult,
} from "../src/types/homepage-engine";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function createCandidate(overrides: Partial<HomepageCandidate> = {}): HomepageCandidate {
  return {
    id: `manga-${Math.random().toString(36).slice(2)}`,
    title: "Generic Title",
    altTitles: [],
    description: "Description",
    coverImage: "https://example.com/cover.jpg",
    status: "ongoing",
    type: "manga",
    genres: [],
    tags: [],
    authors: [],
    artists: [],
    demographic: "shounen",
    rating: 8.0,
    ratingCount: 100,
    followCount: 500,
    viewCount: 1000,
    chapterCount: 50,
    volumeCount: 5,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    providers: ["mangadex"],
    ...overrides,
  };
}

function makeContext(overrides: Partial<HomepageEngineContext> = {}): HomepageEngineContext {
  return { seed: "2026-07-19", ...overrides };
}

function makePool(count: number, overrides: Partial<HomepageCandidate> = {}): HomepageCandidate[] {
  return Array.from({ length: count }, (_, i) =>
    createCandidate({ id: `m-${i}`, title: `Title ${i}`, followCount: (count - i) * 100, rating: 9 - i * 0.1, ...overrides })
  );
}

// ---------------------------------------------------------------------------
// Test runner
// ---------------------------------------------------------------------------

let passed = 0;
let failed = 0;

function assert(label: string, condition: boolean, details?: string) {
  if (condition) {
    console.log(`  ✅ [PASS] ${label}`);
    passed++;
  } else {
    console.error(`  ❌ [FAIL] ${label}${details ? ` — ${details}` : ""}`);
    failed++;
  }
}

// ---------------------------------------------------------------------------
// Suite 1: FNV-1a noise utility
// ---------------------------------------------------------------------------
console.log("\n── Suite 1: FNV-1a Noise ──");
{
  const n1 = getNoiseScore("2026-07-19", "id-A");
  const n2 = getNoiseScore("2026-07-19", "id-A");
  const n3 = getNoiseScore("2026-07-19", "id-B");
  assert("Deterministic: same inputs → same output", n1 === n2);
  assert("Different IDs → different values", n1 !== n3);
  assert("Bounded [0, 100]", n1 >= 0 && n1 <= 100);
}

// ---------------------------------------------------------------------------
// Suite 2: Franchise key
// ---------------------------------------------------------------------------
console.log("\n── Suite 2: Franchise Key ──");
{
  assert("Strips subtitle (colon)", getFranchiseKey("Chainsaw Man: Buddy Stories") === "chainsaw man");
  assert("Strips dash suffix", getFranchiseKey("Chainsaw Man - Part 2") === "chainsaw man");
  assert("Two-word stem", getFranchiseKey("Chainsaw Man") === "chainsaw man");
  assert("Distinct franchise differs", getFranchiseKey("Jujutsu Kaisen 0") === "jujutsu kaisen");
}

// ---------------------------------------------------------------------------
// Suite 3: Scoring
// ---------------------------------------------------------------------------
console.log("\n── Suite 3: Scoring ──");
{
  const candidates = [
    createCandidate({ id: "low",  followCount: 10,   rating: 5 }),
    createCandidate({ id: "high", followCount: 1000, rating: 10 }),
  ];
  const scored = HomepageContentEngine.scoreCandidates(candidates, "2026-07-19");
  assert("Returns same count", scored.length === 2);
  assert("ScoreBreakdown attached", !!scored[0].scoreBreakdown);
  assert("High follower → popularity 100", scored.find(s => s.id === "high")?.scoreBreakdown?.popularity === 100);
  assert("High rating → rating 100", scored.find(s => s.id === "high")?.scoreBreakdown?.rating === 100);
  assert("modifierTrace is array", Array.isArray(scored[0].scoreBreakdown?.modifierTrace));
}

// ---------------------------------------------------------------------------
// Suite 4: Hero selection
// ---------------------------------------------------------------------------
console.log("\n── Suite 4: Hero Selection ──");
{
  const candidates = HomepageContentEngine.scoreCandidates(
    makePool(6).map((c, i) => ({ ...c, id: `h-${i}` })),
    "2026-07-19"
  );
  const { hero, remaining, heroConfidence } = HomepageContentEngine.selectHero(candidates, "2026-07-19");
  assert("Hero selected", !!hero);
  assert("Hero from Top 5 (not lowest)", !["h-5"].includes(hero!.manga.id));
  assert("Remaining has 5 candidates", remaining.length === 5);
  assert("heroConfidence is a number", typeof heroConfidence === "number");
  assert("heroConfidence > 0", heroConfidence > 0);
}

// ---------------------------------------------------------------------------
// Suite 5: Layout — global deduplication
// ---------------------------------------------------------------------------
console.log("\n── Suite 5: Layout & Deduplication ──");
{
  const pool = makePool(12);
  const layout = HomepageContentEngine.buildLayout(
    { trending: pool, latest: pool, popular: pool },
    makeContext()
  );

  assert("Layout returned", !!layout);
  assert("Hero section first", layout.layout.sections[0].type === "hero");

  const carousels = layout.layout.sections.filter(s => s.type === "carousel");
  assert("3 carousel sections", carousels.length === 3);

  const heroId = (layout.layout.sections[0].data as any).manga.id;
  const tIds = (carousels.find(s => (s as any).id === "trending")?.data as any[]).map(m => m.id);
  const lIds = (carousels.find(s => (s as any).id === "latest")?.data as any[]).map(m => m.id);
  const pIds = (carousels.find(s => (s as any).id === "popular")?.data as any[]).map(m => m.id);

  assert("Hero not in Trending", !tIds.includes(heroId));
  assert("Trending not in Latest", lIds.every(id => !tIds.includes(id)));
  assert("Latest not in Popular", pIds.every(id => !lIds.includes(id)));
}

// ---------------------------------------------------------------------------
// Suite 6: CandidateSources as Record<string, true>
// ---------------------------------------------------------------------------
console.log("\n── Suite 6: Candidate Provenance ──");
{
  const sharedId = "shared-manga";
  const shared = createCandidate({ id: sharedId, title: "Shared Title", followCount: 999, rating: 9.9 });
  const trending = [shared, ...makePool(5).map((c, i) => ({ ...c, id: `t-only-${i}` }))];
  const latest   = [shared, ...makePool(5).map((c, i) => ({ ...c, id: `l-only-${i}` }))];
  const popular  = makePool(6).map((c, i) => ({ ...c, id: `p-only-${i}` }));

  const result = HomepageContentEngine.buildLayout(
    { trending, latest, popular },
    makeContext()
  );

  // Find the shared candidate in the rejections or sections
  const allCards: any[] = result.layout.sections.flatMap(s =>
    s.type === "carousel" ? (s.data as any[]) :
    s.type === "hero" ? [(s.data as any).manga] : []
  );

  const foundShared = allCards.find(c => c.id === sharedId);
  if (foundShared) {
    assert("candidateSources is a Record (not array)", typeof foundShared.candidateSources === "object" && !Array.isArray(foundShared.candidateSources));
    assert("candidateSources.trending is true", foundShared.candidateSources?.trending === true);
    assert("candidateSources.latest is true", foundShared.candidateSources?.latest === true);
    assert("candidateSources.popular is undefined/false (not in pool)", !foundShared.candidateSources?.popular);
  } else {
    // Shared was a rejection — check rejections
    const rejectedShared = result.rejections.find(r => r.id === sharedId);
    assert("Shared candidate has sources in rejection", !!rejectedShared?.sources);
    assert("candidateSources.trending is true in rejection", rejectedShared?.sources?.trending === true);
    assert("candidateSources.latest is true in rejection", rejectedShared?.sources?.latest === true);
  }
}

// ---------------------------------------------------------------------------
// Suite 7: NoiseGenerator interface — custom implementation
// ---------------------------------------------------------------------------
console.log("\n── Suite 7: NoiseGenerator Interface ──");
{
  let computeCalled = false;
  let lastCandidate: HomepageCandidate | null = null;

  const customNoise: NoiseGenerator = {
    compute(seed, candidate) {
      computeCalled = true;
      lastCandidate = candidate as HomepageCandidate;
      return 50; // Constant noise
    },
  };

  HomepageContentEngine.scoreCandidates(
    [createCandidate({ id: "noise-test" })],
    "2026-07-19",
    { noiseGenerator: customNoise }
  );

  assert("Custom NoiseGenerator.compute() was called", computeCalled);
  assert("compute() receives full candidate object", lastCandidate !== null && "id" in lastCandidate!);
}

// ---------------------------------------------------------------------------
// Suite 8: RankingModifier — priority order and ModifierResult
// ---------------------------------------------------------------------------
console.log("\n── Suite 8: RankingModifier ──");
{
  const executionOrder: string[] = [];

  const modA: RankingModifier = {
    id: "mod-a", priority: 20,
    apply: () => { executionOrder.push("mod-a"); return { delta: 5, reason: "boost-a" }; },
  };
  const modB: RankingModifier = {
    id: "mod-b", priority: 10,
    apply: () => { executionOrder.push("mod-b"); return { delta: -2, reason: "penalty-b" }; },
  };
  const modC: RankingModifier = {
    id: "mod-c", priority: 30,
    apply: () => { executionOrder.push("mod-c"); return { delta: 0, reason: "noop" }; },
  };

  const scored = HomepageContentEngine.scoreCandidates(
    [createCandidate({ id: "mod-test" })],
    "test",
    { modifiers: [modA, modC, modB] }
  );

  assert("Modifiers run in priority order (10→20→30)", executionOrder.join(",") === "mod-b,mod-a,mod-c");

  const trace = scored[0].scoreBreakdown?.modifierTrace ?? [];
  assert("modifierTrace has 3 entries", trace.length === 3);
  assert("modifierTrace records reason strings", trace.every(t => typeof t.reason === "string"));
  assert("modifierBoost is sum of deltas", scored[0].scoreBreakdown?.modifierBoost === 3); // 5 - 2 + 0
}

// ---------------------------------------------------------------------------
// Suite 9: RankingModifier — high boost promotes title
// ---------------------------------------------------------------------------
console.log("\n── Suite 9: Modifier Promotion ──");
{
  const targetId = "promo-target";
  const targetPool = [
    createCandidate({ id: targetId, title: "Promoted Title", followCount: 1, rating: 1 }),
    ...makePool(10).map((c, i) => ({ ...c, id: `bg-${i}` })),
  ];

  const promoteModifier: RankingModifier = {
    id: "editorial-boost", priority: 10,
    apply(candidate) {
      return candidate.id === targetId
        ? { delta: 9999, reason: "editorial" }
        : { delta: 0, reason: "none" };
    },
  };

  const result = HomepageContentEngine.buildLayout(
    { trending: targetPool, latest: makePool(8), popular: makePool(8) },
    makeContext({ services: { rankingModifiers: [promoteModifier] } })
  );

  const heroId = (result.layout.sections[0].data as any)?.manga?.id;
  assert("High-boost modifier promotes target to hero", heroId === targetId);
}

// ---------------------------------------------------------------------------
// Suite 10: Timing injection and EngineTimings structure
// ---------------------------------------------------------------------------
console.log("\n── Suite 10: Timing Injection ──");
{
  let tick = 0;
  const fakeClock = () => tick++ * 10; // Each call advances by 10 units

  const result = HomepageContentEngine.buildLayout(
    { trending: makePool(10), latest: makePool(10), popular: makePool(10) },
    makeContext({ services: { clock: fakeClock } })
  );

  const t = result.timings;
  assert("unionMs present", typeof t.unionMs === "number");
  assert("scoringMs present", typeof t.scoringMs === "number");
  assert("heroMs present", typeof t.heroMs === "number");
  assert("sectionFillMs present", typeof t.sectionFillMs === "number");
  assert("metricsMs present", typeof t.metricsMs === "number");
  assert("totalMs present", typeof t.totalMs === "number");
}

// ---------------------------------------------------------------------------
// Suite 11: Hero confidence
// ---------------------------------------------------------------------------
console.log("\n── Suite 11: Hero Confidence ──");
{
  const result = HomepageContentEngine.buildLayout(
    { trending: makePool(10), latest: makePool(6), popular: makePool(6) },
    makeContext()
  );
  assert("heroConfidence is a number", typeof result.stats.heroConfidence === "number");
  assert("heroConfidence > 0", result.stats.heroConfidence > 0);
}

// ---------------------------------------------------------------------------
// Suite 12: Pool exhaustion
// ---------------------------------------------------------------------------
console.log("\n── Suite 12: Pool Exhaustion ──");
{
  const result = HomepageContentEngine.buildLayout(
    { trending: makePool(10), latest: makePool(10), popular: makePool(10) },
    makeContext()
  );
  const pe = result.stats.poolExhaustion;
  assert("poolExhaustion has all sections", ["trending", "latest", "popular"].every(k => k in pe));
  assert("poolExhaustion values between 0 and 1", Object.values(pe).every(v => v >= 0 && v <= 1));
}

// ---------------------------------------------------------------------------
// Suite 13: Rejections — only hard reasons
// ---------------------------------------------------------------------------
console.log("\n── Suite 13: Rejections ──");
{
  const pool = makePool(12);
  const result = HomepageContentEngine.buildLayout(
    { trending: pool, latest: pool, popular: pool },
    makeContext()
  );

  const validReasons = new Set(["duplicate", "pool_exhausted", "not_selected"]);
  assert(
    "All rejections have valid hard reasons",
    result.rejections.every(r => validReasons.has(r.reason))
  );
  assert(
    "No soft penalty reasons in rejections",
    !result.rejections.some(r => (r.reason as string).includes("author") || (r.reason as string).includes("genre"))
  );
  assert("rejected count matches rejections array", result.stats.rejected === result.rejections.length);
}

// ---------------------------------------------------------------------------
// Suite 14: Immutability — result is frozen
// ---------------------------------------------------------------------------
console.log("\n── Suite 14: Immutability ──");
{
  const result = HomepageContentEngine.buildLayout(
    { trending: makePool(10), latest: makePool(6), popular: makePool(6) },
    makeContext()
  );

  assert("result is frozen", Object.isFrozen(result));
  assert("result.stats is frozen", Object.isFrozen(result.stats));
  assert("result.timings is frozen", Object.isFrozen(result.timings));
  assert("result.rejections is frozen", Object.isFrozen(result.rejections));
}

// ---------------------------------------------------------------------------
// Suite 15: HomepageStrategy interface compliance
// ---------------------------------------------------------------------------
console.log("\n── Suite 15: HomepageStrategy Contract ──");
{
  const engine = new HomepageContentEngine();
  const result = engine.buildLayout(
    { trending: makePool(8), latest: makePool(8), popular: makePool(8) },
    makeContext()
  );
  assert("Instance satisfies HomepageStrategy interface", !!result.layout && !!result.stats && !!result.timings);
  assert("Layout has sections array", Array.isArray(result.layout.sections));
}

// ---------------------------------------------------------------------------
// Summary
// ---------------------------------------------------------------------------
console.log(`\n=== Engine Test Results: ${passed} passed, ${failed} failed ===`);
if (failed > 0) process.exit(1);
