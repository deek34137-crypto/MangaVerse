import { NextRequest, NextResponse } from "next/server";
import { getChapterDetail } from "@/services/manga";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; chapterId: string }> }
) {
  try {
    const { id, chapterId } = await params;
    const chapterData = await getChapterDetail(id, chapterId);

    if (!chapterData) {
      return NextResponse.json({ error: "Chapter not found" }, { status: 404 });
    }

    return NextResponse.json(chapterData);
  } catch (error) {
    console.error("Get chapter error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}