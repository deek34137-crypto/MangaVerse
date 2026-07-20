import { ComicKProvider } from "../src/services/providers/comick";

async function testComicK() {
  console.log("=== Running ComicK Live Integration Tests ===");
  const provider = new ComicKProvider();

  // Test 1: Healthcheck
  console.log("\nTesting healthCheck()...");
  const health = await provider.healthCheck();
  console.log("Health Check Result:", health);
  if (health.status !== "ONLINE" && health.status !== "DEGRADED") {
    throw new Error(`FAIL: Provider healthCheck returned ${health.status}.`);
  }

  // Test 2: Search
  console.log("\nTesting searchManga('One Piece', limit=5)...");
  const searchResults = await provider.searchManga("One Piece", { limit: 5 });
  console.log(`Search returned ${searchResults.length} items (limit: 5).`);
  if (searchResults.length === 0) {
    throw new Error("FAIL: Live search returned 0 items.");
  }

  const testItem = searchResults[0];
  console.log("Sample Search Item:", {
    id: testItem.id,
    title: testItem.title,
    coverImage: testItem.coverImage,
    status: testItem.status,
    type: testItem.type,
    year: testItem.year,
  });

  if (!testItem.id || !testItem.title) {
    throw new Error("FAIL: Search item fields are incomplete.");
  }

  // Test 3: Detail
  const targetMangaId = testItem.id;
  console.log(`\nTesting getMangaDetail('${targetMangaId}')...`);
  const detail = await provider.getMangaDetail(targetMangaId);
  console.log("Manga Detail:", {
    id: detail.id,
    title: detail.title,
    coverImage: detail.coverImage,
    authors: detail.authors,
    artists: detail.artists,
    type: detail.type,
    status: detail.status,
    year: detail.year,
    genresCount: (detail.genres || []).length,
  });

  if (!detail.title) {
    throw new Error("FAIL: Detail title is missing.");
  }

  // Test 4: Chapters
  console.log(`\nTesting getChapters('${targetMangaId}')...`);
  const chapters = await provider.getChapters(targetMangaId);
  console.log(`Retrieved ${chapters.length} chapters.`);
  if (chapters.length === 0) {
    throw new Error("FAIL: Chapters list is empty.");
  }

  console.log("Sample Chapters (First 3):");
  chapters.slice(0, 3).forEach(c => console.log(`  Ch ${c.number || c.displayNumber}: ID = ${c.id}, Published = ${c.publishedAt}`));

  // Test 5: Pages
  const targetChapterId = chapters[0].id;
  console.log(`\nTesting getChapterPages('${targetChapterId}')...`);
  const pages = await provider.getChapterPages(targetChapterId);
  console.log(`Retrieved ${pages.length} page images.`);
  if (pages.length === 0) {
    throw new Error("FAIL: Pages list is empty.");
  }

  pages.slice(0, 3).forEach(p => console.log(`  Page ${p.number}: ${p.url}`));

  console.log("\n=== ALL COMICK LIVE INTEGRATION TESTS PASSED SUCCESSFULLY! ===");
}

testComicK().catch(err => {
  console.error("ComicK integration tests failed:", err);
  process.exit(1);
});
