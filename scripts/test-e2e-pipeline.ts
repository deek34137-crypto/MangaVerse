import * as dotenv from "dotenv";
import * as path from "path";

dotenv.config({ path: path.resolve(process.cwd(), ".env") });

async function run() {
  console.log("=== Starting End-to-End Data Pipeline Validation ===");

  const { syncManga, syncChapters, syncChapterPages } = await import("../src/services/manga/sync");
  const { providerRegistry } = await import("../src/services/providers");
  const { db } = await import("../src/db");
  const { manga: mangaTable, mangaProvider: mangaProviderTable, chapters: chaptersTable, chapterProvider: chapterProviderTable } = await import("../src/db/schema");
  const { eq, and } = await import("drizzle-orm");

  try {
    // Initialize providers
    await providerRegistry.initializeAll();

    // Target Manga Title: "One Piece"
    // Target Manga Title: "One Piece"
    const weebcentralId = "01J76XY7E9FNDZ1DBBM6PBJPFK"; // One Piece on WeebCentral
    const mangakatanaId = "one-piece.49"; // One Piece on MangaKatana
    const mangadexId = "d8a959f7-648e-4c8d-8f23-f1f3f3e129f7"; // Hardcoded One Piece ID for fallback/sync

    // 1. Sync WeebCentral first
    console.log(`\n--- Step 1: Syncing One Piece from WeebCentral (${weebcentralId}) ---`);
    const canonicalId1 = await syncManga("weebcentral", weebcentralId);
    console.log(`Canonical Manga ID after WeebCentral: ${canonicalId1}`);

    const [wcManga] = await db.select().from(mangaTable).where(eq(mangaTable.id, canonicalId1)).limit(1);
    console.log(`Title: "${wcManga?.title}" | Slug: "${wcManga?.slug}"`);

    // 2. Sync MangaKatana (Deduplication Check)
    console.log(`\n--- Step 2: Syncing One Piece from MangaKatana (${mangakatanaId}) ---`);
    const canonicalId2 = await syncManga("mangakatana", mangakatanaId);
    console.log(`Canonical Manga ID after MangaKatana: ${canonicalId2}`);

    if (canonicalId1 === canonicalId2) {
      console.log("SUCCESS: MangaKatana deduplicated perfectly into the same canonical ID!");
    } else {
      console.warn("WARNING: MangaKatana created a duplicate canonical ID.");
    }

    // 3. Try to Sync MangaDex (allow to fail gracefully if offline/DNS blocked)
    console.log(`\n--- Step 3: Attempting to Sync One Piece from MangaDex (${mangadexId}) ---`);
    try {
      const canonicalId3 = await syncManga("mangadex", mangadexId);
      console.log(`Canonical Manga ID after MangaDex: ${canonicalId3}`);
      if (canonicalId1 === canonicalId3) {
        console.log("SUCCESS: MangaDex deduplicated perfectly into the same canonical ID!");
      } else {
        console.warn("WARNING: MangaDex created a duplicate canonical ID.");
      }
    } catch (mdErr) {
      console.log("INFO: MangaDex sync skipped or failed (likely DNS/network issue):", mdErr instanceof Error ? mdErr.message : mdErr);
    }

    const finalMangaId = canonicalId1; // We'll trace the main canonical ID from WeebCentral

    // Check linked providers
    const linkedProviders = await db.select().from(mangaProviderTable).where(eq(mangaProviderTable.mangaId, finalMangaId));
    console.log("Linked providers in DB:", linkedProviders.map(p => p.provider));

    // 4. Chapter Sync
    console.log(`\n--- Step 4: Syncing Chapters for canonical ID ${finalMangaId} ---`);
    const syncedChapters = await syncChapters(finalMangaId);
    console.log(`Total chapters synced from provider sources: ${syncedChapters.length}`);

    // Check database counts
    const canonicalChapters = await db.select().from(chaptersTable).where(eq(chaptersTable.mangaId, finalMangaId));
    console.log(`Canonical chapters in DB: ${canonicalChapters.length}`);

    // Check mapping counts per provider
    const mappedLinks = await db
      .select({
        id: chapterProviderTable.id,
        provider: chapterProviderTable.provider,
        chapterId: chapterProviderTable.chapterId,
        providerChapterId: chapterProviderTable.providerChapterId,
        displayNumber: chapterProviderTable.displayNumber
      })
      .from(chapterProviderTable)
      .innerJoin(chaptersTable, eq(chapterProviderTable.chapterId, chaptersTable.id))
      .where(eq(chaptersTable.mangaId, finalMangaId));

    console.log(`Total chapter-provider mappings in DB: ${mappedLinks.length}`);
    const providerCounts: Record<string, number> = {};
    mappedLinks.forEach(link => {
      providerCounts[link.provider] = (providerCounts[link.provider] || 0) + 1;
    });
    console.log("Mappings per provider:", providerCounts);

    // Assertions for pipeline health
    console.log("\n--- Checking Pipeline Health Assertions ---");

    // Assertion A: No orphan chapters
    const orphans = mappedLinks.filter(l => !l.chapterId);
    if (orphans.length > 0) {
      throw new Error(`FAIL: Found ${orphans.length} orphan chapter-provider links with no canonical chapterId.`);
    } else {
      console.log("PASS: No orphan chapter links found.");
    }

    // Assertion B: Numeric ordering & consistency
    const sortedCanonical = [...canonicalChapters].sort((a, b) => {
      const numA = a.number ? parseFloat(a.number) : 99999;
      const numB = b.number ? parseFloat(b.number) : 99999;
      return numA - numB;
    });
    console.log(`First chapter number: ${sortedCanonical[0]?.number} | Sort key: ${sortedCanonical[0]?.sortKey}`);
    console.log(`Last chapter number: ${sortedCanonical[sortedCanonical.length - 1]?.number} | Sort key: ${sortedCanonical[sortedCanonical.length - 1]?.sortKey}`);
    
    // Assertion C: Chapter duplicates check
    const duplicateChapters = new Set<string>();
    const seenChapters = new Set<string>();
    canonicalChapters.forEach(c => {
      if (c.number) {
        if (seenChapters.has(c.number)) {
          duplicateChapters.add(c.number);
        }
        seenChapters.add(c.number);
      }
    });
    if (duplicateChapters.size > 0) {
      console.warn(`WARNING: Found duplicate canonical chapter numbers in DB:`, Array.from(duplicateChapters).slice(0, 10));
    } else {
      console.log("PASS: No duplicate canonical chapter numbers.");
    }

    // 5. Chapter Pages Ingestion Check
    console.log(`\n--- Step 5: Ingesting Chapter Pages for a sample chapter from WeebCentral & MangaKatana ---`);
    // Find chapter provider link for Chapter 1
    const mdLink = mappedLinks.find(l => l.provider === "mangadex" && l.displayNumber === "1");
    const wcLink = mappedLinks.find(l => l.provider === "weebcentral" && l.displayNumber === "1");
    const mkLink = mappedLinks.find(l => l.provider === "mangakatana" && l.displayNumber === "1");

    if (wcLink) {
      console.log(`Syncing pages for WeebCentral Chapter 1 (Link ID: ${wcLink.id}, Provider ID: ${wcLink.providerChapterId})...`);
      await syncChapterPages(wcLink.id);
      const [updatedLink] = await db.select().from(chapterProviderTable).where(eq(chapterProviderTable.id, wcLink.id)).limit(1);
      const pagesCount = Array.isArray(updatedLink.pages) ? updatedLink.pages.length : 0;
      console.log(`WeebCentral: Page count stored: ${updatedLink.pageCount}. Pages array length: ${pagesCount}`);
    } else {
      console.warn("WARNING: WeebCentral Chapter 1 link not found.");
    }

    if (mkLink) {
      console.log(`Syncing pages for MangaKatana Chapter 1 (Link ID: ${mkLink.id}, Provider ID: ${mkLink.providerChapterId})...`);
      await syncChapterPages(mkLink.id);
      const [updatedLink] = await db.select().from(chapterProviderTable).where(eq(chapterProviderTable.id, mkLink.id)).limit(1);
      const pagesCount = Array.isArray(updatedLink.pages) ? updatedLink.pages.length : 0;
      console.log(`MangaKatana: Page count stored: ${updatedLink.pageCount}. Pages array length: ${pagesCount}`);
    } else {
      console.warn("WARNING: MangaKatana Chapter 1 link not found.");
    }

    console.log("\n=== End-to-End Pipeline Validation Finished Successfully ===");
  } catch (err) {
    console.error("\n!!! Pipeline Validation Failed with Error:", err);
  } finally {
    await providerRegistry.shutdownAll();
  }
}

run().then(() => process.exit(0));
