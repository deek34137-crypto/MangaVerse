import postgres from "postgres";
import * as dotenv from "dotenv";
import * as path from "path";

dotenv.config({ path: path.resolve(process.cwd(), ".env") });
const directUrl = process.env.DIRECT_URL;

if (!directUrl) {
  console.error("DIRECT_URL is not set!");
  process.exit(1);
}

const sql = postgres(directUrl, { ssl: "require" });

async function run() {
  try {
    // Dynamic import to avoid early database connection setup
    const { syncChapters } = await import("../src/services/manga/sync");

    console.log("Fetching all manga in the database...");
    const mangas = await sql`SELECT id, title FROM manga`;
    console.log(`Found ${mangas.length} manga entries in DB.`);

    for (const m of mangas) {
      const chaptersCountRes = await sql`SELECT count(*) FROM chapters WHERE manga_id = ${m.id}`;
      const count = parseInt(chaptersCountRes[0].count, 10);
      
      if (count === 0) {
        console.log(`Syncing chapters for "${m.title}" (${m.id})...`);
        try {
          const synced = await syncChapters(m.id);
          console.log(`Successfully synced ${synced.length} chapters for "${m.title}".`);
        } catch (syncErr) {
          console.error(`Failed to sync chapters for "${m.title}":`, syncErr);
        }
      } else {
        console.log(`"${m.title}" already has ${count} chapters. Skipping.`);
      }
    }

    console.log("All empty manga chapter syncs complete!");
  } catch (error) {
    console.error("Failed to run sync script:", error);
  } finally {
    await sql.end();
  }
}

run().then(() => process.exit(0));
