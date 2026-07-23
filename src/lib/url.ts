/**
 * Canonical URL Builder Service (src/lib/url.ts)
 * Centralized, immutable single source of truth for site link generation.
 */

export function isUuid(val: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(val);
}

export function slugifyTitle(text: string): string {
  if (!text) return "manga";
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 100) || "manga";
}

/**
 * Returns the canonical URL for a manga series.
 * Prioritizes human-readable slug over UUID.
 */
export function getMangaUrl(mangaInput: { slug?: string | null; id?: string | null; canonicalId?: string | null; title?: string | null } | string): string {
  if (!mangaInput) return "/search";

  if (typeof mangaInput === "string") {
    const trimmed = mangaInput.trim();
    if (!trimmed) return "/search";
    return `/manga/${trimmed}`;
  }

  const slug = mangaInput.slug?.trim();
  if (slug) {
    return `/manga/${slug}`;
  }

  const titleSlug = mangaInput.title ? slugifyTitle(mangaInput.title) : null;
  const id = (mangaInput.id || mangaInput.canonicalId)?.trim();

  if (titleSlug) {
    return `/manga/${titleSlug}`;
  }

  if (id) {
    return `/manga/${id}`;
  }

  return "/search";
}

/**
 * Returns the canonical URL for a specific chapter within a manga.
 * Clean format: /manga/[mangaSlug]/chapter/[chapterNumberOrSlug]
 */
export function getChapterUrl(
  mangaInput: { slug?: string | null; id?: string | null; canonicalId?: string | null; title?: string | null } | string,
  chapterInput: { number?: number | string | null; chapterNumber?: number | string | null; id?: string | null; chapterId?: string | null; slug?: string | null } | string | number
): string {
  const mangaUrl = getMangaUrl(mangaInput);

  let chapterSlug = "";

  if (typeof chapterInput === "string" || typeof chapterInput === "number") {
    chapterSlug = String(chapterInput).trim();
  } else if (chapterInput) {
    const rawNum = chapterInput.number ?? chapterInput.chapterNumber;
    if (rawNum != null && rawNum !== "") {
      chapterSlug = String(rawNum).trim();
    } else if (chapterInput.slug?.trim()) {
      chapterSlug = chapterInput.slug.trim();
    } else if (chapterInput.chapterId?.trim()) {
      chapterSlug = chapterInput.chapterId.trim();
    } else if (chapterInput.id?.trim()) {
      chapterSlug = chapterInput.id.trim();
    }
  }

  if (!chapterSlug) {
    chapterSlug = "1";
  }

  return `${mangaUrl}/chapter/${chapterSlug}`;
}

/**
 * Returns the canonical URL for a genre browse page.
 */
export function getGenreUrl(genreInput: string): string {
  if (!genreInput) return "/genres";
  const slug = slugifyTitle(genreInput);
  return `/genres/${slug}`;
}

/**
 * Returns search catalog URL with query parameters.
 */
export function getSearchUrl(params?: Record<string, string | number | boolean | null | undefined>): string {
  if (!params) return "/search";
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value != null && value !== "") {
      query.set(key, String(value));
    }
  }
  const queryString = query.toString();
  return queryString ? `/search?${queryString}` : "/search";
}
