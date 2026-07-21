import { RequestContext } from "../src/services/infrastructure/request-context";
import { eventBus } from "../src/services/infrastructure/event-bus";
import { multiTierCache } from "../src/services/infrastructure/cache-service";
import { healthService } from "../src/services/providers/health-service";
import { policyEngine } from "../src/services/providers/policy-engine";
import { providerOrchestrator } from "../src/services/providers/orchestrator";
import { chapterMerger } from "../src/services/manga/chapter-merger";
import { calculateSimilarity } from "../src/services/manga/deduplication";
import { ContractValidator } from "../src/services/providers/contract-validator";
import { aniListSource } from "../src/services/metadata/anilist-source";
import { metadataPipeline } from "../src/services/metadata/pipeline";
import { jobScheduler } from "../src/services/infrastructure/scheduler";

export interface LatencyBenchmark {
  component: string;
  budgetMs: number;
  measuredMs: number;
  passed: boolean;
}

async function runProductionReadinessAudit() {
  console.log("=================================================");
  console.log("MANGAVERSE PRODUCTION READINESS REVIEW (PRR) AUDIT");
  console.log("=================================================\n");

  const benchmarks: LatencyBenchmark[] = [];

  // 1. Audit L1 Memory Cache Latency (<5ms budget)
  const l1Start = performance.now();
  await multiTierCache.set("prr:test:key", { data: "test" }, 30);
  await multiTierCache.get("prr:test:key");
  const l1Duration = performance.now() - l1Start;
  benchmarks.push({
    component: "L1 Cache Lookup",
    budgetMs: 5,
    measuredMs: parseFloat(l1Duration.toFixed(2)),
    passed: l1Duration <= 5,
  });

  // 2. Audit Policy Engine Selection Latency (<20ms budget)
  policyEngine.selectProviders("reading", new RequestContext()); // Warm up cold-boot instantiation
  const policyStart = performance.now();
  policyEngine.selectProviders("reading", new RequestContext());
  const policyDuration = performance.now() - policyStart;
  benchmarks.push({
    component: "Policy Engine Selection",
    budgetMs: 20,
    measuredMs: parseFloat(policyDuration.toFixed(2)),
    passed: policyDuration <= 20,
  });

  // 3. Audit Canonical Resolution Latency (<50ms budget)
  const simStart = performance.now();
  calculateSimilarity("Solo Leveling", "Solo Leveling (Digital)");
  const simDuration = performance.now() - simStart;
  benchmarks.push({
    component: "Canonical Identity Resolution",
    budgetMs: 50,
    measuredMs: parseFloat(simDuration.toFixed(2)),
    passed: simDuration <= 50,
  });

  // 4. Audit Chapter Merge Latency (<75ms budget)
  const mergeStart = performance.now();
  const providerMap = new Map();
  providerMap.set("comick", [{ id: "c1", number: 1, title: "Ch 1", language: "en" }]);
  providerMap.set("mangadex", [{ id: "m1", number: 1, title: "Ch 1", language: "en" }]);
  chapterMerger.mergeChapterLists("manga_prr_123", providerMap);
  const mergeDuration = performance.now() - mergeStart;
  benchmarks.push({
    component: "Chapter Merge Engine",
    budgetMs: 75,
    measuredMs: parseFloat(mergeDuration.toFixed(2)),
    passed: mergeDuration <= 75,
  });

  // Print Latency Benchmark Summary Table
  console.log("📊 LATENCY BUDGET PERFORMANCE BENCHMARKS");
  console.table(benchmarks);

  // 5. Architecture Conformance & Security Verification
  console.log("\n🔒 SECURITY & CONTRACT CONFORMANCE AUDIT");
  const ssrfCheck = ContractValidator.validatePages([{ number: 1, url: "file:///etc/passwd" }], "test");
  console.log("SSRF Blocking Status:", !ssrfCheck.isValid ? "PASSED (Blocked file:/// protocol)" : "FAILED");

  const jsCheck = ContractValidator.validateManga({ id: "1", title: "Test", coverImage: "javascript:alert(1)" }, "test");
  console.log("Script Injection Blocking Status:", jsCheck.sanitized?.coverImage === undefined ? "PASSED (Stripped javascript: URI)" : "FAILED");

  // 6. Resilience & Circuit Breaker Verification
  console.log("\n⚡ RESILIENCE & CIRCUIT BREAKER AUDIT");
  healthService.recordBlock("prr-test-provider", 100);
  const health = healthService.getHealth("prr-test-provider");
  console.log("Circuit Breaker Status on 403 WAF Block:", health.circuitState === "OPEN" ? "PASSED (Circuit OPEN)" : "FAILED");

  // 7. Scheduler Audit
  console.log("\n⏰ SCHEDULER & BACKGROUND MAINTENANCE AUDIT");
  const jobs = jobScheduler.getJobs();
  console.log("Registered Scheduler Jobs Count:", jobs.length);
  const jobResult = await jobScheduler.executeJob("job_providerhealthjob");
  console.log("ProviderHealthJob Execution Status:", jobResult ? "PASSED" : "FAILED");

  const ssrfPassed = ssrfCheck.sanitized === null;
  const jsPassed = jsCheck.sanitized?.coverImage === undefined;
  const healthPassed = health.circuitState === "OPEN";
  const benchmarksPassed = benchmarks.every((b) => b.passed);

  const allPassed = benchmarksPassed && ssrfPassed && jsPassed && healthPassed && jobResult;

  console.log("\n=================================================");
  if (allPassed) {
    console.log("🎉 PRODUCTION READINESS AUDIT PASSED! READY FOR PRODUCTION DEPLOYMENT.");
  } else {
    console.log("⚠️ PRODUCTION READINESS AUDIT HAD WARNINGS/FAILURES.");
  }
  console.log("=================================================");
}

runProductionReadinessAudit().catch((err) => {
  console.error("PRR Audit Error:", err);
  process.exit(1);
});
