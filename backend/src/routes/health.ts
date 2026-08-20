import { Hono } from "hono";
import { healthManager } from "../lib/health/health-manager";
import { PublicHealthApiResponse } from "../types";

export const healthRouter = new Hono();

healthRouter.get("/", (c) => {
  const providerStatuses = healthManager.getAllHealth();
  const values = Object.values(providerStatuses);

  let overallStatus: "ok" | "degraded" | "down" = "ok";
  if (values.filter((s) => s === "down").length > 3) {
    overallStatus = "down";
  } else if (values.some((s) => s === "degraded" || s === "down")) {
    overallStatus = "degraded";
  }

  const response: PublicHealthApiResponse = {
    status: overallStatus,
    timestamp: new Date().toISOString(),
    providers: providerStatuses,
  };

  return c.json(response);
});
