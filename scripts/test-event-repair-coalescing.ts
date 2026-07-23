import { snapshotStorage } from "../src/services/aggregation/snapshot-engine";
import { loadReaderPage } from "../src/services/ui/loaders/reader.loader";
import { CanonicalChapter } from "../src/services/aggregation/types";

async function runRecoveryAndCoalescingTests() {
  console.log("=====================================================");
  console.log(" 🧪 Test Suite 1 — Reverse Lookup & 4-Tier Recovery");
  console.log("=====================================================\n");

  const testMangaId = "manga_naruto_test";
  const testChapterId = "cch_naruto_101";

  const mockChapters: CanonicalChapter[] = [
    {
      id: testChapterId,
      canonicalChapterId: testChapterId,
      aggregationVersion: "1.0",
      canonicalMangaId: testMangaId,
      chapterNumber: 101,
      key: { chapter: 101, key: "v00_c0101_p00_m0" },
      title: "Chapter 101 — Naruto Shippuden",
      sources: [
        {
          providerId: "mangatown",
          providerChapterId: "naruto/c101",
          sourceScore: 0.95,
          url: "https://www.mangatown.com/manga/naruto/c101/",
        },
      ],
      providerIds: ["mangatown"],
      updatedAt: new Date().toISOString(),
      lastValidated: new Date().toISOString(),
      traceId: "trace_ch_test101",
    },
  ];

  // 1. Save snapshot to populate chapters and reverse lookup index
  console.log("1. Saving chapters snapshot for reverse indexing...");
  await snapshotStorage.saveChaptersSnapshot(testMangaId, mockChapters);

  // 2. Test reverse lookup directly
  console.log("2. Testing getChapterLookup reverse index...");
  const lookup = await snapshotStorage.getChapterLookup(testChapterId);
  if (!lookup || lookup.canonicalMangaId !== testMangaId) {
    throw new Error(`Reverse lookup failed: expected ${testMangaId}, got ${lookup?.canonicalMangaId}`);
  }
  console.log(`   ✅ Reverse lookup succeeded: canonicalMangaId=${lookup.canonicalMangaId}, fingerprints=${lookup.providerFingerprints.length}`);

  // 3. Test Tier 2 Recovery in loadReaderPage when canonicalId is missing ("manga_default")
  console.log("3. Testing loadReaderPage with missing canonicalId ('manga_default')...");
  const result = await loadReaderPage("manga_default", testChapterId);

  if (result.type === "ERROR") {
    throw new Error(`loadReaderPage Tier-2 recovery failed: ${result.errorMessage}`);
  }

  console.log(`   ✅ Tier 2 Recovery succeeded! Rendered title="${result.chapterTitle}", winningProvider="${result.telemetry?.winningProviderId}"`);
  console.log(`   Telemetry: recoveryTier=${result.telemetry?.recoveryTierUsed}, recovered=${result.telemetry?.recovered}`);

  if (result.telemetry?.recoveryTierUsed !== "TIER_2_REVERSE_LOOKUP") {
    throw new Error(`Expected recoveryTier TIER_2_REVERSE_LOOKUP, got ${result.telemetry?.recoveryTierUsed}`);
  }

  console.log("\n🎉 Recovery & Coalescing Test Suite Passed 100%!");
  process.exit(0);
}

runRecoveryAndCoalescingTests().catch((err) => {
  console.error("❌ Test failed:", err);
  process.exit(1);
});
