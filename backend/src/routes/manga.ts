import { Hono } from "hono";
import { adapterRegistry } from "../lib/adapters";
import { edgeCache, CACHE_TTL } from "../lib/cache/edge-cache";
import { healthManager } from "../lib/health/health-manager";
import { metadataResolver } from "../lib/metadata/metadata-resolver";
import { NormalizedManga } from "../types";

export const mangaRouter = new Hono();

async function handleMangaDetail(c: any, providerRaw: string, idRaw: string, urlRaw?: string) {
  const provider = (providerRaw || "").trim().toLowerCase();
  const id = (idRaw || "").trim();
  const url = urlRaw ? String(urlRaw).trim() : undefined;

  if (!provider || !id) {
    return c.json({ error: "Missing required fields: provider and id" }, 400);
  }

  const adapter = adapterRegistry.get(provider);
  if (!adapter) {
    return c.json({ error: `Provider "${provider}" not supported` }, 404);
  }

  const cacheKey = `manga:detail:${provider}:${id}`;
  const cached = await edgeCache.get<NormalizedManga>(cacheKey);
  if (cached) {
    c.header("Cache-Control", "public, max-age=3600, s-maxage=86400, stale-while-revalidate=604800");
    return c.json(cached);
  }

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
      // Fallback gracefully
    }

    await edgeCache.set(cacheKey, finalManga, CACHE_TTL.MANGA_DETAIL);
    c.header("Cache-Control", "public, max-age=3600, s-maxage=86400, stale-while-revalidate=604800");
    return c.json(finalManga);
  } catch (err: any) {
    healthManager.recordFailure(provider, err.message);
    return c.json({ error: err.message || "Failed to fetch manga detail" }, 500);
  }
}

mangaRouter.get("/detail", async (c) => {
  const provider = c.req.query("provider") || "";
  const id = c.req.query("id") || "";
  const url = c.req.query("url") || undefined;
  return handleMangaDetail(c, provider, id, url);
});

mangaRouter.post("/detail", async (c) => {
  const body = await c.req.json().catch(() => ({}));
  const provider = body.provider || "";
  const id = body.id || "";
  const url = body.url;
  return handleMangaDetail(c, provider, id, url);
});
