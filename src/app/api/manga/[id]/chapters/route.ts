import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { chapters, chapterPages, chapterScanlatorGroups, scanlatorGroups, manga } from "@/db/schema";
import { eq, and, desc, asc, inArray, count } from "drizzle-orm";
import { syncManga, syncChapters } from "@/services/mangadex";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    let mangaResult = await db
      .select({ id: manga.id })
      .from(manga)
      .where(eq(manga.id, id))
      .limit(1);

    if (mangaResult.length === 0) {
      try {
        await syncManga(id);
        await syncChapters(id);
      } catch {
        return NextResponse.json({ error: "Manga not found on MangaDex" }, { status: 404 });
      }
      mangaResult = [{ id }];
    }

    let chaptersData = await db
      .select({
        id: chapters.id,
        mangaId: chapters.mangaId,
        number: chapters.number,
        volume: chapters.volume,
        title: chapters.title,
        language: chapters.language,
        pageCount: chapters.pageCount,
        publishedAt: chapters.publishedAt,
        createdAt: chapters.createdAt,
        updatedAt: chapters.updatedAt,
      })
      .from(chapters)
      .where(eq(chapters.mangaId, id))
      .orderBy(desc(chapters.number));

    if (chaptersData.length === 0) {
      try {
        await syncChapters(id);
        chaptersData = await db
          .select({
            id: chapters.id,
            mangaId: chapters.mangaId,
            number: chapters.number,
            volume: chapters.volume,
            title: chapters.title,
            language: chapters.language,
            pageCount: chapters.pageCount,
            publishedAt: chapters.publishedAt,
            createdAt: chapters.createdAt,
            updatedAt: chapters.updatedAt,
          })
          .from(chapters)
          .where(eq(chapters.mangaId, id))
          .orderBy(desc(chapters.number));
      } catch {
        return NextResponse.json({ error: "No chapters found" }, { status: 404 });
      }
    }

    const chapterIds = chaptersData.map(c => c.id);

    const [pagesData, scanlatorData] = await Promise.all([
      chapterIds.length > 0 ? db
        .select({
          chapterId: chapterPages.chapterId,
          id: chapterPages.id,
          number: chapterPages.number,
          url: chapterPages.url,
          width: chapterPages.width,
          height: chapterPages.height,
          size: chapterPages.size,
        })
        .from(chapterPages)
        .where(inArray(chapterPages.chapterId, chapterIds))
        .orderBy(asc(chapterPages.number)) : [],
      chapterIds.length > 0 ? db
        .select({
          chapterId: chapterScanlatorGroups.chapterId,
          group: { id: scanlatorGroups.id, name: scanlatorGroups.name, slug: scanlatorGroups.slug, website: scanlatorGroups.website, discord: scanlatorGroups.discord, description: scanlatorGroups.description }
        })
        .from(chapterScanlatorGroups)
        .innerJoin(scanlatorGroups, eq(chapterScanlatorGroups.groupId, scanlatorGroups.id))
        .where(inArray(chapterScanlatorGroups.chapterId, chapterIds)) : [],
    ]);

    const chaptersWithRelations = chaptersData.map(chapter => ({
      ...chapter,
      pages: pagesData.filter(p => p.chapterId === chapter.id),
      scanlatorGroups: scanlatorData.filter(s => s.chapterId === chapter.id).map(s => s.group),
    }));

    return NextResponse.json({
      chapters: chaptersWithRelations,
      total: chaptersWithRelations.length,
    });
  } catch (error) {
    console.error("Get chapters error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}