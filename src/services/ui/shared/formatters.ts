export function formatRatingLabel(rating?: number | null): string {
  if (rating === undefined || rating === null || rating <= 0) {
    return "Not Rated";
  }
  const formatted = rating.toFixed(1);
  return `★★★★☆ ${formatted}`;
}

export function formatRelativeDate(isoDate?: string): string {
  if (!isoDate) return "Recently";
  const date = new Date(isoDate);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));

  if (diffHours < 1) return "Just now";
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 30) return `${diffDays}d ago`;
  return date.toLocaleDateString();
}

export function formatChapterLabel(chapterNumber?: string | number, title?: string): string {
  if (!chapterNumber && !title) return "Chapter 1";
  if (chapterNumber && title) return `Ch. ${chapterNumber} — ${title}`;
  if (chapterNumber) return `Chapter ${chapterNumber}`;
  return title || "Chapter 1";
}
