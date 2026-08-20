import { NormalizedManga, MangaCover } from "../../types";

export interface MetadataMatchCriteria {
  targetTitle: string;
  targetAltTitles?: string[];
  targetAuthor?: string;
  targetYear?: number;
  targetType?: string;
  targetExternalId?: {
    anilist?: number;
    mal?: number;
    kitsu?: string;
  };
}

export interface CandidateMetadata {
  id: string;
  title: string;
  romajiTitle?: string;
  englishTitle?: string;
  nativeTitle?: string;
  altTitles?: string[];
  description?: string;
  coverImage?: string;
  coverImageLarge?: string;
  coverImageExtraLarge?: string;
  bannerImage?: string;
  covers?: MangaCover[];
  authors?: string[];
  year?: number;
  type?: string;
  status?: "ongoing" | "completed" | "hiatus" | "cancelled" | "unknown";
  genres?: string[];
  externalIds?: {
    anilist?: number;
    mal?: number;
    kitsu?: string;
  };
  score?: number;
}

export interface MetadataMatchResult {
  confidence: number;
  isStrongMatch: boolean; // Score >= 90
  isAcceptableMatch: boolean; // Score 80-89 with secondary confirmation
  matchedCandidate?: CandidateMetadata;
  signals: string[];
}

export interface MetadataProvider {
  readonly id: "anilist" | "kitsu" | "jikan";
  readonly name: string;
  search(criteria: MetadataMatchCriteria): Promise<CandidateMetadata[]>;
}

export function normalizeTitle(title: string): string {
  if (!title) return "";
  return title
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "") // remove diacritics
    .replace(/[^\w\s]/g, " ") // replace punctuation with space
    .replace(/\s+/g, " ") // normalize whitespace
    .trim();
}

/**
 * Multi-signal weighted metadata scoring rule.
 * 
 * Weights:
 * - Exact provider external ID: +100
 * - Exact canonical title: +50
 * - Exact alternate title: +35
 * - Romanized/native match: +25
 * - Author match: +15
 * - Year match: +10
 * - Format/type match: +10
 * 
 * Decision rules:
 * - Score >= 90: Strong match
 * - Score 80-89: Acceptable only with secondary confirmation
 * - Score < 80: Reject
 */
export function calculateWeightedMatch(
  criteria: MetadataMatchCriteria,
  candidate: CandidateMetadata
): MetadataMatchResult {
  let score = 0;
  const signals: string[] = [];
  let hasSecondaryConfirmation = false;

  const normTarget = normalizeTitle(criteria.targetTitle);
  const normCandTitle = normalizeTitle(candidate.title);
  const normCandEnglish = candidate.englishTitle ? normalizeTitle(candidate.englishTitle) : "";
  const normCandRomaji = candidate.romajiTitle ? normalizeTitle(candidate.romajiTitle) : "";
  const normCandNative = candidate.nativeTitle ? normalizeTitle(candidate.nativeTitle) : "";

  // 1. Exact External ID (+100)
  if (criteria.targetExternalId && candidate.externalIds) {
    if (
      (criteria.targetExternalId.anilist && criteria.targetExternalId.anilist === candidate.externalIds.anilist) ||
      (criteria.targetExternalId.mal && criteria.targetExternalId.mal === candidate.externalIds.mal) ||
      (criteria.targetExternalId.kitsu && criteria.targetExternalId.kitsu === candidate.externalIds.kitsu)
    ) {
      score += 100;
      signals.push("ExactExternalId (+100)");
    }
  }

  // 2. Exact Canonical Title Match (+50)
  if (normTarget && (normTarget === normCandTitle || normTarget === normCandEnglish)) {
    score += 50;
    signals.push("ExactCanonicalTitle (+50)");
  } else if (normTarget && normCandTitle && (normCandTitle.includes(normTarget) || normTarget.includes(normCandTitle))) {
    // High similarity partial/substring
    const ratio = Math.min(normTarget.length, normCandTitle.length) / Math.max(normTarget.length, normCandTitle.length);
    if (ratio >= 0.75) {
      score += 40;
      signals.push(`SubTitleMatch ratio=${ratio.toFixed(2)} (+40)`);
    } else {
      score += 25;
      signals.push(`PartialTitleMatch (+25)`);
    }
  }

  // 3. Exact Alternate Title Match (+35)
  const allCandAlts = [
    ...(candidate.altTitles || []),
    candidate.romajiTitle,
    candidate.englishTitle,
  ].filter(Boolean).map((t) => normalizeTitle(t!));

  const targetAlts = (criteria.targetAltTitles || []).map(normalizeTitle);

  let altMatched = false;
  for (const tAlt of [normTarget, ...targetAlts]) {
    if (!tAlt) continue;
    if (allCandAlts.includes(tAlt)) {
      score += 35;
      signals.push(`ExactAlternateTitle "${tAlt}" (+35)`);
      altMatched = true;
      hasSecondaryConfirmation = true;
      break;
    }
  }

  // 4. Romanized / Native match (+25)
  if (!altMatched && (normTarget === normCandRomaji || normTarget === normCandNative)) {
    score += 25;
    signals.push("NativeRomajiTitle (+25)");
    hasSecondaryConfirmation = true;
  }

  // 5. Author / Artist match (+15)
  if (criteria.targetAuthor && candidate.authors && candidate.authors.length > 0) {
    const normTargetAuthor = normalizeTitle(criteria.targetAuthor);
    const authorMatch = candidate.authors.some((a) => normalizeTitle(a) === normTargetAuthor || normTargetAuthor.includes(normalizeTitle(a)));
    if (authorMatch) {
      score += 15;
      signals.push("AuthorMatch (+15)");
      hasSecondaryConfirmation = true;
    }
  }

  // 6. Year match (+10)
  if (criteria.targetYear && candidate.year && criteria.targetYear === candidate.year) {
    score += 10;
    signals.push("YearMatch (+10)");
    hasSecondaryConfirmation = true;
  }

  // 7. Format / Type match (+10)
  if (criteria.targetType && candidate.type && criteria.targetType.toLowerCase() === candidate.type.toLowerCase()) {
    score += 10;
    signals.push("FormatTypeMatch (+10)");
    hasSecondaryConfirmation = true;
  }

  const finalScore = Math.min(100, score);
  const isStrongMatch = finalScore >= 90;
  const isAcceptableMatch = finalScore >= 80 && (hasSecondaryConfirmation || finalScore >= 85);

  return {
    confidence: finalScore,
    isStrongMatch,
    isAcceptableMatch,
    matchedCandidate: isAcceptableMatch ? candidate : undefined,
    signals,
  };
}
