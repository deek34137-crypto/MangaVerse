"use server";

import { auth } from "@/auth";
import { db } from "@/db";
import { manga, mangaFollows, mangaViews, reviews, reviewVotes, history } from "@/db/schema";
import { eq, and, count, avg, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";

/* ─── Track view ─────────────────────────────────────────────────────────── */
export async function trackMangaView(mangaId: string) {
  const session = await auth();

  try {
    await db.insert(mangaViews).values({
      mangaId,
      userId: session?.user?.id ?? null,
    });

    // Increment denormalised counter
    await db
      .update(manga)
      .set({ viewCount: sql`${manga.viewCount} + 1` })
      .where(eq(manga.id, mangaId));

    return { success: true };
  } catch (err) {
    // Fire-and-forget; silently swallow duplicate view errors
    return { success: false };
  }
}

/* ─── Toggle follow ──────────────────────────────────────────────────────── */
export async function toggleFollow(mangaId: string) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Unauthorized" };

  if (!z.string().min(1).safeParse(mangaId).success) return { error: "Invalid manga ID" };

  try {
    const existing = await db
      .select({ id: mangaFollows.id })
      .from(mangaFollows)
      .where(and(
        eq(mangaFollows.userId, session.user.id),
        eq(mangaFollows.mangaId, mangaId),
      ))
      .limit(1);

    let following: boolean;

    if (existing.length > 0) {
      // Unfollow
      await db
        .delete(mangaFollows)
        .where(eq(mangaFollows.id, existing[0].id));
      await db
        .update(manga)
        .set({ followCount: sql`GREATEST(0, ${manga.followCount} - 1)` })
        .where(eq(manga.id, mangaId));
      following = false;
    } else {
      // Follow
      await db.insert(mangaFollows).values({
        userId: session.user.id,
        mangaId,
      });
      await db
        .update(manga)
        .set({ followCount: sql`${manga.followCount} + 1` })
        .where(eq(manga.id, mangaId));
      following = true;
    }

    revalidatePath(`/manga/${mangaId}`);
    return { success: true, following };
  } catch (err) {
    console.error("toggleFollow:", err);
    return { error: "Failed to toggle follow" };
  }
}

/* ─── Check if user follows ──────────────────────────────────────────────── */
export async function getFollowStatus(mangaId: string) {
  const session = await auth();
  if (!session?.user?.id) return false;

  const result = await db
    .select({ id: mangaFollows.id })
    .from(mangaFollows)
    .where(and(
      eq(mangaFollows.userId, session.user.id),
      eq(mangaFollows.mangaId, mangaId),
    ))
    .limit(1);

  return result.length > 0;
}

/* ─── Submit / update review ─────────────────────────────────────────────── */
export async function submitReview(
  mangaId: string,
  data: { rating: number; title?: string; content: string; isSpoiler?: boolean },
) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Unauthorized" };

  const parsed = z.object({
    mangaId:    z.string().min(1),
    rating:     z.number().min(1).max(10),
    title:      z.string().max(200).optional(),
    content:    z.string().min(10).max(5000),
    isSpoiler:  z.boolean().optional(),
  }).safeParse({ mangaId, ...data });
  if (!parsed.success) return { error: parsed.error.flatten().fieldErrors };

  const { rating, title, content, isSpoiler } = parsed.data;

  try {
    const existing = await db
      .select({ id: reviews.id })
      .from(reviews)
      .where(and(eq(reviews.userId, session.user.id), eq(reviews.mangaId, mangaId)))
      .limit(1);

    if (existing.length > 0) {
      await db
        .update(reviews)
        .set({
          rating: rating.toString(),
          title: title ?? null,
          content,
          isSpoiler: isSpoiler ?? false,
          updatedAt: new Date(),
        })
        .where(eq(reviews.id, existing[0].id));
    } else {
      await db.insert(reviews).values({
        userId: session.user.id,
        mangaId,
        rating: rating.toString(),
        title: title ?? null,
        content,
        isSpoiler: isSpoiler ?? false,
      });
    }

    // Recalculate average rating on manga table
    const avgResult = await db
      .select({ avg: avg(reviews.rating) })
      .from(reviews)
      .where(eq(reviews.mangaId, mangaId));

    const newRating = avgResult[0]?.avg ?? "0";
    const countResult = await db
      .select({ count: count() })
      .from(reviews)
      .where(eq(reviews.mangaId, mangaId));

    await db
      .update(manga)
      .set({
        rating: parseFloat(String(newRating)).toFixed(2),
        ratingCount: countResult[0]?.count ?? 0,
        updatedAt: new Date(),
      })
      .where(eq(manga.id, mangaId));

    revalidatePath(`/manga/${mangaId}`);
    return { success: true };
  } catch (err) {
    console.error("submitReview:", err);
    return { error: "Failed to submit review" };
  }
}

/* ─── Vote on review ─────────────────────────────────────────────────────── */
export async function voteReview(reviewId: string, isHelpful: boolean) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Unauthorized" };

  try {
    const existing = await db
      .select({ id: reviewVotes.id, isHelpful: reviewVotes.isHelpful })
      .from(reviewVotes)
      .where(and(eq(reviewVotes.userId, session.user.id), eq(reviewVotes.reviewId, reviewId)))
      .limit(1);

    if (existing.length > 0) {
      if (existing[0].isHelpful === isHelpful) {
        // Remove vote (toggle off)
        await db.delete(reviewVotes).where(eq(reviewVotes.id, existing[0].id));
        if (isHelpful) {
          await db
            .update(reviews)
            .set({ helpfulCount: sql`GREATEST(0, ${reviews.helpfulCount} - 1)` })
            .where(eq(reviews.id, reviewId));
        }
      } else {
        await db.update(reviewVotes).set({ isHelpful }).where(eq(reviewVotes.id, existing[0].id));
      }
    } else {
      await db.insert(reviewVotes).values({ userId: session.user.id, reviewId, isHelpful });
      if (isHelpful) {
        await db
          .update(reviews)
          .set({ helpfulCount: sql`${reviews.helpfulCount} + 1` })
          .where(eq(reviews.id, reviewId));
      }
    }

    return { success: true };
  } catch (err) {
    console.error("voteReview:", err);
    return { error: "Failed to vote" };
  }
}

/* ─── Track chapter read (history) ──────────────────────────────────────── */
export async function trackChapterRead(
  mangaId: string,
  chapterId: string,
  progress = 0,
) {
  const session = await auth();
  if (!session?.user?.id) return { success: false };

  try {
    await db
      .insert(history)
      .values({ userId: session.user.id, mangaId, chapterId, progress })
      .onConflictDoUpdate({
        target: [history.userId, history.mangaId, history.chapterId],
        set: { progress, readAt: new Date() },
      });

    return { success: true };
  } catch (err) {
    console.error("trackChapterRead:", err);
    return { success: false };
  }
}
