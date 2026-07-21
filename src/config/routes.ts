/**
 * Centralized Route Configuration for MangaHub
 */

export const PROTECTED_ROUTES = [
  "/library",
  "/history",
  "/recommendations",
  "/settings",
] as const;

export const AUTH_ROUTES = [
  "/login",
  "/register",
  "/forgot-password",
] as const;

export function isProtectedRoute(pathname: string): boolean {
  return PROTECTED_ROUTES.some((route) => pathname.startsWith(route));
}

export function isAuthRoute(pathname: string): boolean {
  return AUTH_ROUTES.some((route) => pathname.startsWith(route));
}
