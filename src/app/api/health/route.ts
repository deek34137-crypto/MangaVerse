import { NextResponse } from "next/server";
import { getCacheBackend, getTieredMetrics } from "@/services/cache";
import { db } from "@/db";
import { manga } from "@/db/schema";
import { count } from "drizzle-orm";

export async function GET() {
  try {
    const startTime = Date.now();
    
    // Check database
    let dbStatus = "ok";
    let dbLatency = 0;
    try {
      const dbStart = Date.now();
      await db.select({ count: count() }).from(manga).limit(1);
      dbLatency = Date.now() - dbStart;
    } catch (e) {
      dbStatus = "error";
    }

    // Check Redis
    let redisStatus = "ok";
    let redisLatency = 0;
    try {
      const redisStart = Date.now();
      const cache = await getCacheBackend();
      await cache.set("health-check", "ok", 10);
      await cache.get("health-check");
      redisLatency = Date.now() - redisStart;
    } catch (e) {
      redisStatus = "error";
    }

    // Check MangaDex API
    let mangadexStatus = "ok";
    let mangadexLatency = 0;
    try {
      const mdStart = Date.now();
      const response = await fetch("https://api.mangadex.org/manga", {
        method: "GET",
        headers: { "Accept": "application/json" },
        signal: AbortSignal.timeout(5000),
      });
      mangadexLatency = Date.now() - mdStart;
      if (!response.ok) mangadexStatus = "error";
    } catch {
      mangadexStatus = "error";
    }

    const tieredMetrics = getTieredMetrics();
    const allOk = dbStatus === "ok" && redisStatus === "ok" && mangadexStatus === "ok";

    return NextResponse.json(
      {
        status: allOk ? "healthy" : "degraded",
        timestamp: new Date().toISOString(),
        latencyMs: Date.now() - startTime,
        services: {
          database: { status: dbStatus, latencyMs: dbLatency },
          redis: { status: redisStatus, latencyMs: redisLatency },
          mangadex: { status: mangadexStatus, latencyMs: mangadexLatency },
          cache: {
            status: "ok",
            ...tieredMetrics,
          },
        },
      },
      {
        status: allOk ? 200 : 503,
        headers: {
          "Cache-Control": "no-cache, no-store, must-revalidate",
        },
      }
    );
  } catch (error) {
    return NextResponse.json(
      { status: "unhealthy", error: String(error) },
      { status: 503 }
    );
  }
}