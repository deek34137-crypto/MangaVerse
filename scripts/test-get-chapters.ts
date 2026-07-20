import * as dotenv from "dotenv";
import * as path from "path";

dotenv.config({ path: path.resolve(process.cwd(), ".env") });

async function run() {
  const { getChaptersDetail } = await import("../src/services/manga");
  const mangaId = "a77742b1-befd-49a4-bff5-1ad4e6b0ef7b"; // Chainsaw Man (Main)
  
  console.log(`Calling getChaptersDetail for ${mangaId}...`);
  try {
    const chapters = await getChaptersDetail(mangaId);
    console.log(`Result: Returned ${chapters.length} chapters.`);
  } catch (error) {
    console.error("Failed with error:", error);
  }
}

run().then(() => process.exit(0));
