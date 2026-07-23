/**
 * Database Snapshot Layer & Builder (RFC-002)
 * Creates stable, cached database snapshots from Canonical Domain objects, isolating the UI from external provider volatility.
 */

import { CanonicalMangaDomain, CanonicalChapterDomain } from "./domain";

export interface MangaSnapshot {
  snapshotId: string;
  manga: CanonicalMangaDomain;
  chapters: CanonicalChapterDomain[];
  chapterCount: number;
  healthStatus: "HEALTHY" | "DEGRADED" | "SYNCING";
  builtAt: string;
}

export function buildMangaSnapshot(
  manga: CanonicalMangaDomain,
  chapters: CanonicalChapterDomain[] = []
): MangaSnapshot {
  const isHealthy = chapters.length > 0 && Boolean(manga.coverImage);

  return {
    snapshotId: `snapshot:${manga.canonicalId}:${Date.now()}`,
    manga,
    chapters: [...chapters].sort((a, b) => Number(b.chapterNumber) - Number(a.chapterNumber)),
    chapterCount: chapters.length,
    healthStatus: isHealthy ? "HEALTHY" : "DEGRADED",
    builtAt: new Date().toISOString(),
  };
}
