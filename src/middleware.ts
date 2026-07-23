import NextAuth from "next-auth";
import { authConfig } from "./auth.config";
import { NextResponse } from "next/server";
import { isProtectedRoute, isAuthRoute } from "@/config/routes";
import { logger } from "@/lib/observability";

const { auth } = NextAuth(authConfig);

const middlewareHandler = auth(async (req) => {
  const startTime = Date.now();
  const { pathname, search } = req.nextUrl;
  const isLoggedIn = !!req.auth?.user;

  const isOnAuth = isAuthRoute(pathname);
  const isOnProtected = isProtectedRoute(pathname);

  let response: NextResponse;

  if (isOnAuth && isLoggedIn) {
    logger.info(
      "Already authenticated user attempted to visit auth page, redirecting to /library",
      { pathname, userId: req.auth?.user?.id },
      "MIDDLEWARE"
    );
    response = NextResponse.redirect(new URL("/library", req.nextUrl));
  } else if (isOnProtected && !isLoggedIn) {
    const callbackUrl = pathname + search;
    logger.warn(
      "Unauthenticated request to protected route, redirecting to /login",
      { pathname, callbackUrl },
      "MIDDLEWARE"
    );
    response = NextResponse.redirect(
      new URL(`/login?callbackUrl=${encodeURIComponent(callbackUrl)}`, req.nextUrl)
    );
  } else {
    response = NextResponse.next();
  }

  // Security Headers
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("X-Frame-Options", "SAMEORIGIN");
  response.headers.set("X-XSS-Protection", "1; mode=block");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  if (process.env.NODE_ENV === "production") {
    response.headers.set("Strict-Transport-Security", "max-age=31536000; includeSubDomains");
  }

  response.headers.set("X-Response-Time", `${Date.now() - startTime}ms`);
  return response;
});

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|apple-icon.svg|icon.svg|placeholders).*)",
  ],
};

export default middlewareHandler;
