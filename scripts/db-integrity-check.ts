import postgres from "postgres";
import * as dotenv from "dotenv";
import * as path from "path";

dotenv.config({ path: path.resolve(process.cwd(), ".env") });
const directUrl = process.env.DIRECT_URL;

if (!directUrl) {
  console.error("DIRECT_URL environment variable is missing!");
  process.exit(1);
}

const sql = postgres(directUrl, { ssl: "require" });

async function runChecks() {
  console.log("=== Running Database Integrity Checks ===");
  let hasErrors = false;

  try {
    // 1. Duplicate Canonical Manga (by slug)
    console.log("\nChecking for duplicate canonical manga slugs...");
    const dupSlugs = await sql`
      SELECT slug, COUNT(*) 
      FROM manga 
      WHERE slug IS NOT NULL 
      GROUP BY slug 
      HAVING COUNT(*) > 1
    `;
    if (dupSlugs.length > 0) {
      console.error(`❌ FAIL: Found duplicate manga slugs:`, dupSlugs);
      hasErrors = true;
    } else {
      console.log("✅ PASS: No duplicate manga slugs found.");
    }

    // 2. Duplicate Canonical Chapters (by manga_id + number)
    console.log("\nChecking for duplicate canonical chapters (manga_id + number)...");
    const dupChapters = await sql`
      SELECT manga_id, number, COUNT(*) 
      FROM chapters 
      WHERE number IS NOT NULL 
      GROUP BY manga_id, number 
      HAVING COUNT(*) > 1
    `;
    if (dupChapters.length > 0) {
      console.error(`❌ FAIL: Found duplicate canonical chapters:`, dupChapters);
      hasErrors = true;
    } else {
      console.log("✅ PASS: No duplicate canonical chapters found.");
    }

    // 3. Orphan Provider Mappings (manga_provider points to missing manga)
    console.log("\nChecking for orphan manga_provider mappings...");
    const orphanMangaProviders = await sql`
      SELECT mp.id, mp.provider, mp.provider_manga_id, mp.manga_id 
      FROM manga_provider mp 
      LEFT JOIN manga m ON mp.manga_id = m.id 
      WHERE m.id IS NULL
    `;
    if (orphanMangaProviders.length > 0) {
      console.error(`❌ FAIL: Found orphan manga_provider mappings:`, orphanMangaProviders);
      hasErrors = true;
    } else {
      console.log("✅ PASS: No orphan manga_provider mappings.");
    }

    // 4. Orphan Provider Mappings (chapter_provider points to missing chapter)
    console.log("\nChecking for orphan chapter_provider mappings...");
    const orphanChapterProviders = await sql`
      SELECT cp.id, cp.provider, cp.provider_chapter_id, cp.chapter_id 
      FROM chapter_provider cp 
      LEFT JOIN chapters c ON cp.chapter_id = c.id 
      WHERE c.id IS NULL
    `;
    if (orphanChapterProviders.length > 0) {
      console.error(`❌ FAIL: Found orphan chapter_provider mappings (limit 10):`, orphanChapterProviders.slice(0, 10));
      hasErrors = true;
    } else {
      console.log("✅ PASS: No orphan chapter_provider mappings.");
    }

    // 5. Invalid Chapter Numbers (check NaN or null when they shouldn't be, or negative values)
    console.log("\nChecking for invalid chapter numbers...");
    const invalidChapters = await sql`
      SELECT id, manga_id, number 
      FROM chapters 
      WHERE number IS NOT NULL AND (number < 0 OR number::text = 'NaN')
    `;
    if (invalidChapters.length > 0) {
      console.error(`❌ FAIL: Found invalid chapter numbers:`, invalidChapters);
      hasErrors = true;
    } else {
      console.log("✅ PASS: No negative or NaN chapter numbers found.");
    }

    // 6. Broken Foreign Keys (chapters pointing to missing manga)
    console.log("\nChecking for chapters with missing manga foreign key...");
    const orphanChapters = await sql`
      SELECT c.id, c.manga_id, c.number 
      FROM chapters c 
      LEFT JOIN manga m ON c.manga_id = m.id 
      WHERE m.id IS NULL
    `;
    if (orphanChapters.length > 0) {
      console.error(`❌ FAIL: Found chapters pointing to non-existent manga:`, orphanChapters);
      hasErrors = true;
    } else {
      console.log("✅ PASS: No chapters with missing manga foreign keys.");
    }

    console.log("\n=== Database Integrity Integrity Check Summary ===");
    if (hasErrors) {
      console.error("❌ Overall DB Validation: FAILED (integrity errors present)");
      process.exit(1);
    } else {
      console.log("✅ Overall DB Validation: PASSED successfully!");
    }

  } catch (err) {
    console.error("DB Integrity script failed with error:", err);
    process.exit(1);
  } finally {
    await sql.end();
  }
}

runChecks();
