import { NextRequest, NextResponse } from "next/server";
import { getHomeData } from "@/services/home";
import { cacheGet, cacheSet } from "@/services/cache";
import { searchManga } from "@/services/mangadex";
import type { HomeSection, HeroManga, Manga } from "@/services/home/types";

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    console.log("[cron] Starting cache warming...");

    const homeData = await getHomeData();
    const sections = homeData.sections || [];

    // Find sections by type
    const heroSection = sections.find(s => s.type === "hero");
    const trendingSection = sections.find(s => s.type === "carousel" && s.id === "trending");
    const latestSection = sections.find(s => s.type === "carousel" && s.id === "latest");
    const popularSection = sections.find(s => s.type === "carousel" && s.id === "popular");

    // Type narrow the data
    const featured = heroSection && heroSection.type === "hero" ? heroSection.data : null;
    const trending = trendingSection && trendingSection.type === "carousel" ? trendingSection.data as Manga[] : undefined;
    const latest = latestSection && latestSection.type === "carousel" ? latestSection.data as Manga[] : undefined;
    const popular = popularSection && popularSection.type === "carousel" ? popularSection.data as Manga[] : undefined;

    // Pre-warm trending searches
    const trendingSearches = ["one piece", "chainsaw man", "solo leveling", "berserk", "vinland saga"];

    for (const query of trendingSearches) {
      try {
        const { searchManga } = await import("@/services/mangadex");
        const res = await searchManga({ title: query, limit: 10 });
        console.log(`[cron] Warmed search: ${query} (${res.data.length} results)`);
      } catch (e) {
        console.warn(`[cron] Failed to warm search for: ${query}`, e);
      }
    }

    console.log("[cron] Cache warming completed", {
      featured: featured ? 1 : 0,
      trending: trending?.length || 0,
      latest: latest?.length || 0,
      popular: popular?.length || 0,
    });

    return NextResponse.json({
      success: true,
      message: "Cache warmed successfully",
      warmed: {
        featured: featured ? 1 : 0,
        trending: trending?.length || 0,
        latest: latest?.length || 0,
        popular: popular?.length || 0,
      },
    });
  } catch (error) {
    console.error("[cron] Cache warming failed:", error);
    return NextResponse.json(
      { error: "Cache warming failed" },
      { status: 500 }
    );
  }
}