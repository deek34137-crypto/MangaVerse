import type { RawProviderManga } from "../types";

export type SharedMangaStatus = NonNullable<RawProviderManga["status"]>;

/**
 * Normalizes multi-provider status strings ("Ongoing", "On Going", "In Progress",
 * "Completed", "Hiatus", "Cancelled", "Publishing") into standard status type.
 */
export function parseMangaStatus(statusStr: string | null | undefined): SharedMangaStatus {
  if (!statusStr || typeof statusStr !== "string") return "UNKNOWN";

  const lower = statusStr.trim().toLowerCase();

  if (
    lower.includes("ongoing") ||
    lower.includes("on going") ||
    lower.includes("in progress") ||
    lower.includes("publishing") ||
    lower.includes("releasing")
  ) {
    return "ONGOING";
  }

  if (
    lower.includes("completed") ||
    lower.includes("complete") ||
    lower.includes("finished") ||
    lower.includes("ended")
  ) {
    return "COMPLETED";
  }

  if (lower.includes("hiatus") || lower.includes("on hold") || lower.includes("paused")) {
    return "HIATUS";
  }

  if (lower.includes("cancelled") || lower.includes("canceled") || lower.includes("dropped")) {
    return "CANCELLED";
  }

  return "UNKNOWN";
}
