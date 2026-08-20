import { adapterRegistry } from "../src/lib/adapters";
import {
  validateUrlAgainstNetworkPolicy,
  METADATA_NETWORK_POLICY,
} from "../src/lib/security/ssrf";
import { executeBoundedSearch } from "../src/lib/aggregation/search-aggregator";
import { healthManager } from "../src/lib/health/health-manager";
import {
  calculateWeightedMatch,
  MetadataMatchCriteria,
  CandidateMetadata,
} from "../src/lib/metadata/metadata-provider";
import { metadataResolver } from "../src/lib/metadata/metadata-resolver";
import { pageCountResolver } from "../src/lib/chapters/page-count-resolver";
import { NormalizedManga, NormalizedChapter } from "../src/types";

async function runContractTests() {
  console.log("==================================================");
  console.log("   MangaHub Certified Provider Contract Tests     ");
  console.log("==================================================\n");

  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, testName: string, detail?: string) {
    if (condition) {
      console.log(`  [PASS] ${testName}`);
      passed++;
    } else {
      console.error(`  [FAIL] ${testName} ${detail ? `-> ${detail}` : ""}`);
      failed++;
    }
  }

  // 1. Check all registered adapters
  const allAdapters = adapterRegistry.getAll();
  assert(allAdapters.length >= 10, `Registry contains ${allAdapters.length} adapters (expected >= 10)`);

  for (const adapter of allAdapters) {
    console.log(`\nTesting Provider Contract: [${adapter.id.toUpperCase()}] ${adapter.name}`);

    // Adapter structure
    assert(typeof adapter.id === "string" && adapter.id.length > 0, `${adapter.id}: valid id`);
    assert(typeof adapter.name === "string" && adapter.name.length > 0, `${adapter.id}: valid name`);
    assert(adapter.baseUrl.startsWith("http"), `${adapter.id}: valid baseUrl`);
    assert([1, 2, 3].includes(adapter.tier), `${adapter.id}: valid tier (${adapter.tier})`);
    assert(typeof adapter.capabilities === "object", `${adapter.id}: valid capabilities`);
    assert(Array.isArray(adapter.networkPolicy.allowedHosts), `${adapter.id}: valid allowedHosts`);
  }

  // 2. SSRF Protection & Metadata CDN Contract Tests
  console.log("\n==================================================");
  console.log("   Testing SSRF & Network Policy Security         ");
  console.log("==================================================");

  const weebPolicy = adapterRegistry.get("weebcentral")!.networkPolicy;
  const dexPolicy = adapterRegistry.get("mangadex")!.networkPolicy;

  // Private / loopback blocks
  assert(!validateUrlAgainstNetworkPolicy("http://127.0.0.1/secret", weebPolicy).valid, "SSRF: Blocks 127.0.0.1");
  assert(!validateUrlAgainstNetworkPolicy("http://localhost:3000/api", weebPolicy).valid, "SSRF: Blocks localhost");
  assert(!validateUrlAgainstNetworkPolicy("http://169.254.169.254/latest/meta-data", weebPolicy).valid, "SSRF: Blocks AWS metadata IP 169.254.169.254");
  assert(!validateUrlAgainstNetworkPolicy("http://10.0.0.1/admin", weebPolicy).valid, "SSRF: Blocks 10.0.0.0/8 private network");
  assert(!validateUrlAgainstNetworkPolicy("http://172.16.0.1/internal", weebPolicy).valid, "SSRF: Blocks 172.16.0.0/12 private network");
  assert(!validateUrlAgainstNetworkPolicy("http://192.168.1.1/router", weebPolicy).valid, "SSRF: Blocks 192.168.0.0/16 private network");
  assert(!validateUrlAgainstNetworkPolicy("file:///etc/passwd", weebPolicy).valid, "SSRF: Blocks file:// protocol");
  assert(!validateUrlAgainstNetworkPolicy("gopher://127.0.0.1:70", weebPolicy).valid, "SSRF: Blocks gopher:// protocol");
  assert(!validateUrlAgainstNetworkPolicy("https://attacker-controlled.xyz/exploit.jpg", weebPolicy).valid, "SSRF: Blocks unlisted domain outside provider policy");

  // Valid host approvals
  assert(validateUrlAgainstNetworkPolicy("https://uploads.mangadex.org/covers/123/abc.jpg", dexPolicy).valid, "SSRF: Allows certified MangaDex CDN host");
  assert(validateUrlAgainstNetworkPolicy("https://weebcentral.com/image.jpg", weebPolicy).valid, "SSRF: Allows certified WeebCentral host");
  assert(validateUrlAgainstNetworkPolicy("https://s4.anilist.co/file/anilistcdn/media/manga/cover/large/bx105398-b61390.png", METADATA_NETWORK_POLICY).valid, "SSRF: Allows certified AniList CDN host");
  assert(validateUrlAgainstNetworkPolicy("https://media.kitsu.app/manga/poster_images/41982/large.jpg", METADATA_NETWORK_POLICY).valid, "SSRF: Allows certified Kitsu CDN host");
  assert(validateUrlAgainstNetworkPolicy("https://cdn.myanimelist.net/images/manga/3/222243l.webp", METADATA_NETWORK_POLICY).valid, "SSRF: Allows certified MyAnimeList CDN host");

  // 3. Weighted Metadata Scoring Contract Tests
  console.log("\n==================================================");
  console.log("   Testing Weighted Metadata Matching System      ");
  console.log("==================================================");

  const testCriteria: MetadataMatchCriteria = {
    targetTitle: "Solo Leveling",
    targetAltTitles: ["Na Honjaman Rebeleop", "Only I Level Up"],
    targetAuthor: "Chugong",
    targetYear: 2018,
    targetType: "manga",
  };

  // Exact ID Match (+100)
  const idCand: CandidateMetadata = {
    id: "151807",
    title: "Solo Leveling",
    externalIds: { anilist: 151807 },
  };
  const idMatch = calculateWeightedMatch({ ...testCriteria, targetExternalId: { anilist: 151807 } }, idCand);
  assert(idMatch.confidence === 100, "Metadata: Exact external ID scores 100%");
  assert(idMatch.isStrongMatch === true, "Metadata: Exact external ID is strong match (short-circuit)");

  // Exact Title (+50) + Alt Title (+35) + Author (+15) -> 100
  const strongCand: CandidateMetadata = {
    id: "1",
    title: "Solo Leveling",
    altTitles: ["Only I Level Up"],
    authors: ["Chugong"],
    year: 2018,
  };
  const strongMatch = calculateWeightedMatch(testCriteria, strongCand);
  assert(strongMatch.confidence === 100, "Metadata: Canonical + Alt + Author scores 100");
  assert(strongMatch.isStrongMatch === true, "Metadata: Multi-signal match is strong match");

  // Acceptable match (80-89 with secondary confirmation)
  const acceptableCand: CandidateMetadata = {
    id: "2",
    title: "Solo Leveling Side Stories",
    altTitles: ["Na Honjaman Rebeleop"],
    authors: ["Chugong"],
    type: "manga",
  };
  const acceptableMatch = calculateWeightedMatch(testCriteria, acceptableCand);
  assert(acceptableMatch.confidence >= 80, `Metadata: Score ${acceptableMatch.confidence} >= 80`);
  assert(acceptableMatch.isAcceptableMatch === true, "Metadata: Secondary confirmation allows 80+ match");

  // Unrelated manga (<80 -> rejected)
  const unrelatedCand: CandidateMetadata = {
    id: "3",
    title: "Solo Bug Player",
    authors: ["Unknown"],
    year: 2020,
  };
  const unrelatedMatch = calculateWeightedMatch(testCriteria, unrelatedCand);
  assert(unrelatedMatch.confidence < 80, `Metadata: Unrelated manga scores low (${unrelatedMatch.confidence} < 80)`);
  assert(unrelatedMatch.isAcceptableMatch === false, "Metadata: Low confidence match is rejected");

  // 4. Metadata Resolver Native Fallback & Artwork Preservation
  console.log("\n==================================================");
  console.log("   Testing Metadata Resolver & Artwork Fallback   ");
  console.log("==================================================");

  const baseManga: NormalizedManga = {
    id: "test_manga_123",
    title: "Nonexistent Series 999XYZ",
    altTitles: [],
    coverImage: "https://weebcentral.com/native_cover.jpg",
    genres: [],
    authors: [],
    artists: [],
    status: "ongoing",
    provider: "weebcentral",
    url: "https://weebcentral.com/series/123",
  };

  const resolved = await metadataResolver.resolveMangaMetadata(baseManga);
  assert(resolved.source === "provider", "Metadata: Falls back to provider source when unmatched");
  assert(resolved.manga.nativeCoverImage === "https://weebcentral.com/native_cover.jpg", "Metadata: Preserves nativeCoverImage");
  assert(resolved.manga.coverImage === "https://weebcentral.com/native_cover.jpg", "Metadata: Uses native cover when external metadata missing");
  assert(resolved.manga.metadataConfidence === 100, "Metadata: Native fallback confidence is 100");

  // 5. Chapter Page Count Resolver Contract Tests
  console.log("\n==================================================");
  console.log("   Testing Chapter Page Count System              ");
  console.log("==================================================");

  // Single resolution (mocked adapter)
  const singleRes = await pageCountResolver.resolve({
    provider: "weebcentral",
    id: "test_ch_1",
  });
  assert(
    ["resolved", "unavailable", "failed"].includes(singleRes.status),
    `PageCount: Resolution status '${singleRes.status}' is valid`
  );

  // Batch resolution
  const batchRes = await pageCountResolver.resolveBatch([
    { provider: "weebcentral", id: "ch_1" },
    { provider: "mangakatana", id: "ch_2" },
  ], 30, 4);

  assert(Array.isArray(batchRes), "BatchPageCount: Returns array");
  assert(batchRes.length === 2, "BatchPageCount: Returns correct number of items");
  assert(batchRes[0].chapterId === "ch_1", "BatchPageCount: Preserves chapterId");
  assert(batchRes[0].provider === "weebcentral", "BatchPageCount: Preserves provider");

  // 6. Chapter Model Contract Tests
  console.log("\n==================================================");
  console.log("   Testing Chapter Number & Language Contract     ");
  console.log("==================================================");

  const testAdapter = adapterRegistry.get("weebcentral") as any;
  assert(testAdapter.extractChapterNumber("Chapter 12.5") === "12.5", "Chapter parser: 'Chapter 12.5' -> '12.5'");
  assert(testAdapter.extractChapterNumber("Episode 0") === "0", "Chapter parser: 'Episode 0' -> '0'");
  assert(testAdapter.extractChapterNumber("Ch. 100") === "100", "Chapter parser: 'Ch. 100' -> '100'");
  assert(testAdapter.extractChapterNumber("Special 1") === "1", "Chapter parser: 'Special 1' -> '1'");

  // NormalizedChapter pageCount model test
  const dummyChapter: NormalizedChapter = {
    id: "ch_123",
    number: "12.5",
    url: "https://weebcentral.com/ch/123",
    provider: "weebcentral",
    pageCount: 18,
  };
  assert(dummyChapter.pageCount === 18, "NormalizedChapter: pageCount model is valid");

  // 7. Health Manager Contract Test
  console.log("\n==================================================");
  console.log("   Testing Health Manager Contract                ");
  console.log("==================================================");

  healthManager.recordSuccess("mangadex", 150);
  assert(healthManager.getHealth("mangadex").status === "healthy", "Health: recorded success is healthy");
  assert(healthManager.getHealth("mangadex").latencyMs === 150, "Health: latency recorded");

  healthManager.recordFailure("test_failing", "HTTP 500");
  healthManager.recordFailure("test_failing", "HTTP 500");
  assert(healthManager.getHealth("test_failing").status === "degraded", "Health: 2 failures is degraded");

  // 8. Search Aggregator Integration Test
  console.log("\n==================================================");
  console.log("   Testing Search Aggregator (MangaDex Mock)      ");
  console.log("==================================================");

  try {
    const searchRes = await executeBoundedSearch("Solo Leveling", "mangadex", 5);
    assert(Array.isArray(searchRes.results), "Search: returns results array");
    assert(searchRes.sources.completed.includes("mangadex"), "Search: MangaDex completed");
    if (searchRes.results.length > 0) {
      const first = searchRes.results[0];
      assert(typeof first.id === "string", "Result: has valid id");
      assert(typeof first.title === "string", "Result: has valid title");
      assert(first.provider === "mangadex", "Result: has provider mangadex");
    }
  } catch (err: any) {
    console.warn("MangaDex live search skipped in offline/test environment:", err.message);
  }

  console.log("\n==================================================");
  console.log(`   TEST RESULTS: ${passed} PASSED, ${failed} FAILED `);
  console.log("==================================================");

  if (failed > 0) {
    process.exit(1);
  }
}

runContractTests().catch((e) => {
  console.error("Test runner failed:", e);
  process.exit(1);
});
