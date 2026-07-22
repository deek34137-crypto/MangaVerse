import { loadHomePage } from "../src/services/ui/loaders/home.loader";
import { loadMangaDetailPage } from "../src/services/ui/loaders/manga.loader";
import { loadSearchPage } from "../src/services/ui/loaders/search.loader";

async function runPostDeploymentSmokeTest() {
  console.log("=== Launch Certification: Workstream 4 — Post-Deployment Smoke Test ===");

  // 1. Load Homepage
  const homeVm = await loadHomePage();
  if (homeVm.type !== "SUCCESS") throw new Error("Homepage loader returned ERROR state");
  console.log(`[PASS] Homepage loaded cleanly with ${homeVm.trendingRows.length} trending items.`);

  // 2. Fetch seed manga dynamically
  const seedId = homeVm.heroSpotlight[0]?.canonicalId || homeVm.trendingRows[0]?.canonicalId;
  if (!seedId) throw new Error("No seed manga available for smoke test");

  // 3. Load Manga Detail Page
  const detailVm = await loadMangaDetailPage(seedId);
  if (detailVm.type !== "SUCCESS") throw new Error(`Detail loader returned ERROR state for ${seedId}`);
  console.log(`[PASS] Manga Detail Page for '${detailVm.title}' loaded cleanly (${detailVm.chapters.length} chapters).`);

  // 4. Test Search with Typo
  const searchVm = await loadSearchPage("snk");
  if (searchVm.type !== "SUCCESS") throw new Error("Search loader returned ERROR state");
  console.log(`[PASS] Search loader returned ${searchVm.totalResults} results for typo query 'snk'.`);

  console.log("\n✅ WORKSTREAM 4 POST-DEPLOYMENT SMOKE TEST PASSED 100%");
}

runPostDeploymentSmokeTest().catch((err) => {
  console.error("❌ Smoke test failed:", err);
  process.exit(1);
});
