import { db } from "@/db";
import { syncJobs, manga as mangaTable } from "@/db/schema";
import { eq, sql } from "drizzle-orm";
import { syncManga, syncChapters, syncChapterPages } from "@/services/manga/sync";
import { getMangaStats, getCoverArt, getManga } from "@/services/mangadex/manga";

type DbClient = typeof db | any;

export async function enqueueSyncJob(
  type: string,
  targetId: string,
  payload: any = {},
  priority = 50
): Promise<void> {
  try {
    await db.insert(syncJobs).values({
      type,
      targetId,
      payload,
      priority,
      status: "pending",
      runAt: new Date(),
    }).onConflictDoNothing();
  } catch (err) {
    console.error(`[Queue] Failed to enqueue job for type=${type}, targetId=${targetId}:`, err);
  }
}

function isRetryableError(error: any): boolean {
  const msg = (error.message || String(error)).toLowerCase();
  const status = error.status || error.statusCode || error.response?.status;

  if (status === 404) return false;
  if (status === 400 || status === 401 || status === 403) return false;

  if (msg.includes("not found") || msg.includes("404")) return false;
  if (msg.includes("validation error") || msg.includes("zod")) return false;
  if (msg.includes("schema mismatch") || msg.includes("column does not exist")) return false;

  return true;
}

async function runWorker(type: string, targetId: string, payload: any): Promise<void> {
  switch (type) {
    case "manga":
      await syncManga(payload.provider || "mangadex", payload.providerMangaId || targetId);
      break;
    case "chapter":
      await syncChapters(targetId);
      break;
    case "cover": {
      const mdEntity = await getManga(targetId);
      const coverFileName = mdEntity.relationships.find(r => r.type === "cover_art");
      const coverUrl = coverFileName ? await getCoverArt(targetId, (coverFileName.attributes as { fileName?: string })?.fileName || "") : undefined;
      if (coverUrl) {
        await db.update(mangaTable)
          .set({ coverImage: coverUrl, updatedAt: new Date() })
          .where(eq(mangaTable.id, targetId));
      }
      break;
    }
    case "statistics": {
      const stats = await getMangaStats(targetId);
      if (stats) {
        const rating = stats.rating?.average || stats.rating?.bayesian || 0;
        const follows = stats.follows || 0;
        await db.update(mangaTable)
          .set({
            rating: rating.toFixed(2),
            followCount: follows,
            updatedAt: new Date(),
          })
          .where(eq(mangaTable.id, targetId));
      }
      break;
    }
    case "pages":
      await syncChapterPages(targetId);
      break;
    case "author":
    case "artist":
    case "tag":
      await syncManga(payload.provider || "mangadex", payload.providerMangaId || targetId);
      break;
    default:
      throw new Error(`Unknown job type: ${type}`);
  }
}

export async function processNextQueueJob(): Promise<boolean> {
  const job = await db.transaction(async (tx) => {
    const pendingJobs = await tx.execute(sql`
      SELECT id, type, target_id as "targetId", payload, attempts, max_attempts as "maxAttempts"
      FROM sync_jobs
      WHERE status = 'pending' AND run_at <= NOW()
      ORDER BY priority DESC, run_at ASC
      LIMIT 1
      FOR UPDATE SKIP LOCKED
    `);

    if (pendingJobs.length === 0) return null;
    const j = pendingJobs[0] as any;

    await tx.update(syncJobs)
      .set({ status: "processing", updatedAt: new Date() })
      .where(eq(syncJobs.id, j.id));

    return j;
  });

  if (!job) return false;

  const startTime = Date.now();
  try {
    console.log(`[Queue Worker] Processing job id=${job.id}, type=${job.type}, targetId=${job.targetId}`);
    await runWorker(job.type, job.targetId, job.payload);

    await db.update(syncJobs)
      .set({ status: "completed", updatedAt: new Date() })
      .where(eq(syncJobs.id, job.id));
    
    console.log(`[Queue Worker] Job id=${job.id} completed successfully in ${Date.now() - startTime}ms`);
  } catch (error: any) {
    console.error(`[Queue Worker] Job id=${job.id} failed:`, error);
    const nextAttempts = job.attempts + 1;
    
    if (nextAttempts >= job.maxAttempts || !isRetryableError(error)) {
      await db.update(syncJobs)
        .set({
          status: "failed",
          attempts: nextAttempts,
          lastError: error.message || String(error),
          updatedAt: new Date(),
        })
        .where(eq(syncJobs.id, job.id));
      console.log(`[Queue Worker] Job id=${job.id} permanently failed (DLQ)`);
    } else {
      const delaySeconds = Math.pow(2, nextAttempts) * 30; // 60s, 120s, 240s, 480s
      const runAt = new Date(Date.now() + delaySeconds * 1000);
      await db.update(syncJobs)
        .set({
          status: "pending",
          attempts: nextAttempts,
          runAt,
          lastError: error.message || String(error),
          updatedAt: new Date(),
        })
        .where(eq(syncJobs.id, job.id));
      console.log(`[Queue Worker] Job id=${job.id} scheduled for retry in ${delaySeconds} seconds`);
    }
  }

  return true;
}

export async function processQueueBatch(limit = 10): Promise<number> {
  let processedCount = 0;
  while (processedCount < limit) {
    const processed = await processNextQueueJob();
    if (!processed) break;
    processedCount++;
  }
  return processedCount;
}
