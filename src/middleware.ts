import { auth } from "@/auth";
import { NextResponse } from "next/server";

export default auth((req) => {
  const isLoggedIn = !!req.auth;
  const isOnAuthPage = req.nextUrl.pathname.startsWith("/login") ||
    req.nextUrl.pathname.startsWith("/register") ||
    req.nextUrl.pathname.startsWith("/forgot-password");

  const isOnProtectedPage = req.nextUrl.pathname.startsWith("/library") ||
    req.nextUrl.pathname.startsWith("/history") ||
    req.nextUrl.pathname.startsWith("/recommendations") ||
    req.nextUrl.pathname.startsWith("/settings");

  if (isOnAuthPage && isLoggedIn) {
    return NextResponse.redirect(new URL("/library", req.nextUrl));
  }

  if (isOnProtectedPage && !isLoggedIn) {
    const callbackUrl = req.nextUrl.pathname + req.nextUrl.search;
    return NextResponse.redirect(
      new URL(`/login?callbackUrl=${encodeURIComponent(callbackUrl)}`, req.nextUrl)
    );
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|.*\\.png$).*)",
  ],
};