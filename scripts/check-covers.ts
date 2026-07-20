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
    console.log("Querying first 10 manga with non-null cover images...");
    const manga = await sql`
      SELECT id, title, slug, cover_image 
      FROM manga 
      WHERE cover_image IS NOT NULL 
      LIMIT 20
    `;
    console.log("Manga covers:");
    console.log(JSON.stringify(manga, null, 2));

    console.log("\nChecking manga_provider links for these manga...");
    for (const m of manga) {
      const providers = await sql`
        SELECT provider, provider_manga_id, cover_image
        FROM manga_provider
        WHERE manga_id = ${m.id}
      `;
      console.log(`Manga "${m.title}" providers:`, providers);
    }
  } catch (error) {
    console.error("Query failed:", error);
  } finally {
    await sql.end();
  }
}

run();
