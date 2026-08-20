import { Hono } from "hono";
import { executeBoundedSearch } from "../lib/aggregation/search-aggregator";

export const searchRouter = new Hono();

searchRouter.post("/", async (c) => {
  try {
    const body = await c.req.json().catch(() => ({}));
    const query = (body.query || "").trim();
    const source = body.source || "all";
    const limit = typeof body.limit === "number" ? Math.min(Math.max(body.limit, 1), 60) : 24;

    if (!query) {
      return c.json(
        {
          error: "Query parameter is required",
          results: [],
          totalResults: 0,
          sources: { completed: [], failed: [], skipped: [] },
        },
        400
      );
    }

    const searchResponse = await executeBoundedSearch(query, source, limit);
    return c.json(searchResponse);
  } catch (err: any) {
    return c.json(
      {
        error: err?.message || "Search failed",
        results: [],
        totalResults: 0,
        sources: { completed: [], failed: [], skipped: [] },
      },
      500
    );
  }
});
