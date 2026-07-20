import * as fs from "fs";
import * as path from "path";
import { MangaKatanaParser } from "../src/services/providers/mangakatana/parser";

const FIXTURES_DIR = path.join(__dirname, "../tests/fixtures/mangakatana");

async function ensureFixtures() {
  if (!fs.existsSync(FIXTURES_DIR)) {
    fs.mkdirSync(FIXTURES_DIR, { recursive: true });
  }

  const files = {
    "search.html": "https://mangakatana.com/?search=One+Piece",
    "detail.html": "https://mangakatana.com/manga/one-piece.49",
    "pages.html": "https://mangakatana.com/manga/one-piece.49/c1",
  };

  const headers = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  };

  for (const [filename, url] of Object.entries(files)) {
    const filePath = path.join(FIXTURES_DIR, filename);
    if (!fs.existsSync(filePath)) {
      console.log(`[Fixture Generator] Fetching ${url} -> ${filename}...`);
      const res = await fetch(url, { headers });
      const html = await res.text();
      fs.writeFileSync(filePath, html, "utf-8");
      console.log(`[Fixture Generator] Saved ${filePath} (${html.length} bytes)`);
    }
  }
}

async function runParserTests() {
  console.log("=== Running MangaKatana Fixture Parser Tests ===");
  await ensureFixtures();

  const parser = new MangaKatanaParser();

  // Test 1: Search Parser
  console.log("\nTesting search.html...");
  const searchHtml = fs.readFileSync(path.join(FIXTURES_DIR, "search.html"), "utf-8");
  const searchItems = parser.parseSearch(searchHtml);
  console.log(`Parsed ${searchItems.length} search items.`);
  
  if (searchItems.length === 0) {
    throw new Error("FAIL: Search parser returned 0 items.");
  }
  
  const opItem = searchItems.find(item => item.title.toLowerCase().includes("one piece"));
  if (!opItem) {
    console.warn("WARN: 'One Piece' not found in search results. Results titles:", searchItems.map(i => i.title));
  } else {
    console.log("SUCCESS: Found One Piece in search results.");
    console.log(`  ID: ${opItem.id}`);
    console.log(`  Title: ${opItem.title}`);
    console.log(`  Cover: ${opItem.coverUrl}`);
    
    if (!opItem.id || !opItem.coverUrl.startsWith("https://")) {
      throw new Error("FAIL: Invalid mapped search item fields.");
    }
  }

  // Test 2: Detail Parser
  console.log("\nTesting detail.html...");
  const detailHtml = fs.readFileSync(path.join(FIXTURES_DIR, "detail.html"), "utf-8");
  const detail = parser.parseDetail(detailHtml);
  console.log("Parsed series details:");
  console.log(`  Title: ${detail.title}`);
  console.log(`  Cover: ${detail.coverUrl}`);
  console.log(`  Authors: ${detail.authors.join(", ")}`);
  console.log(`  Status: ${detail.status}`);
  console.log(`  Description: ${detail.description.substring(0, 100)}...`);
  console.log(`  Genres: ${detail.genres.join(", ")}`);

  if (detail.title !== "One Piece") {
    throw new Error(`FAIL: Detail title expected 'One Piece', got '${detail.title}'`);
  }
  if (!detail.coverUrl.startsWith("https://")) {
    throw new Error(`FAIL: Detail coverUrl must start with https://, got '${detail.coverUrl}'`);
  }
  if ((detail.genres || []).length === 0) {
    throw new Error("FAIL: Genres list is empty.");
  }

  // Test 3: Chapters Parser
  console.log("\nTesting chapters from detail.html...");
  const chapters = parser.parseChapters(detailHtml, "one-piece.49");
  console.log(`Parsed ${chapters.length} chapters.`);
  
  if (chapters.length === 0) {
    throw new Error("FAIL: Chapters list is empty.");
  }
  
  // Find a specific chapter, e.g. chapter 1
  const ch1 = chapters.find(c => c.number === 1);
  if (!ch1) {
    throw new Error("FAIL: Chapter 1 not found in chapters list.");
  }
  console.log(`SUCCESS: Found Chapter 1: ID = ${ch1.id} | Date = ${ch1.publishedAt?.toISOString()}`);
  
  // Assert dates are parsed correctly
  const hasDates = chapters.some(c => c.publishedAt !== undefined);
  if (!hasDates) {
    throw new Error("FAIL: No published dates parsed (all are undefined).");
  }

  // Test 4: Pages Parser
  console.log("\nTesting pages.html...");
  const pagesHtml = fs.readFileSync(path.join(FIXTURES_DIR, "pages.html"), "utf-8");
  const pages = parser.parsePages(pagesHtml);
  console.log(`Parsed ${pages.length} page image URLs.`);
  
  if (pages.length === 0) {
    throw new Error("FAIL: Pages list is empty.");
  }

  console.log("Page URLs sample:");
  pages.slice(0, 3).forEach((p, idx) => console.log(`  Page ${idx+1}: ${p}`));

  // Assert all URLs start with https://
  for (const page of pages) {
    if (!page.startsWith("https://")) {
      throw new Error(`FAIL: Page URL does not start with https:// -> ${page}`);
    }
  }

  // Assert no duplicates
  const uniquePages = new Set(pages);
  if (uniquePages.size !== pages.length) {
    throw new Error("FAIL: Duplicate page URLs found.");
  }

  console.log("\n=== ALL PARSER TESTS PASSED SUCCESSFULLY! ===");
}

runParserTests().catch(err => {
  console.error("Test execution failed:", err);
  process.exit(1);
});
