import { TagService } from "./tags";

async function runTests() {
  console.log("Running TagService Unit Tests...");
  
  // Test case 1: Resolve tag UUID
  try {
    const actionUUID = await TagService.getUUID("Action");
    console.log("Test 1: Resolve tag 'Action' ->", actionUUID);
    if (actionUUID === "391b0423-d847-456f-aff0-8b0cfc03066b") {
      console.log("✅ Test 1 Passed");
    } else {
      console.error("❌ Test 1 Failed: Expected MangaDex Action tag UUID");
    }
  } catch (e) {
    console.error("❌ Test 1 Failed with error:", e);
  }

  // Test case 2: Bulk get UUIDs
  try {
    const uuids = await TagService.getUUIDs(["Action", "Adventure", "UnknownTag"]);
    console.log("Test 2: Resolve multiple tags ->", uuids);
    if (uuids.length === 2 && uuids.includes("391b0423-d847-456f-aff0-8b0cfc03066b")) {
      console.log("✅ Test 2 Passed (Unknown tags filtered out correctly)");
    } else {
      console.error("❌ Test 2 Failed");
    }
  } catch (e) {
    console.error("❌ Test 2 Failed with error:", e);
  }

  // Test case 3: Cache hits
  try {
    const t0 = Date.now();
    await TagService.getUUID("Action");
    const t1 = Date.now();
    console.log(`Test 3: Cache Hit Speed -> Resolved in ${t1 - t0}ms`);
    if (t1 - t0 < 50) {
      console.log("✅ Test 3 Passed (Fast cache read)");
    } else {
      console.warn("⚠️ Test 3 Warning: Cache resolution took longer than expected");
    }
  } catch (e) {
    console.error("❌ Test 3 Failed with error:", e);
  }
}

if (require.main === module) {
  runTests();
}
