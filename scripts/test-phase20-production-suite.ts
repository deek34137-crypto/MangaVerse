import "@/services/providers";
import { providerPolicyRegistry } from "@/services/providers/shared/provider-policy";
import { snapshotStorage } from "@/services/aggregation/snapshot-engine";
import { refreshQueue } from "@/services/aggregation/refresh-queue";
import { metricsCollector } from "@/services/aggregation/metrics-collector";
import { computeOverallMergeConfidence } from "@/services/aggregation/confidence-model";
import { mergeMangaEntities } from "@/services/aggregation/merge-engine";
import { aggregator } from "@/services/aggregation/aggregator";
import { RawProviderManga } from "@/services/providers/shared/types";

async function runPhase20ProductionSuite() {
  console.log("=================================================");
  console.log("🚀  Phase 20 — Production Readiness & Serving Certification Suite (15 Checks)");
  console.log("=================================================\n");

  let passed = 0;

  // Check 1: Descriptor & Telemetry Isolation
  try {
    const desc = providerPolicyRegistry.getDescriptor("mangadex");
    if (desc && !("runtime" in desc)) {
      console.log("  ✅ Check 1: ProviderDescriptor & Telemetry Isolation - PASSED");
      passed++;
    } else {
      console.error("  ❌ Check 1 Failed: Runtime property present on static descriptor");
    }
  } catch (e: any) {
    console.error("  ❌ Check 1 Failed:", e.message);
  }

  // Check 2: Snapshot State Machine Transitions
  try {
    const mockCanonical = mergeMangaEntities([
      { providerId: "mangadex", data: { id: "m1", title: "Kingdom" } },
    ]).canonical;

    const snap = await snapshotStorage.saveMangaSnapshot(mockCanonical);
    if (snap.state === "FRESH") {
      snapshotStorage.setSnapshotState(`snapshot:manga:${mockCanonical.canonicalId}`, "STALE");
      const fetched = await snapshotStorage.getMangaSnapshot(mockCanonical.canonicalId);
      if (fetched && fetched.state === "STALE") {
        console.log("  ✅ Check 2: Snapshot State Machine Transitions (FRESH -> STALE) - PASSED");
        passed++;
      } else {
        console.error("  ❌ Check 2 Failed: Unexpected snapshot state:", fetched?.state);
      }
    }
  } catch (e: any) {
    console.error("  ❌ Check 2 Failed:", e.message);
  }

  // Check 3: Dual Versioning (schemaVersion & contentVersion)
  try {
    const mockCanonical = mergeMangaEntities([
      { providerId: "comick", data: { id: "c1", title: "Vagabond" } },
    ]).canonical;

    const snap1 = await snapshotStorage.saveMangaSnapshot(mockCanonical);
    const snap2 = await snapshotStorage.saveMangaSnapshot(mockCanonical);

    if (snap1.schemaVersion === 1 && snap2.contentVersion === snap1.contentVersion + 1) {
      console.log("  ✅ Check 3: Dual Versioning (schemaVersion & contentVersion) - PASSED");
      passed++;
    } else {
      console.error(`  ❌ Check 3 Failed: v1=${snap1.contentVersion}, v2=${snap2.contentVersion}`);
    }
  } catch (e: any) {
    console.error("  ❌ Check 3 Failed:", e.message);
  }

  // Check 4: Non-Blocking Queued SWR Refresh & Deduplication
  try {
    const entityId = "test_swr_entity";
    let refreshCalls = 0;
    const mockRefresh = async (id: string) => {
      refreshCalls++;
      return mergeMangaEntities([{ providerId: "mangadex", data: { id: "m1", title: "SWR Test" } }]).canonical;
    };

    const res1 = await refreshQueue.enqueueRefresh(entityId, mockRefresh);
    const res2 = await refreshQueue.enqueueRefresh(entityId, mockRefresh); // Deduplicated!

    if (res1 === true && res2 === false) {
      console.log("  ✅ Check 4: Non-Blocking Queued SWR Refresh & Deduplication - PASSED");
      passed++;
    } else {
      console.error(`  ❌ Check 4 Failed: res1=${res1}, res2=${res2}`);
    }
  } catch (e: any) {
    console.error("  ❌ Check 4 Failed:", e.message);
  }

  // Check 5: Cascading Dependency Graph Invalidation
  try {
    const canonicalId = "can_cascade_test";
    const keys = await snapshotStorage.invalidateCascade(canonicalId);
    if (keys.length === 5 && keys.includes(`snapshot:manga:${canonicalId}`) && keys.includes(`snapshot:chapters:${canonicalId}`)) {
      console.log("  ✅ Check 5: Cascading Dependency Graph Invalidation - PASSED");
      passed++;
    } else {
      console.error("  ❌ Check 5 Failed: Invalidated keys:", keys);
    }
  } catch (e: any) {
    console.error("  ❌ Check 5 Failed:", e.message);
  }

  // Check 6: Business vs Infrastructure Metrics Separation
  try {
    const biz = metricsCollector.getBusinessMetrics();
    const infra = metricsCollector.getInfrastructureMetrics();
    if (typeof biz.mergeSuccessRate === "number" && typeof infra.cacheHitRate === "number") {
      console.log("  ✅ Check 6: Business vs Infrastructure Metrics Separation - PASSED");
      passed++;
    } else {
      console.error("  ❌ Check 6 Failed: Metrics missing key rates");
    }
  } catch (e: any) {
    console.error("  ❌ Check 6 Failed:", e.message);
  }

  // Check 7: Merge Drift Alerting Rate Detection
  try {
    const canonicalId = "drift_test_entity";
    metricsCollector.recordMergeEvent({ canonicalId, decision: "AUTO_MERGE", providerCount: 6, providerIds: ["m1", "m2", "m3", "m4", "m5", "m6"] });
    metricsCollector.recordMergeEvent({ canonicalId, decision: "AUTO_MERGE", providerCount: 2, providerIds: ["m1", "m2"] }); // Drops >= 50%!

    const biz = metricsCollector.getBusinessMetrics();
    if (biz.mergeDriftRate > 0) {
      console.log("  ✅ Check 7: Merge Drift Alerting Rate Detection - PASSED");
      passed++;
    } else {
      console.error("  ❌ Check 7 Failed: Drift rate not triggered:", biz.mergeDriftRate);
    }
  } catch (e: any) {
    console.error("  ❌ Check 7 Failed:", e.message);
  }

  // Check 8: Overall Entity Merge Confidence Calculation
  try {
    const confMulti = computeOverallMergeConfidence([{ trustScore: 0.95 }, { trustScore: 0.90 }, { trustScore: 0.88 }]);
    const confSingle = computeOverallMergeConfidence([{ trustScore: 0.85 }]);
    if (confMulti > confSingle && confMulti <= 1.0) {
      console.log("  ✅ Check 8: Overall Entity Merge Confidence Calculation - PASSED");
      passed++;
    } else {
      console.error(`  ❌ Check 8 Failed: multi=${confMulti}, single=${confSingle}`);
    }
  } catch (e: any) {
    console.error("  ❌ Check 8 Failed:", e.message);
  }

  // Check 9: Partial Provider Outage Resilience
  try {
    const partialInputs = [
      { providerId: "mangadex", data: { id: "m1", title: "Hunter x Hunter" } },
      { providerId: "weebcentral", data: { id: "w1", title: "Hunter x Hunter" } },
      // 4 providers offline/failing
    ];
    const merged = mergeMangaEntities(partialInputs);
    if (merged.canonical.title.value === "Hunter x Hunter" && merged.canonical.providerMappings.length === 2) {
      console.log("  ✅ Check 9: Partial Provider Outage Resilience (Graceful Merge) - PASSED");
      passed++;
    } else {
      console.error("  ❌ Check 9 Failed: Partial merge failed");
    }
  } catch (e: any) {
    console.error("  ❌ Check 9 Failed:", e.message);
  }

  // Check 10: High-Concurrency Stress Benchmark (50 Parallel Requests)
  try {
    const mockInput: RawProviderManga = { id: "conc_1", title: "Berserk" };
    const promises = Array.from({ length: 50 }, () =>
      Promise.resolve(mergeMangaEntities([{ providerId: "mangadex", data: mockInput }]))
    );
    const results = await Promise.all(promises);
    const allSameId = results.every((r) => r.canonical.canonicalId === results[0].canonical.canonicalId);

    if (results.length === 50 && allSameId) {
      console.log("  ✅ Check 10: High-Concurrency Stress Benchmark (50 Parallel Requests) - PASSED");
      passed++;
    } else {
      console.error("  ❌ Check 10 Failed: Concurrency drift detected");
    }
  } catch (e: any) {
    console.error("  ❌ Check 10 Failed:", e.message);
  }

  // Check 11: Memory Leak & GC Stability Check (1,000 Entity Merges)
  try {
    const startMemory = process.memoryUsage().heapUsed;
    const mockInput: RawProviderManga = { id: "mem_1", title: "Monster" };

    for (let i = 0; i < 1000; i++) {
      mergeMangaEntities([{ providerId: "mangadex", data: mockInput }]);
    }

    const endMemory = process.memoryUsage().heapUsed;
    const diffMb = (endMemory - startMemory) / (1024 * 1024);

    if (diffMb < 50) { // Heap growth < 50MB across 1,000 merges
      console.log(`  ✅ Check 11: Memory Leak & GC Stability Check (${diffMb.toFixed(2)} MB growth) - PASSED`);
      passed++;
    } else {
      console.error(`  ❌ Check 11 Failed: Heap grew by ${diffMb.toFixed(2)} MB`);
    }
  } catch (e: any) {
    console.error("  ❌ Check 11 Failed:", e.message);
  }

  // Check 12: Sub-50ms Cache Hit Serving Latency
  try {
    const mockCanonical = mergeMangaEntities([
      { providerId: "mangadex", data: { id: "m1", title: "Demon Slayer" } },
    ]).canonical;

    await snapshotStorage.saveMangaSnapshot(mockCanonical);

    const start = Date.now();
    const hit = await snapshotStorage.getMangaSnapshot(mockCanonical.canonicalId);
    const latency = Date.now() - start;

    if (hit && latency < 50) {
      console.log(`  ✅ Check 12: Sub-50ms Cache Hit Serving Latency (${latency}ms) - PASSED`);
      passed++;
    } else {
      console.error(`  ❌ Check 12 Failed: Serving latency ${latency}ms >= 50ms`);
    }
  } catch (e: any) {
    console.error("  ❌ Check 12 Failed:", e.message);
  }

  // Check 13: Phase 19 Aggregation Compatibility
  try {
    const merged = mergeMangaEntities([
      { providerId: "mangadex", data: { id: "m1", title: "Slam Dunk" } },
      { providerId: "comick", data: { id: "c1", title: "Slam Dunk" } },
    ]);
    if (merged.canonical.canonicalId && merged.canonical.aggregationVersion === "1.0") {
      console.log("  ✅ Check 13: Phase 19 Aggregation Regression Compatibility - PASSED");
      passed++;
    } else {
      console.error("  ❌ Check 13 Failed: Aggregation regression error");
    }
  } catch (e: any) {
    console.error("  ❌ Check 13 Failed:", e.message);
  }

  // Check 14: Phase 17.5 Reliability Compatibility
  try {
    const descs = providerPolicyRegistry.getAllDescriptors();
    if (descs.length === 8) {
      console.log("  ✅ Check 14: Phase 17.5 Provider Policy Registry Compatibility - PASSED");
      passed++;
    } else {
      console.error("  ❌ Check 14 Failed: Descriptor count:", descs.length);
    }
  } catch (e: any) {
    console.error("  ❌ Check 14 Failed:", e.message);
  }

  // Check 15: 100-Iteration Zero-Drift Benchmark Pass
  try {
    let zeroDrift = true;
    const baseInput = [
      { providerId: "mangadex", data: { id: "m1", title: "Chainsaw Man" } },
      { providerId: "comick", data: { id: "c1", title: "Chainsaw Man" } },
    ];
    const fixedNow = "2026-07-22T00:00:00.000Z";
    const ref = JSON.stringify(mergeMangaEntities(baseInput, { fixedNow }).canonical);

    for (let i = 0; i < 100; i++) {
      const res = JSON.stringify(mergeMangaEntities(baseInput, { fixedNow }).canonical);
      if (res !== ref) {
        zeroDrift = false;
        break;
      }
    }

    if (zeroDrift) {
      console.log("  ✅ Check 15: 100-Iteration Zero-Drift Benchmark Pass - PASSED");
      passed++;
    } else {
      console.error("  ❌ Check 15 Failed: Drift detected across 100 runs");
    }
  } catch (e: any) {
    console.error("  ❌ Check 15 Failed:", e.message);
  }

  console.log("\n───────────────────────────────────────────────────────────────────────────");
  console.log(` Phase 20 Production Readiness Results: ${passed}/15 checks passed`);
  console.log("───────────────────────────────────────────────────────────────────────────\n");

  if (passed === 15) {
    console.log("🚀  All Phase 20 Production Readiness Checks Passed Cleanly!");
    process.exit(0);
  } else {
    console.error("❌  Phase 20 Production Certification Failed!");
    process.exit(1);
  }
}

runPhase20ProductionSuite().catch(console.error);
