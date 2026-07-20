import { NextResponse } from "next/server";
import { db } from "@/db";
import { sql } from "drizzle-orm";
import { providerRegistry } from "@/services/providers";
import { getCacheBackend } from "@/services/cache";

export async function GET() {
  const startTime = performance.now();
  const checks: Record<string, { status: "healthy" | "unhealthy" | "degraded"; latencyMs?: number; details?: any }> = {};

  // 1. Database Check
  const dbStart = performance.now();
  try {
    await db.execute(sql`SELECT 1`);
    checks.database = { status: "healthy", latencyMs: Math.round(performance.now() - dbStart) };
  } catch (err: any) {
    checks.database = { status: "unhealthy", latencyMs: Math.round(performance.now() - dbStart), details: err.message };
  }

  // 2. Cache/Redis Check
  const cacheStart = performance.now();
  try {
    const backend = getCacheBackend();
    await backend.set("__healthcheck__", "ok", 10);
    const val = await backend.get<string>("__healthcheck__");
    checks.cache = {
      status: val === "ok" ? "healthy" : "degraded",
      latencyMs: Math.round(performance.now() - cacheStart),
      details: { backend: backend.constructor.name },
    };
  } catch (err: any) {
    checks.cache = { status: "unhealthy", latencyMs: Math.round(performance.now() - cacheStart), details: err.message };
  }

  // 3. Provider Registry Check
  try {
    const providers = providerRegistry.getProviders();
    const enabledCount = providers.filter((p) => p.enabled).length;
    checks.providers = {
      status: enabledCount > 0 ? "healthy" : "degraded",
      details: {
        total: providers.length,
        enabled: enabledCount,
        list: providers.map((p) => ({ id: p.id, displayName: p.displayName, enabled: p.enabled })),
      },
    };
  } catch (err: any) {
    checks.providers = { status: "unhealthy", details: err.message };
  }

  const allHealthy = Object.values(checks).every((c) => c.status === "healthy");
  const anyUnhealthy = Object.values(checks).some((c) => c.status === "unhealthy");

  const status = allHealthy ? "healthy" : anyUnhealthy ? "unhealthy" : "degraded";
  const statusCode = status === "unhealthy" ? 503 : 200;

  return NextResponse.json(
    {
      status,
      timestamp: new Date().toISOString(),
      uptimeSeconds: Math.round(process.uptime()),
      totalLatencyMs: Math.round(performance.now() - startTime),
      checks,
    },
    { status: statusCode }
  );
}
