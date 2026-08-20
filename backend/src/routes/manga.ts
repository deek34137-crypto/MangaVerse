import { Hono } from "hono";
import { adapterRegistry } from "../lib/adapters";
import { edgeCache, CACHE_TTL } from "../lib/cache/edge-cache";
import { healthManager } from "../lib/health/health-manager";
import { metadataResolver } from "../lib/metadata/metadata-resolver";
import { NormalizedManga } from "../types";

export const mangaRouter = new Hono();

mangaRouter.post("/detail", async (c) => {
  try {
    const body = await c.req.json().catch(() => ({}));
    const provider = (body.provider || "").trim().toLowerCase();
    const id = (body.id || "").trim();
    const url = body.url ? String(body.url).trim() : undefined;

    if (!provider || !id) {
      return c.json({ error: "Missing required fields: provider and id" }, 400);
    }

    const adapter = adapterRegistry.get(provider);
    if (!adapter) {
      return c.json({ error: `Provider "${provider}" not supported` }, 404);
    }

    const cacheKey = `manga:detail:${provider}:${id}`;
    const cached = await edgeCache.get<NormalizedManga>(cacheKey);
    if (cached) return c.json(cached);

    const tStart = Date.now();
    try {
      const rawMangaDetail = await adapter.getMangaDetail({ provider, id, url });
      healthManager.recordSuccess(provider, Date.now() - tStart);

      // Non-blocking high-quality metadata enrichment
      let finalManga = rawMangaDetail;
      try {
        const enriched = await metadataResolver.resolveMangaMetadata(rawMangaDetail);
        finalManga = {
          ...rawMangaDetail,
          ...enriched.manga,
        };
      } catch {
        // Fallback gracefully to raw provider artwork
      }

      await edgeCache.set(cacheKey, finalManga, CACHE_TTL.MANGA_DETAIL);
      return c.json(finalManga);
    } catch (err: any) {
      healthManager.recordFailure(provider, err.message);
      return c.json({ error: err.message || "Failed to fetch manga detail" }, 500);
    }
  } catch (err: any) {
    return c.json({ error: err?.message || "Internal server error" }, 500);
  }
});
