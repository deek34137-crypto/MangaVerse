import { NextRequest, NextResponse } from "next/server";
import { backendClient } from "@/lib/backend-client";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const rawUrl = searchParams.get("url");
  const provider = searchParams.get("provider") || "weebcentral";

  if (!rawUrl) {
    return new NextResponse("Missing url parameter", { status: 400 });
  }

  // If already proxied via worker, redirect directly
  if (rawUrl.includes("/api/proxy/image")) {
    return NextResponse.redirect(rawUrl, { status: 307 });
  }

  const workerProxyUrl = backendClient.getImageProxyUrl(provider, rawUrl);
  return NextResponse.redirect(workerProxyUrl, { status: 307 });
}
