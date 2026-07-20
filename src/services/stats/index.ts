import { db } from "@/db";
import { manga, chapters, users } from "@/db/schema";
import { eq, count, and, gte, sql } from "drizzle-orm";
import { cacheGet, cacheSet } from "@/services/cache";
import type { SiteStats } from "@/services/home/types";

export class StatsService {
  private static readonly CACHE_TTL = 300; // 5 minutes

  async getSiteStats(): Promise<SiteStats> {
    const cacheKey = "stats:site";
    const cached = await cacheGet<SiteStats>(cacheKey);
    if (cached) return cached;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [mangaCount, chaptersCount, usersCount, chaptersTodayCount] = await Promise.all([
      db.select({ count: count() }).from(manga),
      db.select({ count: count() }).from(chapters),
      db.select({ count: count() }).from(users),
      db.select({ count: count() }).from(chapters).where(gte(chapters.createdAt, today)),
    ]);

    const stats: SiteStats = {
      totalManga: mangaCount[0]?.count ?? 0,
      totalChapters: chaptersCount[0]?.count ?? 0,
      totalUsers: usersCount[0]?.count ?? 0,
      chaptersToday: chaptersTodayCount[0]?.count ?? 0,
    };

    await cacheSet(cacheKey, stats, StatsService.CACHE_TTL);
    return stats;
  }
}

export const statsService = new StatsService();