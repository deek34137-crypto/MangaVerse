import { ConfidenceScorer, calculateSimilarity } from "../src/services/manga/deduplication";
import { chapterMerger } from "../src/services/manga/chapter-merger";
import { eventBus } from "../src/services/infrastructure/event-bus";
import type { RawProviderChapter } from "../src/services/providers/shared/types";

async function runPhase4Verification() {
  console.log("==========================================");
  console.log("VERIFYING PHASE 4: CANONICAL ENGINE & MERGE");
  console.log("==========================================");

  // 1. Test Title & Confidence Scorer
  console.log("\n[1/2] Testing Title Similarity & Confidence Scorer...");
  const simExact = calculateSimilarity("One Piece", "One Piece");
  const simAlt = calculateSimilarity("Attack on Titan", "Shingeki no Kyojin");
  const simClose = calculateSimilarity("Solo Leveling", "Solo Leveling (Digital)");

  console.log(`Exact Match Similarity ("One Piece"): ${simExact}`);
  console.log(`Close Match Similarity ("Solo Leveling"): ${simClose}`);

  if (simExact !== 1.0) throw new Error("Exact title similarity calculation failed");
  if (simClose < 0.7) throw new Error("Close title similarity calculation failed");

  // 2. Test ChapterMerger & Mirror Provenance
  console.log("\n[2/2] Testing ChapterMerger & Mirror Provenance...");
  let mergeEventsCount = 0;
  eventBus.on("chapter:merged", (evt) => {
    mergeEventsCount++;
  });

  const providerChapterMap = new Map<string, RawProviderChapter[]>();

  providerChapterMap.set("comick", [
    { id: "cmk-ch-1", number: 1, title: "Romance Dawn", language: "en" },
    { id: "cmk-ch-2", number: 2, title: "Luffy", language: "en" },
  ]);

  providerChapterMap.set("mangadex", [
    { id: "mdx-ch-1", number: 1, title: "Romance Dawn", language: "en" },
    { id: "mdx-ch-3", number: 3, title: "Zoro", language: "en" },
  ]);

  const mergedTimeline = chapterMerger.mergeChapterLists("manga_one_piece_123", providerChapterMap);
  console.log("Merged Canonical Chapter Timeline:", JSON.stringify(mergedTimeline, null, 2));

  if (mergedTimeline.length !== 3) {
    throw new Error(`Expected 3 unique chapters in timeline, got ${mergedTimeline.length}`);
  }

  const ch1 = mergedTimeline.find((c) => c.chapterNumber === 1);
  if (!ch1 || ch1.alternativeSources.length !== 1) {
    throw new Error("Chapter 1 mirror provenance assignment failed");
  }

  if (mergeEventsCount !== 3) {
    throw new Error(`Expected 3 chapter:merged telemetry events, got ${mergeEventsCount}`);
  }

  console.log("\n✅ PHASE 4 CANONICAL ENGINE & MERGING VERIFICATION PASSED!");
}

runPhase4Verification().catch((err) => {
  console.error("\n❌ PHASE 4 VERIFICATION FAILED:", err);
  process.exit(1);
});
