import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { chapters, chapterPages } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { syncManga, syncChapters, syncChapterPages } from "@/services/mangadex";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; chapterId: string }> }
) {
  try {
    const { id, chapterId } = await params;

    let chapterData = await db
      .select()
      .from(chapters)
      .where(and(eq(chapters.id, chapterId), eq(chapters.mangaId, id)))
      .limit(1);

    if (chapterData.length === 0) {
      try {
        await syncManga(id);
        await syncChapters(id);
      } catch {
        return NextResponse.json({ error: "Chapter not found on MangaDex" }, { status: 404 });
      }
      chapterData = await db
        .select()
        .from(chapters)
        .where(and(eq(chapters.id, chapterId), eq(chapters.mangaId, id)))
        .limit(1);
    }

    if (chapterData.length === 0) {
      return NextResponse.json({ error: "Chapter not found" }, { status: 404 });
    }

    const chapter = chapterData[0];

    let pagesData = await db
      .select()
      .from(chapterPages)
      .where(eq(chapterPages.chapterId, chapterId))
      .orderBy(chapterPages.number);

    if (pagesData.length === 0) {
      try {
        await syncChapterPages(chapterId);
        pagesData = await db
          .select()
          .from(chapterPages)
          .where(eq(chapterPages.chapterId, chapterId))
          .orderBy(chapterPages.number);
      } catch {
        // pages not available
      }
    }

    return NextResponse.json({
      ...chapter,
      pages: pagesData,
    });
  } catch (error) {
    console.error("Get chapter error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}