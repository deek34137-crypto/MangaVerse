import assert from "node:assert";
import { normalizeChapter, sortChapters } from "../src/services/manga/chapter-normalizer";
import { isSnapshotStale, shouldTriggerRepair, executeSnapshotRepair } from "../src/services/manga/repair-worker";
import { trackReaderStateEnter, trackReaderStateExit } from "../src/lib/reader-telemetry";

console.log("▶ Running Operational Readiness & Performance Benchmarks...");

// 1. Chapter Decimal & Special Normalization
const chDecimal = normalizeChapter({ id: "c1", number: "122.5", title: "Chapter 122.5 - Extra" });
assert.strictEqual(chDecimal.number, 122.5);
assert.strictEqual(chDecimal.isDecimal, true);
console.log("  ✓ Decimal chapter 122.5 normalized correctly");

const chPrologue = normalizeChapter({ id: "c0", number: "0", title: "Prologue" });
assert.strictEqual(chPrologue.number, 0);
assert.strictEqual(chPrologue.isPrologue, true);
console.log("  ✓ Prologue normalized to 0");

const sorted = sortChapters([
  { id: "c1", number: 1 },
  { id: "c2", number: 2 },
  { id: "c1_5", number: 1.5 },
]);
assert.strictEqual(sorted[0].number, 2);
assert.strictEqual(sorted[1].number, 1.5);
assert.strictEqual(sorted[2].number, 1);
console.log("  ✓ Decimal chapters sorted cleanly in descending order");

// 2. Snapshot Freshness & Repair Worker
const freshSnapshot: any = { builtAt: new Date().toISOString(), chapterCount: 10, manga: { coverImage: "/c.jpg" } };
const staleSnapshot: any = { builtAt: new Date(Date.now() - 25 * 60 * 60 * 1000).toISOString(), chapterCount: 10, manga: { coverImage: "/c.jpg" } };

assert.strictEqual(isSnapshotStale(freshSnapshot), false);
assert.strictEqual(isSnapshotStale(staleSnapshot), true);
assert.strictEqual(shouldTriggerRepair(staleSnapshot).reason, "STALE_SNAPSHOT");
console.log("  ✓ Snapshot freshness (24h TTL) and repair trigger verified");

// 3. Reader Telemetry Transitions
trackReaderStateEnter("manga1", "ch1", "LOADING_METADATA");
const duration = trackReaderStateExit("manga1", "ch1", "LOADING_METADATA", "RESOLVING_PROVIDER", { provider: "mangadex" });
assert.ok(typeof duration === "number");
console.log("  ✓ Reader state machine transition telemetry verified");

// 4. Async Snapshot Repair Execution Benchmark
async function runRepairBenchmark() {
  const t0 = performance.now();
  const repaired = await executeSnapshotRepair("manga-bench", "MISSING_CHAPTERS");
  const elapsed = performance.now() - t0;

  assert.ok(repaired != null);
  assert.ok(elapsed < 500, `Repair duration ${elapsed}ms exceeded target SLO (<500ms)`);
  console.log(`  ✓ Snapshot repair benchmark completed in ${elapsed.toFixed(1)}ms (<500ms target SLO)`);
}

runRepairBenchmark().then(() => {
  console.log("✅ All Operational Readiness & Performance Benchmark tests passed successfully!");
});
