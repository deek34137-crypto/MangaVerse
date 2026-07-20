import { NextRequest, NextResponse } from "next/server";
import { getChaptersDetail } from "@/services/manga";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const chapters = await getChaptersDetail(id);

    return NextResponse.json({
      chapters,
      total: chapters.length,
    });
  } catch (error) {
    console.error("Get chapters error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}