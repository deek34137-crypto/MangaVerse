import "dotenv/config";
import { db } from "../src/db";
import { manga as mangaTable, chapters as chaptersTable, chapterProvider as chapterProviderTable } from "../src/db/schema";
import { getMangaDetail, getChaptersDetail, getChapterDetail } from "../src/services/manga";
import { cacheGet, cacheSet, invalidateMangaCache } from "../src/services/cache";
import { eq } from "drizzle-orm";

let passed = 0;
let failed = 0;

function assert(label: string, condition: boolean, details?: string) {
  if (condition) {
    console.log(`  ✅ [PASS] ${label}`);
    passed++;
  } else {
    console.error(`  ❌ [FAIL] ${label}${details ? ` — ${details}` : ""}`);
    failed++;
  }
}

async function main() {
  console.log("\n=== Suite: Integration Tests (Sync Pipeline -> Reader API -> Cache Promotion) ===");

  // 1. Fetch a target manga from DB
  const mangas = await db.select().from(mangaTable).limit(1);
  if (mangas.length === 0) {
    console.error("No manga found in DB for integration test.");
    process.exit(1);
  }

  const targetManga = mangas[0];
  console.log(`Target Manga: "${targetManga.title}" (${targetManga.id})`);

  // Test 1: getMangaDetail Integration & Cache Population
  {
    await invalidateMangaCache(targetManga.id, targetManga.slug || undefined);
    const detail = await getMangaDetail(targetManga.id);
    assert("getMangaDetail returns valid manga record with relations", detail && detail.id === targetManga.id);

    // Verify L1/L2 Cache Population
    const cachedDetail = await cacheGet<any>(`manga:detail:${targetManga.id}`);
    assert("getMangaDetail populates Redis/Memory cache", cachedDetail && cachedDetail.id === targetManga.id);
  }

  // Test 2: getChaptersDetail Integration
  {
    const chapters = await getChaptersDetail(targetManga.id);
    assert("getChaptersDetail returns chapter list array", Array.isArray(chapters) && chapters.length > 0);

    const cachedChapters = await cacheGet<any[]>(`manga:chapters:${targetManga.id}`);
    assert("getChaptersDetail populates Redis/Memory chapter cache", Array.isArray(cachedChapters) && cachedChapters.length > 0);
  }

  // Test 3: End-to-End Chapter Page Retrieval & Reader Payload
  {
    const chapters = await getChaptersDetail(targetManga.id);
    const sampleChapter = chapters[0];

    const chapterDetail = await getChapterDetail(targetManga.id, sampleChapter.id);
    assert("getChapterDetail returns chapter metadata", chapterDetail && chapterDetail.id === sampleChapter.id);
    assert("getChapterDetail page payload is non-empty array", Array.isArray(chapterDetail?.pages) && chapterDetail.pages.length > 0);
    assert("First page has valid proxied/raw URL", typeof chapterDetail?.pages?.[0]?.url === "string" && chapterDetail.pages[0].url.length > 0);

    // Verify Chapter Detail Cache Promotion
    const cachedChDetail = await cacheGet<any>(`chapter:detail:${sampleChapter.id}`);
    assert("getChapterDetail populates chapter:detail cache key", cachedChDetail && cachedChDetail.pages?.length > 0);
  }

  console.log(`\nIntegration Tests Complete: ${passed} Passed, ${failed} Failed\n`);
  if (failed > 0) process.exit(1);
  process.exit(0);
}

main().catch((err) => {
  console.error("Integration test error:", err);
  process.exit(1);
});
