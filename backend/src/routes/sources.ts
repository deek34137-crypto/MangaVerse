import { Hono } from "hono";
import { adapterRegistry } from "../lib/adapters";

export const sourcesRouter = new Hono();

sourcesRouter.get("/", (c) => {
  const sources = adapterRegistry.getSourcesList();
  return c.json({ sources });
});
