import { Hono } from "hono";
import { adapterRegistry } from "../lib/adapters";
import { edgeCache, CACHE_TTL } from "../lib/cache/edge-cache";
import { healthManager } from "../lib/health/health-manager";
import { ChapterPage } from "../types";

export const pagesRouter = new Hono();

async function handlePages(c: any, providerRaw: string, chapterIdRaw: string, urlRaw?: string) {
  const provider = (providerRaw || "").trim().toLowerCase();
  const chapterId = (chapterIdRaw || "").trim();
  const url = urlRaw ? String(urlRaw).trim() : undefined;

  if (!provider || !chapterId) {
    return c.json({ error: "Missing required fields: provider and chapterId" }, 400);
  }

  const adapter = adapterRegistry.get(provider);
  if (!adapter) {
    return c.json({ error: `Provider "${provider}" not supported` }, 404);
  }

  const cacheKey = `chapter:pages:${provider}:${chapterId}`;
  const cached = await edgeCache.get<{ pages: ChapterPage[]; totalPages: number }>(cacheKey);
  if (cached) {
    c.header("Cache-Control", "public, max-age=86400, s-maxage=604800, stale-while-revalidate=2592000");
    return c.json({
      provider: adapter.id,
      chapterId,
      pages: cached.pages,
      totalPages: cached.totalPages,
      cached: true,
    });
  }

  const tStart = Date.now();
  try {
    const rawPages = await adapter.getPages({ provider, id: chapterId, url });
    healthManager.recordSuccess(provider, Date.now() - tStart);

    const result = {
      pages: rawPages,
      totalPages: rawPages.length,
    };

    await edgeCache.set(cacheKey, result, CACHE_TTL.PAGES);
    c.header("Cache-Control", "public, max-age=86400, s-maxage=604800, stale-while-revalidate=2592000");

    return c.json({
      provider: adapter.id,
      chapterId,
      pages: rawPages,
      totalPages: rawPages.length,
      cached: false,
    });
  } catch (err: any) {
    healthManager.recordFailure(provider, err.message);
    return c.json({ error: err.message || "Failed to fetch chapter pages" }, 500);
  }
}

pagesRouter.get("/", async (c) => {
  const provider = c.req.query("provider") || c.req.query("source") || "";
  const chapterId = c.req.query("chapterId") || c.req.query("id") || "";
  const url = c.req.query("url") || undefined;
  return handlePages(c, provider, chapterId, url);
});

pagesRouter.post("/", async (c) => {
  const body = await c.req.json().catch(() => ({}));
  const provider = body.provider || body.source || "";
  const chapterId = body.chapterId || body.id || "";
  const url = body.url;
  return handlePages(c, provider, chapterId, url);
});
