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

async function check() {
  try {
    console.log("Searching for manga containing 'Chainsaw'...");
    const manga = await sql`SELECT id, title, rating, follow_count, chapter_count FROM manga WHERE title ILIKE '%Chainsaw%'`;
    console.log("Manga Rows:", JSON.stringify(manga, null, 2));

    if (manga.length > 0) {
      for (const m of manga) {
        const chapters = await sql`SELECT count(*) FROM chapters WHERE manga_id = ${m.id}`;
        console.log(`Manga ID ${m.id} (${m.title}) has ${chapters[0].count} chapters in DB.`);
      }
    }
  } catch (error) {
    console.error("Query failed:", error);
  } finally {
    await sql.end();
  }
}

check();
