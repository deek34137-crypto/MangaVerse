/**
 * Standardized date parser for HTML providers supporting both relative
 * ("2 hours ago", "3d ago", "yesterday") and absolute calendar dates.
 */
export function parseRelativeDate(dateStr: string | null | undefined): Date | null {
  if (!dateStr || typeof dateStr !== "string") return null;

  const clean = dateStr.trim().toLowerCase();
  if (!clean) return null;

  const now = new Date();

  // Relative checks
  if (clean === "today" || clean === "just now" || clean === "now") {
    return now;
  }
  if (clean === "yesterday") {
    return new Date(now.getTime() - 24 * 60 * 60 * 1000);
  }

  // Regex patterns: "X hours ago", "X mins ago", "X days ago", "Xh ago", "Xd ago", "Xm ago"
  const relMatch = clean.match(/^(\d+)\s*(s|sec|second|m|min|minute|h|hr|hour|d|day|w|wk|week|mo|month|y|yr|year)s?\s*(ago)?$/i);
  if (relMatch) {
    const amount = parseInt(relMatch[1], 10);
    const unit = relMatch[2].toLowerCase();

    if (isNaN(amount)) return null;

    if (unit.startsWith("s")) return new Date(now.getTime() - amount * 1000);
    if (unit.startsWith("m") && unit !== "mo" && unit !== "month") return new Date(now.getTime() - amount * 60 * 1000);
    if (unit.startsWith("h")) return new Date(now.getTime() - amount * 60 * 60 * 1000);
    if (unit.startsWith("d")) return new Date(now.getTime() - amount * 24 * 60 * 60 * 1000);
    if (unit.startsWith("w")) return new Date(now.getTime() - amount * 7 * 24 * 60 * 60 * 1000);
    if (unit === "mo" || unit.startsWith("month")) return new Date(now.getTime() - amount * 30 * 24 * 60 * 60 * 1000);
    if (unit.startsWith("y")) return new Date(now.getTime() - amount * 365 * 24 * 60 * 60 * 1000);
  }

  // Fallback to Standard JS Date parsing
  const parsed = new Date(dateStr);
  return isNaN(parsed.getTime()) ? null : parsed;
}
