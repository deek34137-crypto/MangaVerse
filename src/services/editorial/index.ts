import { db } from "@/db";
import { editorialCollections, editorialCollectionItems, manga, mangaGenres, genres } from "@/db/schema";
import { eq, and, desc, asc, lte, gte, or, isNull } from "drizzle-orm";
import { cacheGet, cacheSet } from "@/services/cache";
import type { HeroManga } from "@/services/home/types";

export class EditorialService {
  private static readonly CACHE_TTL = 300; // 5 minutes

  async getActiveCollections(): Promise<any[]> {
    const cacheKey = "editorial:collections:active";
    const cached = await cacheGet<any[]>(cacheKey);
    if (cached) return cached;

    const now = new Date();
    const collections = await db
      .select()
      .from(editorialCollections)
      .where(
        and(
          eq(editorialCollections.isActive, true),
          or(
            isNull(editorialCollections.startsAt),
            lte(editorialCollections.startsAt, now)
          ),
          or(
            isNull(editorialCollections.endsAt),
            gte(editorialCollections.endsAt, now)
          )
        )
      )
      .orderBy(desc(editorialCollections.priority), asc(editorialCollections.createdAt));

    const result: any[] = [];
    for (const collection of collections) {
      const items = await this.getCollectionItems(collection.id);
      if (items.length > 0) {
        result.push({
          ...collection,
          items,
        });
      }
    }

    await cacheSet(cacheKey, result, EditorialService.CACHE_TTL);
    return result;
  }

  async getCollectionBySlug(slug: string) {
    const cacheKey = `editorial:collection:${slug}`;
    const cached = await cacheGet<any>(cacheKey);
    if (cached) return cached;

    const now = new Date();
    const collection = await db
      .select()
      .from(editorialCollections)
      .where(
        and(
          eq(editorialCollections.slug, slug),
          eq(editorialCollections.isActive, true),
          or(
            isNull(editorialCollections.startsAt),
            lte(editorialCollections.startsAt, now)
          ),
          or(
            isNull(editorialCollections.endsAt),
            gte(editorialCollections.endsAt, now)
          )
        )
      )
      .limit(1);

    if (!collection[0]) return null;

    const items = await this.getCollectionItems(collection[0].id);
    const result = {
      ...collection[0],
      items,
    };

    await cacheSet(cacheKey, result, EditorialService.CACHE_TTL);
    return result;
  }

  async getCollectionItems(collectionId: string) {
    const items = await db
      .select({
        collectionId: editorialCollectionItems.collectionId,
        mangaId: editorialCollectionItems.mangaId,
        displayOrder: editorialCollectionItems.displayOrder,
        manga: {
          id: manga.id,
          title: manga.title,
          altTitles: manga.altTitles,
          description: manga.description,
          coverImage: manga.coverImage,
          bannerImage: manga.bannerImage,
          status: manga.status,
          type: manga.type,
          demographic: manga.demographic,
          rating: manga.rating,
          followCount: manga.followCount,
          viewCount: manga.viewCount,
          chapterCount: manga.chapterCount,
          volumeCount: manga.volumeCount,
          startDate: manga.startDate,
          endDate: manga.endDate,
          latestChapterId: manga.latestChapterId,
          createdAt: manga.createdAt,
          updatedAt: manga.updatedAt,
        },
      })
      .from(editorialCollectionItems)
      .innerJoin(manga, eq(editorialCollectionItems.mangaId, manga.id))
      .where(eq(editorialCollectionItems.collectionId, collectionId))
      .orderBy(asc(editorialCollectionItems.displayOrder));

    return items.map(item => ({
      collectionId: item.collectionId,
      mangaId: item.mangaId,
      displayOrder: item.displayOrder,
      manga: item.manga,
    }));
  }

  async getHeroManga(): Promise<{ manga: any; editorial: { slug: string; title: string } } | null> {
    const cacheKey = "editorial:hero";
    const cached = await cacheGet<{ manga: any; editorial: { slug: string; title: string } }>(cacheKey);
    if (cached) return cached;

    const collections = await this.getActiveCollections();
    const editorialCollection = collections.find(c => c.slug === "editors-picks");

    if (editorialCollection?.items.length) {
      const topItem = editorialCollection.items[0];
      const genresData = await db
        .select({
          mangaId: mangaGenres.mangaId,
          genre: { id: genres.id, name: genres.name, slug: genres.slug, mangaCount: genres.mangaCount },
        })
        .from(mangaGenres)
        .innerJoin(genres, eq(mangaGenres.genreId, genres.id))
        .where(eq(mangaGenres.mangaId, topItem.mangaId));

      const result = {
        manga: {
          ...topItem.manga,
          genres: genresData.map(g => g.genre),
        },
        editorial: { slug: editorialCollection.slug, title: editorialCollection.title },
      };

      await cacheSet(cacheKey, result, EditorialService.CACHE_TTL);
      return result;
    }

    // Fallback: highest rated ongoing manga
    const topManga = await db
      .select()
      .from(manga)
      .where(eq(manga.status, "ongoing"))
      .orderBy(desc(manga.rating))
      .limit(1);

    if (!topManga[0]) return null;

    const genresData = await db
      .select({
        mangaId: mangaGenres.mangaId,
        genre: { id: genres.id, name: genres.name, slug: genres.slug, mangaCount: genres.mangaCount },
      })
      .from(mangaGenres)
      .innerJoin(genres, eq(mangaGenres.genreId, genres.id))
      .where(eq(mangaGenres.mangaId, topManga[0].id));

    const result = {
      manga: {
        ...topManga[0],
        genres: genresData.map(g => g.genre),
      },
      editorial: { slug: "auto", title: "Auto Pick" },
    };

    await cacheSet(cacheKey, result, EditorialService.CACHE_TTL);
    return result;
  }
}

export const editorialService = new EditorialService();