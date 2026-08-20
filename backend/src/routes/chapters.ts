import { Hono } from "hono";
import { adapterRegistry } from "../lib/adapters";
import { edgeCache, CACHE_TTL } from "../lib/cache/edge-cache";
import { healthManager } from "../lib/health/health-manager";
import { PageCountResolution } from "../types";

export const chaptersRouter = new Hono();

async function handleChapters(c: any, providerRaw: string, idRaw: string, urlRaw?: string) {
  let provider = (providerRaw || "").trim().toLowerCase();
  const id = (idRaw || "").trim();
  const url = urlRaw ? String(urlRaw).trim() : undefined;

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
  if (cached) {
    c.header("Cache-Control", "public, max-age=1800, s-maxage=86400, stale-while-revalidate=604800");
    return c.json(cached);
  }

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
      fetchedAt: Date.now(),
    };

    await edgeCache.set(cacheKey, response, CACHE_TTL.CHAPTERS);
    c.header("Cache-Control", "public, max-age=1800, s-maxage=86400, stale-while-revalidate=604800");
    return c.json(response);
  } catch (err: any) {
    healthManager.recordFailure(provider, err.message);
    return c.json({ error: err.message || "Failed to fetch chapters" }, 500);
  }
}

chaptersRouter.get("/", async (c) => {
  const provider = c.req.query("provider") || c.req.query("source") || "";
  const id = c.req.query("id") || "";
  const url = c.req.query("url") || undefined;
  return handleChapters(c, provider, id, url);
});

chaptersRouter.post("/", async (c) => {
  const body = await c.req.json().catch(() => ({}));
  const provider = body.provider || body.source || "";
  const id = body.id || "";
  const url = body.url;
  return handleChapters(c, provider, id, url);
});
