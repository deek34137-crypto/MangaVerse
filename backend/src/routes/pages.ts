import { Hono } from "hono";
import { adapterRegistry } from "../lib/adapters";
import { edgeCache, CACHE_TTL } from "../lib/cache/edge-cache";
import { healthManager } from "../lib/health/health-manager";
import { PagesApiResponse, PageCountResolution } from "../types";

export const pagesRouter = new Hono();

const MAX_PAGES = 500;

pagesRouter.post("/", async (c) => {
  try {
    const body = await c.req.json().catch(() => ({}));
    let provider = (body.provider || body.source || "").trim().toLowerCase();
    const chapterId = (body.chapterId || body.id || "").trim();
    const url = body.url ? String(body.url).trim() : undefined;

    // Auto-detect provider from URL if not given
    if (!provider && url) {
      for (const adapter of adapterRegistry.getAll()) {
        if (url.includes(adapter.id) || url.includes(new URL(adapter.baseUrl).hostname)) {
          provider = adapter.id;
          break;
        }
      }
    }

    if (!provider || (!chapterId && !url)) {
      return c.json({ error: "Missing required fields: provider and chapterId/url" }, 400);
    }

    const adapter = adapterRegistry.get(provider);
    if (!adapter) {
      return c.json({ error: `Provider "${provider}" not supported` }, 404);
    }

    const cacheKey = `chapter:pages:${provider}:${chapterId || url}`;
    const cached = await edgeCache.get<PagesApiResponse>(cacheKey);
    if (cached) return c.json(cached);

    const tStart = Date.now();
    try {
      const rawPages = await adapter.getPages({ provider, id: chapterId, url });
      healthManager.recordSuccess(provider, Date.now() - tStart);

      // Enforce MAX_PAGES safety ceiling
      const pages = rawPages.slice(0, MAX_PAGES);

      const response: PagesApiResponse = {
        chapterId: chapterId || url || "",
        provider: adapter.id,
        pages,
        totalPages: pages.length,
      };

      await edgeCache.set(cacheKey, response, CACHE_TTL.PAGES);

      // Automatically cache page count resolution for future chapter queries
      if (chapterId) {
        const pageCountCacheKey = `mangahub:pagecount:${provider}:${chapterId}`;
        const resolution: PageCountResolution = {
          status: "resolved",
          count: pages.length,
        };
        await edgeCache.set(pageCountCacheKey, resolution, 14 * 24 * 3600);
      }

      return c.json(response);
    } catch (err: any) {
      healthManager.recordFailure(provider, err.message);
      return c.json({ error: err.message || "Failed to extract chapter pages" }, 500);
    }
  } catch (err: any) {
    return c.json({ error: err?.message || "Internal server error" }, 500);
  }
});
