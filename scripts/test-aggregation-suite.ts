import "@/services/providers";
import {
  buildMangaFingerprint,
  evaluateMergeDecision,
  generateCanonicalId,
  computeFingerprintSimilarity,
} from "@/services/aggregation/entity-engine";
import { mergeMangaEntities } from "@/services/aggregation/merge-engine";
import { parseStructuredChapterKey, aggregateChapters } from "@/services/aggregation/chapter-aggregator";
import { computeEffectiveConfidence } from "@/services/aggregation/confidence-model";
import { rankChapterSources, computeSourceScore } from "@/services/aggregation/source-ranker";
import { computeAdaptiveHedgeDelay, fetchReaderPagesWithHedge } from "@/services/aggregation/reader-failover";
import { aggregator } from "@/services/aggregation/aggregator";
import { RawProviderManga, RawProviderChapter } from "@/services/providers/shared/types";

async function runAggregationSuite() {
  console.log("=================================================");
  console.log("🧪  Phase 19 — Multi-Provider Aggregation Certification Suite (13 Checks)");
  console.log("=================================================\n");

  let passedChecks = 0;

  // Check 1: Fingerprint & Title Normalization
  try {
    const raw: RawProviderManga = {
      id: "test1",
      title: "  Attack on Titan: Junior High! (Attack on Titan - Junior High)  ",
      authors: ["Isayama Hajime"],
    };
    const fp = buildMangaFingerprint(raw);
    if (fp.normalizedTitle.includes("attack on titan junior high") && fp.primaryAuthor === "isayama hajime") {
      console.log("  ✅ Check 1: Fingerprint & Title Normalization - PASSED");
      passedChecks++;
    } else {
      console.error("  ❌ Check 1 Failed: Normalized title:", fp.normalizedTitle);
    }
  } catch (e: any) {
    console.error("  ❌ Check 1 Failed:", e.message);
  }

  // Check 2: 3-Tier Match Thresholds
  try {
    const fpA = buildMangaFingerprint({ id: "a", title: "One Piece", authors: ["Oda Eiichiro"] });
    const fpB = buildMangaFingerprint({ id: "b", title: "One Piece (Official)", authors: ["Oda Eiichiro"] });
    const fpC = buildMangaFingerprint({ id: "c", title: "One Piece: Party", authors: ["Andou Ei"] });

    const decAB = evaluateMergeDecision(fpA, fpB);
    const decAC = evaluateMergeDecision(fpA, fpC);

    if (decAB === "AUTO_MERGE" && decAC === "SEPARATE_SERIES") {
      console.log("  ✅ Check 2: 3-Tier Match Thresholds - PASSED");
      passedChecks++;
    } else {
      console.error(`  ❌ Check 2 Failed: decAB=${decAB}, decAC=${decAC}`);
    }
  } catch (e: any) {
    console.error("  ❌ Check 2 Failed:", e.message);
  }

  // Check 3: Canonical ID Stability
  try {
    const id1 = generateCanonicalId("Naruto");
    const id2 = generateCanonicalId("Naruto");
    const id3 = generateCanonicalId("Bleach");
    if (id1 === id2 && id1 !== id3 && id1.length === 36) {
      console.log("  ✅ Check 3: Canonical ID Stability (UUIDv5) - PASSED");
      passedChecks++;
    } else {
      console.error("  ❌ Check 3 Failed: Unstable UUIDs");
    }
  } catch (e: any) {
    console.error("  ❌ Check 3 Failed:", e.message);
  }

  // Check 4: Field-Specific Merge Strategies
  try {
    const merged = mergeMangaEntities([
      { providerId: "mangadex", data: { id: "m1", title: "Naruto", description: "Short desc", coverImage: "http://cover1.jpg", genres: ["Action"] }, latencyMs: 300 },
      { providerId: "comick", data: { id: "c1", title: "Naruto", description: "Much longer detailed narrative synopsis of Naruto Uzumaki and Hidden Leaf Village", coverImage: "http://cover2.jpg", genres: ["Ninja"] }, latencyMs: 200 },
    ]);
    if (merged.canonical.description?.value.includes("Much longer detailed") && merged.canonical.genres.value.length === 2) {
      console.log("  ✅ Check 4: Field-Specific Merge Strategies - PASSED");
      passedChecks++;
    } else {
      console.error("  ❌ Check 4 Failed: Description or Genre merge error");
    }
  } catch (e: any) {
    console.error("  ❌ Check 4 Failed:", e.message);
  }

  // Check 5: Field Provenance & Trace ID Correlation
  try {
    const merged = mergeMangaEntities([
      { providerId: "mangadex", data: { id: "m1", title: "Bleach", coverImage: "http://b.jpg" } },
    ]);
    const traceId = merged.canonical.traceId;
    if (merged.canonical.title.traceId === traceId && merged.trace.traceId === traceId) {
      console.log("  ✅ Check 5: Field Provenance & Trace ID Correlation - PASSED");
      passedChecks++;
    } else {
      console.error("  ❌ Check 5 Failed: Mismatched trace IDs");
    }
  } catch (e: any) {
    console.error("  ❌ Check 5 Failed:", e.message);
  }

  // Check 6: Structured Chapter Parsing
  try {
    const k1 = parseStructuredChapterKey("Vol. 3 Ch. 10.1 (Special)");
    if (k1.volume === 3 && k1.chapter === 10.1 && k1.part === 1 && k1.isSpecial === true && k1.key === "v03_c0010_p01_s1") {
      console.log("  ✅ Check 6: Structured Chapter Key Parsing - PASSED");
      passedChecks++;
    } else {
      console.error("  ❌ Check 6 Failed: Structured key:", k1);
    }
  } catch (e: any) {
    console.error("  ❌ Check 6 Failed:", e.message);
  }

  // Check 7: Chapter Deduplication
  try {
    const chs = aggregateChapters("can_1", [
      { providerId: "mangadex", chapters: [{ id: "c1", number: 10, title: "Chapter 10", language: "en" }] },
      { providerId: "comick", chapters: [{ id: "c10", number: 10, title: "Ch.10.0", language: "en" }] },
    ]);
    if (chs.length === 1 && chs[0].sources.length === 2) {
      console.log("  ✅ Check 7: Cross-Provider Chapter Deduplication - PASSED");
      passedChecks++;
    } else {
      console.error("  ❌ Check 7 Failed: Chapter deduplication count:", chs.length);
    }
  } catch (e: any) {
    console.error("  ❌ Check 7 Failed:", e.message);
  }

  // Check 8: Volatility-Aware Confidence Scoring
  try {
    const stable = computeEffectiveConfidence("mangadex", { latencyP95Ms: 400, latencyStdDevMs: 20 });
    const volatile = computeEffectiveConfidence("mangadex", { latencyP95Ms: 400, latencyStdDevMs: 350 });
    if (stable > volatile) {
      console.log("  ✅ Check 8: Volatility-Aware Confidence Scoring - PASSED");
      passedChecks++;
    } else {
      console.error(`  ❌ Check 8 Failed: stable=${stable}, volatile=${volatile}`);
    }
  } catch (e: any) {
    console.error("  ❌ Check 8 Failed:", e.message);
  }

  // Check 9: Runtime Source Ranking
  try {
    const ranked = rankChapterSources([
      { providerId: "mangabuddy", providerChapterId: "1", sourceScore: 0, url: "" },
      { providerId: "mangadex", providerChapterId: "1", sourceScore: 0, url: "" },
    ]);
    if (ranked[0].providerId === "mangadex") {
      console.log("  ✅ Check 9: Runtime Observed Metric Source Ranking - PASSED");
      passedChecks++;
    } else {
      console.error("  ❌ Check 9 Failed: Unexpected top rank:", ranked[0].providerId);
    }
  } catch (e: any) {
    console.error("  ❌ Check 9 Failed:", e.message);
  }

  // Check 10: Adaptive Hedged Reader Failover
  try {
    const hedgeDelay = computeAdaptiveHedgeDelay("mangadex", 200, 600);
    if (hedgeDelay === 300) {
      console.log("  ✅ Check 10: Adaptive Reader Hedging Delay - PASSED");
      passedChecks++;
    } else {
      console.error("  ❌ Check 10 Failed: Unexpected hedge delay:", hedgeDelay);
    }
  } catch (e: any) {
    console.error("  ❌ Check 10 Failed:", e.message);
  }

  // Check 11: Cache Consistency
  try {
    const mockManga = mergeMangaEntities([
      { providerId: "mangadex", data: { id: "m1", title: "Solo Leveling" } },
    ]).canonical;
    if (mockManga.canonicalId && mockManga.aggregationVersion === "1.0") {
      console.log("  ✅ Check 11: Cache Consistency & Canonical Identity - PASSED");
      passedChecks++;
    } else {
      console.error("  ❌ Check 11 Failed: Cache entity invalid");
    }
  } catch (e: any) {
    console.error("  ❌ Check 11 Failed:", e.message);
  }

  // Check 12: Provider Ordering Stability
  try {
    const inputA: RawProviderManga = { id: "a", title: "One Piece", description: "Short" };
    const inputB: RawProviderManga = { id: "b", title: "One Piece", description: "Longer synopsis" };

    const fixedNow = "2026-07-22T00:00:00.000Z";
    const merged1 = mergeMangaEntities([
      { providerId: "mangadex", data: inputA },
      { providerId: "comick", data: inputB },
    ], { fixedNow });
    const merged2 = mergeMangaEntities([
      { providerId: "comick", data: inputB },
      { providerId: "mangadex", data: inputA },
    ], { fixedNow });

    if (merged1.canonical.canonicalId === merged2.canonical.canonicalId) {
      console.log("  ✅ Check 12: Provider Ordering Stability - PASSED");
      passedChecks++;
    } else {
      console.error("  ❌ Check 12 Failed: Output ID changed based on order");
    }
  } catch (e: any) {
    console.error("  ❌ Check 12 Failed:", e.message);
  }

  // Check 13: Determinism Under Repeated Execution (100 Iterations)
  try {
    let deterministic = true;
    const baseInput = [
      { providerId: "mangadex", data: { id: "m1", title: "Jujutsu Kaisen", genres: ["Action", "Supernatural"] } },
      { providerId: "comick", data: { id: "c1", title: "Jujutsu Kaisen", genres: ["Supernatural", "Shounen"] } },
    ];
    const fixedNow = "2026-07-22T00:00:00.000Z";

    const firstRun = JSON.stringify(mergeMangaEntities(baseInput, { fixedNow }).canonical);

    for (let i = 0; i < 100; i++) {
      const run = JSON.stringify(mergeMangaEntities(baseInput, { fixedNow }).canonical);
      if (run !== firstRun) {
        deterministic = false;
        break;
      }
    }

    if (deterministic) {
      console.log("  ✅ Check 13: Determinism Under Repeated Execution (100 Runs) - PASSED");
      passedChecks++;
    } else {
      console.error("  ❌ Check 13 Failed: Nondeterministic output detected across 100 runs");
    }
  } catch (e: any) {
    console.error("  ❌ Check 13 Failed:", e.message);
  }

  console.log("\n───────────────────────────────────────────────────────────────────────────");
  console.log(` Aggregation Results: ${passedChecks}/13 checks passed`);
  console.log("───────────────────────────────────────────────────────────────────────────\n");

  if (passedChecks === 13) {
    console.log("✅  All Phase 19 Aggregation Checks Passed Cleanly!");
    process.exit(0);
  } else {
    console.error("❌  Aggregation Suite Failed!");
    process.exit(1);
  }
}

runAggregationSuite().catch(console.error);
