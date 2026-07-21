import { db } from "@/db";
import {
  manga as mangaTable,
  genres as genresTable,
  tags as tagsTable,
  authors as authorsTable,
  artists as artistsTable,
  chapters as chaptersTable,
  chapterProvider as chapterProviderTable,
  mangaGenres,
  mangaTags,
  mangaAuthors,
  mangaArtists,
  mangaProvider as mangaProviderTable,
} from "@/db/schema";
import { eq, and, desc, asc, inArray, count, or } from "drizzle-orm";
import { syncManga, syncChapters, syncChapterPages } from "./sync";
import { withSyncLock } from "@/lib/lock";
import { enqueueSyncJob } from "@/services/queue/worker";
import { cacheGet, cacheSet } from "@/services/cache";

const PROVIDER_PRIORITY: Record<string, number> = {
  mangadex: 1,
  comick: 2,
  mangasee: 3,
  manganato: 4,
};

function isUuid(val: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(val);
}

/**
 * Fetch manga and metadata from DB.
 * Supports lookups by ID or Slug.
 * If missing from DB, triggers self-healing sync.
 */
export async function getMangaDetail(idOrSlug: string): Promise<any | null> {
  const cacheKey = `manga:detail:${idOrSlug}`;
  const cached = await cacheGet<any>(cacheKey);
  if (cached) {
    return cached;
  }

  const fetchFromDb = async () => {
    const query = db.select().from(mangaTable);
    const mangaData = isUuid(idOrSlug)
      ? await query.where(eq(mangaTable.id, idOrSlug)).limit(1)
      : await query.where(eq(mangaTable.slug, idOrSlug)).limit(1);

    if (mangaData.length === 0) return null;
    const mangaItem = mangaData[0];
    const id = mangaItem.id;

    const [genresData, tagsData, authorsData, artistsData, latestChapterData, chapterCountData] = await Promise.all([
      db
        .select({ id: genresTable.id, name: genresTable.name, slug: genresTable.slug })
        .from(genresTable)
        .innerJoin(mangaGenres, eq(mangaGenres.genreId, genresTable.id))
        .where(eq(mangaGenres.mangaId, id)),
      db
        .select({ id: tagsTable.id, name: tagsTable.name, slug: tagsTable.slug, group: tagsTable.group })
        .from(tagsTable)
        .innerJoin(mangaTags, eq(mangaTags.tagId, tagsTable.id))
        .where(eq(mangaTags.mangaId, id)),
      db
        .select({ id: authorsTable.id, name: authorsTable.name, slug: authorsTable.slug, image: authorsTable.image })
        .from(authorsTable)
        .innerJoin(mangaAuthors, eq(mangaAuthors.authorId, authorsTable.id))
        .where(eq(mangaAuthors.mangaId, id)),
      db
        .select({ id: artistsTable.id, name: artistsTable.name, slug: artistsTable.slug, image: artistsTable.image })
        .from(artistsTable)
        .innerJoin(mangaArtists, eq(mangaArtists.artistId, artistsTable.id))
        .where(eq(mangaArtists.mangaId, id)),
      db
        .select()
        .from(chaptersTable)
        .where(eq(chaptersTable.mangaId, id))
        .orderBy(desc(chaptersTable.sortKey))
        .limit(1),
      db
        .select({ count: count() })
        .from(chaptersTable)
        .where(eq(chaptersTable.mangaId, id)),
    ]);

    return {
      ...mangaItem,
      rating: parseFloat(String(mangaItem.rating || 0)),
      genres: genresData,
      tags: tagsData,
      authors: authorsData,
      artists: artistsData,
      latestChapter: latestChapterData[0] || null,
      chapterCount: chapterCountData[0]?.count || 0,
    };
  };

  const item = await fetchFromDb();
  if (item) {
    await cacheSet(cacheKey, item, 300);
    if (item.id) await cacheSet(`manga:detail:${item.id}`, item, 300);
    if (item.slug) await cacheSet(`manga:detail:${item.slug}`, item, 300);

    // If stats are empty, trigger background sync asynchronously without blocking return
    if (item.rating === 0 && item.followCount === 0) {
      db.select().from(mangaProviderTable).where(eq(mangaProviderTable.mangaId, item.id))
        .then((links) => {
          if (links.length > 0) {
            enqueueSyncJob("manga", item.id, { provider: links[0].provider, providerMangaId: links[0].providerMangaId }, 100).catch(() => {});
            enqueueSyncJob("chapter", item.id, { provider: links[0].provider, providerMangaId: links[0].providerMangaId }, 100).catch(() => {});
          }
        })
        .catch(() => {});
    }
    return item;
  }

  // Not found in DB, if it's a UUID, we might be able to sync if we can map it to a provider
  // Since we only query database, if it is not found and we don't have mapping, return null.
  return null;
}

/**
 * Fetch all chapters for a manga.
 * For each chapter, joins and selects the highest-priority provider link.
 */
export async function getChaptersDetail(mangaId: string): Promise<any[]> {
  const cacheKey = `manga:chapters:${mangaId}`;
  const cached = await cacheGet<any[]>(cacheKey);
  if (cached && cached.length > 0) {
    return cached;
  }

  const tStart = performance.now();
  const fetchFromDb = async () => {
    const dbStart = performance.now();
    // Query all canonical chapters
    const chaptersData = await db
      .select()
      .from(chaptersTable)
      .where(eq(chaptersTable.mangaId, mangaId))
      .orderBy(desc(chaptersTable.sortKey));

    if (chaptersData.length === 0) return null;

    const chapterIds = chaptersData.map((c) => c.id);

    // Query all provider links for these chapters
    const providerLinks = await db
      .select()
      .from(chapterProviderTable)
      .where(inArray(chapterProviderTable.chapterId, chapterIds));

    const dbMs = performance.now() - dbStart;

    // Map links to chapter ID
    const linksMap = new Map<string, any[]>();
    for (const link of providerLinks) {
      const existing = linksMap.get(link.chapterId) || [];
      existing.push(link);
      linksMap.set(link.chapterId, existing);
    }

    const mapped = chaptersData.map((chapter) => {
      const links = linksMap.get(chapter.id) || [];
      
      // Sort links by provider priority (lowest numeric value = highest priority)
      links.sort((a, b) => {
        const priorityA = PROVIDER_PRIORITY[a.provider.toLowerCase()] ?? 99;
        const priorityB = PROVIDER_PRIORITY[b.provider.toLowerCase()] ?? 99;
        return priorityA - priorityB;
      });

      // Prioritize provider link with populated pages > 0, falling back to priority ranking
      const bestLink = links.find((l) => (l.pages as any)?.length > 0) || links[0];

      return {
        id: chapter.id,
        mangaId: chapter.mangaId,
        number: chapter.number ? parseFloat(chapter.number) : null,
        volume: chapter.volume,
        type: chapter.type,
        title: bestLink?.title || (chapter.number ? `Chapter ${parseFloat(chapter.number)}` : "Special"),
        language: bestLink?.language || "en",
        pageCount: bestLink?.pageCount || 0,
        publishedAt: bestLink?.publishedAt || chapter.createdAt,
        createdAt: chapter.createdAt,
        updatedAt: chapter.updatedAt,
        scanlatorGroups: bestLink ? (bestLink.pages as any).scanlatorGroups || [] : [],
        provider: bestLink?.provider || "unknown",
        providerChapterId: bestLink?.providerChapterId || "",
        pages: [],
      };
    });

    console.log(`[MangaDetailTrace] getChaptersDetail DB query: ${dbMs.toFixed(1)}ms for ${chaptersData.length} chapters`);
    return mapped;
  };

  const results = await fetchFromDb();
  if (results && results.length > 0) {
    await cacheSet(cacheKey, results, 300);
    console.log(`[MangaDetailTrace] getChaptersDetail total: ${(performance.now() - tStart).toFixed(1)}ms (${results.length} chapters)`);
    return results;
  }

  // If no chapters in DB, trigger synchronous sync to self-heal
  try {
    console.log(`[MangaDetailTrace] No chapters in DB for Manga ${mangaId}. Syncing synchronously...`);
    const { syncChapters } = await import("./sync");
    await syncChapters(mangaId);
    
    const freshResults = await fetchFromDb();
    if (freshResults) {
      console.log(`[MangaDetailTrace] Synchronous sync finished in ${(performance.now() - tStart).toFixed(1)}ms (${freshResults.length} chapters)`);
      return freshResults;
    }
  } catch (err) {
    console.error(`[MangaDetailTrace] Failed to run synchronous chapters sync for Manga ${mangaId}:`, err);
  }

  return [];
}

/**
 * Fetch a specific chapter with page images.
 * If pages are missing, triggers on-demand sync from the provider.
 */
export async function getChapterDetail(mangaId: string, chapterId: string): Promise<any | null> {
  const cacheKey = `chapter:detail:${chapterId}`;
  const cached = await cacheGet<any>(cacheKey);
  if (cached && cached.pages && cached.pages.length > 0) {
    return cached;
  }

  const tStart = performance.now();
  console.log(`[ReaderTrace] Requested chapter: mangaId=${mangaId} chapterId=${chapterId}`);

  const fetchFromDb = async () => {
    const chapterData = await db
      .select()
      .from(chaptersTable)
      .where(and(eq(chaptersTable.id, chapterId), eq(chaptersTable.mangaId, mangaId)))
      .limit(1);

    if (chapterData.length === 0) {
      console.warn(`[ReaderTrace] Chapter ID ${chapterId} not found in database for manga ${mangaId}`);
      return null;
    }
    const chapter = chapterData[0];
    console.log(`[ReaderTrace] Found chapter ${chapter.number} ("${chapter.title}")`);

    // Fetch provider links for this chapter
    const links = await db
      .select()
      .from(chapterProviderTable)
      .where(eq(chapterProviderTable.chapterId, chapterId));

    console.log(`[ReaderTrace] Found ${links.length} provider links for chapter ${chapterId}`);

    if (links.length === 0) {
      console.warn(`[ReaderTrace] 0 provider links found for chapter ${chapterId}`);
      return null;
    }

    // Sort links by priority
    links.sort((a, b) => {
      const priorityA = PROVIDER_PRIORITY[a.provider.toLowerCase()] ?? 99;
      const priorityB = PROVIDER_PRIORITY[b.provider.toLowerCase()] ?? 99;
      return priorityA - priorityB;
    });

    let activeLink = links[0];
    let pages: any[] = [];

    // Attempt page retrieval across prioritized provider links with automatic fallback
    for (const link of links) {
      console.log(`[ReaderTrace] Evaluating provider link: id=${link.id} provider=${link.provider} providerChapterId=${link.providerChapterId}`);
      let candidatePages = (link.pages as any) || [];

      if (candidatePages.length === 0) {
        console.log(`[ReaderTrace] DB pages empty for link ${link.id} (${link.provider}). Triggering on-demand page sync...`);
        try {
          const syncStart = performance.now();
          const result = await withSyncLock(
            `sync:pages:${link.id}`,
            async () => {
              await syncChapterPages(link.id);
            },
            async () => {
              const updated = await db
                .select()
                .from(chapterProviderTable)
                .where(eq(chapterProviderTable.id, link.id))
                .limit(1);
              if (updated.length > 0) {
                const p = (updated[0].pages as any) || [];
                console.log(`[ReaderTrace] DB readback check for link ${link.id}: ${p.length} pages in DB`);
                if (p.length > 0) return p;
              }
              return null;
            }
          );

          console.log(`[ReaderTrace] On-demand sync finished for ${link.id} in ${(performance.now() - syncStart).toFixed(1)}ms`);

          if (result && Array.isArray(result) && result.length > 0) {
            candidatePages = result;
          }
        } catch (err) {
          console.error(`[ReaderTrace] On-demand page sync error for link ${link.id} (${link.provider}):`, err);
        }
      } else {
        console.log(`[ReaderTrace] DB hit: Found ${candidatePages.length} cached pages for link ${link.id} (${link.provider})`);
      }

      if (candidatePages.length > 0) {
        activeLink = link;
        pages = candidatePages;
        console.log(`[ReaderTrace] Successfully selected provider link ${link.provider} with ${pages.length} pages`);
        break; // Successfully got pages from this provider link
      } else {
        console.warn(`[ReaderTrace] Provider link ${link.provider} (${link.id}) returned 0 pages. Trying next link...`);
      }
    }

    const elapsedMs = Math.round(performance.now() - tStart);
    console.log(`[ReaderTrace] Completed getChapterDetail in ${elapsedMs}ms — returning ${pages.length} pages`);

    const result = {
      id: chapter.id,
      mangaId: chapter.mangaId,
      number: chapter.number ? parseFloat(chapter.number) : null,
      volume: chapter.volume,
      type: chapter.type,
      title: activeLink.title || (chapter.number ? `Chapter ${parseFloat(chapter.number)}` : "Special"),
      language: activeLink.language,
      pageCount: pages.length || activeLink.pageCount,
      publishedAt: activeLink.publishedAt,
      createdAt: chapter.createdAt,
      updatedAt: chapter.updatedAt,
      scanlatorGroups: [],
      provider: activeLink.provider,
      providerChapterId: activeLink.providerChapterId,
      pages: pages.map((p: any, i: number) => ({
        id: `${chapterId}-page-${i + 1}`,
        chapterId,
        number: p.number || i + 1,
        url: p.url,
        width: p.width || 0,
        height: p.height || 0,
        size: p.size || 0,
      })),
    };

    if (result.pages.length > 0) {
      await cacheSet(cacheKey, result, 3600);
    }

    return result;
  };

  return await fetchFromDb();
}
export { syncManga, syncChapters };
