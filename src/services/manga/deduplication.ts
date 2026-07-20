import { db } from "@/db";
import { mangaAlias as mangaAliasTable, manga as mangaTable } from "@/db/schema";
import { eq, or, and, sql } from "drizzle-orm";
import type { DomainManga } from "./repositories";
import type { RawProviderManga } from "../providers/types";

export function normalizeTitle(title: string): string {
  return title
    .toLowerCase()
    .normalize("NFD") // Decompose diacritics
    .replace(/[\u0300-\u036f]/g, "") // Strip diacritics
    .replace(/[^\w\s-]/g, "") // Strip punctuation and symbols
    .replace(/\s+/g, " ")     // Collapse multiple spaces
    .trim();
}

export function levenshteinDistance(a: string, b: string): number {
  const tmp = [];
  for (let i = 0; i <= a.length; i++) {
    tmp[i] = [i];
  }
  for (let j = 0; j <= b.length; j++) {
    tmp[0][j] = j;
  }
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      tmp[i][j] = Math.min(
        tmp[i - 1][j] + 1,
        tmp[i][j - 1] + 1,
        tmp[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1)
      );
    }
  }
  return tmp[a.length][b.length];
}

export function calculateSimilarity(a: string, b: string): number {
  const normA = normalizeTitle(a);
  const normB = normalizeTitle(b);
  if (normA === normB) return 1.0;
  const maxLen = Math.max(normA.length, normB.length);
  if (maxLen === 0) return 1.0;
  const dist = levenshteinDistance(normA, normB);
  return 1.0 - dist / maxLen;
}

export interface ProviderTrustProfile {
  name: string;
  trustScore: number; // 0.0 - 1.0
  metadataCompleteness: number; // 0.0 - 1.0
}

const TRUST_PROFILES: Record<string, ProviderTrustProfile> = {
  mangadex: { name: "mangadex", trustScore: 0.95, metadataCompleteness: 0.9 },
  comick: { name: "comick", trustScore: 0.9, metadataCompleteness: 0.85 },
  mangasee: { name: "mangasee", trustScore: 0.8, metadataCompleteness: 0.6 },
  manganato: { name: "manganato", trustScore: 0.7, metadataCompleteness: 0.5 },
};

export class ConfidenceScorer {
  public static calculateConfidence(
    canonical: DomainManga,
    incoming: RawProviderManga,
    incomingProvider: string,
    aliases: string[] = []
  ): number {
    // 1. Title matching: compare primary titles and alternative titles/aliases
    let maxTitleSimilarity = calculateSimilarity(canonical.title, incoming.title);
    
    // Check against canonical's alternative titles
    for (const alt of canonical.altTitles || []) {
      const sim = calculateSimilarity(alt, incoming.title);
      if (sim > maxTitleSimilarity) maxTitleSimilarity = sim;
    }
    
    // Check against canonical's database aliases
    for (const alias of aliases) {
      const sim = calculateSimilarity(alias, incoming.title);
      if (sim > maxTitleSimilarity) maxTitleSimilarity = sim;
    }

    // Check if incoming altTitles match canonical title
    for (const alt of incoming.altTitles || []) {
      const sim = calculateSimilarity(canonical.title, alt);
      if (sim > maxTitleSimilarity) maxTitleSimilarity = sim;
    }

    let score = maxTitleSimilarity * 0.7; // Title represents 70% weight

    // 2. Year Matching (15% weight)
    if (canonical.startDate && incoming.year) {
      const canonicalYear = new Date(canonical.startDate).getFullYear();
      if (!isNaN(canonicalYear)) {
        if (canonicalYear === incoming.year) {
          score += 0.15;
        } else if (Math.abs(canonicalYear - incoming.year) === 1) {
          score += 0.08; // Off by 1 year (often occurs due to differences in magazine release dates)
        } else {
          score -= 0.1; // Penalty for mismatching year
        }
      }
    } else {
      score += 0.08; // Neutral weight when year is missing from either
    }

    // 3. Author/Artist Matching (15% weight)
    // We'll give it a neutral baseline contribution of 15% for now
    score += 0.15; 

    // 4. Provider Trust Modification
    const profile = TRUST_PROFILES[incomingProvider.toLowerCase()] || {
      name: incomingProvider,
      trustScore: 0.7,
      metadataCompleteness: 0.5,
    };
    
    // Scale the final score slightly based on the provider's trust score
    score = score * (0.8 + profile.trustScore * 0.2);

    return Math.max(0, Math.min(1.0, score));
  }

  /**
   * Search for duplicate manga in database using title and alternative titles.
   */
  public static async findCandidateManga(incoming: RawProviderManga): Promise<DomainManga[]> {
    const normalized = normalizeTitle(incoming.title);
    
    // Direct matches in DB using manga table title
    const directMatches = await db
      .select()
      .from(mangaTable)
      .where(sql`LOWER(${mangaTable.title}) = ${incoming.title.toLowerCase()}`);
    
    if (directMatches.length > 0) {
      return directMatches.map(r => ({
        ...r,
        altTitles: r.altTitles as string[],
        rating: parseFloat(r.rating)
      }));
    }

    // Matches via alias table
    const aliasMatches = await db
      .select({ manga: mangaTable })
      .from(mangaAliasTable)
      .innerJoin(mangaTable, eq(mangaAliasTable.mangaId, mangaTable.id))
      .where(eq(mangaAliasTable.normalizedAlias, normalized))
      .limit(5);

    if (aliasMatches.length > 0) {
      return aliasMatches.map(r => ({
        ...r.manga,
        altTitles: r.manga.altTitles as string[],
        rating: parseFloat(r.manga.rating)
      }));
    }

    return [];
  }
}
export default ConfidenceScorer;
