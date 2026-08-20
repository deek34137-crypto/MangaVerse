import { Hono } from "hono";
import { adapterRegistry } from "../lib/adapters";
import { edgeCache, CACHE_TTL } from "../lib/cache/edge-cache";
import { healthManager } from "../lib/health/health-manager";
import { PageCountResolution } from "../types";

export const chaptersRouter = new Hono();

chaptersRouter.post("/", async (c) => {
  try {
    const body = await c.req.json().catch(() => ({}));
    let provider = (body.provider || body.source || "").trim().toLowerCase();
    const id = (body.id || "").trim();
    const url = body.url ? String(body.url).trim() : undefined;

    // Auto-detect provider from URL if not specified
    if (!provider && url) {
      for (const adapter of adapterRegistry.getAll()) {
        if (url.includes(adapter.id) || url.includes(new URL(adapter.baseUrl).hostname)) {
          provider = adapter.id;
          break;
        }
      }
    }

    if (!provider) {
      return c.json({ error: "Missing required field: provider or valid manga url" }, 400);
    }

    const adapter = adapterRegistry.get(provider);
    if (!adapter) {
      return c.json({ error: `Provider "${provider}" not found` }, 404);
    }

    const cacheKey = `manga:chapters:${provider}:${id || url}`;
    const cached = await edgeCache.get(cacheKey);
    if (cached) return c.json(cached);

    const tStart = Date.now();
    try {
      const rawChapters = await adapter.getChapters({ provider, id: id || url || "", url });
      healthManager.recordSuccess(provider, Date.now() - tStart);

      // Fast, non-blocking check for already cached page counts
      const enrichedChapters = await Promise.all(
        rawChapters.map(async (ch) => {
          if (ch.pageCount != null) return ch;
          const pageCacheKey = `mangahub:pagecount:${provider}:${ch.id}`;
          const pageCached = await edgeCache.get<PageCountResolution>(pageCacheKey);
          if (pageCached && pageCached.status === "resolved") {
            return { ...ch, pageCount: pageCached.count };
          }
          return { ...ch, pageCount: null };
        })
      );

      const response = {
        provider: adapter.id,
        providerName: adapter.name,
        totalChapters: enrichedChapters.length,
        chapters: enrichedChapters,
      };

      await edgeCache.set(cacheKey, response, CACHE_TTL.CHAPTERS);
      return c.json(response);
    } catch (err: any) {
      healthManager.recordFailure(provider, err.message);
      return c.json({ error: err.message || "Failed to fetch chapters" }, 500);
    }
  } catch (err: any) {
    return c.json({ error: err?.message || "Internal server error" }, 500);
  }
});
