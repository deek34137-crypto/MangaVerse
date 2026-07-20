"use server";

import { auth } from "@/auth";
import { db } from "@/db";
import { libraryEntries } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import type { LibraryStatus } from "@/types";

const statusSchema = z.enum([
  "reading", "completed", "on_hold", "dropped", "plan_to_read", "rereading",
]);

/* ─── Add / upsert ───────────────────────────────────────────────────────── */
export async function addToLibrary(mangaId: string, status: LibraryStatus) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Unauthorized" };

  const parsed = z.object({ mangaId: z.string().min(1), status: statusSchema })
    .safeParse({ mangaId, status });
  if (!parsed.success) return { error: "Invalid input" };

  try {
    const existing = await db
      .select({ id: libraryEntries.id })
      .from(libraryEntries)
      .where(and(
        eq(libraryEntries.userId, session.user.id),
        eq(libraryEntries.mangaId, mangaId),
      ))
      .limit(1);

    if (existing.length > 0) {
      await db
        .update(libraryEntries)
        .set({ status, updatedAt: new Date() })
        .where(and(
          eq(libraryEntries.userId, session.user.id),
          eq(libraryEntries.mangaId, mangaId),
        ));
    } else {
      await db.insert(libraryEntries).values({
        userId: session.user.id,
        mangaId,
        status,
      });
    }

    revalidatePath("/library");
    revalidatePath(`/manga/${mangaId}`);
    return { success: true };
  } catch (err) {
    console.error("addToLibrary:", err);
    return { error: "Failed to add to library" };
  }
}

/* ─── Remove ─────────────────────────────────────────────────────────────── */
export async function removeFromLibrary(mangaId: string) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Unauthorized" };

  try {
    await db
      .delete(libraryEntries)
      .where(and(
        eq(libraryEntries.userId, session.user.id),
        eq(libraryEntries.mangaId, mangaId),
      ));

    revalidatePath("/library");
    revalidatePath(`/manga/${mangaId}`);
    return { success: true };
  } catch (err) {
    console.error("removeFromLibrary:", err);
    return { error: "Failed to remove from library" };
  }
}

/* ─── Update status ──────────────────────────────────────────────────────── */
export async function updateLibraryStatus(mangaId: string, status: LibraryStatus) {
  return addToLibrary(mangaId, status);
}

/* ─── Update reading progress ────────────────────────────────────────────── */
export async function updateReadingProgress(mangaId: string, chapterId: string) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Unauthorized" };

  const parsed = z.object({
    mangaId:   z.string().min(1),
    chapterId: z.string().min(1),
  }).safeParse({ mangaId, chapterId });
  if (!parsed.success) return { error: "Invalid input" };

  try {
    await db
      .update(libraryEntries)
      .set({
        lastReadChapterId: chapterId,
        lastReadAt: new Date(),
        updatedAt: new Date(),
      })
      .where(and(
        eq(libraryEntries.userId, session.user.id),
        eq(libraryEntries.mangaId, mangaId),
      ));

    revalidatePath(`/manga/${mangaId}`);
    return { success: true };
  } catch (err) {
    console.error("updateReadingProgress:", err);
    return { error: "Failed to update progress" };
  }
}

/* ─── Toggle favourite ───────────────────────────────────────────────────── */
export async function toggleFavourite(mangaId: string) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Unauthorized" };

  try {
    const entry = await db
      .select({ id: libraryEntries.id, isFavorite: libraryEntries.isFavorite })
      .from(libraryEntries)
      .where(and(
        eq(libraryEntries.userId, session.user.id),
        eq(libraryEntries.mangaId, mangaId),
      ))
      .limit(1);

    if (entry.length === 0) return { error: "Not in library" };

    const newValue = !entry[0].isFavorite;
    await db
      .update(libraryEntries)
      .set({ isFavorite: newValue, updatedAt: new Date() })
      .where(eq(libraryEntries.id, entry[0].id));

    revalidatePath("/library");
    revalidatePath(`/manga/${mangaId}`);
    return { success: true, isFavorite: newValue };
  } catch (err) {
    console.error("toggleFavourite:", err);
    return { error: "Failed to toggle favourite" };
  }
}

/* ─── Get entry ──────────────────────────────────────────────────────────── */
export async function getLibraryEntry(mangaId: string) {
  const session = await auth();
  if (!session?.user?.id) return null;

  try {
    const result = await db
      .select()
      .from(libraryEntries)
      .where(and(
        eq(libraryEntries.userId, session.user.id),
        eq(libraryEntries.mangaId, mangaId),
      ))
      .limit(1);

    return result[0] ?? null;
  } catch (err) {
    console.error("getLibraryEntry:", err);
    return null;
  }
}
