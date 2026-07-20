import { NextRequest, NextResponse } from "next/server";
import { getMangaDetail } from "@/services/manga";
import { safeJsonResponse } from "@/lib/utils";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const mangaData = await getMangaDetail(id);

    if (!mangaData) {
      return NextResponse.json({ error: "Manga not found" }, { status: 404 });
    }

    return safeJsonResponse(mangaData);
  } catch (error) {
    console.error("Get manga error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}