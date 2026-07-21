import { db } from "@/db";
import crypto from "crypto";
import { manga as mangaTable, mangaAlias as mangaAliasTable, mangaProvider as mangaProviderTable, chapterProvider as chapterProviderTable, chapters as chaptersTable } from "@/db/schema";
import { providerRegistry } from "../providers";
import { MangaRepository, ProviderRepository, ChapterRepository, MatchReviewRepository } from "./repositories";
import { generateUniqueSlug } from "./slug";
import { ConfidenceScorer } from "./deduplication";
import { MergeEngine } from "./merge";
import { generateSortKey } from "./sorting";
import { eq, sql } from "drizzle-orm";
import { invalidateMangaCache, invalidateChapterCache } from "@/services/cache";

const mangaRepo = new MangaRepository();
const providerRepo = new ProviderRepository();
const chapterRepo = new ChapterRepository();
const reviewRepo = new MatchReviewRepository();
const mergeEngine = new MergeEngine();

export async function syncManga(providerName: string, providerMangaId: string, traceId?: string): Promise<string> {
  const provider = providerRegistry.get(providerName);
  console.log(`[SyncEngine] Fetching manga detail for ${providerMangaId} from ${providerName}...`);
  const rawManga = await provider.getMangaDetail(providerMangaId);

  // 1. Check if this provider+manga combination is already linked in the DB
  const existingLink = await providerRepo.getMangaProviderLinkByProviderId(providerName, providerMangaId);
  if (existingLink) {
    console.log(`[SyncEngine] Existing link found. Canonical Manga ID: ${existingLink.mangaId}. Merging metadata...`);
    await mergeEngine.mergeMangaMetadata(existingLink.mangaId, rawManga, providerName, traceId);
    return existingLink.mangaId;
  }

  // 2. Not linked yet. Find potential candidate matches in database
  const candidates = await ConfidenceScorer.findCandidateManga(rawManga);
  let bestCandidate = null;
  let bestScore = 0;

  for (const cand of candidates) {
    const aliases = await mangaRepo.getAliases(cand.id);
    const score = ConfidenceScorer.calculateConfidence(cand, rawManga, providerName, aliases);
    if (score > bestScore) {
      bestScore = score;
      bestCandidate = cand;
    }
  }

  console.log(`[SyncEngine] Match detection: best candidate score is ${bestScore.toFixed(2)}`);

  // High Confidence: Automatic Link & Merge
  if (bestCandidate && bestScore >= 0.85) {
    const mangaId = bestCandidate.id;
    console.log(`[SyncEngine] High confidence match: linking to canonical manga ${bestCandidate.title} (${mangaId})`);
    
    await providerRepo.linkManga(mangaId, providerName, providerMangaId, rawManga.coverImage || undefined, rawManga.rawMetadata);
    await mergeEngine.mergeMangaMetadata(mangaId, rawManga, providerName, traceId);
    
    // Register additional aliases
    await mangaRepo.addAlias(mangaId, rawManga.title, rawManga.title.toLowerCase(), undefined, providerName);
    for (const alt of rawManga.altTitles || []) {
      await mangaRepo.addAlias(mangaId, alt, alt.toLowerCase(), undefined, providerName);
    }
    
    return mangaId;
  }

  // Medium Confidence: Create new but queue manual review matching
  if (bestCandidate && bestScore >= 0.50) {
    console.log(`[SyncEngine] Medium confidence match: creating new canonical manga and queueing match review`);
    // Create new canonical manga anyway, but write a review request
    const mangaId = await createNewCanonicalManga(rawManga, providerName, providerMangaId);
    await reviewRepo.savePendingReview(providerName, providerMangaId, bestCandidate.id, bestScore);
    return mangaId;
  }

  // Low/No Confidence: Create as entirely new canonical record
  console.log(`[SyncEngine] No matching candidates found. Creating as new canonical manga.`);
  return await createNewCanonicalManga(rawManga, providerName, providerMangaId);
}

async function createNewCanonicalManga(rawManga: any, providerName: string, providerMangaId: string): Promise<string> {
  const slug = await generateUniqueSlug(rawManga.title);
  
  // Insert canonical record
  const newMangaId = crypto.randomUUID();
  await mangaRepo.save({
    id: newMangaId,
    slug,
    title: rawManga.title,
    altTitles: rawManga.altTitles || [],
    description: rawManga.description || null,
    coverImage: rawManga.coverImage || null,
    bannerImage: rawManga.bannerImage || null,
    status: rawManga.status || "ongoing",
    type: rawManga.type || "manga",
    demographic: rawManga.demographic || null,
    rating: 0,
    startDate: rawManga.year ? new Date(rawManga.year, 0, 1) : null,
    version: 1,
  });

  // Link provider
  await providerRepo.linkManga(newMangaId, providerName, providerMangaId, rawManga.coverImage || undefined, rawManga.rawMetadata);

  // Register initial aliases
  await mangaRepo.addAlias(newMangaId, rawManga.title, rawManga.title.toLowerCase(), undefined, providerName);
  for (const alt of rawManga.altTitles || []) {
    await mangaRepo.addAlias(newMangaId, alt, alt.toLowerCase(), undefined, providerName);
  }

  return newMangaId;
}

export async function ensureProviderLinks(mangaId: string): Promise<any[]> {
  const existingLinks = await db.select().from(mangaProviderTable).where(eq(mangaProviderTable.mangaId, mangaId));
  if (existingLinks.length > 0) return existingLinks;

  console.warn(`[SyncEngine] Manga ${mangaId} has 0 linked providers. Attempting multi-provider auto-link...`);
  const canonical = await mangaRepo.findById(mangaId);
  if (!canonical?.title) return [];

  const aliases = await mangaRepo.getAliases(mangaId);
  const providersToTry = ["mangadex", "weebcentral", "mangakatana", "comick", "webtoon"];

  let overallBestCandidate: any = null;
  let overallBestProvider = "";
  let overallBestScore = 0;

  for (const providerName of providersToTry) {
    try {
      const provider = providerRegistry.get(providerName);
      const searchResults = await provider.searchManga(canonical.title, { limit: 3 });

      for (const candidate of searchResults) {
        const score = ConfidenceScorer.calculateConfidence(canonical, candidate, providerName, aliases);
        if (score > overallBestScore) {
          overallBestScore = score;
          overallBestCandidate = candidate;
          overallBestProvider = providerName;
        }
      }
      if (overallBestScore >= 0.85) break;
    } catch (err) {
      console.warn(`[SyncEngine] ensureProviderLinks search failed for provider ${providerName}:`, err);
    }
  }

  if (overallBestCandidate) {
    console.log(
      `[SyncEngine] Auto-linking Manga ${mangaId} ("${canonical.title}") ` +
      `to ${overallBestProvider} ID ${overallBestCandidate.id} (confidence: ${overallBestScore.toFixed(2)})`
    );
    await providerRepo.linkManga(
      mangaId,
      overallBestProvider,
      overallBestCandidate.id,
      overallBestCandidate.coverImage || undefined,
      overallBestCandidate.rawMetadata
    );
    return await db.select().from(mangaProviderTable).where(eq(mangaProviderTable.mangaId, mangaId));
  }

  return [];
}

export async function syncChapters(mangaId: string): Promise<any[]> {
  // 1. Ensure linked providers exist
  const links = await ensureProviderLinks(mangaId);
  
  console.log(`[SyncEngine] Syncing chapters for Manga ID ${mangaId} across ${links.length} linked providers...`);

  if (links.length === 0) {
    console.warn(`[SyncEngine] Manga ${mangaId} has 0 linked providers — chapter sync skipped.`);
    return [];
  }

  const allSynced: any[] = [];
  const now = new Date();

  for (const link of links) {
    const providerName = link.provider;
    const providerMangaId = link.providerMangaId;
    
    try {
      const provider = providerRegistry.get(providerName);
      const rawChapters = await provider.getChapters(providerMangaId);

      console.log(`[SyncEngine] Fetched ${rawChapters.length} chapters from provider ${providerName}`);

      if (rawChapters.length === 0) continue;

      // Classify and normalize incoming chapters
      const classifiedChapters = rawChapters.map(ch => {
        let number: string | null = null;
        let type = ch.type || "regular";
        
        if (ch.number !== null && !Number.isNaN(Number(ch.number))) {
          number = Number(ch.number).toFixed(2);
        } else {
          // Special/Non-numeric
          const titleLower = (ch.title || "").toLowerCase();
          if (titleLower.includes("oneshot") || titleLower.includes("one-shot")) {
            type = "oneshot";
          } else if (titleLower.includes("extra")) {
            type = "extra";
          } else if (titleLower.includes("omake")) {
            type = "omake";
          } else if (titleLower.includes("bonus")) {
            type = "bonus";
          } else {
            type = "special";
          }
        }

        const sortKey = generateSortKey(ch.volume ?? null, ch.number ?? 99999);

        return {
          mangaId,
          number,
          volume: ch.volume ?? null,
          type,
          title: ch.title || "",
          sortKey: sortKey,
          raw: ch,
        };
      });

      // Split into numeric vs specials to avoid PostgreSQL multiple conflict target limits
      const regularChapters = classifiedChapters.filter(c => c.number !== null);
      const specialChapters = classifiedChapters.filter(c => c.number === null);

      const regularMap = new Map<string, string>(); // number -> id
      const specialMap = new Map<string, string>(); // title -> id

      // 1a. Upsert Regular/Numeric Chapters
      if (regularChapters.length > 0) {
        const insertedReg = await db
          .insert(chaptersTable)
          .values(regularChapters.map(c => ({
            mangaId: c.mangaId,
            number: c.number,
            volume: c.volume,
            type: c.type,
            title: c.title,
            sortKey: c.sortKey,
          })))
          .onConflictDoUpdate({
            target: [chaptersTable.mangaId, chaptersTable.number],
            where: sql`chapters.number IS NOT NULL`,
            set: {
              volume: sql`EXCLUDED.volume`,
              type: sql`EXCLUDED.type`,
              title: sql`EXCLUDED.title`,
              sortKey: sql`EXCLUDED.sort_key`,
              updatedAt: now,
            },
          })
          .returning({ id: chaptersTable.id, number: chaptersTable.number });

        insertedReg.forEach(row => {
          if (row.number) {
            regularMap.set(row.number, row.id);
          }
        });
      }

      // 1b. Upsert Special Chapters
      if (specialChapters.length > 0) {
        const insertedSpec = await db
          .insert(chaptersTable)
          .values(specialChapters.map(c => ({
            mangaId: c.mangaId,
            number: c.number,
            volume: c.volume,
            type: c.type,
            title: c.title,
            sortKey: c.sortKey,
          })))
          .onConflictDoUpdate({
            target: [chaptersTable.mangaId, chaptersTable.title],
            where: sql`chapters.number IS NULL`,
            set: {
              volume: sql`EXCLUDED.volume`,
              type: sql`EXCLUDED.type`,
              sortKey: sql`EXCLUDED.sort_key`,
              updatedAt: now,
            },
          })
          .returning({ id: chaptersTable.id, title: chaptersTable.title });

        insertedSpec.forEach(row => {
          if (row.title) {
            specialMap.set(row.title, row.id);
          }
        });
      }

      // 2. Bulk Upsert Provider Mappings
      const bulkLinks = classifiedChapters.map(c => {
        let chapterId: string | undefined;
        if (c.number !== null) {
          chapterId = regularMap.get(c.number);
        } else {
          chapterId = specialMap.get(c.title);
        }

        if (!chapterId) {
          throw new Error(`Mapping failed: Canonical chapter ID not found for ${c.number !== null ? "number " + c.number : "special title " + c.title}`);
        }

        return {
          chapterId,
          provider: providerName,
          providerChapterId: c.raw.id,
          displayNumber: c.raw.displayNumber || c.number || "0.00",
          title: c.raw.title || "",
          language: c.raw.language || "en",
          pageCount: c.raw.pageCount || 0,
          publishedAt: c.raw.publishedAt ? new Date(c.raw.publishedAt) : null,
          lastFetched: now,
          updatedAt: now,
        };
      });

      await db
        .insert(chapterProviderTable)
        .values(bulkLinks)
        .onConflictDoUpdate({
          target: [chapterProviderTable.provider, chapterProviderTable.providerChapterId],
          set: {
            chapterId: sql`EXCLUDED.chapter_id`,
            displayNumber: sql`EXCLUDED.display_number`,
            title: sql`EXCLUDED.title`,
            language: sql`EXCLUDED.language`,
            pageCount: sql`EXCLUDED.page_count`,
            publishedAt: sql`EXCLUDED.published_at`,
            lastFetched: now,
            updatedAt: now,
          },
        });

      allSynced.push(...rawChapters);
      console.log(`[SyncEngine] Successfully synced ${rawChapters.length} chapters.`);
      await invalidateMangaCache(mangaId);
    } catch (err) {
      console.error(`[SyncEngine] Failed to sync chapters from provider ${providerName} for Manga ${mangaId}:`, err);
    }
  }

  return allSynced;
}

export async function syncChapterPages(chapterProviderId: string): Promise<void> {
  const syncStart = performance.now();
  // Get the link
  const linkRecords = await db
    .select()
    .from(chapterProviderTable)
    .where(eq(chapterProviderTable.id, chapterProviderId))
    .limit(1);

  if (linkRecords.length === 0) {
    console.error(`[ReaderTrace] Chapter Provider Link with ID ${chapterProviderId} not found`);
    throw new Error(`Chapter Provider Link with ID ${chapterProviderId} not found`);
  }

  const link = linkRecords[0];
  const provider = providerRegistry.get(link.provider);
  
  console.log(`[ReaderTrace] Requesting pages from provider "${link.provider}" for providerChapterId ${link.providerChapterId}...`);
  const rawPages = await provider.getChapterPages(link.providerChapterId);
  const fetchMs = Math.round(performance.now() - syncStart);

  console.log(`[ReaderTrace] Provider "${link.provider}" returned ${rawPages.length} pages in ${fetchMs}ms`);

  if (rawPages.length === 0) {
    console.warn(`[ReaderTrace] Provider "${link.provider}" returned 0 pages for chapter ${link.providerChapterId}. Skipping DB overwrite to prevent caching empty state.`);
    throw new Error(`Provider "${link.provider}" returned 0 pages for chapter ${link.providerChapterId}`);
  }

  // Save the non-empty pages list directly to database
  await db
    .update(chapterProviderTable)
    .set({
      pages: rawPages,
      pageCount: rawPages.length,
      lastFetched: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(chapterProviderTable.id, chapterProviderId));

  await invalidateChapterCache(link.chapterId);
  console.log(`[ReaderTrace] Persisted ${rawPages.length} pages to DB for chapterProvider link ${chapterProviderId}`);
}
