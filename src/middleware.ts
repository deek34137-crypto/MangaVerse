import { auth } from "@/auth";
import { NextResponse } from "next/server";

export default auth((req) => {
  console.time(`middleware:${req.nextUrl.pathname}`);

  const isLoggedIn = !!req.auth;
  const isOnAuthPage = req.nextUrl.pathname.startsWith("/login") ||
    req.nextUrl.pathname.startsWith("/register") ||
    req.nextUrl.pathname.startsWith("/forgot-password");

  const isOnProtectedPage = req.nextUrl.pathname.startsWith("/library") ||
    req.nextUrl.pathname.startsWith("/history") ||
    req.nextUrl.pathname.startsWith("/recommendations") ||
    req.nextUrl.pathname.startsWith("/settings");

  let response;
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

  console.timeEnd(`middleware:${req.nextUrl.pathname}`);
  return response;
});

export const config = {
  matcher: [
    "/library/:path*",
    "/history/:path*",
    "/recommendations/:path*",
    "/settings/:path*",
    "/api/auth/register",
    "/api/auth/forgot-password",
    "/api/auth/verify-code",
    "/api/auth/reset-password",
  ],
};