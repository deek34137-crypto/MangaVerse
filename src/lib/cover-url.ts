/**
 * Canonical cover URL utilities.
 *
 * Two responsibilities:
 *  1. Build the upstream MangaDex cover URL from raw API data.
 *  2. Wrap any upstream URL through the local image proxy for the presentation layer.
 *
 * ─ DB stores raw upstream URLs (https://uploads.mangadex.org/...)
 * ─ Proxy decoration happens at query/output time, never at write time.
 */

/**
 * Build the MangaDex thumbnail URL for a cover image.
 *
 * MangaDex's cover format:
 *   https://uploads.mangadex.org/covers/{mangaId}/{fileName}.{size}.jpg
 *
 * Where {fileName} is the full filename *including* its original extension.
 * e.g. "abc123.jpg" → "abc123.jpg.512.jpg"   (correct per MangaDex API docs)
 *      "abc123.png" → "abc123.png.256.jpg"
 *
 * @param mangaId       MangaDex manga UUID
 * @param fileName      Raw fileName from cover_art relationship attributes
 * @param size          Thumbnail size: 256 | 512 | null (null = original, no suffix)
 */
export function buildMangaDexCoverUrl(
  mangaId: string,
  fileName: string,
  size: 256 | 512 | null = 512
): string {
  if (!mangaId || !fileName) return "";

  // If fileName is already a full HTTP(S) URL
  if (fileName.startsWith("http://") || fileName.startsWith("https://")) {
    if (fileName.endsWith(".512.jpg") || fileName.endsWith(".256.jpg") || size === null) {
      return fileName;
    }
    return `${fileName}.${size}.jpg`;
  }

  // Prevent double-suffixing if fileName already ends with .512.jpg or .256.jpg
  if (fileName.endsWith(".512.jpg") || fileName.endsWith(".256.jpg")) {
    return `https://uploads.mangadex.org/covers/${mangaId}/${fileName}`;
  }

  const base = `https://uploads.mangadex.org/covers/${mangaId}/${fileName}`;
  return size ? `${base}.${size}.jpg` : base;
}

/**
 * Wrap a raw upstream image URL through the local image proxy.
 *
 * - Already-proxied URLs (containing "/api/image?url=") are returned as-is to
 *   prevent double-wrapping.
 * - Null/empty inputs return an empty string.
 * - The proxy handles SSRF protection, hotlink bypass, MIME validation, and caching.
 *
 * Usage: call this at the repository/service output layer, NOT when writing to DB.
 */
export function decorateCoverUrl(rawUrl: string | null | undefined): string {
  if (!rawUrl) return "";
  // Already proxied — don't double-wrap
  if (rawUrl.includes("/api/image?url=") || rawUrl.startsWith("/api/image")) {
    return rawUrl;
  }
  // Relative or data URLs — pass through unchanged
  if (!rawUrl.startsWith("http://") && !rawUrl.startsWith("https://")) {
    return rawUrl;
  }
  return `/api/image?url=${encodeURIComponent(rawUrl)}`;
}
