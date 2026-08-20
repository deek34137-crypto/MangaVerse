import { Hono } from "hono";
import { MetadataApiRequest, MetadataApiResponse, NormalizedManga } from "../types";
import { metadataResolver } from "../lib/metadata/metadata-resolver";

export const metadataRouter = new Hono();

/**
 * POST /api/manga/metadata
 * High-quality metadata resolution endpoint (AniList / Kitsu / Jikan).
 */
metadataRouter.post("/", async (c) => {
  try {
    const body = await c.req.json<MetadataApiRequest>();

    if (!body || !body.title) {
      return c.json({ error: "Missing required 'title' field" }, 400);
    }

    const dummyBaseManga: NormalizedManga = {
      id: body.providerId || "custom",
      title: body.title,
      altTitles: body.altTitles || [],
      genres: [],
      authors: body.author ? [body.author] : [],
      artists: [],
      status: "unknown",
      provider: body.provider || "provider",
      url: "",
    };

    const enriched = await metadataResolver.resolveMangaMetadata(dummyBaseManga);

    const response: MetadataApiResponse = {
      manga: enriched.manga,
      confidence: enriched.confidence,
      source: enriched.source,
    };

    return c.json(response);
  } catch (err: any) {
    return c.json(
      { error: err?.message || "Failed to resolve metadata" },
      500
    );
  }
});
