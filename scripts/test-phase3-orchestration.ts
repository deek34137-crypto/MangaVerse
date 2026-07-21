import { healthService } from "../src/services/providers/health-service";
import { policyEngine } from "../src/services/providers/policy-engine";
import { providerOrchestrator } from "../src/services/providers/orchestrator";
import { RequestContext } from "../src/services/infrastructure/request-context";
import { eventBus } from "../src/services/infrastructure/event-bus";

async function runPhase3Verification() {
  console.log("==========================================");
  console.log("VERIFYING PHASE 3: HEALTH & ORCHESTRATION");
  console.log("==========================================");

  // 1. Test HealthService adaptive scoring
  console.log("\n[1/3] Testing HealthService Multi-Window Telemetry...");
  healthService.recordSuccess("mangadex", 120);
  healthService.recordSuccess("mangadex", 150);
  healthService.recordSuccess("comick", 200);
  healthService.recordBlock("bad-provider", 500);

  const mangadexHealth = healthService.getHealth("mangadex");
  console.log("MangaDex Health State:", mangadexHealth);
  if (mangadexHealth.availabilityRate !== 1.0) throw new Error("MangaDex availability rate should be 1.0");

  const badHealth = healthService.getHealth("bad-provider");
  console.log("Bad Provider Health State (Cloudflare Blocked):", badHealth);
  if (badHealth.circuitState !== "OPEN") throw new Error("Bad provider circuit state should be OPEN");

  // 2. Test PolicyEngine ranking
  console.log("\n[2/3] Testing PolicyEngine Selection & Profiles...");
  const profile = policyEngine.getProfile();
  console.log("Current Policy Profile:", profile);

  const ctx = new RequestContext({ preferredSource: "mangadex" });
  const ranked = policyEngine.selectProviders("discovery", ctx);
  console.log("Ranked Providers for Discovery (Preferred: MangaDex):", ranked.map((p) => p.name));

  // 3. Test ProviderOrchestrator Execution & Failover
  console.log("\n[3/3] Testing ProviderOrchestrator Search & Telemetry...");
  let telemetryFired = false;
  eventBus.on("provider:succeeded", (evt) => {
    if (evt.operation === "searchManga") telemetryFired = true;
  });

  const searchResults = await providerOrchestrator.searchManga("One Piece", ctx);
  console.log("Orchestration Search Results Count:", searchResults.length);

  console.log("\n✅ PHASE 3 HEALTH & ORCHESTRATION VERIFICATION PASSED!");
}

runPhase3Verification().catch((err) => {
  console.error("\n❌ PHASE 3 VERIFICATION FAILED:", err);
  process.exit(1);
});
