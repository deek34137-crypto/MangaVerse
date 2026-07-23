import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/db";
import { history, libraryEntries } from "@/db/schema";
import { eq, and, sql } from "drizzle-orm";
import { z } from "zod";

const historySyncSchema = z.object({
  mangaId: z.string().uuid().or(z.string().min(1)),
  chapterId: z.string().uuid().or(z.string().min(1)),
  pageNumber: z.number().int().min(1).default(1),
  scrollOffset: z.number().default(0),
  readingMode: z.string().default("webtoon"),
  updatedAt: z.number().optional(),
});

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const parsed = historySyncSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid payload", details: parsed.error.format() }, { status: 400 });
    }

    const { mangaId, chapterId, pageNumber, updatedAt } = parsed.data;
    const userId = session.user.id;
    const readDate = updatedAt ? new Date(updatedAt) : new Date();

    // 1. Idempotent Upsert into History Table (Latest-write-wins)
    await db
      .insert(history)
      .values({
        userId,
        mangaId,
        chapterId,
        progress: pageNumber,
        readAt: readDate,
      })
      .onConflictDoUpdate({
        target: [history.userId, history.mangaId, history.chapterId],
        set: {
          progress: sql`EXCLUDED.progress`,
          readAt: sql`EXCLUDED.read_at`,
        },
      });

    // 2. Idempotent Upsert into Library Table (Update lastReadChapterId & progress)
    await db
      .insert(libraryEntries)
      .values({
        userId,
        mangaId,
        status: "reading",
        progress: pageNumber,
        lastReadChapterId: chapterId,
        lastReadAt: readDate,
      })
      .onConflictDoUpdate({
        target: [libraryEntries.userId, libraryEntries.mangaId],
        set: {
          lastReadChapterId: sql`EXCLUDED.last_read_chapter_id`,
          lastReadAt: sql`EXCLUDED.last_read_at`,
          updatedAt: new Date(),
        },
      });

    return NextResponse.json({
      success: true,
      mangaId,
      chapterId,
      pageNumber,
      syncedAt: readDate.toISOString(),
    });
  } catch (error: any) {
    console.error("[HistoryAPI] Error syncing history:", error);
    return NextResponse.json({ error: "Failed to persist reading progress" }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const mangaId = searchParams.get("mangaId");

  try {
    if (mangaId) {
      const records = await db
        .select()
        .from(history)
        .where(and(eq(history.userId, session.user.id), eq(history.mangaId, mangaId)))
        .orderBy(sql`read_at DESC`);
      return NextResponse.json({ history: records });
    }

    const allHistory = await db
      .select()
      .from(history)
      .where(eq(history.userId, session.user.id))
      .orderBy(sql`read_at DESC`)
      .limit(50);

    return NextResponse.json({ history: allHistory });
  } catch (error: any) {
    console.error("[HistoryAPI] Error fetching history:", error);
    return NextResponse.json({ error: "Failed to fetch history" }, { status: 500 });
  }
}
