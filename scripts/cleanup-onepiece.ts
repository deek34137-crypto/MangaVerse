import * as dotenv from "dotenv";
import * as path from "path";

dotenv.config({ path: path.resolve(process.cwd(), ".env") });

async function clean() {
  console.log("=== Cleaning up One Piece records from database ===");

  const { db } = await import("../src/db");
  const { manga: mangaTable, chapters: chaptersTable, mangaProvider: mangaProviderTable } = await import("../src/db/schema");
  const { eq, or } = await import("drizzle-orm");

  try {
    const onepieces = await db
      .select()
      .from(mangaTable)
      .where(or(
        eq(mangaTable.title, "One Piece"),
        eq(mangaTable.slug, "one-piece")
      ));

    console.log(`Found ${onepieces.length} One Piece manga records in database.`);

    for (const op of onepieces) {
      console.log(`Deleting chapters and provider links for Manga ID: ${op.id}...`);
      await db.delete(chaptersTable).where(eq(chaptersTable.mangaId, op.id));
      await db.delete(mangaProviderTable).where(eq(mangaProviderTable.mangaId, op.id));
      await db.delete(mangaTable).where(eq(mangaTable.id, op.id));
      console.log(`Deleted Manga ID: ${op.id}`);
    }

    console.log("=== Database Cleanup Finished ===");
  } catch (err) {
    console.error("Cleanup failed:", err);
  }
}

clean().then(() => process.exit(0));
