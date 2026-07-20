import { db } from "@/db";
import { manga, mangaGenres, genres, chapters, mangaViews, mangaFollows, libraryEntries, mangaAuthors, authors, mangaProvider } from "@/db/schema";
import { eq, desc, asc, sql, and, gte, inArray, isNotNull, count } from "drizzle-orm";
import { cacheGet, cacheSet } from "@/services/cache";
import type { Manga, ContinueReadingItem } from "@/services/home/types";
import { decorateCoverUrl } from "@/lib/cover-url";

export interface TrendingScores {
  viewsScore: number;
  followsScore: number;
  ratingScore: number;
  freshnessScore: number;
  editorBoost: number;
  finalTrendingScore: number;
}

export interface TrendingManga extends Manga {
  trendingScores?: TrendingScores;
}

export class TrendingService {
  private static readonly CACHE_TTL = 600; // 10 minutes
  private static readonly DAYS_WINDOW = 7;

  calculateScores(manga: any): TrendingScores {
    const viewsLast7d = manga.viewCountLast7d ?? 0;
    const followsLast7d = manga.followCountLast7d ?? 0;
    const rating = manga.rating ?? 0;
    const daysSinceUpdate = manga.updatedAt
      ? (Date.now() - new Date(manga.updatedAt).getTime()) / 86400000
      : 30;

    const viewsScore = Math.log10(viewsLast7d + 1);
    const followsScore = Math.log10(followsLast7d + 1) * 2;
    const ratingScore = rating * 5;
    const freshnessScore = Math.max(0, 14 - daysSinceUpdate);
    const editorBoost = manga.isEditorialPick ? 25 : 0;

    const finalTrendingScore = viewsScore + followsScore + ratingScore + freshnessScore + editorBoost;

    return {
      viewsScore: Math.round(viewsScore * 100) / 100,
      followsScore: Math.round(followsScore * 100) / 100,
      ratingScore: Math.round(ratingScore * 100) / 100,
      freshnessScore: Math.round(freshnessScore * 100) / 100,
      editorBoost,
      finalTrendingScore: Math.round(finalTrendingScore * 100) / 100,
    };
  }

  async updateAllTrendingScores(): Promise<void> {
    console.log("[Trending Cron] Starting trending score calculation...");

    await db.execute(sql`
      WITH stats AS (
        SELECT 
          m.id AS manga_id,
          COALESCE(v.cnt, 0) AS views_last_7d,
          COALESCE(f.cnt, 0) AS follows_last_7d
        FROM manga m
        LEFT JOIN (
          SELECT manga_id, COUNT(*) AS cnt 
          FROM manga_views 
          WHERE viewed_at >= NOW() - INTERVAL '7 days' 
          GROUP BY manga_id
        ) v ON v.manga_id = m.id
        LEFT JOIN (
          SELECT manga_id, COUNT(*) AS cnt 
          FROM manga_follows 
          WHERE created_at >= NOW() - INTERVAL '7 days' 
          GROUP BY manga_id
        ) f ON f.manga_id = m.id
        WHERE m.status = 'ongoing'
          AND (m.updated_at >= NOW() - INTERVAL '7 days' OR v.cnt > 0 OR f.cnt > 0 OR m.final_trending_score = 0)
      )
      UPDATE manga m
      SET 
        views_score = LOG(10, s.views_last_7d + 1),
        follows_score = LOG(10, s.follows_last_7d + 1) * 2,
        rating_score = COALESCE(m.rating, 0.0) * 5,
        freshness_score = GREATEST(0, 14 - EXTRACT(EPOCH FROM (NOW() - COALESCE(m.updated_at, m.created_at))) / 86400),
        editor_boost = 0,
        final_trending_score = 
          LOG(10, s.views_last_7d + 1) + 
          (LOG(10, s.follows_last_7d + 1) * 2) + 
          (COALESCE(m.rating, 0.0) * 5) + 
          GREATEST(0, 14 - EXTRACT(EPOCH FROM (NOW() - COALESCE(m.updated_at, m.created_at))) / 86400)
      FROM stats s
      WHERE m.id = s.manga_id
    `);

    console.log("[Trending Cron] Completed trending score calculation successfully");
  }

  async getTrending(limit = 8, skipShuffle = false): Promise<any[]> {
    const cacheKey = `trending:${limit}:skip:${skipShuffle}`;
    const cached = await cacheGet<any[]>(cacheKey);
    if (cached) return cached;

    const tStart = performance.now();
    const results = await db
      .select()
      .from(manga)
      .orderBy(desc(manga.finalTrendingScore))
      .limit(skipShuffle ? limit : 30);
    const dbMs = performance.now() - tStart;

    const items = skipShuffle ? results : results.sort(() => 0.5 - Math.random()).slice(0, limit);
    const tEnrich = performance.now();
    const enriched = await this.enrichManga(items);
    const enrichMs = performance.now() - tEnrich;
    const totalMs = performance.now() - tStart;

    console.log(`[TrendingService.getTrending] DB: ${dbMs.toFixed(1)}ms, Enrich: ${enrichMs.toFixed(1)}ms, Total: ${totalMs.toFixed(1)}ms`);
    await cacheSet(cacheKey, enriched, 30);
    return enriched;
  }

  async getLatestUpdates(limit = 8, skipShuffle = false): Promise<any[]> {
    const cacheKey = `latest:${limit}:skip:${skipShuffle}`;
    const cached = await cacheGet<any[]>(cacheKey);
    if (cached) return cached;

    const tStart = performance.now();
    const results = await db
      .select()
      .from(manga)
      .orderBy(desc(manga.updatedAt))
      .limit(skipShuffle ? limit : 30);
    const dbMs = performance.now() - tStart;

    const items = skipShuffle ? results : results.sort(() => 0.5 - Math.random()).slice(0, limit);
    const tEnrich = performance.now();
    const enriched = await this.enrichManga(items);
    const enrichMs = performance.now() - tEnrich;
    const totalMs = performance.now() - tStart;

    console.log(`[TrendingService.getLatestUpdates] DB: ${dbMs.toFixed(1)}ms, Enrich: ${enrichMs.toFixed(1)}ms, Total: ${totalMs.toFixed(1)}ms`);
    await cacheSet(cacheKey, enriched, 30);
    return enriched;
  }

  async getPopular(limit = 8, skipShuffle = false): Promise<any[]> {
    const cacheKey = `popular:${limit}:skip:${skipShuffle}`;
    const cached = await cacheGet<any[]>(cacheKey);
    if (cached) return cached;

    const tStart = performance.now();
    const results = await db
      .select()
      .from(manga)
      .orderBy(desc(manga.followCount))
      .limit(skipShuffle ? limit : 30);
    const dbMs = performance.now() - tStart;

    const items = skipShuffle ? results : results.sort(() => 0.5 - Math.random()).slice(0, limit);
    const tEnrich = performance.now();
    const enriched = await this.enrichManga(items);
    const enrichMs = performance.now() - tEnrich;
    const totalMs = performance.now() - tStart;

    console.log(`[TrendingService.getPopular] DB: ${dbMs.toFixed(1)}ms, Enrich: ${enrichMs.toFixed(1)}ms, Total: ${totalMs.toFixed(1)}ms`);
    await cacheSet(cacheKey, enriched, 30);
    return enriched;
  }

  async getContinueReading(userId: string): Promise<any[]> {
    const cacheKey = `continue:${userId}`;
    const cached = await cacheGet<any[]>(cacheKey);
    if (cached) return cached;

    const results = await db
      .select({
        id: manga.id,
        title: manga.title,
        coverImage: manga.coverImage,
        status: manga.status,
        type: manga.type,
        rating: manga.rating,
        chapterCount: manga.chapterCount,
        followCount: manga.followCount,
        viewCount: manga.viewCount,
        updatedAt: manga.updatedAt,
        latestChapterId: manga.latestChapterId,
        libraryStatus: libraryEntries.status,
        lastReadAt: libraryEntries.lastReadAt,
        lastReadChapterId: libraryEntries.lastReadChapterId,
      })
      .from(libraryEntries)
      .innerJoin(manga, eq(libraryEntries.mangaId, manga.id))
      .where(
        and(
          eq(libraryEntries.userId, userId),
          inArray(libraryEntries.status, ["reading", "rereading"] as string[]),
        )
      )
      .orderBy(desc(libraryEntries.lastReadAt))
      .limit(12);

    const enriched = await this.enrichManga(results);
    await cacheSet(cacheKey, enriched, 60); // short TTL — personal data
    return enriched;
  }

  async getRecentlyViewed(userId: string): Promise<any[]> {
    const cacheKey = `recent-viewed:${userId}`;
    const cached = await cacheGet<any[]>(cacheKey);
    if (cached) return cached;

    const results = await db
      .selectDistinctOn([manga.id], {
        id: manga.id,
        title: manga.title,
        coverImage: manga.coverImage,
        status: manga.status,
        type: manga.type,
        rating: manga.rating,
        chapterCount: manga.chapterCount,
        followCount: manga.followCount,
        viewCount: manga.viewCount,
        updatedAt: manga.updatedAt,
        latestChapterId: manga.latestChapterId,
        viewedAt: mangaViews.viewedAt,
      })
      .from(mangaViews)
      .innerJoin(manga, eq(mangaViews.mangaId, manga.id))
      .where(eq(mangaViews.userId, userId))
      .orderBy(manga.id, desc(mangaViews.viewedAt))
      .limit(12);

    const sorted = results.sort(
      (a, b) => new Date(b.viewedAt).getTime() - new Date(a.viewedAt).getTime()
    );

    const enriched = await this.enrichManga(sorted);
    await cacheSet(cacheKey, enriched, 120);
    return enriched;
  }

  private async enrichManga(mangaList: any[]): Promise<any[]> {
    if (!mangaList.length) return [];

    const mangaIds = mangaList.map(m => m.id);

    const t0 = performance.now();
    const [genresData, authorsData, providersData] = await Promise.all([
      db
        .select({
          mangaId: mangaGenres.mangaId,
          genre: { id: genres.id, name: genres.name, slug: genres.slug, mangaCount: genres.mangaCount },
        })
        .from(mangaGenres)
        .innerJoin(genres, eq(mangaGenres.genreId, genres.id))
        .where(inArray(mangaGenres.mangaId, mangaIds)),
      db
        .select({
          mangaId: mangaAuthors.mangaId,
          author: { id: authors.id, name: authors.name, slug: authors.slug, image: authors.image, description: authors.description, mangaCount: authors.mangaCount },
        })
        .from(mangaAuthors)
        .innerJoin(authors, eq(mangaAuthors.authorId, authors.id))
        .where(inArray(mangaAuthors.mangaId, mangaIds)),
      db
        .select({
          mangaId: mangaProvider.mangaId,
          provider: mangaProvider.provider,
        })
        .from(mangaProvider)
        .where(inArray(mangaProvider.mangaId, mangaIds)),
    ]);

    console.log(`[TrendingService] enrichManga for ${mangaIds.length} items took ${(performance.now() - t0).toFixed(1)}ms`);

    const genresByManga = new Map<string, any[]>();
    for (const g of genresData) {
      const existing = genresByManga.get(g.mangaId) || [];
      existing.push(g.genre);
      genresByManga.set(g.mangaId, existing);
    }

    const authorsByManga = new Map<string, any[]>();
    for (const a of authorsData) {
      const existing = authorsByManga.get(a.mangaId) || [];
      existing.push(a.author);
      authorsByManga.set(a.mangaId, existing);
    }

    const providersByManga = new Map<string, string[]>();
    for (const p of providersData) {
      const existing = providersByManga.get(p.mangaId) || [];
      existing.push(p.provider);
      providersByManga.set(p.mangaId, existing);
    }


    return mangaList.map(m => ({
      ...m,
      coverImage: decorateCoverUrl(m.coverImage),
      genres: genresByManga.get(m.id) || [],
      authors: authorsByManga.get(m.id) || [],
      providers: providersByManga.get(m.id) || [],
    }));
  }
}

export const trendingService = new TrendingService();