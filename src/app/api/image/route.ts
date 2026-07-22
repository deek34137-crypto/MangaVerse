import { NextRequest, NextResponse } from "next/server";
import dns from "dns";
import { promisify } from "util";
import path from "path";
import fs from "fs/promises";

const lookupAsync = promisify(dns.lookup);

interface CachedFetch {
  arrayBuffer: ArrayBuffer;
  contentType: string;
  etag: string;
}

import { providerPolicyRegistry } from "@/services/providers/shared/provider-policy";

// In-memory map of active fetch promises for deduplication
const activeFetches = new Map<string, Promise<CachedFetch>>();

function getRefererForHost(hostname: string, protocol: string): string {
  return providerPolicyRegistry.getRefererForHost(hostname, protocol);
}

function isPrivateIp(ip: string): boolean {
  if (ip === "127.0.0.1" || ip === "::1" || ip === "localhost") return true;

  // IPv4 private ranges check
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

  // IPv6 private ranges check
  if (ip.includes(":")) {
    const lower = ip.toLowerCase();
    if (lower.startsWith("fc") || lower.startsWith("fd")) return true;
    if (lower.startsWith("fe8") || lower.startsWith("fe9") || lower.startsWith("fea") || lower.startsWith("feb")) return true;
    if (lower.startsWith("::ffff:")) {
      const ipv4Part = ip.slice(7);
      return isPrivateIp(ipv4Part);
    }
    return false;
  }

  return true;
}

export async function GET(request: NextRequest) {
  const startTime = performance.now();
  const { searchParams } = new URL(request.url);
  const rawUrl = searchParams.get("url");

  if (!rawUrl) {
    return new NextResponse("Missing url parameter", { status: 400 });
  }

  let imageUrl: string = rawUrl;

  // Recursively unnest/decode any nested proxy URLs to prevent nested proxying
  while (imageUrl.startsWith("/api/image") || imageUrl.includes("/api/image?url=")) {
    try {
      const parsed = new URL(imageUrl, request.url);
      const innerUrl = parsed.searchParams.get("url");
      if (innerUrl && innerUrl !== imageUrl) {
        imageUrl = innerUrl;
      } else {
        break;
      }
    } catch {
      break;
    }
  }

  let parsedUrl: URL;
  try {
    parsedUrl = new URL(imageUrl);
    if (parsedUrl.protocol !== "http:" && parsedUrl.protocol !== "https:") {
      return new NextResponse("Forbidden protocol", { status: 403 });
    }
  } catch {
    return new NextResponse("Invalid url parameter", { status: 400 });
  }

  // Handle caching (ETag / If-None-Match)
  const ifNoneMatch = request.headers.get("if-none-match");

  // Deduplicate active fetches using the final URL as key
  let fetchPromise = activeFetches.get(imageUrl);

  if (!fetchPromise) {
    fetchPromise = (async () => {
      let currentUrl = imageUrl!;
      let redirectCount = 0;
      const maxRedirects = 5;
      let responseData: Response | null = null;

      while (redirectCount < maxRedirects) {
        const parsed = new URL(currentUrl);
        const hostname = parsed.hostname;

        // 1. Host Validation
        const isAllowed = providerPolicyRegistry.isHostAllowed(hostname);

        if (!isAllowed) {
          throw new Error("Forbidden domain");
        }

        // 2. Private IP Protection (SSRF Prevention)
        const lookupResult = await lookupAsync(hostname);
        const resolvedIp = typeof lookupResult === "string" ? lookupResult : (lookupResult as any)?.address;
        if (!resolvedIp || isPrivateIp(resolvedIp)) {
          throw new Error("Forbidden target IP");
        }

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 12000);

        const referer = getRefererForHost(hostname, parsed.protocol);

        const res = await fetch(currentUrl, {
          signal: controller.signal,
          redirect: "manual",
          headers: {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
            "Referer": referer,
            "Accept": "image/avif,image/webp,image/apng,image/*,*/*;q=0.8",
          },
        });

        clearTimeout(timeoutId);

        if (res.status >= 300 && res.status < 400) {
          const location = res.headers.get("location");
          if (!location) {
            throw new Error("Redirect location header missing");
          }
          currentUrl = new URL(location, currentUrl).toString();
          redirectCount++;
        } else {
          responseData = res;
          break;
        }
      }

      if (!responseData || !responseData.ok) {
        let upstreamBody = "(unreadable)";
        try { upstreamBody = (await responseData?.text() ?? "").slice(0, 500); } catch {}
        console.error("[Proxy] Upstream request failed:", {
          requestedUrl: imageUrl,
          finalUrl: currentUrl,
          status: responseData?.status,
          statusText: responseData?.statusText,
          headers: Object.fromEntries(responseData?.headers?.entries() ?? []),
          body: upstreamBody,
          elapsedMs: (performance.now() - startTime).toFixed(1),
        });
        throw new Error(`Upstream error: ${responseData ? `${responseData.status} ${responseData.statusText}` : "No response"}`);
      }

      // Validate Image Size (Content-Length check)
      const contentLengthStr = responseData.headers.get("content-length");
      if (contentLengthStr) {
        const contentLength = parseInt(contentLengthStr, 10);
        if (contentLength > 15 * 1024 * 1024) {
          throw new Error("File too large");
        }
      }

      // Validate Image MIME Type
      const contentType = responseData.headers.get("content-type") || "";
      const allowedMimeTypes = ["image/jpeg", "image/png", "image/webp", "image/gif", "image/avif"];
      const cleanContentType = contentType.split(";")[0].trim().toLowerCase();

      if (!allowedMimeTypes.includes(cleanContentType)) {
        throw new Error("Unsupported media type");
      }

      const arrayBuffer = await responseData.arrayBuffer();
      if (arrayBuffer.byteLength > 15 * 1024 * 1024) {
        throw new Error("File too large");
      }

      const etag = responseData.headers.get("etag") || `W/"${arrayBuffer.byteLength}-${responseData.headers.get("last-modified")}"`;

      return { arrayBuffer, contentType: cleanContentType, etag };
    })().finally(() => {
      activeFetches.delete(imageUrl!);
    });

    activeFetches.set(imageUrl, fetchPromise);
  }

  try {
    const { arrayBuffer, contentType, etag } = await fetchPromise;

    if (ifNoneMatch && ifNoneMatch === etag) {
      return new NextResponse(null, {
        status: 304,
        headers: {
          "Cache-Control": "public, max-age=31536000, immutable",
          "ETag": etag,
          "X-Image-Source": "CACHE",
        },
      });
    }

    return new NextResponse(arrayBuffer, {
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=31536000, immutable",
        "ETag": etag,
        "X-Image-Source": "UPSTREAM",
      },
    });

  } catch (error: any) {
    if (error.name === "AbortError" || error.message?.includes("Timeout")) {
      return new NextResponse("Gateway Timeout", { status: 504 });
    }
    if (error.message === "Forbidden domain" || error.message === "Forbidden target IP") {
      return new NextResponse(error.message, { status: 403 });
    }
    if (error.message === "File too large") {
      return new NextResponse(error.message, { status: 413 });
    }
    if (error.message === "Unsupported media type") {
      return new NextResponse(error.message, { status: 415 });
    }
    console.error("Proxy error:", error.message, `(elapsedMs: ${(performance.now() - startTime).toFixed(1)})`);
    try {
      const placeholderPath = path.join(process.cwd(), "public", "images", "cover-placeholder.jpg");
      const placeholderBytes = await fs.readFile(placeholderPath);
      return new NextResponse(placeholderBytes, {
        status: 200,
        headers: {
          "Content-Type": "image/jpeg",
          "Cache-Control": "public, max-age=300, stale-while-revalidate=60",
          "X-Placeholder": "1",
          "X-Image-Source": "PLACEHOLDER",
        },
      });
    } catch {
      return new NextResponse("Internal Server Error", { status: 500 });
    }
  }
}
