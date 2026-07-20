import { db } from "@/db";
import { genres } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { cacheGet, cacheSet } from "@/services/cache";
import type { Genre } from "@/types";

export class GenreService {
  private static readonly CACHE_TTL = 3600; // 1 hour

  async getAll(limit = 16): Promise<any[]> {
    const cacheKey = `genres:all:${limit}`;
    const cached = await cacheGet<any[]>(cacheKey);
    if (cached) return cached;

    const results = await db
      .select()
      .from(genres)
      .orderBy(desc(genres.mangaCount))
      .limit(limit);

    await cacheSet(cacheKey, results, GenreService.CACHE_TTL);
    return results;
  }

  async getBySlug(slug: string): Promise<any | null> {
    const results = await db
      .select()
      .from(genres)
      .where(eq(genres.slug, slug))
      .limit(1);
    return results[0] ?? null;
  }
}

export const genreService = new GenreService();