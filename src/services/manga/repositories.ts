import { db } from "@/db";
import {
  manga as mangaTable,
  mangaProvider as mangaProviderTable,
  chapterProvider as chapterProviderTable,
  metadataProvenance as metadataProvenanceTable,
  mangaAlias as mangaAliasTable,
  mangaMatchReview as mangaMatchReviewTable,
  auditLog as auditLogTable,
  chapters as chaptersTable,
} from "@/db/schema";
import { eq, and, sql } from "drizzle-orm";
import type { RawProviderManga, RawProviderChapter } from "../providers/types";

// Domain structures mapped from DB
export interface DomainManga {
  id: string;
  slug: string | null;
  title: string;
  altTitles: string[];
  description: string | null;
  coverImage: string | null;
  bannerImage: string | null;
  status: string;
  type: string;
  demographic: string | null;
  rating: number;
  startDate: Date | null;
  version: number;
}

export interface IMangaRepository {
  findById(id: string): Promise<DomainManga | null>;
  findBySlug(slug: string): Promise<DomainManga | null>;
  findByProvider(provider: string, providerMangaId: string): Promise<DomainManga | null>;
  save(manga: Partial<DomainManga> & { id: string }, expectedVersion?: number): Promise<boolean>;
  getProvenance(mangaId: string): Promise<any[]>;
  saveProvenance(mangaId: string, fieldName: string, provider: string, hash: string): Promise<void>;
  addAlias(mangaId: string, alias: string, normalized: string, language?: string, provider?: string): Promise<void>;
  getAliases(mangaId: string): Promise<string[]>;
}

export class MangaRepository implements IMangaRepository {
  public async findById(id: string): Promise<DomainManga | null> {
    const records = await db.select().from(mangaTable).where(eq(mangaTable.id, id)).limit(1);
    if (records.length === 0) return null;
    const r = records[0];
    return {
      ...r,
      altTitles: r.altTitles as string[],
      rating: parseFloat(r.rating),
    };
  }

  public async findBySlug(slug: string): Promise<DomainManga | null> {
    const records = await db.select().from(mangaTable).where(eq(mangaTable.slug, slug)).limit(1);
    if (records.length === 0) return null;
    const r = records[0];
    return {
      ...r,
      altTitles: r.altTitles as string[],
      rating: parseFloat(r.rating),
    };
  }

  public async findByProvider(provider: string, providerMangaId: string): Promise<DomainManga | null> {
    const records = await db
      .select({ manga: mangaTable })
      .from(mangaProviderTable)
      .innerJoin(mangaTable, eq(mangaProviderTable.mangaId, mangaTable.id))
      .where(
        and(
          eq(mangaProviderTable.provider, provider),
          eq(mangaProviderTable.providerMangaId, providerMangaId)
        )
      )
      .limit(1);

    if (records.length === 0) return null;
    const r = records[0].manga;
    return {
      ...r,
      altTitles: r.altTitles as string[],
      rating: parseFloat(r.rating),
    };
  }

  public async save(manga: Partial<DomainManga> & { id: string }, expectedVersion?: number): Promise<boolean> {
    const now = new Date();
    
    if (expectedVersion !== undefined) {
      // Optimistic Locking: update only if version matches
      const res = await db
        .update(mangaTable)
        .set({
          ...manga,
          altTitles: manga.altTitles ? manga.altTitles : undefined,
          rating: manga.rating ? String(manga.rating) : undefined,
          version: expectedVersion + 1,
          updatedAt: now,
        })
        .where(
          and(
            eq(mangaTable.id, manga.id),
            eq(mangaTable.version, expectedVersion)
          )
        )
        .returning();
      
      return res.length > 0;
    }

    // Insert or update without optimistic locking
    const existing = await this.findById(manga.id);
    if (existing) {
      await db
        .update(mangaTable)
        .set({
          ...manga,
          altTitles: manga.altTitles ? manga.altTitles : undefined,
          rating: manga.rating ? String(manga.rating) : undefined,
          updatedAt: now,
        })
        .where(eq(mangaTable.id, manga.id));
    } else {
      await db.insert(mangaTable).values({
        id: manga.id,
        slug: manga.slug || null,
        title: manga.title || "Untitled",
        altTitles: manga.altTitles || [],
        description: manga.description || null,
        coverImage: manga.coverImage || null,
        bannerImage: manga.bannerImage || null,
        status: manga.status || "ongoing",
        type: manga.type || "manga",
        demographic: manga.demographic || null,
        rating: manga.rating ? String(manga.rating) : "0",
        version: 1,
        createdAt: now,
        updatedAt: now,
      });
    }
    return true;
  }

  public async getProvenance(mangaId: string): Promise<any[]> {
    return db
      .select()
      .from(metadataProvenanceTable)
      .where(eq(metadataProvenanceTable.mangaId, mangaId));
  }

  public async saveProvenance(
    mangaId: string,
    fieldName: string,
    provider: string,
    hash: string
  ): Promise<void> {
    const existing = await db
      .select()
      .from(metadataProvenanceTable)
      .where(
        and(
          eq(metadataProvenanceTable.mangaId, mangaId),
          eq(metadataProvenanceTable.fieldName, fieldName)
        )
      )
      .limit(1);

    if (existing.length > 0) {
      await db
        .update(metadataProvenanceTable)
        .set({
          provider,
          valueHash: hash,
          updatedAt: new Date(),
          version: existing[0].version + 1,
        })
        .where(eq(metadataProvenanceTable.id, existing[0].id));
    } else {
      await db.insert(metadataProvenanceTable).values({
        mangaId,
        fieldName,
        provider,
        valueHash: hash,
        version: 1,
      });
    }
  }

  public async addAlias(
    mangaId: string,
    alias: string,
    normalized: string,
    language?: string,
    provider?: string
  ): Promise<void> {
    const existing = await db
      .select()
      .from(mangaAliasTable)
      .where(
        and(
          eq(mangaAliasTable.mangaId, mangaId),
          eq(mangaAliasTable.normalizedAlias, normalized)
        )
      )
      .limit(1);

    if (existing.length === 0) {
      await db.insert(mangaAliasTable).values({
        mangaId,
        alias,
        normalizedAlias: normalized,
        language: language || null,
        provider: provider || null,
      });
    }
  }

  public async getAliases(mangaId: string): Promise<string[]> {
    const list = await db
      .select({ alias: mangaAliasTable.alias })
      .from(mangaAliasTable)
      .where(eq(mangaAliasTable.mangaId, mangaId));
    return list.map((a) => a.alias);
  }
}

export class ProviderRepository {
  public async linkManga(
    mangaId: string,
    provider: string,
    providerMangaId: string,
    url?: string,
    rawMetadata?: any
  ): Promise<void> {
    const existing = await db
      .select()
      .from(mangaProviderTable)
      .where(
        and(
          eq(mangaProviderTable.provider, provider),
          eq(mangaProviderTable.providerMangaId, providerMangaId)
        )
      )
      .limit(1);

    const now = new Date();
    if (existing.length > 0) {
      await db
        .update(mangaProviderTable)
        .set({
          mangaId,
          providerUrl: url || null,
          rawMetadata: rawMetadata || null,
          lastSyncedAt: now,
          lastSuccessAt: now,
          updatedAt: now,
        })
        .where(eq(mangaProviderTable.id, existing[0].id));
    } else {
      await db.insert(mangaProviderTable).values({
        mangaId,
        provider,
        providerMangaId,
        providerUrl: url || null,
        rawMetadata: rawMetadata || null,
        lastSyncedAt: now,
        lastSuccessAt: now,
        createdAt: now,
        updatedAt: now,
      });
    }
  }

  public async getMangaProviderLink(mangaId: string, provider: string) {
    const records = await db
      .select()
      .from(mangaProviderTable)
      .where(
        and(
          eq(mangaProviderTable.mangaId, mangaId),
          eq(mangaProviderTable.provider, provider)
        )
      )
      .limit(1);
    return records[0] || null;
  }

  public async getMangaProviderLinkByProviderId(provider: string, providerMangaId: string) {
    const records = await db
      .select()
      .from(mangaProviderTable)
      .where(
        and(
          eq(mangaProviderTable.provider, provider),
          eq(mangaProviderTable.providerMangaId, providerMangaId)
        )
      )
      .limit(1);
    return records[0] || null;
  }
}

export class ChapterRepository {
  public async findCanonicalChapter(mangaId: string, number: number): Promise<any | null> {
    const chapters = await db
      .select()
      .from(chaptersTable)
      .where(
        and(
          eq(chaptersTable.mangaId, mangaId),
          eq(chaptersTable.number, String(number))
        )
      )
      .limit(1);
    return chapters[0] || null;
  }

  public async saveCanonicalChapter(
    mangaId: string,
    number: number,
    volume: number | null,
    sortKey: bigint
  ): Promise<string> {
    const existing = await this.findCanonicalChapter(mangaId, number);
    
    if (existing) {
      await db
        .update(chaptersTable)
        .set({
          volume: volume !== null ? volume : undefined,
          sortKey: sortKey,
          updatedAt: new Date(),
        })
        .where(eq(chaptersTable.id, existing.id));
      return existing.id;
    } else {
      const res = await db
        .insert(chaptersTable)
        .values({
          mangaId,
          number: String(number),
          volume: volume !== null ? volume : null,
          sortKey: sortKey,
        })
        .returning({ id: chaptersTable.id });
      return res[0].id;
    }
  }

  public async linkChapterProvider(
    chapterId: string,
    provider: string,
    providerChapterId: string,
    displayNumber: string,
    title: string,
    language: string,
    pageCount: number,
    pages: any[],
    publishedAt?: Date,
    rawMetadata?: any
  ): Promise<void> {
    const existing = await db
      .select()
      .from(chapterProviderTable)
      .where(
        and(
          eq(chapterProviderTable.provider, provider),
          eq(chapterProviderTable.providerChapterId, providerChapterId)
        )
      )
      .limit(1);

    const now = new Date();

    if (existing.length > 0) {
      await db
        .update(chapterProviderTable)
        .set({
          chapterId,
          displayNumber,
          title,
          language,
          pageCount,
          pages: pages,
          publishedAt: publishedAt || undefined,
          lastFetched: now,
          updatedAt: now,
        })
        .where(eq(chapterProviderTable.id, existing[0].id));
    } else {
      await db.insert(chapterProviderTable).values({
        chapterId,
        provider,
        providerChapterId,
        displayNumber,
        title,
        language,
        pageCount,
        pages: pages,
        publishedAt: publishedAt || null,
        lastFetched: now,
        createdAt: now,
        updatedAt: now,
      });
    }
  }
}

export class MatchReviewRepository {
  public async getPendingReview(provider: string, providerMangaId: string) {
    const list = await db
      .select()
      .from(mangaMatchReviewTable)
      .where(
        and(
          eq(mangaMatchReviewTable.incomingProvider, provider),
          eq(mangaMatchReviewTable.providerMangaId, providerMangaId),
          eq(mangaMatchReviewTable.decision, "pending")
        )
      )
      .limit(1);
    return list[0] || null;
  }

  public async savePendingReview(
    provider: string,
    providerMangaId: string,
    candidateMangaId: string,
    confidence: number
  ): Promise<void> {
    const existing = await this.getPendingReview(provider, providerMangaId);
    if (!existing) {
      await db.insert(mangaMatchReviewTable).values({
        incomingProvider: provider,
        providerMangaId,
        candidateMangaId,
        confidence: String(confidence),
        decision: "pending",
      });
    }
  }
}

export class AuditLogRepository {
  public async logChange(
    provider: string,
    fieldName: string,
    oldValue: string | null,
    newValue: string | null,
    reason?: string,
    traceId?: string
  ): Promise<void> {
    await db.insert(auditLogTable).values({
      provider,
      fieldName,
      oldValue,
      newValue,
      reason: reason || null,
      traceId: traceId || null,
    });
  }
}
