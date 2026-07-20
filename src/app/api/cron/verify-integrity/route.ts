import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { syncJobs } from "@/db/schema";
import { sql } from "drizzle-orm";

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    console.log("[integrity-cron] Starting database integrity checks...");
    const report: Record<string, any> = {};

    // 1. Clean up stale sync jobs
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    const deletedCompleted = await db.delete(syncJobs)
      .where(sql`status = 'completed' AND updated_at < ${oneDayAgo}`)
      .returning({ id: syncJobs.id });

    const deletedFailed = await db.delete(syncJobs)
      .where(sql`status = 'failed' AND updated_at < ${sevenDaysAgo}`)
      .returning({ id: syncJobs.id });

    report.cleanedJobs = {
      completed: deletedCompleted.length,
      failed: deletedFailed.length,
    };

    // 2. Detect and prune orphaned genre/tag links
    const orphanedGenres = await db.execute(sql`
      DELETE FROM manga_genres 
      WHERE manga_id NOT IN (SELECT id FROM manga) 
         OR genre_id NOT IN (SELECT id FROM genres)
      RETURNING manga_id
    `);

    const orphanedTags = await db.execute(sql`
      DELETE FROM manga_tags 
      WHERE manga_id NOT IN (SELECT id FROM manga) 
         OR tag_id NOT IN (SELECT id FROM tags)
      RETURNING manga_id
    `);

    report.cleanedOrphanedLinks = {
      genres: orphanedGenres.length,
      tags: orphanedTags.length,
    };

    // 3. Repair broken latestChapterId references in the manga table
    const brokenLatestChapters = await db.execute(sql`
      UPDATE manga
      SET latest_chapter_id = NULL
      WHERE latest_chapter_id IS NOT NULL 
        AND latest_chapter_id NOT IN (SELECT id FROM chapters)
      RETURNING id
    `);

    report.fixedBrokenLatestChapters = brokenLatestChapters.length;

    // 4. Diagnostic report on manga with missing cover images
    const missingCovers = await db.execute(sql`
      SELECT id, title FROM manga WHERE cover_image IS NULL OR cover_image = ''
    `);

    report.missingCoversCount = missingCovers.length;

    console.log("[integrity-cron] Integrity checks completed successfully", report);

    return NextResponse.json({
      success: true,
      report,
    });
  } catch (error: any) {
    console.error("[integrity-cron] Integrity check execution failed:", error);
    return NextResponse.json(
      { error: "Integrity checks failed", message: error.message || String(error) },
      { status: 500 }
    );
  }
}
