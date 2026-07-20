import * as dotenv from "dotenv";
import * as path from "path";

// Load env variables immediately
dotenv.config({ path: path.resolve(process.cwd(), ".env") });

async function run() {
  console.log("=== Starting Aggregation Ingestion Test ===");

  const { syncManga, syncChapters } = await import("../src/services/manga/sync");
  const { providerRegistry } = await import("../src/services/providers");
  const { db } = await import("../src/db");
  const { manga: mangaTable, mangaProvider: mangaProviderTable, chapters: chaptersTable } = await import("../src/db/schema");
  const { eq } = await import("drizzle-orm");

  try {
    // 1. Initialise provider registry
    console.log("Initialising providers...");
    await providerRegistry.initializeAll();

    // 2. Fetch manga from MangaDex first
    const mangadexMangaId = "a77742b1-befd-49a4-bff5-1ad4e6b0ef7b"; // Chainsaw Man MangaDex ID
    console.log(`\n--- Step 1: Syncing Chainsaw Man from MangaDex (${mangadexMangaId}) ---`);
    const canonicalId1 = await syncManga("mangadex", mangadexMangaId);
    console.log(`Canonical Manga ID created/linked: ${canonicalId1}`);

    // Query canonical details from DB
    const [mangaRecord1] = await db.select().from(mangaTable).where(eq(mangaTable.id, canonicalId1)).limit(1);
    console.log(`Title in DB: "${mangaRecord1?.title}"`);
    console.log(`Slug in DB: "${mangaRecord1?.slug}"`);

    // Check linked providers
    const providers1 = await db.select().from(mangaProviderTable).where(eq(mangaProviderTable.mangaId, canonicalId1));
    console.log("Linked providers in DB:", providers1.map(p => p.provider));

    // 3. Search and Sync from ComicK to verify deduplication & merging
    console.log(`\n--- Step 2: Ingesting Chainsaw Man from ComicK ---`);
    const comickProvider = providerRegistry.get("comick");

    // Mock provider methods to bypass Cloudflare WAF on test environment
    comickProvider.searchManga = async (query: string) => {
      console.log(`[Mock ComicK] searchManga called for "${query}"`);
      return [
        {
          id: "comick-chainsaw-man-hid",
          title: "Chainsaw Man",
          altTitles: ["Chainsawman", "チェンソーマン"],
          description: "Denji is a teenage boy living with a Chainsaw Devil named Pochita...",
          coverImage: "https://images.comick.cc/covers/chainsaw-man.jpg",
          status: "ongoing",
          type: "manga",
          genres: ["Action", "Comedy", "Drama", "Horror", "Supernatural"],
          tags: [],
          authors: ["Tatsuki Fujimoto"],
          artists: ["Tatsuki Fujimoto"],
          year: 2018,
          rawMetadata: { mock: true },
        }
      ];
    };

    comickProvider.getMangaDetail = async (id: string) => {
      console.log(`[Mock ComicK] getMangaDetail called for "${id}"`);
      return {
        id: "comick-chainsaw-man-hid",
        title: "Chainsaw Man",
        altTitles: ["Chainsawman", "チェンソーマン"],
        description: "Denji is a teenage boy living with a Chainsaw Devil named Pochita...",
        coverImage: "https://images.comick.cc/covers/chainsaw-man.jpg",
        status: "ongoing",
        type: "manga",
        genres: ["Action", "Comedy", "Drama", "Horror", "Supernatural"],
        tags: [],
        authors: ["Tatsuki Fujimoto"],
        artists: ["Tatsuki Fujimoto"],
        year: 2018,
        rawMetadata: { mock: true },
      };
    };

    comickProvider.getChapters = async (id: string) => {
      console.log(`[Mock ComicK] getChapters called for "${id}"`);
      return [
        {
          id: "comick-ch-1",
          number: 1,
          volume: 1,
          title: "Dog & Chainsaw",
          language: "en",
          displayNumber: "1",
          publishedAt: new Date(),
          scanlatorGroups: ["VIZ Media"],
          rawMetadata: { mock: true },
        }
      ];
    };

    console.log("Searching ComicK for 'Chainsaw Man'...");
    const comickSearch = await comickProvider.searchManga("Chainsaw Man", { limit: 5 });
    
    if (comickSearch.length === 0) {
      throw new Error("Could not find Chainsaw Man on ComicK search");
    }

    const bestComickMatch = comickSearch[0];
    console.log(`Best match from ComicK: "${bestComickMatch.title}" (ID: ${bestComickMatch.id})`);

    console.log(`Syncing match from ComicK to database...`);
    const canonicalId2 = await syncManga("comick", bestComickMatch.id);
    console.log(`Canonical Manga ID after ComicK sync: ${canonicalId2}`);

    if (canonicalId1 === canonicalId2) {
      console.log("SUCCESS: ComicK manga was correctly deduplicated and mapped to the same canonical record!");
    } else {
      console.warn("WARNING: ComicK manga was NOT matched to the same canonical record (created duplicate).");
    }

    // Query canonical details again to verify merging
    const [mangaRecord2] = await db.select().from(mangaTable).where(eq(mangaTable.id, canonicalId2)).limit(1);
    console.log(`Title in DB now: "${mangaRecord2?.title}"`);
    
    const providers2 = await db.select().from(mangaProviderTable).where(eq(mangaProviderTable.mangaId, canonicalId2));
    console.log("Linked providers in DB now:", providers2.map(p => p.provider));

    // 4. Sync Chapters
    console.log(`\n--- Step 3: Syncing Chapters ---`);
    console.log(`Running syncChapters for Manga ID: ${canonicalId2}...`);
    const chapters = await syncChapters(canonicalId2);
    console.log(`Chapters Sync complete. Total provider chapters synced: ${chapters.length}`);

    const allChapters = await db.select().from(chaptersTable).where(eq(chaptersTable.mangaId, canonicalId2));
    console.log(`Canonical chapters in DB count: ${allChapters.length} (Sample:`, allChapters.slice(0, 5).map(c => `Ch ${c.number} (SortKey: ${c.sortKey})`), ")");

    console.log("\n=== Ingestion Test Completed Successfully ===");
  } catch (err) {
    console.error("\n!!! Ingestion Test Failed with Error:", err);
  } finally {
    await providerRegistry.shutdownAll();
  }
}

run().then(() => process.exit(0));
