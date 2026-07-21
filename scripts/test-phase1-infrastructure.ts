import { RequestContext } from "../src/services/infrastructure/request-context";
import { eventBus } from "../src/services/infrastructure/event-bus";
import { multiTierCache } from "../src/services/infrastructure/cache-service";

async function runPhase1Verification() {
  console.log("==========================================");
  console.log("VERIFYING PHASE 1: CORE INFRASTRUCTURE");
  console.log("==========================================");

  // 1. Verify RequestContext
  console.log("\n[1/3] Testing RequestContext...");
  const ctx = new RequestContext({
    timeoutMs: 5000,
    retryBudget: 2,
    preferredLanguage: "en",
    preferredSource: "comick",
  });
  console.log("Created Context:", ctx.toLogMeta());
  if (ctx.remainingMs() <= 0) throw new Error("RequestContext remainingMs invalid");
  if (!ctx.hasRemainingRetryBudget()) throw new Error("RequestContext retry budget invalid");
  
  ctx.consumeRetry();
  console.log("After consumeRetry:", ctx.toLogMeta());
  if (ctx.getRetriesUsed() !== 1) throw new Error("RequestContext retries used count incorrect");

  // 2. Verify SystemEventBus
  console.log("\n[2/3] Testing SystemEventBus Telemetry...");
  let eventReceived = false;
  eventBus.on("provider:succeeded", (payload) => {
    console.log("--> Received provider:succeeded event:", payload);
    eventReceived = true;
  });

  eventBus.emit("provider:succeeded", {
    version: 1,
    providerId: "comick",
    operation: "searchManga",
    durationMs: 142,
    requestId: ctx.requestId,
    traceId: ctx.traceId,
    timestamp: Date.now(),
  });

  if (!eventReceived) throw new Error("SystemEventBus failed to deliver event");

  // 3. Verify MultiTierCacheService
  console.log("\n[3/3] Testing MultiTierCacheService (L1 Memory)...");
  const testKey = "test:phase1:canonical_manga_123";
  const testVal = { id: "123", title: "One Piece", rating: 9.8 };

  await multiTierCache.set(testKey, testVal, 30);
  const cached = await multiTierCache.get<typeof testVal>(testKey);

  console.log("Cached Hit Result:", cached);
  if (!cached.data || cached.data.title !== "One Piece" || cached.level !== "L1") {
    throw new Error("MultiTierCache L1 memory hit failed");
  }

  await multiTierCache.del(testKey);
  const cleared = await multiTierCache.get<typeof testVal>(testKey);
  if (cleared.data !== null) {
    throw new Error("MultiTierCache delete failed");
  }

  console.log("\n✅ PHASE 1 INFRASTRUCTURE VERIFICATION PASSED!");
}

runPhase1Verification().catch((err) => {
  console.error("\n❌ PHASE 1 VERIFICATION FAILED:", err);
  process.exit(1);
});
