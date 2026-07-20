import * as dotenv from "dotenv";
import * as path from "path";

dotenv.config({ path: path.resolve(process.cwd(), ".env") });

async function run() {
  const { syncChapters } = await import("../src/services/manga/sync");
  const { getMangaFeed } = await import("../src/services/mangadex/manga");
  const mangaId = "a77742b1-befd-49a4-bff5-1ad4e6b0ef7b"; // Chainsaw Man (Main)
  console.log(`Testing feed fetch for ${mangaId}...`);
  try {
    const feed = await getMangaFeed(mangaId, {
      limit: 10,
      offset: 0,
      order: { chapter: "asc" },
    });
    // Let's also fetch a general request without any params just to be sure
    const rawFeedUrl = `https://api.mangadex.org/manga/${mangaId}/feed`;
    console.log("Fetching raw feed from:", rawFeedUrl);
    const res = await fetch(rawFeedUrl);
    const json = await res.json();
    console.log("Raw Feed Total:", json.total);
    if (json.data && json.data.length > 0) {
      console.log("Available languages in raw feed:", Array.from(new Set(json.data.map((d: any) => d.attributes.translatedLanguage))));
    }
    console.log("Feed Total:", feed.total);
    console.log("Feed Data Length:", feed.data?.length);
    if (feed.data?.length > 0) {
      console.log("First item sample:", JSON.stringify(feed.data[0], null, 2));
    }

    console.log("Running syncChapters...");
    const synced = await syncChapters(mangaId);
    console.log(`syncChapters returned ${synced.length} chapters.`);
  } catch (error) {
    console.error("Test failed with error:", error);
  }
}

run().then(() => process.exit(0));
