import { db } from "@/db";
import { manga as mangaTable } from "@/db/schema";
import { eq } from "drizzle-orm";

export function generateBaseSlug(title: string): string {
  return title
    .toLowerCase()
    .normalize("NFD") // Decompose diacritics
    .replace(/[\u0300-\u036f]/g, "") // Remove diacritics
    .replace(/[^\w\s-]/g, "") // Remove non-word characters (except spaces and hyphens)
    .replace(/\s+/g, "-") // Replace spaces with hyphens
    .replace(/-+/g, "-") // Collapse consecutive hyphens
    .replace(/^-+|-+$/g, "") // Trim leading/trailing hyphens
    .slice(0, 100); // Sensible maximum length limit
}

export async function generateUniqueSlug(title: string): Promise<string> {
  const baseSlug = generateBaseSlug(title);
  let potentialSlug = baseSlug || "manga";
  let counter = 1;

  while (true) {
    const existing = await db
      .select({ id: mangaTable.id })
      .from(mangaTable)
      .where(eq(mangaTable.slug, potentialSlug))
      .limit(1);

    if (existing.length === 0) {
      return potentialSlug;
    }

    counter++;
    potentialSlug = `${baseSlug}-${counter}`;
  }
}
export default generateUniqueSlug;
