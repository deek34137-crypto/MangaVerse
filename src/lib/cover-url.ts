import { getProxiedImageUrl } from "./utils";

/**
 * Canonical cover URL utilities.
 *
 * Two responsibilities:
 *  1. Build the upstream MangaDex cover URL from raw API data.
 *  2. Wrap any upstream URL through the edge image proxy for the presentation layer.
 */

/**
 * Build the MangaDex thumbnail URL for a cover image.
 *
 * MangaDex's cover format:
 *   https://uploads.mangadex.org/covers/{mangaId}/{fileName}.{size}.jpg
 *
 * Where {fileName} is the full filename *including* its original extension.
 * e.g. "abc123.jpg" -> "abc123.jpg.512.jpg"
 *      "abc123.png" -> "abc123.png.256.jpg"
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
 * Wrap a raw upstream image URL through the image proxy.
 */
export function decorateCoverUrl(rawUrl: string | null | undefined): string {
  return getProxiedImageUrl(rawUrl, "mangadex");
}
