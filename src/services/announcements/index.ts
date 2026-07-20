import { db } from "@/db";
import { siteAnnouncements } from "@/db/schema";
import { eq, and, desc, asc, lte, gte, or, isNull } from "drizzle-orm";
import { cacheGet, cacheSet } from "@/services/cache";
import type { Announcement } from "@/services/home/types";

function mapAnnouncement(row: typeof siteAnnouncements.$inferSelect): Announcement {
  return {
    ...row,
    startsAt: row.startsAt instanceof Date ? row.startsAt.toISOString() : row.startsAt,
    endsAt: row.endsAt instanceof Date ? row.endsAt.toISOString() : row.endsAt ?? null,
    createdAt: row.createdAt instanceof Date ? row.createdAt.toISOString() : row.createdAt,
    type: row.type as Announcement["type"],
  };
}

export class AnnouncementService {
  private static readonly CACHE_TTL = 300; // 5 minutes

  async getActive(): Promise<Announcement[]> {
    const cacheKey = "announcements:active";
    const cached = await cacheGet<Announcement[]>(cacheKey);
    if (cached) return cached;

    const now = new Date();
    const results = await db
      .select()
      .from(siteAnnouncements)
      .where(
        and(
          eq(siteAnnouncements.isActive, true),
          or(
            isNull(siteAnnouncements.startsAt),
            lte(siteAnnouncements.startsAt, now)
          ),
          or(
            isNull(siteAnnouncements.endsAt),
            gte(siteAnnouncements.endsAt, now)
          )
        )
      )
      .orderBy(asc(siteAnnouncements.priority), desc(siteAnnouncements.createdAt));

    const mapped = results.map(mapAnnouncement);
    await cacheSet("announcements:active", mapped, AnnouncementService.CACHE_TTL);
    return mapped;
  }

  async getById(id: string) {
    const results = await db
      .select()
      .from(siteAnnouncements)
      .where(eq(siteAnnouncements.id, id))
      .limit(1);
    if (!results[0]) return null;
    return mapAnnouncement(results[0]);
  }
}

export const announcementService = new AnnouncementService();