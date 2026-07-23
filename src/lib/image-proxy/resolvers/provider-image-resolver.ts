import { NextRequest, NextResponse } from "next/server";
import dns from "dns";
import { promisify } from "util";
import { providerPolicyRegistry } from "@/services/providers/shared/provider-policy";

const lookupAsync = promisify(dns.lookup);

export interface CachedFetch {
  arrayBuffer: ArrayBuffer;
  contentType: string;
  etag: string;
}

export interface ProviderImageResolver {
  name: string;
  canResolve(hostname: string, url: string): boolean;
  resolve(url: string, request: NextRequest): Promise<Response>;
}

function isPrivateIp(ip: string): boolean {
  if (ip === "127.0.0.1" || ip === "::1" || ip === "localhost") return true;
  if (ip.includes(".")) {
    const parts = ip.split(".").map(Number);
    if (parts.length !== 4 || parts.some(isNaN)) return true;
    const [first, second] = parts;
    if (first === 10) return true;
    if (first === 172 && second >= 16 && second <= 31) return true;
    if (first === 192 && second === 168) return true;
    if (first === 169 && second === 254) return true;
    if (first === 127) return true;
    return false;
  }
  if (ip.includes(":")) {
    const lower = ip.toLowerCase();
    if (lower.startsWith("fc") || lower.startsWith("fd")) return true;
    if (lower.startsWith("fe8") || lower.startsWith("fe9") || lower.startsWith("fea") || lower.startsWith("feb")) return true;
    if (lower.startsWith("::ffff:")) {
      return isPrivateIp(ip.slice(7));
    }
    return false;
  }
  return true;
}

export async function fetchUpstreamImage(
  targetUrl: string,
  referer: string,
  timeoutMs: number = 10000
): Promise<CachedFetch> {
  const parsed = new URL(targetUrl);
  const hostname = parsed.hostname;

  if (!providerPolicyRegistry.isHostAllowed(hostname)) {
    throw new Error("Forbidden domain");
  }

  const lookupResult = await lookupAsync(hostname);
  const resolvedIp = typeof lookupResult === "string" ? lookupResult : (lookupResult as any)?.address;
  if (!resolvedIp || isPrivateIp(resolvedIp)) {
    throw new Error("Forbidden target IP");
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(targetUrl, {
      signal: controller.signal,
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
        Referer: referer,
        Accept: "image/avif,image/webp,image/apng,image/*,*/*;q=0.8",
      },
    });

    if (!res.ok) {
      throw new Error(`Upstream returned HTTP ${res.status}`);
    }

    const contentType = (res.headers.get("content-type") || "").split(";")[0].trim().toLowerCase();
    const allowedMimeTypes = ["image/jpeg", "image/png", "image/webp", "image/gif", "image/avif"];
    if (!allowedMimeTypes.includes(contentType)) {
      throw new Error("Unsupported media type");
    }

    const arrayBuffer = await res.arrayBuffer();
    if (arrayBuffer.byteLength > 15 * 1024 * 1024) {
      throw new Error("File too large");
    }

    const etag = res.headers.get("etag") || `W/"${arrayBuffer.byteLength}-${Date.now()}"`;
    return { arrayBuffer, contentType, etag };
  } finally {
    clearTimeout(timer);
  }
}

// ── MangaDex Resolver ──────────────────────────────────────────────────────────
export class MangaDexResolver implements ProviderImageResolver {
  public readonly name = "MangaDexResolver";

  public canResolve(hostname: string): boolean {
    return hostname.includes("mangadex.org") || hostname.includes("cmdgd.org");
  }

  public async resolve(url: string, request: NextRequest): Promise<Response> {
    const referer = "https://mangadex.org/";
    
    // Attempt 1: Fetch requested URL (e.g. .512.jpg or .256.jpg thumbnail)
    try {
      const fetched = await fetchUpstreamImage(url, referer);
      return this.buildResponse(fetched, request);
    } catch (firstErr: any) {
      // Attempt 2: If thumbnail returns 404/error and ends with .512.jpg or .256.jpg, strip suffix to fetch original filename
      if (url.endsWith(".512.jpg") || url.endsWith(".256.jpg")) {
        const originalUrl = url.slice(0, url.lastIndexOf("."));
        console.warn(`[MangaDexResolver] Thumbnail failed (${firstErr.message}). Retrying original cover: ${originalUrl}`);
        try {
          const originalFetched = await fetchUpstreamImage(originalUrl, referer);
          return this.buildResponse(originalFetched, request);
        } catch (secondErr: any) {
          throw secondErr;
        }
      }
      throw firstErr;
    }
  }

  private buildResponse(fetched: CachedFetch, request: NextRequest): Response {
    const ifNoneMatch = request.headers.get("if-none-match");
    if (ifNoneMatch && ifNoneMatch === fetched.etag) {
      return new NextResponse(null, {
        status: 304,
        headers: {
          "Cache-Control": "public, max-age=31536000, immutable",
          ETag: fetched.etag,
          "X-Image-Source": "MANGADEX_CACHE",
        },
      });
    }
    return new NextResponse(fetched.arrayBuffer, {
      headers: {
        "Content-Type": fetched.contentType,
        "Cache-Control": "public, max-age=31536000, immutable",
        ETag: fetched.etag,
        "X-Image-Source": "MANGADEX_UPSTREAM",
      },
    });
  }
}

// ── ComicK Resolver ────────────────────────────────────────────────────────────
export class ComicKResolver implements ProviderImageResolver {
  public readonly name = "ComicKResolver";

  public canResolve(hostname: string): boolean {
    return hostname.includes("comick") || hostname.includes("comick.pictures");
  }

  public async resolve(url: string, request: NextRequest): Promise<Response> {
    const referer = "https://comick.io/";
    const fetched = await fetchUpstreamImage(url, referer);
    return new NextResponse(fetched.arrayBuffer, {
      headers: {
        "Content-Type": fetched.contentType,
        "Cache-Control": "public, max-age=31536000, immutable",
        ETag: fetched.etag,
        "X-Image-Source": "COMICK_UPSTREAM",
      },
    });
  }
}

// ── WeebCentral Resolver ───────────────────────────────────────────────────────
export class WeebCentralResolver implements ProviderImageResolver {
  public readonly name = "WeebCentralResolver";

  public canResolve(hostname: string): boolean {
    return hostname.includes("weebcentral.com") || hostname.includes("planeptune.us") || hostname.includes("compsci88.com");
  }

  public async resolve(url: string, request: NextRequest): Promise<Response> {
    const referer = "https://weebcentral.com/";
    const fetched = await fetchUpstreamImage(url, referer);
    return new NextResponse(fetched.arrayBuffer, {
      headers: {
        "Content-Type": fetched.contentType,
        "Cache-Control": "public, max-age=31536000, immutable",
        ETag: fetched.etag,
        "X-Image-Source": "WEEBCENTRAL_UPSTREAM",
      },
    });
  }
}

// ── Default Resolver ───────────────────────────────────────────────────────────
export class DefaultResolver implements ProviderImageResolver {
  public readonly name = "DefaultResolver";

  public canResolve(): boolean {
    return true; // Fallback matches all
  }

  public async resolve(url: string, request: NextRequest): Promise<Response> {
    const parsed = new URL(url);
    const referer = providerPolicyRegistry.getRefererForHost(parsed.hostname, parsed.protocol);
    const fetched = await fetchUpstreamImage(url, referer);
    return new NextResponse(fetched.arrayBuffer, {
      headers: {
        "Content-Type": fetched.contentType,
        "Cache-Control": "public, max-age=31536000, immutable",
        ETag: fetched.etag,
        "X-Image-Source": "DEFAULT_UPSTREAM",
      },
    });
  }
}

// ── Strategy Registry Manager ──────────────────────────────────────────────────
class ResolverRegistryManager {
  private resolvers: ProviderImageResolver[] = [
    new MangaDexResolver(),
    new ComicKResolver(),
    new WeebCentralResolver(),
    new DefaultResolver(),
  ];

  public register(resolver: ProviderImageResolver) {
    this.resolvers.unshift(resolver);
  }

  public getResolver(url: string): ProviderImageResolver {
    let hostname = "";
    try {
      hostname = new URL(url).hostname;
    } catch {}

    for (const r of this.resolvers) {
      if (r.canResolve(hostname, url)) {
        return r;
      }
    }
    return this.resolvers[this.resolvers.length - 1];
  }
}

export const resolverRegistry = new ResolverRegistryManager();
