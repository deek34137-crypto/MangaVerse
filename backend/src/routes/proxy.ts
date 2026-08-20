import { Hono } from "hono";
import { adapterRegistry } from "../lib/adapters";
import { validateUrlAgainstNetworkPolicy, METADATA_NETWORK_POLICY } from "../lib/security/ssrf";

export const proxyRouter = new Hono();

proxyRouter.get("/image", async (c) => {
  const providerId = (c.req.query("provider") || c.req.query("source") || "").trim().toLowerCase();
  const targetUrl = c.req.query("url");

  if (!providerId || !targetUrl) {
    return c.json({ error: "Missing required query parameters: provider and url" }, 400);
  }

  const isMetadataProvider = ["anilist", "kitsu", "jikan", "mal", "metadata"].includes(providerId);
  const adapter = adapterRegistry.get(providerId);

  if (!isMetadataProvider && !adapter) {
    return c.json({ error: `Provider "${providerId}" is not registered` }, 404);
  }

  const policy = isMetadataProvider ? METADATA_NETWORK_POLICY : adapter!.networkPolicy;
  const validation = validateUrlAgainstNetworkPolicy(targetUrl, policy);

  if (!validation.valid || !validation.sanitizedUrl) {
    return c.json(
      {
        error: "SSRF Policy Violation: Target URL rejected",
        details: validation.reason,
      },
      403
    );
  }

  try {
    const referer = adapter ? `${adapter.baseUrl}/` : "https://mangahub.io/";
    const origin = adapter ? adapter.baseUrl : undefined;

    const upstream = await fetch(validation.sanitizedUrl, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
        Accept: "image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8",
        Referer: referer,
        ...(origin ? { Origin: origin } : {}),
      },
    });

    if (!upstream.ok) {
      return c.json(
        {
          error: `Upstream image host returned HTTP ${upstream.status}`,
          status: upstream.status,
        },
        502
      );
    }

    const contentType = upstream.headers.get("content-type") || "image/jpeg";
    const cacheControl = "public, max-age=86400, s-maxage=86400, stale-while-revalidate=604800";

    return new Response(upstream.body, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Access-Control-Allow-Origin": "*",
        "Cache-Control": cacheControl,
      },
    });
  } catch (err: any) {
    return c.json({ error: "Failed to stream proxied image", message: err?.message }, 502);
  }
});

proxyRouter.get("/html", async (c) => {
  const providerId = (c.req.query("provider") || c.req.query("source") || "").trim().toLowerCase();
  const targetUrl = c.req.query("url");

  if (!providerId || !targetUrl) {
    return c.json({ error: "Missing required query parameters: provider and url" }, 400);
  }

  const adapter = adapterRegistry.get(providerId);
  if (!adapter) {
    return c.json({ error: `Provider "${providerId}" is not registered` }, 404);
  }

  const validation = validateUrlAgainstNetworkPolicy(targetUrl, adapter.networkPolicy);
  if (!validation.valid || !validation.sanitizedUrl) {
    return c.json(
      {
        error: "SSRF Policy Violation: Target URL rejected",
        details: validation.reason,
      },
      403
    );
  }

  try {
    const upstream = await fetch(validation.sanitizedUrl, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
        Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        Referer: `${adapter.baseUrl}/`,
      },
    });

    if (!upstream.ok) {
      return c.json(
        {
          error: `Upstream host returned HTTP ${upstream.status}`,
          status: upstream.status,
        },
        502
      );
    }

    const html = await upstream.text();
    return c.text(html, 200, {
      "Content-Type": "text/html; charset=utf-8",
      "Access-Control-Allow-Origin": "*",
    });
  } catch (err: any) {
    return c.json({ error: "Failed to proxy HTML", message: err?.message }, 502);
  }
});
