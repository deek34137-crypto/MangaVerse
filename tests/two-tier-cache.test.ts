import "dotenv/config";
import { cacheGet, cacheSet, cacheDel, invalidateMangaCache, invalidateChapterCache } from "../src/services/cache";

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
  console.log("\n=== Suite: Two-Tier Cache & Invalidation Tests ===");

  // Test 1: Basic SET and GET (L1/L2)
  {
    const key = "test:item:1";
    const value = { id: "1", title: "Test Item" };
    await cacheSet(key, value, 60);

    const retrieved = await cacheGet<typeof value>(key);
    assert("cacheSet & cacheGet retrieve stored object", retrieved?.title === "Test Item", `Got ${JSON.stringify(retrieved)}`);
  }

  // Test 2: Invalidation with cacheDel
  {
    const key = "test:item:2";
    await cacheSet(key, "data", 60);
    await cacheDel(key);

    const retrieved = await cacheGet<string>(key);
    assert("cacheDel purges key from cache", retrieved === null, `Got ${retrieved}`);
  }

  // Test 3: Manga cache invalidation helper
  {
    const mangaId = "manga-test-100";
    const slug = "manga-test-slug";
    await cacheSet(`manga:detail:${mangaId}`, { title: "Manga Test" }, 60);
    await cacheSet(`manga:detail:${slug}`, { title: "Manga Test" }, 60);
    await cacheSet(`manga:chapters:${mangaId}`, [{ id: "c1" }], 60);

    await invalidateMangaCache(mangaId, slug);

    const detail = await cacheGet(`manga:detail:${mangaId}`);
    const slugDetail = await cacheGet(`manga:detail:${slug}`);
    const chapters = await cacheGet(`manga:chapters:${mangaId}`);

    assert("invalidateMangaCache purges detail by ID", detail === null);
    assert("invalidateMangaCache purges detail by Slug", slugDetail === null);
    assert("invalidateMangaCache purges chapters list", chapters === null);
  }

  // Test 4: Chapter page invalidation helper
  {
    const chapterId = "ch-test-200";
    await cacheSet(`chapter:detail:${chapterId}`, { pages: [{ url: "p1.png" }] }, 60);

    await invalidateChapterCache(chapterId);

    const detail = await cacheGet(`chapter:detail:${chapterId}`);
    assert("invalidateChapterCache purges chapter detail & pages", detail === null);
  }

  console.log(`\nTwo-Tier Cache Tests Complete: ${passed} Passed, ${failed} Failed\n`);
  if (failed > 0) process.exit(1);
  process.exit(0);
}

main().catch((err) => {
  console.error("Cache test error:", err);
  process.exit(1);
});
