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
    const mangaCountRes = await sql`SELECT count(*) FROM manga`;
    const providerCountRes = await sql`SELECT count(*) FROM manga_provider`;
    console.log(`Manga Count in DB: ${mangaCountRes[0].count}`);
    console.log(`Manga Provider Mappings Count in DB: ${providerCountRes[0].count}`);

    if (parseInt(providerCountRes[0].count) === 0) {
      console.log("WARNING: manga_provider table is completely empty!");
    } else {
      console.log("Some mappings exist. Fetching a few mapping samples...");
      const samples = await sql`SELECT * FROM manga_provider LIMIT 5`;
      console.log(JSON.stringify(samples, null, 2));
    }
  } catch (error) {
    console.error("Query failed:", error);
  } finally {
    await sql.end();
  }
}

run();
