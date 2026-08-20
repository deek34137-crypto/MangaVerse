import { Hono } from "hono";
import { adapterRegistry } from "../lib/adapters";
import { edgeCache, CACHE_TTL } from "../lib/cache/edge-cache";
import { NormalizedSearchResult } from "../types";

export const frontpageRouter = new Hono();

frontpageRouter.get("/", (c) => {
  const sources = [
    {
      sourceId: "weebcentral",
      sourceName: "WeebCentral",
      availableSections: [
        { id: "popular", title: "Popular Manga", type: "trending" },
        { id: "latest", title: "Latest Updates", type: "latest_hot" },
      ],
    },
    {
      sourceId: "mangadex",
      sourceName: "MangaDex",
      availableSections: [
        { id: "popular", title: "Popular Titles", type: "trending" },
        { id: "latest", title: "Recently Added", type: "recently_added" },
      ],
    },
    {
      sourceId: "comick",
      sourceName: "ComicK",
      availableSections: [
        { id: "trending", title: "Trending Titles", type: "trending" },
        { id: "popular", title: "Most Popular", type: "most_followed" },
      ],
    },
  ];

  return c.json({ sources, sourceIds: sources.map((s) => s.sourceId) });
});

frontpageRouter.post("/", async (c) => {
  try {
    const body = await c.req.json().catch(() => ({}));
    const source = (body.source || "weebcentral").toLowerCase();
    const section = body.section || "popular";
    const limit = typeof body.limit === "number" ? Math.min(Math.max(body.limit, 1), 50) : 24;

    const cacheKey = `frontpage:${source}:${section}:${limit}`;
    const cached = await edgeCache.get(cacheKey);
    if (cached) return c.json(cached);

    const adapter = adapterRegistry.get(source) || adapterRegistry.get("weebcentral");
    if (!adapter) {
      return c.json({ error: "Source not available" }, 404);
    }

    let items: NormalizedSearchResult[] = [];
    try {
      // Use query tailored for popular / trending
      const query = section === "latest" ? "a" : "";
      items = await adapter.search(query, { limit });
    } catch {
      // Fallback query
      items = await adapter.search("one", { limit });
    }

    const response = {
      source: adapter.id,
      sourceName: adapter.name,
      section: {
        id: section,
        title: section.charAt(0).toUpperCase() + section.slice(1),
        type: section,
        items,
        supportsPagination: false,
      },
      fetchedAt: Date.now(),
    };

    await edgeCache.set(cacheKey, response, CACHE_TTL.FRONTPAGE);
    return c.json(response);
  } catch (err: any) {
    return c.json({ error: err?.message || "Failed to load frontpage section" }, 500);
  }
});
