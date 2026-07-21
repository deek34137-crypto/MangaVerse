import { RequestContext } from "../src/services/infrastructure/request-context";
import { eventBus } from "../src/services/infrastructure/event-bus";
import { healthService } from "../src/services/providers/health-service";
import { ContractValidator } from "../src/services/providers/contract-validator";
import { jobScheduler } from "../src/services/infrastructure/scheduler";

async function runPhase6ResilienceSuite() {
  console.log("==========================================");
  console.log("VERIFYING PHASE 6: CHAOS & RESILIENCE SUITE");
  console.log("==========================================");

  // 1. Test WAF / Cloudflare 403 Circuit Opening
  console.log("\n[1/4] Scenario: Cloudflare 403 WAF Block...");
  let circuitOpenedEventFired = false;
  eventBus.on("circuit:opened", (evt) => {
    console.log("--> Circuit Opened Event Captured:", evt);
    circuitOpenedEventFired = true;
  });

  healthService.recordBlock("blocked-provider-api", 180);
  const blockedHealth = healthService.getHealth("blocked-provider-api");

  if (blockedHealth.circuitState !== "OPEN" || !circuitOpenedEventFired) {
    throw new Error("Resilience Failure: WAF 403 block did not open circuit breaker");
  }

  // 2. Test RequestContext Latency Budget Exhaustion
  console.log("\n[2/4] Scenario: Primary Provider Timeout Budget Exhaustion...");
  const ctx = new RequestContext({ timeoutMs: 50, retryBudget: 1 });
  await new Promise((resolve) => setTimeout(resolve, 60)); // Sleep 60ms to exceed 50ms budget

  if (!ctx.isExpired() || ctx.remainingMs() !== 0) {
    throw new Error("Resilience Failure: RequestContext did not report timeout expiration");
  }

  // 3. Test Corrupt / Malformed Payload & SSRF Injection
  console.log("\n[3/4] Scenario: Malformed Payload & SSRF Injection Protection...");
  const malformedManga = ContractValidator.validateManga(
    {
      id: "fake-id",
      title: "Malicious Manga",
      coverImage: "javascript:eval('malicious_script')",
    },
    "test-provider"
  );

  console.log("Sanitized Malformed Payload:", malformedManga);
  if (malformedManga.sanitized?.coverImage !== undefined) {
    throw new Error("Resilience Failure: ContractValidator failed to strip javascript: URI injection");
  }

  // 4. Test JobScheduler Proactive Execution
  console.log("\n[4/4] Scenario: Background JobScheduler Execution...");
  const jobs = jobScheduler.getJobs();
  console.log("Registered Scheduler Jobs:", jobs.map((j) => j.type));

  const executed = await jobScheduler.executeJob("job_providerhealthjob");
  if (!executed) {
    throw new Error("Resilience Failure: JobScheduler failed to execute ProviderHealthJob");
  }

  console.log("\n✅ PHASE 6 RESILIENCE & CHAOS SUITE PASSED!");
}

runPhase6ResilienceSuite().catch((err) => {
  console.error("\n❌ PHASE 6 RESILIENCE SUITE FAILED:", err);
  process.exit(1);
});
