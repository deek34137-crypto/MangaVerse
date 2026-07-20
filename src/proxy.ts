import NextAuth from "next-auth";
import { authConfig } from "./auth.config";
import { NextResponse } from "next/server";
import { rateLimit } from "@/lib/rate-limit";

const { auth } = NextAuth(authConfig);

const proxyHandler = auth(async (req) => {
  // Apply rate limiting
  const rateLimitResponse = await rateLimit(req);
  if (rateLimitResponse) {
    return rateLimitResponse;
  }

  const startTime = Date.now();

  const isLoggedIn = !!req.auth;
  const isOnAuthPage = req.nextUrl.pathname.startsWith("/login") ||
    req.nextUrl.pathname.startsWith("/register") ||
    req.nextUrl.pathname.startsWith("/forgot-password");

  const isOnProtectedPage = req.nextUrl.pathname.startsWith("/library") ||
    req.nextUrl.pathname.startsWith("/history") ||
    req.nextUrl.pathname.startsWith("/recommendations") ||
    req.nextUrl.pathname.startsWith("/settings");

  let response: NextResponse;
  if (isOnAuthPage && isLoggedIn) {
    response = NextResponse.redirect(new URL("/library", req.nextUrl));
  } else if (isOnProtectedPage && !isLoggedIn) {
    const callbackUrl = req.nextUrl.pathname + req.nextUrl.search;
    response = NextResponse.redirect(
      new URL(`/login?callbackUrl=${encodeURIComponent(callbackUrl)}`, req.nextUrl)
    );
  } else {
    response = NextResponse.next();
  }

  response.headers.set("X-Response-Time", `${Date.now() - startTime}ms`);
  return response;
});

export const config = {
  matcher: [
    "/library/:path*",
    "/history/:path*",
    "/recommendations/:path*",
    "/settings/:path*",
    "/api/:path*",
  ],
};

// Export as both default and named exports for Next.js 16 compatibility
export { proxyHandler as proxy };
export default proxyHandler;
