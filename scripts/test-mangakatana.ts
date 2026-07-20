import { MangaKatanaProvider } from "../src/services/providers/mangakatana/provider";

async function testLiveIntegration() {
  console.log("=== Running MangaKatana Live Integration Tests ===");
  const provider = new MangaKatanaProvider();

  // Test 1: Healthcheck
  console.log("\nTesting healthCheck()...");
  const health = await provider.healthCheck();
  console.log("Health Check Result:", health);
  if (health.status !== "ONLINE" && health.status !== "DEGRADED") {
    throw new Error(`FAIL: Provider healthCheck returned ${health.status}.`);
  }

  // Test 2: Search with Limit
  console.log("\nTesting searchManga('One Piece', limit=5)...");
  const searchResults = await provider.searchManga("One Piece", { limit: 5 });
  console.log(`Search returned ${searchResults.length} items (limit: 5).`);
  if (searchResults.length === 0) {
    throw new Error("FAIL: Live search returned 0 items.");
  }
  if (searchResults.length > 5) {
    throw new Error(`FAIL: Search result count (${searchResults.length}) exceeded limit (5).`);
  }

  // Verify fields on a search result
  const testItem = searchResults[0];
  console.log("Sample Search Item:", {
    id: testItem.id,
    title: testItem.title,
    coverImage: testItem.coverImage,
    status: testItem.status,
    type: testItem.type,
    genres: testItem.genres,
  });

  if (!testItem.id || !testItem.title || !testItem.coverImage || !testItem.coverImage.startsWith("https://")) {
    throw new Error("FAIL: Search item fields are incomplete or invalid.");
  }

  // Test 3: Detail Parsing
  const targetMangaId = "one-piece.49";
  console.log(`\nTesting getMangaDetail('${targetMangaId}')...`);
  const detail = await provider.getMangaDetail(targetMangaId);
  console.log("Manga Detail:", {
    id: detail.id,
    title: detail.title,
    coverImage: detail.coverImage,
    authors: detail.authors,
    type: detail.type,
    status: detail.status,
    genresCount: (detail.genres || []).length,
    descriptionLength: detail.description?.length,
  });

  if (detail.title !== "One Piece") {
    throw new Error(`FAIL: Expected 'One Piece', got '${detail.title}'`);
  }
  if (!detail.coverImage || !detail.coverImage.startsWith("https://")) {
    throw new Error(`FAIL: Cover image is invalid: ${detail.coverImage}`);
  }
  if ((detail.genres || []).length === 0) {
    throw new Error("FAIL: Genres list is empty.");
  }

  // Test 4: Chapters list
  console.log(`\nTesting getChapters('${targetMangaId}')...`);
  const chapters = await provider.getChapters(targetMangaId);
  console.log(`Retrieved ${chapters.length} chapters.`);
  if (chapters.length === 0) {
    throw new Error("FAIL: Chapters list is empty.");
  }

  // Check that the chapters list is in ascending order (chapter 1 should be first)
  console.log("Sample Chapters (First 3):");
  chapters.slice(0, 3).forEach(c => console.log(`  Ch ${c.number}: ID = ${c.id}, Published = ${c.publishedAt?.toISOString()}`));
  console.log("Sample Chapters (Last 3):");
  chapters.slice(-3).forEach(c => console.log(`  Ch ${c.number}: ID = ${c.id}, Published = ${c.publishedAt?.toISOString()}`));

  const firstNum = chapters[0].number ?? 99999;
  const lastNum = chapters[chapters.length - 1].number ?? 99999;
  if (firstNum > lastNum) {
    throw new Error(`FAIL: Chapters list is descending (should be ascending).`);
  }
  
  // Verify that dates are parsed correctly (i.e. not fabricated, and some contain actual values)
  const hasDates = chapters.some(c => c.publishedAt !== undefined);
  if (!hasDates) {
    throw new Error("FAIL: No published dates parsed (all are undefined).");
  }

  // Test 5: Chapter Pages
  // Fetch pages using the ID from the first chapter element in the list (ascending, e.g. ch 1)
  const targetChapterId = chapters[0].id;
  console.log(`\nTesting getChapterPages('${targetChapterId}')...`);
  const pages = await provider.getChapterPages(targetChapterId);
  console.log(`Retrieved ${pages.length} page images.`);
  if (pages.length === 0) {
    throw new Error("FAIL: Pages list is empty.");
  }

  pages.slice(0, 3).forEach(p => console.log(`  Page ${p.number}: ${p.url}`));

  for (const page of pages) {
    if (!page.url || !page.url.startsWith("https://")) {
      throw new Error(`FAIL: Page URL is invalid: ${page.url}`);
    }
  }

  // Check no duplicates
  const urls = pages.map(p => p.url);
  const uniqueUrls = new Set(urls);
  if (uniqueUrls.size !== urls.length) {
    throw new Error("FAIL: Duplicate page image URLs found.");
  }

  console.log("\n=== ALL MANGA_KATANA LIVE INTEGRATION TESTS PASSED SUCCESSFULLY! ===");
}

testLiveIntegration().catch(err => {
  console.error("Live integration tests failed:", err);
  process.exit(1);
});
