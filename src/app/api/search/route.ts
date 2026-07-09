import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { manga, mangaGenres, genres, mangaTags, tags, authors, mangaAuthors, artists, mangaArtists, chapters, chapterScanlatorGroups, scanlatorGroups } from "@/db/schema";
import { eq, and, or, ilike, desc, asc, inArray, count, sql } from "drizzle-orm";
import { z } from "zod";
import { searchManga, syncManga } from "@/services/mangadex";
import { mapManga } from "@/services/mangadex/mapping";

const searchSchema = z.object({
  query: z.string().optional(),
  genres: z.array(z.string()).optional(),
  tags: z.array(z.string()).optional(),
  authors: z.array(z.string()).optional(),
  artists: z.array(z.string()).optional(),
  status: z.array(z.string()).optional(),
  type: z.array(z.string()).optional(),
  demographic: z.array(z.string()).optional(),
  rating: z.coerce.number().min(0).max(10).optional(),
  year: z.coerce.number().optional(),
  season: z.array(z.string()).optional(),
  language: z.array(z.string()).optional(),
  sortBy: z.enum(["relevance", "title", "rating", "popularity", "updated", "created", "follows", "views"]).optional(),
  sortOrder: z.enum(["asc", "desc"]).optional(),
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(24),
});

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const params = Object.fromEntries(searchParams.entries());

    const validated = searchSchema.parse({
      ...params,
      genres: params.genres ? params.genres.split(",") : undefined,
      tags: params.tags ? params.tags.split(",") : undefined,
      authors: params.authors ? params.authors.split(",") : undefined,
      artists: params.artists ? params.artists.split(",") : undefined,
      status: params.status ? params.status.split(",") : undefined,
      type: params.type ? params.type.split(",") : undefined,
      demographic: params.demographic ? params.demographic.split(",") : undefined,
      season: params.season ? params.season.split(",") : undefined,
      language: params.language ? params.language.split(",") : undefined,
    });

    const { query, genres: genreSlugs, tags: tagNames, status, type, demographic, rating, sortBy = "relevance", sortOrder = "desc", page, limit } = validated;
    const offset = (page - 1) * limit;

    const conditions: ReturnType<typeof sql>[] = [];

    if (query) {
      conditions.push(
        or(
          ilike(manga.title, `%${query}%`),
          sql`${manga.altTitles} @> ${JSON.stringify([query])}`,
          ilike(authors.name, `%${query}%`),
          ilike(artists.name, `%${query}%`)
        ) as ReturnType<typeof sql>
      );
    }

    if (genreSlugs?.length) {
      const slugParams = genreSlugs.map(s => sql`${s}`);
      conditions.push(
        sql`EXISTS (
          SELECT 1 FROM ${mangaGenres} mg
          JOIN ${genres} g ON mg.genre_id = g.id
          WHERE mg.manga_id = ${manga.id} AND g.slug IN (${sql.join(slugParams, sql`, `)})
        )`
      );
    }

    if (tagNames?.length) {
      const tagParams = tagNames.map(t => sql`${t}`);
      conditions.push(
        sql`EXISTS (
          SELECT 1 FROM ${mangaTags} mt
          JOIN ${tags} t ON mt.tag_id = t.id
          WHERE mt.manga_id = ${manga.id} AND t.slug IN (${sql.join(tagParams, sql`, `)})
        )`
      );
    }

    if (status?.length) {
      conditions.push(inArray(manga.status, status as any) as ReturnType<typeof sql>);
    }

    if (type?.length) {
      conditions.push(inArray(manga.type, type as any) as ReturnType<typeof sql>);
    }

    if (demographic?.length) {
      conditions.push(inArray(manga.demographic, demographic as any) as ReturnType<typeof sql>);
    }

    if (rating) {
      conditions.push(sql`${manga.rating} >= ${rating}`);
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const orderByColumn = (() => {
      switch (sortBy) {
        case "title": return manga.title;
        case "rating": return manga.rating;
        case "popularity": return manga.followCount;
        case "updated": return manga.updatedAt;
        case "created": return manga.createdAt;
        case "follows": return manga.followCount;
        case "views": return manga.viewCount;
        default: return manga.updatedAt;
      }
    })();

    const orderBy = sortOrder === "asc" ? asc(orderByColumn) : desc(orderByColumn);

    const results = await db
      .select({
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
      })
      .from(manga)
      .leftJoin(mangaAuthors, eq(manga.id, mangaAuthors.mangaId))
      .leftJoin(authors, eq(mangaAuthors.authorId, authors.id))
      .leftJoin(mangaArtists, eq(manga.id, mangaArtists.mangaId))
      .leftJoin(artists, eq(mangaArtists.artistId, artists.id))
      .where(whereClause)
      .orderBy(orderBy)
      .limit(limit)
      .offset(offset);

    const totalResult = await db
      .select({ count: count() })
      .from(manga)
      .leftJoin(mangaAuthors, eq(manga.id, mangaAuthors.mangaId))
      .leftJoin(authors, eq(mangaAuthors.authorId, authors.id))
      .leftJoin(mangaArtists, eq(manga.id, mangaArtists.mangaId))
      .leftJoin(artists, eq(mangaArtists.artistId, artists.id))
      .where(whereClause);

    const total = totalResult[0]?.count || 0;

    // If local results are insufficient and we have a query, fall back to MangaDex
    if (results.length < limit && query) {
      try {
        const mdParams: Record<string, string | string[] | number | undefined> = {};
        if (query) mdParams.title = query;
        if (genreSlugs?.length) mdParams.includedTags = genreSlugs;
        if (status?.length) mdParams.status = status;
        if (demographic?.length) mdParams.publicationDemographic = demographic;
        mdParams.limit = limit;
        mdParams.offset = offset;
        mdParams.includes = ["cover_art"];

        const mdResults = await searchManga(mdParams as any);

        const mdMapped = await Promise.all(
          mdResults.data.slice(0, limit - results.length).map(async (entity) => {
            const coverFile = entity.relationships.find(r => r.type === "cover_art");
            const coverUrl = coverFile
              ? `https://uploads.mangadex.org/covers/${entity.id}/${(coverFile.attributes as { fileName?: string })?.fileName || ""}.512.jpg`
              : undefined;
            const mapped = mapManga(entity, coverUrl);
            try {
              await syncManga(entity.id);
            } catch {
              // silent: already mapped for response even if db write fails
            }
            return mapped;
          })
        );

        const combined = [...results, ...mdMapped].slice(0, limit);

        return NextResponse.json({
          manga: combined,
          total: (mdResults.total || 0) + total,
          page,
          limit,
          totalPages: Math.ceil(((mdResults.total || 0) + total) / limit),
          facets: {
            genres: [],
            tags: [],
            authors: [],
            status: [],
            type: [],
            demographic: [],
            year: [],
          },
        });
      } catch {
        // MangaDex fallback failed, return local results
      }
    }

    const mangaIds = results.map(r => r.id);
    const genresData = mangaIds.length > 0 ? await db
      .select({
        mangaId: mangaGenres.mangaId,
        genre: { id: genres.id, name: genres.name, slug: genres.slug, mangaCount: genres.mangaCount }
      })
      .from(mangaGenres)
      .innerJoin(genres, eq(mangaGenres.genreId, genres.id))
      .where(inArray(mangaGenres.mangaId, mangaIds)) : [];

    const tagsData = mangaIds.length > 0 ? await db
      .select({
        mangaId: mangaTags.mangaId,
        tag: { id: tags.id, name: tags.name, slug: tags.slug, group: tags.group, mangaCount: tags.mangaCount }
      })
      .from(mangaTags)
      .innerJoin(tags, eq(mangaTags.tagId, tags.id))
      .where(inArray(mangaTags.mangaId, mangaIds)) : [];

    const authorsData = mangaIds.length > 0 ? await db
      .select({
        mangaId: mangaAuthors.mangaId,
        author: { id: authors.id, name: authors.name, slug: authors.slug, mangaCount: authors.mangaCount }
      })
      .from(mangaAuthors)
      .innerJoin(authors, eq(mangaAuthors.authorId, authors.id))
      .where(inArray(mangaAuthors.mangaId, mangaIds)) : [];

    const artistsData = mangaIds.length > 0 ? await db
      .select({
        mangaId: mangaArtists.mangaId,
        artist: { id: artists.id, name: artists.name, slug: artists.slug, mangaCount: artists.mangaCount }
      })
      .from(mangaArtists)
      .innerJoin(artists, eq(mangaArtists.artistId, artists.id))
      .where(inArray(mangaArtists.mangaId, mangaIds)) : [];

    const latestChapters = mangaIds.length > 0 ? await db
      .select()
      .from(chapters)
      .where(inArray(chapters.id, results.map(r => r.latestChapterId).filter(Boolean) as string[])) : [];

    const enrichedResults = results.map(m => ({
      ...m,
      genres: genresData.filter(g => g.mangaId === m.id).map(g => g.genre),
      tags: tagsData.filter(t => t.mangaId === m.id).map(t => t.tag),
      authors: authorsData.filter(a => a.mangaId === m.id).map(a => a.author),
      artists: artistsData.filter(a => a.mangaId === m.id).map(a => a.artist),
      latestChapter: latestChapters.find(c => c.id === m.latestChapterId),
    }));

    return NextResponse.json({
      manga: enrichedResults,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      facets: {
        genres: [],
        tags: [],
        authors: [],
        status: [],
        type: [],
        demographic: [],
        year: [],
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0].message },
        { status: 400 }
      );
    }
    console.error("Search error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}