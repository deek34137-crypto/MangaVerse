import { NextRequest, NextResponse } from "next/server";
import { getHomeData } from "@/services/home";
import { warmHomepageCache } from "@/services/cache/warm";

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    console.log("[cron] Starting scheduled sync...");

    // Warm the cache for all homepage sections
    await warmHomepageCache();

    console.log("[cron] Sync completed");

    return NextResponse.json({
      success: true,
      message: "Cache warmed successfully",
    });
  } catch (error) {
    console.error("[cron] Sync failed:", error);
    return NextResponse.json(
      { error: "Sync failed" },
      { status: 500 }
    );
  }
}