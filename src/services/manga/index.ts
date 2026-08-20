import { backendClient } from "@/lib/backend-client";
import { cacheGet, cacheSet } from "@/services/cache";

function parseProviderAndId(rawStr: string): { provider: string; id: string } {
  if (rawStr.includes("_")) {
    const parts = rawStr.split("_");
    const provider = parts[0];
    const id = parts.slice(1).join("_");
    return { provider, id };
  }
  return { provider: "weebcentral", id: rawStr };
}

/**
 * Fetch manga and metadata.
 * Uses the Edge Backend Client with local cache and high-res cover resolution.
 */
export async function getMangaDetail(idOrSlug: string): Promise<any | null> {
  const cacheKey = `manga:detail:${idOrSlug}`;
  const cached = await cacheGet<any>(cacheKey);
  if (cached) return cached;

  const { provider, id } = parseProviderAndId(idOrSlug);

  try {
    let detail = await backendClient.getMangaDetail(provider, id);
    if (!detail) {
      // If not found directly, search by query to resolve
      const searchRes = await backendClient.search(idOrSlug, "all", 1);
      if (searchRes.results && searchRes.results.length > 0) {
        const match = searchRes.results[0];
        detail = await backendClient.getMangaDetail(match.provider, match.id);
      }
    }

    if (!detail) return null;

    const bestCover =
      detail.coverImageExtraLarge ||
      detail.coverImageLarge ||
      detail.coverImage ||
      detail.nativeCoverImage ||
      "";

    const coverProvider = detail.metadataSource || detail.provider || provider;

    const item = {
      id: `${detail.provider}_${detail.id}`,
      slug: `${detail.provider}_${detail.id}`,
      title: detail.title,
      altTitles: detail.altTitles || [],
      description: detail.description || "Read high-resolution chapters with zero ads.",
      coverImage: backendClient.getImageProxyUrl(coverProvider, bestCover),
      coverImageLarge: detail.coverImageLarge
        ? backendClient.getImageProxyUrl(coverProvider, detail.coverImageLarge)
        : undefined,
      coverImageExtraLarge: detail.coverImageExtraLarge
        ? backendClient.getImageProxyUrl(coverProvider, detail.coverImageExtraLarge)
        : undefined,
      nativeCoverImage: detail.nativeCoverImage
        ? backendClient.getImageProxyUrl(detail.provider, detail.nativeCoverImage)
        : undefined,
      bannerImage: backendClient.getImageProxyUrl(
        coverProvider,
        detail.bannerImage || bestCover
      ),
      metadataSource: detail.metadataSource,
      metadataConfidence: detail.metadataConfidence,
      externalIds: detail.externalIds,
      status: detail.status || "ongoing",
      type: "manga",
      genres: (detail.genres || []).map((g) => ({ id: g, name: g, slug: g.toLowerCase() })),
      tags: [],
      authors: (detail.authors || []).map((a) => ({ id: a, name: a, slug: a.toLowerCase(), image: null })),
      artists: (detail.artists || []).map((a) => ({ id: a, name: a, slug: a.toLowerCase(), image: null })),
      demographic: "shounen",
      rating: detail.rating ?? 8.5,
      ratingCount: 1250,
      followCount: 5400,
      viewCount: 24500,
      chapterCount: 10,
      volumeCount: 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await cacheSet(cacheKey, item, 300);
    return item;
  } catch (err) {
    console.error(`[getMangaDetail] Error fetching ${idOrSlug}:`, err);
    return null;
  }
}

/**
 * Fetch all chapters for a manga.
 */
export async function getChaptersDetail(mangaIdOrSlug: string): Promise<any[]> {
  const cacheKey = `manga:chapters:${mangaIdOrSlug}`;
  const cached = await cacheGet<any[]>(cacheKey);
  if (cached && cached.length > 0) return cached;

  const { provider, id } = parseProviderAndId(mangaIdOrSlug);

  try {
    const rawChapters = await backendClient.getChapters(provider, id);
    if (!rawChapters || rawChapters.length === 0) return [];

    const mapped = rawChapters.map((ch, idx) => ({
      id: ch.id,
      mangaId: `${provider}_${id}`,
      number: ch.numberValue ?? (idx + 1),
      volume: null,
      type: "chapter",
      title: ch.title || `Chapter ${ch.number}`,
      language: ch.language || "en",
      pageCount: ch.pageCount ?? null,
      publishedAt: ch.publishedAt || new Date().toISOString(),
      createdAt: ch.publishedAt || new Date().toISOString(),
      updatedAt: ch.publishedAt || new Date().toISOString(),
      scanlatorGroups: [],
      provider: ch.provider || provider,
      providerChapterId: ch.id,
      pages: [],
    }));

    await cacheSet(cacheKey, mapped, 300);
    return mapped;
  } catch (err) {
    console.error(`[getChaptersDetail] Error for ${mangaIdOrSlug}:`, err);
    return [];
  }
}

/**
 * Fetch a specific chapter with page images.
 */
export async function getChapterDetail(
  mangaIdOrSlug: string,
  chapterIdOrNumber: string
): Promise<any | null> {
  const cacheKey = `chapter:detail:${mangaIdOrSlug}:${chapterIdOrNumber}`;
  const cached = await cacheGet<any>(cacheKey);
  if (cached && cached.pages && cached.pages.length > 0) return cached;

  const { provider } = parseProviderAndId(mangaIdOrSlug);
  const { id: chapterId } = parseProviderAndId(chapterIdOrNumber);

  try {
    const rawPages = await backendClient.getPages(provider, chapterId);

    const pages = rawPages.map((p, idx) => ({
      id: `${chapterId}-page-${p.index || idx + 1}`,
      chapterId,
      number: p.index || idx + 1,
      url: backendClient.getImageProxyUrl(p.provider || provider, p.url),
      width: p.width || 0,
      height: p.height || 0,
      size: 0,
    }));

    const result = {
      id: chapterId,
      mangaId: mangaIdOrSlug,
      number: parseFloat(chapterIdOrNumber) || 1,
      volume: null,
      type: "chapter",
      title: `Chapter ${chapterIdOrNumber}`,
      language: "en",
      pageCount: pages.length,
      publishedAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      scanlatorGroups: [],
      provider,
      providerChapterId: chapterId,
      pages,
    };

    if (pages.length > 0) {
      await cacheSet(cacheKey, result, 3600);
    }

    return result;
  } catch (err) {
    console.error(`[getChapterDetail] Error for ${chapterIdOrNumber}:`, err);
    return null;
  }
}
