import { db } from "@/db";
import {
  manga as mangaTable,
  genres as genresTable,
  tags as tagsTable,
  authors as authorsTable,
  artists as artistsTable,
  scanlatorGroups as scanlatorGroupsTable,
  chapters as chaptersTable,
  chapterPages as chapterPagesTable,
  mangaGenres,
  mangaTags,
  mangaAuthors,
  mangaArtists,
  chapterScanlatorGroups,
} from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { getManga, getMangaFeed, getChapter, getChapterImages, getCoverArt } from "./manga";
import { mapManga, mapMangaChapter, mapMangaPages } from "./mapping";
import type { Manga, Chapter, Genre, Tag, Author, Artist } from "@/types";

async function upsertAndLinkGenres(genres: Genre[]): Promise<string[]> {
  const ids: string[] = [];
  for (const g of genres) {
    const existing = await db.select({ id: genresTable.id }).from(genresTable).where(eq(genresTable.slug, g.slug)).limit(1);
    if (existing.length > 0) {
      ids.push(existing[0].id);
    } else {
      const inserted = await db.insert(genresTable).values({ name: g.name, slug: g.slug }).returning({ id: genresTable.id });
      ids.push(inserted[0].id);
    }
  }
  return ids;
}

async function upsertAndLinkTags(tags: Tag[]): Promise<string[]> {
  const ids: string[] = [];
  for (const t of tags) {
    const existing = await db.select({ id: tagsTable.id }).from(tagsTable).where(eq(tagsTable.slug, t.slug)).limit(1);
    if (existing.length > 0) {
      ids.push(existing[0].id);
    } else {
      const inserted = await db.insert(tagsTable).values({ name: t.name, slug: t.slug, group: typeof t.group === "string" ? t.group : t.group.name }).returning({ id: tagsTable.id });
      ids.push(inserted[0].id);
    }
  }
  return ids;
}

async function upsertAndLinkAuthors(authors: Author[]): Promise<string[]> {
  const ids: string[] = [];
  for (const a of authors) {
    const existing = await db.select({ id: authorsTable.id }).from(authorsTable).where(eq(authorsTable.slug, a.slug)).limit(1);
    if (existing.length > 0) {
      ids.push(existing[0].id);
    } else {
      const inserted = await db.insert(authorsTable).values({ name: a.name, slug: a.slug }).returning({ id: authorsTable.id });
      ids.push(inserted[0].id);
    }
  }
  return ids;
}

async function upsertAndLinkArtists(artists: Artist[]): Promise<string[]> {
  const ids: string[] = [];
  for (const a of artists) {
    const existing = await db.select({ id: artistsTable.id }).from(artistsTable).where(eq(artistsTable.slug, a.slug)).limit(1);
    if (existing.length > 0) {
      ids.push(existing[0].id);
    } else {
      const inserted = await db.insert(artistsTable).values({ name: a.name, slug: a.slug }).returning({ id: artistsTable.id });
      ids.push(inserted[0].id);
    }
  }
  return ids;
}

async function upsertScanlatorGroup(name: string, slug: string, id: string): Promise<string> {
  const existing = await db.select({ id: scanlatorGroupsTable.id }).from(scanlatorGroupsTable).where(eq(scanlatorGroupsTable.slug, slug)).limit(1);
  if (existing.length > 0) return existing[0].id;
  const inserted = await db.insert(scanlatorGroupsTable).values({ name, slug }).returning({ id: scanlatorGroupsTable.id });
  return inserted[0].id;
}

export async function syncManga(mangaId: string): Promise<Manga> {
  const mdEntity = await getManga(mangaId);
  const coverFileName = mdEntity.relationships.find(r => r.type === "cover_art");
  const coverUrl = coverFileName ? await getCoverArt(mangaId, (coverFileName.attributes as { fileName?: string })?.fileName || "") : undefined;
  const mapped = mapManga(mdEntity, coverUrl);

  const existing = await db.select({ id: mangaTable.id }).from(mangaTable).where(eq(mangaTable.id, mangaId)).limit(1);

  if (existing.length === 0) {
    await db.insert(mangaTable).values({
      id: mangaId,
      title: mapped.title,
      altTitles: mapped.altTitles,
      description: mapped.description || null,
      coverImage: mapped.coverImage || null,
      status: mapped.status,
      type: mapped.type,
      demographic: mapped.demographic || null,
      startDate: mapped.startDate ? new Date(mapped.startDate) : null,
      createdAt: new Date(mapped.createdAt),
      updatedAt: new Date(mapped.updatedAt),
    });
  } else {
    await db.update(mangaTable).set({
      title: mapped.title,
      altTitles: mapped.altTitles,
      description: mapped.description || null,
      coverImage: mapped.coverImage || null,
      status: mapped.status,
      type: mapped.type,
      demographic: mapped.demographic || null,
      updatedAt: new Date(),
    }).where(eq(mangaTable.id, mangaId));
  }

  const genreIds = await upsertAndLinkGenres(mapped.genres);
  const tagIds = await upsertAndLinkTags(mapped.tags);
  const authorIds = await upsertAndLinkAuthors(mapped.authors);
  const artistIds = await upsertAndLinkArtists(mapped.artists);

  for (const gId of genreIds) {
    await db.insert(mangaGenres).values({ mangaId, genreId: gId }).onConflictDoNothing();
  }
  for (const tId of tagIds) {
    await db.insert(mangaTags).values({ mangaId, tagId: tId }).onConflictDoNothing();
  }
  for (const aId of authorIds) {
    await db.insert(mangaAuthors).values({ mangaId, authorId: aId }).onConflictDoNothing();
  }
  for (const aId of artistIds) {
    await db.insert(mangaArtists).values({ mangaId, artistId: aId }).onConflictDoNothing();
  }

  return mapped;
}

export async function syncChapters(mangaId: string): Promise<Chapter[]> {
  const feed = await getMangaFeed(mangaId, { limit: 500, translatedLanguage: ["en"] });
  const chapters: Chapter[] = [];

  for (const entity of feed.data) {
    const mapped = mapMangaChapter(entity, mangaId);
    chapters.push(mapped);

    const existing = await db.select({ id: chaptersTable.id }).from(chaptersTable)
      .where(and(eq(chaptersTable.mangaId, mangaId), eq(chaptersTable.id, entity.id)))
      .limit(1);

    if (existing.length === 0) {
      await db.insert(chaptersTable).values({
        id: mapped.id,
        mangaId: mapped.mangaId,
        number: String(mapped.number),
        volume: mapped.volume || null,
        title: mapped.title || null,
        language: mapped.language,
        pageCount: mapped.pageCount,
        publishedAt: new Date(mapped.publishedAt),
        createdAt: new Date(mapped.createdAt),
        updatedAt: new Date(mapped.updatedAt),
      });
    }

    for (const group of mapped.scanlatorGroups) {
      const groupId = await upsertScanlatorGroup(group.name, group.slug, group.id);
      await db.insert(chapterScanlatorGroups).values({ chapterId: mapped.id, groupId }).onConflictDoNothing();
    }

    try {
      const images = await getChapterImages(entity.id);
      const pages = mapMangaPages(images.baseUrl, images.chapter.hash, images.chapter.data, mapped.id);
      for (const page of pages) {
        await db.insert(chapterPagesTable).values({
          chapterId: page.chapterId,
          number: page.number,
          url: page.url,
          width: page.width,
          height: page.height,
          size: page.size,
        }).onConflictDoNothing();
      }
    } catch {
      // images not available yet for future chapters
    }
  }

  await db.update(mangaTable).set({
    chapterCount: chapters.length,
    latestChapterId: chapters[chapters.length - 1]?.id || null,
    updatedAt: new Date(),
  }).where(eq(mangaTable.id, mangaId));

  return chapters;
}

export async function syncChapterPages(chapterId: string): Promise<void> {
  const images = await getChapterImages(chapterId);
  const pages = mapMangaPages(images.baseUrl, images.chapter.hash, images.chapter.data, chapterId);
  for (const page of pages) {
    await db.insert(chapterPagesTable).values({
      chapterId: page.chapterId,
      number: page.number,
      url: page.url,
      width: page.width,
      height: page.height,
      size: page.size,
    }).onConflictDoNothing();
  }
}