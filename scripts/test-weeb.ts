import "dotenv/config";
import { syncManga, syncChapters } from "../src/services/manga/sync";

async function run() {
  try {
    console.log("=== Starting Sync for One Piece from WeebCentral ===");
    const canonicalId = await syncManga("weebcentral", "01J76XY7E9FNDZ1DBBM6PBJPFK");
    console.log(`Manga sync completed. Canonical ID: ${canonicalId}`);
    
    console.log("=== Syncing Chapters ===");
    await syncChapters(canonicalId);
    console.log("Chapter sync completed successfully!");
  } catch (err) {
    console.error("Sync failed:", err);
  }
}

run();
