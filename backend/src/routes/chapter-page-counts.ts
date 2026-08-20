import { Hono } from "hono";
import { BatchPageCountsApiRequest, BatchPageCountsApiResponse } from "../types";
import { pageCountResolver } from "../lib/chapters/page-count-resolver";

export const chapterPageCountsRouter = new Hono();

/**
 * POST /api/chapter-page-counts
 * Bounded batch page count resolution endpoint.
 * Max batch size: 30 chapters. Max concurrency: 4.
 */
chapterPageCountsRouter.post("/", async (c) => {
  try {
    const body = await c.req.json<BatchPageCountsApiRequest>();

    if (!body || !Array.isArray(body.chapters)) {
      return c.json({ error: "Missing or invalid 'chapters' array in request body" }, 400);
    }

    if (body.chapters.length === 0) {
      const emptyRes: BatchPageCountsApiResponse = { counts: [] };
      return c.json(emptyRes);
    }

    // Hard ceiling: max 30 chapters per batch
    const items = body.chapters.slice(0, 30);

    const counts = await pageCountResolver.resolveBatch(items, 30, 4);

    const response: BatchPageCountsApiResponse = { counts };
    return c.json(response);
  } catch (err: any) {
    return c.json(
      { error: err?.message || "Failed to resolve chapter page counts" },
      500
    );
  }
});
