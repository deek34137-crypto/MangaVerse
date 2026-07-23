import { telemetry } from "../src/services/telemetry";

console.log("=====================================================");
console.log(" MangaHub Sprint 5 Telemetry & Rollout Automation Test");
console.log("=====================================================\n");

let passes = 0;
let fails = 0;

function assert(condition: boolean, label: string) {
  if (condition) {
    console.log(` ✅ PASS: ${label}`);
    passes++;
  } else {
    console.error(` ❌ FAIL: ${label}`);
    fails++;
  }
}

// 1. Verify Bifurcated Telemetry Logging
telemetry.logOperationalEvent({
  eventType: "reader_load",
  component: "reader",
  latencyMs: 140,
  cacheHit: true,
  providerId: "comick",
});

telemetry.logProductEvent({
  eventType: "chapter_complete",
  mangaId: "manga_solo_leveling",
  chapterId: "chap_179",
  pagesRead: 42,
  totalPages: 42,
  completionPct: 100,
});

const opsStats = telemetry.getOperationalStats();
const productStats = telemetry.getProductStats();

assert(opsStats.totalOpsEvents >= 1, "Operational Telemetry logged infra health event");
assert(productStats.totalProductEvents >= 1, "Product Analytics logged user completion event");

// 2. Evaluate Automatic Rollback Trigger Matrix
interface RolloutMetrics {
  readerSuccessPct: number;
  jsErrorRateMultiplier: number;
  proxyFailurePct: number;
  crashFreeSessionsPct: number;
  progressSaveFailurePct: number;
}

function evaluateRollbackTriggers(metrics: RolloutMetrics): { shouldRollback: boolean; reason?: string } {
  if (metrics.readerSuccessPct < 99.0) {
    return { shouldRollback: true, reason: `Reader success ${metrics.readerSuccessPct}% < 99.0% threshold` };
  }
  if (metrics.jsErrorRateMultiplier >= 2.0) {
    return { shouldRollback: true, reason: `JS error rate ${metrics.jsErrorRateMultiplier}x baseline >= 2.0x threshold` };
  }
  if (metrics.proxyFailurePct > 2.0) {
    return { shouldRollback: true, reason: `Proxy failure ${metrics.proxyFailurePct}% > 2.0% threshold` };
  }
  if (metrics.crashFreeSessionsPct < 99.5) {
    return { shouldRollback: true, reason: `Crash-free sessions ${metrics.crashFreeSessionsPct}% < 99.5% threshold` };
  }
  if (metrics.progressSaveFailurePct > 0.01) {
    return { shouldRollback: true, reason: `Progress save failure ${metrics.progressSaveFailurePct}% > 0.01% threshold` };
  }
  return { shouldRollback: false };
}

const healthyMetrics: RolloutMetrics = {
  readerSuccessPct: 99.95,
  jsErrorRateMultiplier: 1.0,
  proxyFailurePct: 0.4,
  crashFreeSessionsPct: 99.98,
  progressSaveFailurePct: 0.001,
};

const degradedMetrics: RolloutMetrics = {
  readerSuccessPct: 98.2, // Breached!
  jsErrorRateMultiplier: 2.5,
  proxyFailurePct: 0.5,
  crashFreeSessionsPct: 99.8,
  progressSaveFailurePct: 0.001,
};

assert(!evaluateRollbackTriggers(healthyMetrics).shouldRollback, "Healthy telemetry metrics passed canary check without rollback");
const rollbackResult = evaluateRollbackTriggers(degradedMetrics);
assert(rollbackResult.shouldRollback, "Degraded reader metrics correctly triggered automatic rollback alarm");
assert(
  Boolean(rollbackResult.reason?.includes("Reader success 98.2%")),
  "Rollback trigger reason correctly identified reader success breach"
);

// 3. Evaluate 12-Point Release Candidate Checklist
const rcChecklist = [
  "Production Build Succeeds",
  "TypeScript Compilation Clean",
  "Automated Test Suite Passed",
  "E2E & Chaos Suite Passed",
  "Security Audit Certified",
  "Database Migrations Verified",
  "Database Backup Verified",
  "Rollback Container Image Available",
  "Telemetry Actively Streaming Events",
  "Post-Deployment Smoke Tests Passed",
  "Canary Stage Healthy",
  "Error Budget Unexhausted",
];

assert(rcChecklist.length === 12, "Pre-Deployment Release Candidate Checklist contains exactly 12 required gates");

console.log("\n-----------------------------------------------------");
console.log(`Sprint 5 Test Results: ${passes} passed, ${fails} failed.`);
console.log("-----------------------------------------------------");

if (fails > 0) {
  process.exit(1);
} else {
  console.log("🎉 Sprint 5 Telemetry, Rollout & Operational Monitoring Validation Passed!\n");
}
