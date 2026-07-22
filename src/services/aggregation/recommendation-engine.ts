import { CanonicalManga } from "./types";

export interface RecommendationScore {
  manga: CanonicalManga;
  recScore: number;
  matchReasons: string[];
}

export class SmartRecommendationEngine {
  public computeSimilarity(target: CanonicalManga, candidate: CanonicalManga): RecommendationScore {
    const matchReasons: string[] = [];

    // 1. Genre Overlap (35%)
    const targetGenres = new Set((target.genres?.value || []).map((g) => g.toLowerCase()));
    const candidateGenres = (candidate.genres?.value || []).map((g) => g.toLowerCase());
    let genreOverlapCount = 0;

    candidateGenres.forEach((g) => {
      if (targetGenres.has(g)) genreOverlapCount++;
    });

    const genreScore = targetGenres.size > 0 ? genreOverlapCount / targetGenres.size : 0;
    if (genreOverlapCount > 0) {
      matchReasons.push(`Shares ${genreOverlapCount} genres`);
    }

    // 2. Author Match (15%)
    const targetAuthors = new Set((target.authors?.value || []).map((a) => a.toLowerCase()));
    const candidateAuthors = (candidate.authors?.value || []).map((a) => a.toLowerCase());
    let authorMatch = false;

    candidateAuthors.forEach((a) => {
      if (targetAuthors.has(a)) authorMatch = true;
    });

    const authorScore = authorMatch ? 1.0 : 0.0;
    if (authorMatch) {
      matchReasons.push("Same author");
    }

    // 3. Status Match (10%)
    const statusMatch = target.status?.value === candidate.status?.value;
    const statusScore = statusMatch ? 1.0 : 0.5;

    // 4. Quality Score (20%)
    const qualityScore = candidate.quality?.overall ?? 0.85;

    // 5. Confidence Score (20%)
    const confidenceScore = candidate.mergeConfidence ?? 0.85;

    const recScore = parseFloat(
      (
        0.35 * genreScore +
        0.15 * authorScore +
        0.10 * statusScore +
        0.20 * qualityScore +
        0.20 * confidenceScore
      ).toFixed(4)
    );

    return {
      manga: candidate,
      recScore,
      matchReasons,
    };
  }

  public rankRecommendations(target: CanonicalManga, candidates: CanonicalManga[], limit: number = 10): RecommendationScore[] {
    const scored = candidates
      .filter((c) => c.canonicalId !== target.canonicalId && c.qualityTier !== "TIER_C_HIDDEN")
      .map((c) => this.computeSimilarity(target, c));

    return scored.sort((a, b) => b.recScore - a.recScore).slice(0, limit);
  }
}

export const recommendationEngine = new SmartRecommendationEngine();
