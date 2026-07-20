import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { trendingService } from "@/services/trending";

export async function GET(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ items: [] });
    }

    const items = await trendingService.getContinueReading(session.user.id);
    return NextResponse.json({ items });
  } catch (error) {
    console.error("Continue reading API error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}