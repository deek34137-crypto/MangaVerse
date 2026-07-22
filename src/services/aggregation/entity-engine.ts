import { normalizeTitle } from "../providers/shared/html/text";
import { RawProviderManga } from "../providers/shared/types";
import { MangaFingerprint } from "./types";
import crypto from "crypto";

export function buildMangaFingerprint(manga: RawProviderManga): MangaFingerprint {
  const normalizedPrimary = normalizeTitle(manga.title);
  const normalizedAliases = (manga.altTitles || [])
    .map((a: string) => normalizeTitle(a))
    .filter(Boolean);

  const primaryAuthor = manga.authors?.[0] ? normalizeTitle(manga.authors[0]) : undefined;
  const status = manga.status ? manga.status.toUpperCase() : undefined;

  return {
    normalizedTitle: normalizedPrimary,
    normalizedAliases,
    primaryAuthor,
    status,
  };
}

/**
 * Dice Coefficient string similarity (0.0 to 1.0)
 */
export function diceCoefficient(a: string, b: string): number {
  if (!a || !b) return 0;
  if (a === b) return 1.0;
  if (a.length < 2 || b.length < 2) return a === b ? 1.0 : 0.0;

  const getBigrams = (str: string) => {
    const s = new Set<string>();
    for (let i = 0; i < str.length - 1; i++) {
      s.add(str.slice(i, i + 2));
    }
    return s;
  };

  const bigramsA = getBigrams(a);
  const bigramsB = getBigrams(b);
  let intersection = 0;

  bigramsA.forEach((bg) => {
    if (bigramsB.has(bg)) intersection++;
  });

  return (2.0 * intersection) / (bigramsA.size + bigramsB.size);
}

/**
 * Computes multi-attribute fingerprint similarity between two manga entities.
 */
export function computeFingerprintSimilarity(
  fp1: MangaFingerprint,
  fp2: MangaFingerprint
): { titleSimilarity: number; overallScore: number; candidateRequiresAuthor: boolean } {
  // Direct title similarity
  let titleSim = diceCoefficient(fp1.normalizedTitle, fp2.normalizedTitle);

  // Check alias cross-matches
  let bestAliasSim = 0;
  const allTitles1 = [fp1.normalizedTitle, ...fp1.normalizedAliases];
  const allTitles2 = [fp2.normalizedTitle, ...fp2.normalizedAliases];

  const MODIFIERS = ["official", "colored", "digital", "hd", "uncensored", "raw", "edition", "version", "ver"];

  for (const t1 of allTitles1) {
    for (const t2 of allTitles2) {
      let sim = diceCoefficient(t1, t2);
      if (t1.length >= 3 && t2.length >= 3 && (t1.includes(t2) || t2.includes(t1))) {
        const diff = t1.length > t2.length ? t1.replace(t2, "").trim() : t2.replace(t1, "").trim();
        const diffWords = diff.split(/\s+/).filter(Boolean);
        const isOnlyModifiers = diffWords.every((w) => MODIFIERS.includes(w.toLowerCase()));
        if (isOnlyModifiers && diffWords.length > 0) {
          sim = Math.max(sim, 0.95);
        }
      }
      if (sim > bestAliasSim) bestAliasSim = sim;
    }
  }

  const effectiveTitleSim = Math.max(titleSim, bestAliasSim);

  // Author match bonus/penalty
  let authorMatch = false;
  if (fp1.primaryAuthor && fp2.primaryAuthor) {
    const authorSim = diceCoefficient(fp1.primaryAuthor, fp2.primaryAuthor);
    if (authorSim >= 0.85) authorMatch = true;
  }

  return {
    titleSimilarity: effectiveTitleSim,
    overallScore: effectiveTitleSim,
    candidateRequiresAuthor: !authorMatch,
  };
}

/**
 * 3-Tier Match Decision Matrix:
 * - ≥ 0.95: Auto-merge
 * - 0.85 to 0.95: Candidate merge (Requires author match)
 * - < 0.85: Separate series
 */
export function evaluateMergeDecision(
  fp1: MangaFingerprint,
  fp2: MangaFingerprint
): "AUTO_MERGE" | "CANDIDATE_MERGE" | "SEPARATE_SERIES" {
  const result = computeFingerprintSimilarity(fp1, fp2);

  if (result.overallScore >= 0.95) {
    return "AUTO_MERGE";
  }

  if (result.overallScore >= 0.85) {
    return result.candidateRequiresAuthor ? "SEPARATE_SERIES" : "CANDIDATE_MERGE";
  }

  return "SEPARATE_SERIES";
}

/**
 * Deterministic Canonical UUIDv5 generator based on normalized title fingerprint
 */
export function generateCanonicalId(normalizedTitle: string): string {
  const NAMESPACE_UUID = "6ba7b810-9dad-11d1-80b4-00c04fd430c8"; // DNS Namespace
  const hash = crypto.createHash("sha1").update(NAMESPACE_UUID + normalizedTitle.trim()).digest("hex");

  return [
    hash.substring(0, 8),
    hash.substring(8, 12),
    "5" + hash.substring(13, 16), // version 5
    ((parseInt(hash.substring(16, 18), 16) & 0x3f) | 0x80).toString(16) + hash.substring(18, 20),
    hash.substring(20, 32),
  ].join("-");
}
