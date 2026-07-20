import postgres from "postgres";
import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.resolve(process.cwd(), ".env") });

const directUrl = process.env.DIRECT_URL || process.env.DATABASE_URL;

async function run() {
  if (!directUrl) {
    console.error("DIRECT_URL or DATABASE_URL not set in .env");
    process.exit(1);
  }

  console.log("Connecting directly to database via directUrl...");
  const sql = postgres(directUrl, { prepare: false });
  try {
    console.log("Recalculating all genre counts...");
    await sql`
      UPDATE genres g
      SET manga_count = COALESCE(sub.cnt, 0)
      FROM (
        SELECT g.id, COUNT(mg.manga_id) as cnt
        FROM genres g
        LEFT JOIN manga_genres mg ON mg.genre_id = g.id
        GROUP BY g.id
      ) sub
      WHERE g.id = sub.id
    `;
    console.log(`✓ Updated genres counts`);

    console.log("Recalculating all tags counts...");
    await sql`
      UPDATE tags t
      SET manga_count = COALESCE(sub.cnt, 0)
      FROM (
        SELECT t.id, COUNT(mt.manga_id) as cnt
        FROM tags t
        LEFT JOIN manga_tags mt ON mt.tag_id = t.id
        GROUP BY t.id
      ) sub
      WHERE t.id = sub.id
    `;
    console.log(`✓ Updated tags counts`);

    console.log("Recalculating all authors counts...");
    await sql`
      UPDATE authors a
      SET manga_count = COALESCE(sub.cnt, 0)
      FROM (
        SELECT a.id, COUNT(ma.manga_id) as cnt
        FROM authors a
        LEFT JOIN manga_authors ma ON ma.author_id = a.id
        GROUP BY a.id
      ) sub
      WHERE a.id = sub.id
    `;
    console.log(`✓ Updated authors counts`);

    console.log("Recalculating all artists counts...");
    await sql`
      UPDATE artists a
      SET manga_count = COALESCE(sub.cnt, 0)
      FROM (
        SELECT a.id, COUNT(ma.manga_id) as cnt
        FROM artists a
        LEFT JOIN manga_artists ma ON ma.artist_id = a.id
        GROUP BY a.id
      ) sub
      WHERE a.id = sub.id
    `;
    console.log(`✓ Updated artists counts`);

    console.log("🎉 Recalculation complete!");
  } catch (err) {
    console.error("Recalculation failed:", err);
  } finally {
    await sql.end();
  }
}

run();
