import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";

import { sourcesRouter } from "./routes/sources";
import { searchRouter } from "./routes/search";
import { mangaRouter } from "./routes/manga";
import { chaptersRouter } from "./routes/chapters";
import { pagesRouter } from "./routes/pages";
import { frontpageRouter } from "./routes/frontpage";
import { healthRouter } from "./routes/health";
import { proxyRouter } from "./routes/proxy";
import { chapterPageCountsRouter } from "./routes/chapter-page-counts";
import { metadataRouter } from "./routes/metadata";
import { adapterRegistry } from "./lib/adapters";

const app = new Hono();

// Global Middleware
app.use("*", logger());
app.use(
  "*",
  cors({
    origin: "*",
    allowMethods: ["GET", "POST", "OPTIONS", "HEAD"],
    allowHeaders: ["Content-Type", "Authorization", "X-Requested-With", "HX-Request"],
    exposeHeaders: ["Content-Length", "Content-Type", "Cache-Control"],
    maxAge: 86400,
  })
);

// Root Directory
app.get("/", (c) => {
  return c.json({
    name: "MangaHub Edge Backend",
    version: "1.1.0",
    status: "operational",
    endpoints: {
      sources: "GET /api/sources",
      search: "POST /api/search",
      mangaDetail: "POST /api/manga/detail",
      mangaMetadata: "POST /api/manga/metadata",
      chapters: "POST /api/chapters",
      chapterPageCounts: "POST /api/chapter-page-counts",
      pages: "POST /api/pages",
      frontpage: "GET /api/frontpage, POST /api/frontpage",
      health: "GET /api/health",
      imageProxy: "GET /api/proxy/image?provider=<id>&url=<url>",
      htmlProxy: "GET /api/proxy/html?provider=<id>&url=<url>",
    },
    certifiedProviders: adapterRegistry.getSourcesList().map((s) => ({
      id: s.id,
      name: s.name,
      tier: s.tier,
      capabilities: s.capabilities,
    })),
  });
});

// Mount Routes
app.route("/api/sources", sourcesRouter);
app.route("/api/search", searchRouter);
app.route("/api/manga/metadata", metadataRouter);
app.route("/api/manga", mangaRouter);
app.route("/api/chapters", chaptersRouter);
app.route("/api/chapter-page-counts", chapterPageCountsRouter);
app.route("/api/pages", pagesRouter);
app.route("/api/frontpage", frontpageRouter);
app.route("/api/health", healthRouter);
app.route("/api/proxy", proxyRouter);

// 404 Handler
app.notFound((c) => {
  return c.json({ error: "Endpoint not found", path: c.req.path }, 404);
});

// Global Error Handler
app.onError((err, c) => {
  console.error(`[WorkerError] ${c.req.method} ${c.req.url}:`, err);
  return c.json(
    {
      error: "Internal Worker Error",
      message: err.message || "An unexpected error occurred",
    },
    500
  );
});

export default app;
