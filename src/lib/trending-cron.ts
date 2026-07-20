import { db } from "@/db";
import { manga, mangaViews, mangaFollows } from "@/db/schema";
import { eq, desc, and, gte, sql } from "drizzle-orm";

export async function calculateAndUpdateTrendingScores() {
  console.log("[Trending Cron] Starting trending score calculation...");

  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const ongoingManga = await db
    .select({ id: manga.id })
    .from(manga)
    .where(eq(manga.status, "ongoing"));

  console.log(`[Trending Cron] Processing ${ongoingManga.length} ongoing manga`);

  let processed = 0;
  const batchSize = 100;

  for (let i = 0; i < ongoingManga.length; i += batchSize) {
    const batch = ongoingManga.slice(i, i + batchSize);
    await Promise.all(batch.map(async (m) => {
      const [
        viewsResult,
        followsResult,
        mangaData,
      ] = await Promise.all([
        db
          .select({ count: sql<number>`count(*)` })
          .from(mangaViews)
          .where(and(
            eq(mangaViews.mangaId, m.id),
            gte(mangaViews.viewedAt, new Date(Date.now() - 7 * 24 * 60 * 60 * 1000))
          )),
        db
          .select({ count: sql<number>`count(*)` })
          .from(mangaFollows)
          .where(and(
            eq(mangaFollows.mangaId, m.id),
            gte(mangaFollows.createdAt, new Date(Date.now() - 7 * 24 * 60 * 60 * 1000))
          )),
        db
          .select({
            rating: manga.rating,
            updatedAt: manga.updatedAt,
            isEditorialPick: sql<boolean>`false`, // TODO: join editorial collections
          })
          .from(manga)
          .where(eq(manga.id, m.id))
          .limit(1),
      ]);

      const viewsLast7d = viewsResult[0]?.count ?? 0;
      const followsLast7d = followsResult[0]?.count ?? 0;
      const rating = Number(mangaData[0]?.rating ?? 0);
      const daysSinceUpdate = mangaData[0]?.updatedAt
        ? (Date.now() - new Date(mangaData[0].updatedAt).getTime()) / 86400000
        : 30;
      const isEditorialPick = mangaData[0]?.isEditorialPick ?? false;

      const viewsScore = Math.log10(viewsLast7d + 1);
      const followsScore = Math.log10(followsLast7d + 1) * 2;
      const ratingScore = rating * 5;
      const freshnessScore = Math.max(0, 14 - daysSinceUpdate);
      const editorBoost = isEditorialPick ? 25 : 0;
      const finalTrendingScore = viewsScore + followsScore + ratingScore + freshnessScore + editorBoost;

      await db
        .update(manga)
        .set({
          viewsScore: viewsScore.toFixed(4),
          followsScore: followsScore.toFixed(4),
          ratingScore: ratingScore.toFixed(4),
          freshnessScore: freshnessScore.toFixed(4),
          editorBoost: editorBoost.toFixed(4),
          finalTrendingScore: finalTrendingScore.toFixed(4),
        })
        .where(eq(manga.id, m.id));
    }));

    processed += batch.length;
    console.log(`[Trending Cron] Processed ${processed}/${ongoingManga.length} manga`);
  }

  console.log("[Trending Cron] Completed trending score calculation");
}

if (require.main === module) {
  calculateAndUpdateTrendingScores()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error("[Trending Cron] Error:", err);
      process.exit(1);
    });
}