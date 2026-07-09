import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { manga, mangaGenres, mangaTags, mangaAuthors, mangaArtists, genres, tags, authors, artists, chapters } from "@/db/schema";
import { eq, and, desc, count } from "drizzle-orm";
import { syncManga } from "@/services/mangadex";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    let mangaData = await db
      .select()
      .from(manga)
      .where(eq(manga.id, id))
      .limit(1);

    if (mangaData.length === 0) {
      try {
        await syncManga(id);
        mangaData = await db
          .select()
          .from(manga)
          .where(eq(manga.id, id))
          .limit(1);
      } catch {
        return NextResponse.json({ error: "Manga not found on MangaDex" }, { status: 404 });
      }
    }

    if (mangaData.length === 0) {
      return NextResponse.json({ error: "Manga not found" }, { status: 404 });
    }

    const mangaItem = mangaData[0];

    const [genresData, tagsData, authorsData, artistsData, latestChapterData, chapterCountData] = await Promise.all([
      db
        .select({ id: genres.id, name: genres.name, slug: genres.slug })
        .from(genres)
        .innerJoin(mangaGenres, eq(mangaGenres.genreId, genres.id))
        .where(eq(mangaGenres.mangaId, id)),
      db
        .select({ id: tags.id, name: tags.name, slug: tags.slug, group: tags.group })
        .from(tags)
        .innerJoin(mangaTags, eq(mangaTags.tagId, tags.id))
        .where(eq(mangaTags.mangaId, id)),
      db
        .select({ id: authors.id, name: authors.name, slug: authors.slug, image: authors.image })
        .from(authors)
        .innerJoin(mangaAuthors, eq(mangaAuthors.authorId, authors.id))
        .where(eq(mangaAuthors.mangaId, id)),
      db
        .select({ id: artists.id, name: artists.name, slug: artists.slug, image: artists.image })
        .from(artists)
        .innerJoin(mangaArtists, eq(mangaArtists.artistId, artists.id))
        .where(eq(mangaArtists.mangaId, id)),
      db
        .select()
        .from(chapters)
        .where(eq(chapters.mangaId, id))
        .orderBy(desc(chapters.number))
        .limit(1),
      db
        .select({ count: count() })
        .from(chapters)
        .where(eq(chapters.mangaId, id)),
    ]);

    return NextResponse.json({
      ...mangaItem,
      genres: genresData,
      tags: tagsData,
      authors: authorsData,
      artists: artistsData,
      latestChapter: latestChapterData[0] || null,
      chapterCount: chapterCountData[0]?.count || 0,
    });
  } catch (error) {
    console.error("Get manga error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}