import postgres from "postgres";
import * as dotenv from "dotenv";
import * as path from "path";

// Load environment variables from .env
dotenv.config({ path: path.resolve(process.cwd(), ".env") });

const directUrl = process.env.DIRECT_URL;

if (!directUrl) {
  console.error("DIRECT_URL is not set in the environment!");
  process.exit(1);
}

console.log("Connecting to database via DIRECT_URL...");
const sql = postgres(directUrl, { ssl: "require" });

async function run() {
  try {
    console.log("Starting migration...");

    // 1. Drop existing unique index if it exists
    console.log("Dropping chapters_manga_number_idx constraint/index...");
    await sql`ALTER TABLE chapters DROP CONSTRAINT IF EXISTS chapters_manga_number_idx;`;
    await sql`DROP INDEX IF EXISTS chapters_manga_number_idx;`;

    // 2. Add columns if they do not exist
    console.log("Adding provider and provider_chapter_id columns...");
    await sql`ALTER TABLE chapters ADD COLUMN IF NOT EXISTS provider varchar(50) DEFAULT 'mangadex' NOT NULL;`;
    await sql`ALTER TABLE chapters ADD COLUMN IF NOT EXISTS provider_chapter_id varchar(255);`;

    // 3. Populate provider_chapter_id for existing rows
    console.log("Populating provider_chapter_id with id...");
    await sql`UPDATE chapters SET provider_chapter_id = id::text WHERE provider_chapter_id IS NULL;`;

    // 4. Alter provider_chapter_id to be NOT NULL
    console.log("Setting provider_chapter_id to NOT NULL...");
    await sql`ALTER TABLE chapters ALTER COLUMN provider_chapter_id SET NOT NULL;`;

    // 5. Create new unique index on (provider, provider_chapter_id)
    console.log("Creating chapters_provider_chapter_idx unique index...");
    await sql`CREATE UNIQUE INDEX IF NOT EXISTS chapters_provider_chapter_idx ON chapters (provider, provider_chapter_id);`;

    // 6. Re-create chapters_manga_number_idx as a non-unique index
    console.log("Creating chapters_manga_number_idx non-unique index...");
    await sql`CREATE INDEX IF NOT EXISTS chapters_manga_number_idx ON chapters (manga_id, number, language);`;

    console.log("Migration completed successfully!");
  } catch (error) {
    console.error("Migration failed:", error);
    process.exit(1);
  } finally {
    await sql.end();
  }
}

run();
