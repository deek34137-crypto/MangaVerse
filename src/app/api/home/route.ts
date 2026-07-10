import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { getHomeData } from "@/services/home";

export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    const userId = session?.user?.id;

    const homeData = await getHomeData(userId);

    const response = {
      version: 1,
      generatedAt: new Date().toISOString(),
      data: homeData,
    };

    return NextResponse.json(response, {
      headers: {
        "Cache-Control": "public, s-maxage=60, stale-while-revalidate=120",
      },
    });
  } catch (error) {
    console.error("Home API error:", error);

    return NextResponse.json(
      {
        version: 1,
        generatedAt: new Date().toISOString(),
        data: {
          featured: { manga: [], total: 0, error: true },
          trending: { manga: [], total: 0, error: true },
          popular: { manga: [], total: 0, error: true },
          latest: { manga: [], total: 0, error: true },
          continueReading: { manga: [], total: 0, error: true },
          recommendations: { manga: [], total: 0, error: true },
        },
      },
      { status: 500 }
    );
  }
}