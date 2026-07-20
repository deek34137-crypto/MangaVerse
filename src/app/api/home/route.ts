import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { homeService } from "@/services/home";
import { cacheGet, cacheSet } from "@/services/cache";

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    const userId = session?.user?.id;

    const cacheKey = `home:${userId || "anon"}`;
    const cached = await cacheGet<any>(cacheKey);
    if (cached) {
      return NextResponse.json(cached);
    }

    const data = await homeService.getHomeData(userId);

    await cacheSet(cacheKey, data, 1800); // 30 minutes

    return NextResponse.json(data);
  } catch (error) {
    console.error("Home API error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}