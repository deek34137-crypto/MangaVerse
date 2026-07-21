import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { logger } from "@/lib/observability";

/**
 * Server-side authentication guard helper.
 * Verifies that a valid session exists. If not, logs telemetry and redirects
 * to the login page preserving the callbackUrl destination.
 */
export async function requireAuth(callbackUrl?: string) {
  const session = await auth();

  if (!session?.user) {
    logger.warn(
      "Unauthorized access attempt caught by requireAuth guard",
      { callbackUrl },
      "AUTH"
    );
    const destination = callbackUrl
      ? `/login?callbackUrl=${encodeURIComponent(callbackUrl)}`
      : "/login";
    redirect(destination);
  }

  return session;
}

/**
 * Extensible role-based authorization guard helper.
 */
export async function requireRole(role: string, callbackUrl?: string) {
  const session = await requireAuth(callbackUrl);

  if (session.user.role !== role) {
    logger.warn(
      "Insufficient role permissions caught by requireRole guard",
      { userId: session.user.id, userRole: session.user.role, requiredRole: role },
      "AUTH"
    );
    redirect("/");
  }

  return session;
}
