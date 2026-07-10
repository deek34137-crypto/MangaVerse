import { getLatestManga, getPopularManga, searchManga, type MangaDexEntity, type MangaDexMangaAttributes } from "@/services/mangadex";
import { mapManga } from "@/services/mangadex/mapping";
import type { Manga } from "@/types";

export interface HomeSection {
  manga: Manga[];
  total: number;
}

export async function getFeatured(limit = 6): Promise<HomeSection> {
  try {
    const res = await searchManga({
      order: { rating: "desc" },
      limit,
      contentRating: ["safe", "suggestive"],
      includes: ["cover_art", "author", "artist"],
    });

    const mapped = await Promise.all(
      res.data.map((entity: MangaDexEntity<MangaDexMangaAttributes>) => mapManga(entity))
    );

    return { manga: mapped, total: res.total || mapped.length };
  } catch {
    return { manga: [], total: 0 };
  }
}

export async function getTrending(limit = 10): Promise<HomeSection> {
  try {
    const res = await searchManga({
      order: { updatedAt: "desc" },
      limit,
      contentRating: ["safe", "suggestive"],
      includes: ["cover_art", "author", "artist"],
    });

    const mapped = await Promise.all(
      res.data.map((entity: MangaDexEntity<MangaDexMangaAttributes>) => mapManga(entity))
    );

    return { manga: mapped, total: res.total || mapped.length };
  } catch {
    return { manga: [], total: 0 };
  }
}

export async function getPopular(limit = 10): Promise<HomeSection> {
  try {
    const res = await getPopularManga(limit, 0);

    const mapped = await Promise.all(
      res.data.map((entity: MangaDexEntity<MangaDexMangaAttributes>) => mapManga(entity))
    );

    return { manga: mapped, total: res.total || mapped.length };
  } catch {
    return { manga: [], total: 0 };
  }
}

export async function getLatest(limit = 10): Promise<HomeSection> {
  try {
    const res = await getLatestManga(limit, 0);

    const mapped = await Promise.all(
      res.data.map((entity: MangaDexEntity<MangaDexMangaAttributes>) => mapManga(entity))
    );

    return { manga: mapped, total: res.total || mapped.length };
  } catch {
    return { manga: [], total: 0 };
  }
}

export async function getContinueReading(userId: string, limit = 6): Promise<HomeSection> {
  try {
    const { eq, desc, inArray, sql } = await import("drizzle-orm");
    const { db } = await import("@/db");
    const { history, manga: mangaTable, mangaGenres, genres, mangaTags, tags, authors, mangaAuthors, artists, mangaArtists } = await import("@/db/schema");

    const recentHistory = await db
      .select({
        mangaId: history.mangaId,
        chapterId: history.chapterId,
        progress: history.progress,
        readAt: history.readAt,
      })
      .from(history)
      .where(eq(history.userId, userId))
      .orderBy(desc(history.readAt))
      .limit(limit);

    if (recentHistory.length === 0) {
      return { manga: [], total: 0 };
    }

    const mangaIds = recentHistory.map(h => h.mangaId).filter(Boolean);

    if (mangaIds.length === 0) {
      return { manga: [], total: 0 };
    }

    const localManga = await db
      .select()
      .from(mangaTable)
      .where(inArray(mangaTable.id, mangaIds));

    if (localManga.length > 0) {
      const enriched = localManga.map(m => ({
        ...m,
        genres: [],
        tags: [],
        authors: [],
        artists: [],
        latestChapter: undefined,
        rating: m.rating || 0,
        ratingCount: 0,
        followCount: m.followCount || 0,
        viewCount: m.viewCount || 0,
        chapterCount: m.chapterCount || 0,
        volumeCount: m.volumeCount || 0,
        startDate: m.startDate || undefined,
        endDate: m.endDate || undefined,
      }));

      const ordered = mangaIds.map(id => enriched.find(m => m.id === id)).filter(Boolean) as any[];
      return { manga: ordered, total: ordered.length };
    }

    return { manga: [], total: 0 };
  } catch {
    return { manga: [], total: 0 };
  }
}

export async function getRecommendations(userId: string, limit = 6): Promise<HomeSection> {
  try {
    const { db } = await import("@/db");
    const { history, library, userStats, manga: mangaTable, mangaGenres, genres } = await import("@/db/schema");
    const { eq, desc, inArray, sql } = await import("drizzle-orm");

    const userLibrary = await db
      .select({ mangaId: library.mangaId })
      .from(library)
      .where(eq(library.userId, userId));

    const userHistory = await db
      .select({ mangaId: history.mangaId })
      .from(history)
      .where(eq(history.userId, userId));

    const stats = await db
      .select({ favoriteGenres: userStats.favoriteGenres })
      .from(userStats)
      .where(eq(userStats.userId, userId))
      .limit(1);

    const libraryIds = userLibrary.map(l => l.mangaId);
    const historyIds = userHistory.map(h => h.mangaId);
    const allUserIds = [...new Set([...libraryIds, ...historyIds])];
    const favoriteGenres = (stats[0]?.favoriteGenres as string[]) || [];

    if (allUserIds.length === 0 && favoriteGenres.length === 0) {
      return getPopular(limit);
    }

    let genreConditions = [];
    if (favoriteGenres.length > 0) {
      genreConditions = favoriteGenres;
    }

    const recommendations = await searchManga({
      order: { rating: "desc" },
      limit: limit * 2,
      contentRating: ["safe", "suggestive"],
      includes: ["cover_art", "author", "artist"],
    });

    const filtered = recommendations.data
      .map(entity => mapManga(entity))
      .filter(m => !allUserIds.includes(m.id));

    return { manga: filtered.slice(0, limit), total: filtered.length };
  } catch {
    return getPopular(limit);
  }
}

export async function getHomeData(userId?: string): Promise<{
  featured: HomeSection;
  trending: HomeSection;
  popular: HomeSection;
  latest: HomeSection;
  continueReading: HomeSection;
  recommendations: HomeSection;
}> {
  const [
    featured,
    trending,
    popular,
    latest,
    continueReading,
    recommendations,
  ] = await Promise.allSettled([
    getFeatured(6),
    getTrending(10),
    getPopular(10),
    getLatest(10),
    userId ? getContinueReading(userId, 6) : Promise.resolve({ manga: [], total: 0 }),
    userId ? getRecommendations(userId, 6) : Promise.resolve({ manga: [], total: 0 }),
  ]);

  return {
    featured: featured.status === "fulfilled" ? featured.value : { manga: [], total: 0 },
    trending: trending.status === "fulfilled" ? trending.value : { manga: [], total: 0 },
    popular: popular.status === "fulfilled" ? popular.value : { manga: [], total: 0 },
    latest: latest.status === "fulfilled" ? latest.value : { manga: [], total: 0 },
    continueReading: continueReading.status === "fulfilled" ? continueReading.value : { manga: [], total: 0 },
    recommendations: recommendations.status === "fulfilled" ? recommendations.value : { manga: [], total: 0 },
  };
}