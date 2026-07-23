import { NextRequest, NextResponse } from "next/server";
import path from "path";
import fs from "fs/promises";
import { resolverRegistry } from "@/lib/image-proxy/resolvers/provider-image-resolver";

export async function GET(request: NextRequest) {
  const startTime = performance.now();
  const { searchParams } = new URL(request.url);
  const rawUrl = searchParams.get("url");

  if (!rawUrl) {
    return new NextResponse("Missing url parameter", { status: 400 });
  }

  let imageUrl: string = rawUrl;

  // Recursively unnest/decode any nested proxy URLs
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

  try {
    const parsedUrl = new URL(imageUrl);
    if (parsedUrl.protocol !== "http:" && parsedUrl.protocol !== "https:") {
      return new NextResponse("Forbidden protocol", { status: 403 });
    }
  } catch {
    return new NextResponse("Invalid url parameter", { status: 400 });
  }

  try {
    const resolver = resolverRegistry.getResolver(imageUrl);
    return await resolver.resolve(imageUrl, request);
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
    console.error(`[ImageProxy] Resolution failed for ${imageUrl}: ${error.message} (took ${(performance.now() - startTime).toFixed(1)}ms)`);
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

