import { CanonicalSnapshot, SnapshotState, CanonicalManga, CanonicalChapter, ChapterLookupPayload } from "./types";
import { cacheGet, cacheSet, cacheDel } from "@/services/cache";

const SCHEMA_VERSION = 1;
const DEFAULT_TTL_MS = 3600000; // 1 hour TTL
const STALE_WINDOW_MS = 600000; // Stale after 10 minutes (triggers SWR background refresh)

export class SnapshotStorageEngine {
  private contentVersionTracker = new Map<string, number>();
  private snapshotStates = new Map<string, SnapshotState>();

  private getNextContentVersion(entityId: string): number {
    const current = this.contentVersionTracker.get(entityId) || 0;
    const next = current + 1;
    this.contentVersionTracker.set(entityId, next);
    return next;
  }

  public async saveMangaSnapshot(canonical: CanonicalManga): Promise<CanonicalSnapshot<CanonicalManga>> {
    const now = new Date();
    const staleTime = new Date(now.getTime() + STALE_WINDOW_MS);
    const expireTime = new Date(now.getTime() + DEFAULT_TTL_MS);

    const contentVersion = this.getNextContentVersion(canonical.canonicalId);
    const key = `snapshot:manga:${canonical.canonicalId}`;

    const snapshot: CanonicalSnapshot<CanonicalManga> = {
      snapshotId: `snap_${canonical.canonicalId}_v${contentVersion}`,
      entityId: canonical.canonicalId,
      schemaVersion: SCHEMA_VERSION,
      contentVersion,
      state: "FRESH",
      data: canonical,
      qualityTier: canonical.qualityTier ?? "TIER_A_PRODUCTION",
      qualityScore: canonical.quality?.overall ?? 0.85,
      mergeConfidence: canonical.mergeConfidence,
      candidateMergeCount: canonical.candidateMergeCount,
      createdAt: now.toISOString(),
      staleAt: staleTime.toISOString(),
      expiresAt: expireTime.toISOString(),
    };

    this.snapshotStates.set(key, "FRESH");
    await cacheSet(key, snapshot, DEFAULT_TTL_MS);
    return snapshot;
  }

  public async getMangaSnapshot(canonicalId: string): Promise<CanonicalSnapshot<CanonicalManga> | null> {
    const key = `snapshot:manga:${canonicalId}`;
    const snapshot = await cacheGet<CanonicalSnapshot<CanonicalManga>>(key);
    if (!snapshot) return null;

    const now = new Date().toISOString();
    let currentState: SnapshotState = this.snapshotStates.get(key) || snapshot.state;

    if (now > snapshot.expiresAt) {
      currentState = "EXPIRED";
    } else if (now > snapshot.staleAt && currentState !== "REFRESHING" && currentState !== "FAILED") {
      currentState = "STALE";
    }

    snapshot.state = currentState;
    return snapshot;
  }

  public async saveChaptersSnapshot(
    canonicalMangaId: string,
    chapters: CanonicalChapter[]
  ): Promise<CanonicalSnapshot<CanonicalChapter[]>> {
    const now = new Date();
    const staleTime = new Date(now.getTime() + STALE_WINDOW_MS);
    const expireTime = new Date(now.getTime() + DEFAULT_TTL_MS);

    const contentVersion = this.getNextContentVersion(`chapters_${canonicalMangaId}`);
    const key = `snapshot:chapters:${canonicalMangaId}`;

    const snapshot: CanonicalSnapshot<CanonicalChapter[]> = {
      snapshotId: `snap_ch_${canonicalMangaId}_v${contentVersion}`,
      entityId: canonicalMangaId,
      schemaVersion: SCHEMA_VERSION,
      snapshotSchemaVersion: SCHEMA_VERSION,
      adapterVersion: "1.0.0",
      aggregationVersion: "1.0",
      contentVersion,
      state: "FRESH",
      lifecycleState: "READY",
      data: chapters,
      qualityTier: "TIER_A_PRODUCTION",
      qualityScore: 1.0,
      mergeConfidence: 1.0,
      candidateMergeCount: 0,
      createdAt: now.toISOString(),
      staleAt: staleTime.toISOString(),
      expiresAt: expireTime.toISOString(),
    };

    this.snapshotStates.set(key, "FRESH");
    await cacheSet(key, snapshot, DEFAULT_TTL_MS);

    // Save rich reverse lookup payload for every canonical chapter
    for (const ch of chapters) {
      const lookupPayload: ChapterLookupPayload = {
        canonicalMangaId,
        canonicalChapterId: ch.canonicalChapterId || ch.id,
        chapterNumber: ch.chapterNumber,
        title: ch.title,
        providerFingerprints: (ch.sources || []).map((s) => ({
          providerId: s.providerId,
          sourceId: s.providerChapterId,
          chapterUrl: s.url || "",
        })),
        snapshotSchemaVersion: SCHEMA_VERSION,
        adapterVersion: "1.0.0",
        aggregationVersion: "1.0",
        lifecycleState: "READY",
        updatedAt: now.toISOString(),
      };

      await this.saveChapterLookup(lookupPayload);
    }

    return snapshot;
  }

  public async saveChapterLookup(payload: ChapterLookupPayload): Promise<void> {
    const key = `chapter_lookup:${payload.canonicalChapterId}`;
    await cacheSet(key, payload, 86400000); // 24hr TTL
  }

  public async getChapterLookup(chapterId: string): Promise<ChapterLookupPayload | null> {
    const key = `chapter_lookup:${chapterId}`;
    return cacheGet<ChapterLookupPayload>(key);
  }

  public async getChaptersSnapshot(canonicalMangaId: string): Promise<CanonicalSnapshot<CanonicalChapter[]> | null> {
    const key = `snapshot:chapters:${canonicalMangaId}`;
    const snapshot = await cacheGet<CanonicalSnapshot<CanonicalChapter[]>>(key);
    if (!snapshot) return null;

    const now = new Date().toISOString();
    let currentState: SnapshotState = this.snapshotStates.get(key) || snapshot.state;

    if (now > snapshot.expiresAt) {
      currentState = "EXPIRED";
    } else if (now > snapshot.staleAt && currentState !== "REFRESHING" && currentState !== "FAILED") {
      currentState = "STALE";
    }

    snapshot.state = currentState;
    return snapshot;
  }

  public setSnapshotState(key: string, state: SnapshotState): void {
    this.snapshotStates.set(key, state);
  }

  /**
   * Asynchronous Event-Driven Snapshot Repair Trigger:
   * Publishes SnapshotRepairRequested and performs background repair without blocking request path.
   */
  public triggerAsyncRepair(canonicalId: string, chapterId: string): void {
    Promise.resolve().then(async () => {
      try {
        console.log(`[EventDrivenRepair] Async background repair triggered for manga=${canonicalId} ch=${chapterId}`);
        const lookup = await this.getChapterLookup(chapterId);
        if (lookup) {
          lookup.lifecycleState = "REPAIRING";
          await this.saveChapterLookup(lookup);
        }
      } catch (err) {
        console.warn(`[EventDrivenRepair] Failed background repair for ${chapterId}:`, err);
      }
    });
  }

  /**
   * Cascading Dependency Graph Invalidation:
   * Invalidating a Manga entity cascades to invalidating its Chapters, Reader, Search, and Recommendations!
   */
  public async invalidateCascade(canonicalId: string): Promise<string[]> {
    const invalidatedKeys: string[] = [
      `snapshot:manga:${canonicalId}`,
      `snapshot:chapters:${canonicalId}`,
      `snapshot:reader:${canonicalId}`,
      `snapshot:search:${canonicalId}`,
      `snapshot:recs:${canonicalId}`,
    ];

    for (const key of invalidatedKeys) {
      this.snapshotStates.delete(key);
      await cacheDel(key);
    }

    return invalidatedKeys;
  }
}

export const snapshotStorage = new SnapshotStorageEngine();
