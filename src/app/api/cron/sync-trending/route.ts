import { NextRequest, NextResponse } from "next/server";
import { searchManga, getPopularManga, getLatestManga } from "@/services/mangadex";
import { mapManga } from "@/services/mangadex/mapping";
import { cacheSet, cacheGet, cacheDel, buildTrendingKey, buildPopularKey, buildLatestKey, getTTL } from "@/services/cache";

const CRON_SECRET = process.env.CRON_SECRET;

const locks = new Map<string, Promise<any>>();

async function withLock<T>(key: string, fn: () => Promise<any>): Promise<any> {
  const existing = locks.get(key);
  if (existing) {
    throw new Error("Lock already held");
  }

  const promise = (async () => {
    try {
      return await fn();
    } finally {
      locks.delete(key);
    }
  })();

  locks.set(key, promise);

  try {
    return await promise;
  } finally {
    locks.delete(key);
  }
}

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && request.headers.get("authorization") !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return withLock("sync-trending", async () => {
    try {
      console.log("[cron] Starting trending/popular/latest sync...");

      const [trendingRes, popularRes, latestRes] = await Promise.allSettled([
        searchManga({
          order: { updatedAt: "desc" },
          limit: 20,
          contentRating: ["safe", "suggestive"],
          includes: ["cover_art", "author", "artist"],
        }),
        (async () => {
          const { getPopularManga } = await import("@/services/mangadex/manga");
          return getPopularManga(20, 0);
        })(),
        (async () => {
          const { getLatestManga } = await import("@/services/mangadex/manga");
          return getLatestManga(20, 0);
        })(),
      ]);

      const results = { trending: 0, popular: 0, latest: 0 };

      if (trendingRes.status === "fulfilled") {
        const mapped = await Promise.all(
          trendingRes.value.data.map((e: any) => mapManga(e))
        );
        await cacheSet(
          `v1:home:trending:20`,
          { manga: mapped, total: trendingRes.value.total ?? mapped.length },
          300
        );
        results.trending = mapped.length;
      }

      if (popularRes.status === "fulfilled") {
        const mapped = await Promise.all(
          popularRes.value.data.map((e: any) => mapManga(e))
        );
        await cacheSet(
          `v1:home:popular:20`,
          { manga: mapped, total: popularRes.value.total ?? mapped.length },
          900
        );
        results.popular = mapped.length;
      }

      if (latestRes.status === "fulfilled") {
        const mapped = await Promise.all(
          latestRes.value.data.map((e: any) => mapManga(e))
        );
        await cacheSet(
          `v1:home:latest:20`,
          { manga: mapped, total: latestRes.value.total ?? mapped.length },
          120
        );
        results.latest = mapped.length;
      }

      console.log("[cron] Trending sync completed", results);

      return NextResponse.json({
        success: true,
        synced: results,
      });
    } catch (error) {
      console.error("[cron] Trending sync failed:", error);
      return NextResponse.json(
        { error: "Sync failed" },
        { status: 500 }
      );
    }
  });
}