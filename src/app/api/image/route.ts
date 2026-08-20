import { NextRequest, NextResponse } from "next/server";
import { backendClient } from "@/lib/backend-client";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const rawUrl = searchParams.get("url");
  const provider = searchParams.get("provider") || "weebcentral";

  if (!rawUrl || rawUrl === "undefined" || rawUrl === "null" || rawUrl.trim() === "") {
    return NextResponse.redirect(new URL("/placeholders/cover.jpg", request.url), { status: 302 });
  }

  // If already proxied via worker, redirect directly
  if (rawUrl.includes("/api/proxy/image")) {
    return NextResponse.redirect(rawUrl, { status: 307 });
  }

  // Pass through relative URLs and local placeholders
  if (rawUrl.startsWith("/") || rawUrl.startsWith("data:") || rawUrl.startsWith("blob:")) {
    return NextResponse.redirect(new URL(rawUrl, request.url), { status: 302 });
  }

  const workerProxyUrl = backendClient.getImageProxyUrl(provider, rawUrl);
  return NextResponse.redirect(workerProxyUrl, { status: 307 });
}
