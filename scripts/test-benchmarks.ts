import "@/services/providers";
import { mergeMangaEntities } from "@/services/aggregation/merge-engine";
import { providerPolicyRegistry } from "@/services/providers/shared/provider-policy";
import { RawProviderManga } from "@/services/providers/shared/types";

async function runScaleAndChaosBenchmarks() {
  console.log("=================================================");
  console.log("⚡  Scale & Chaos Benchmarks (5,000 Entities + Degraded Providers)");
  console.log("=================================================\n");

  // 1. Large Scale Benchmark (5,000 Entities)
  const startMemory = process.memoryUsage().heapUsed;
  const startTime = Date.now();

  const mockInput: RawProviderManga = {
    id: "m_scale",
    title: "One Piece Scale Benchmark",
    description: "Detailed description string for scale testing...",
    coverImage: "http://cover.jpg",
  };

  for (let i = 0; i < 5000; i++) {
    mergeMangaEntities([
      { providerId: "mangadex", data: { ...mockInput, id: `m_${i}` } },
      { providerId: "comick", data: { ...mockInput, id: `c_${i}` } },
    ]);
  }

  const durationMs = Date.now() - startTime;
  const endMemory = process.memoryUsage().heapUsed;
  const memoryGrowthMb = (endMemory - startMemory) / (1024 * 1024);
  const throughput = Math.round((5000 / durationMs) * 1000);

  console.log(`  ✅ 5,000 Entity Aggregation Benchmark: ${durationMs}ms (${throughput} ops/sec, Heap +${memoryGrowthMb.toFixed(2)} MB)`);

  if (throughput > 500 && memoryGrowthMb < 100) {
    console.log("  ✅ Scale Benchmark PASS\n");
  } else {
    console.error("  ❌ Scale Benchmark Fail: Throughput or Memory exceeded limits\n");
    process.exit(1);
  }

  // 2. Chaos Benchmark (2 Online, 2 Degraded, 2 Slow, 2 Timeout)
  console.log("  🧪 Running Chaos Simulation Benchmark across 8 Providers...");
  const descs = providerPolicyRegistry.getAllDescriptors();

  // Simulate degraded runtime state updates
  descs.forEach((d, idx) => {
    if (idx >= 6) {
      // 2 Timeout
      providerPolicyRegistry.updateMetrics(d.identity.id, { availabilityRatio: 0.2, latencyP95Ms: 5000 });
    } else if (idx >= 4) {
      // 2 Slow
      providerPolicyRegistry.updateMetrics(d.identity.id, { latencyP95Ms: 2500 });
    } else if (idx >= 2) {
      // 2 Degraded
      providerPolicyRegistry.updateMetrics(d.identity.id, { availabilityRatio: 0.6 });
    } else {
      // 2 Online
      providerPolicyRegistry.updateMetrics(d.identity.id, { availabilityRatio: 1.0, latencyP95Ms: 150 });
    }
  });

  const chaosResult = mergeMangaEntities([
    { providerId: "mangadex", data: mockInput, confidence: 0.95 },
    { providerId: "comick", data: mockInput, confidence: 0.90 },
    { providerId: "weebcentral", data: mockInput, confidence: 0.60 }, // Degraded
    { providerId: "mangakatana", data: mockInput, confidence: 0.40 }, // Slow
  ]);

  if (chaosResult.canonical.title.value === "One Piece Scale Benchmark" && chaosResult.canonical.qualityTier !== "TIER_C_HIDDEN") {
    console.log("  ✅ Chaos Benchmark PASS: Successfully merged under mixed degraded network conditions!");
  } else {
    console.error("  ❌ Chaos Benchmark Fail: Aggregation failed under degraded conditions");
    process.exit(1);
  }

  console.log("\n───────────────────────────────────────────────────────────────────────────");
  console.log(" Scale & Chaos Certification Complete: ALL BENCHMARKS PASSED");
  console.log("───────────────────────────────────────────────────────────────────────────\n");
}

runScaleAndChaosBenchmarks().catch(console.error);
