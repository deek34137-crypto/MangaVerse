import { RawProviderManga } from "../providers/shared/types";
import {
  CanonicalManga,
  FieldProvenance,
  AggregationDecisionTrace,
  AGGREGATION_VERSION,
} from "./types";
import { computeEffectiveConfidence, computeOverallMergeConfidence } from "./confidence-model";
import { generateCanonicalId, buildMangaFingerprint } from "./entity-engine";
import { ratingsEngine } from "./ratings-engine";
import { qualityPipeline } from "./quality-validator";
import crypto from "crypto";

export interface ProviderMangaInput {
  providerId: string;
  data: RawProviderManga;
  latencyMs?: number;
  circuitState?: "CLOSED" | "HALF-OPEN" | "OPEN";
  confidence?: number;
}

export function mergeMangaEntities(
  inputs: ProviderMangaInput[],
  options?: { fixedNow?: string }
): {
  canonical: CanonicalManga;
  trace: AggregationDecisionTrace;
} {
  if (inputs.length === 0) {
    throw new Error("[MergeEngine] Cannot merge empty inputs list.");
  }

  const now = options?.fixedNow || "2026-07-22T00:00:00.000Z";
  const traceId = `trace_${crypto.createHash("md5").update(inputs.map((i) => i.providerId + i.data.id).join(":")).digest("hex").slice(0, 12)}`;

  // Compute effective confidence scores for all inputs
  const scoredInputs = inputs.map((inp) => {
    const confidence = computeEffectiveConfidence(inp.providerId, {
      latencyMs: inp.latencyMs,
      circuitState: inp.circuitState,
    });
    return { ...inp, confidence };
  });

  // Sort inputs by confidence descending, tie-breaking by providerId ascending
  const sorted = [...scoredInputs].sort((a, b) => {
    if (b.confidence !== a.confidence) return b.confidence - a.confidence;
    return a.providerId.localeCompare(b.providerId);
  });

  const fieldDecisions: AggregationDecisionTrace["fieldDecisions"] = {};

  // 1. Title Merge (Winner: Highest confidence provider)
  const titleWinner = sorted[0];
  const titleProv: FieldProvenance<string> = {
    value: titleWinner.data.title,
    provider: titleWinner.providerId,
    confidence: titleWinner.confidence,
    mergedAt: now,
    traceId,
  };
  fieldDecisions["title"] = {
    winner: titleWinner.providerId,
    reason: `Highest effective confidence (${titleWinner.confidence})`,
    alternatives: sorted.map((s) => ({ provider: s.providerId, confidence: s.confidence, value: s.data.title })),
  };

  // 2. Description Merge (Winner: Longest text among inputs with confidence >= 0.70)
  const descCandidates = sorted.filter((s) => s.data.description && s.confidence >= 0.70);
  let descWinner = descCandidates.length > 0
    ? descCandidates.reduce((prev, curr) =>
        (curr.data.description?.length ?? 0) > (prev.data.description?.length ?? 0) ? curr : prev
      )
    : sorted[0];

  const descProv: FieldProvenance<string> | undefined = descWinner.data.description
    ? {
        value: descWinner.data.description,
        provider: descWinner.providerId,
        confidence: descWinner.confidence,
        mergedAt: now,
        traceId,
      }
    : undefined;

  fieldDecisions["description"] = {
    winner: descWinner.providerId,
    reason: `Longest high-confidence description (${descWinner.data.description?.length ?? 0} chars)`,
    alternatives: sorted.map((s) => ({ provider: s.providerId, confidence: s.confidence, value: s.data.description })),
  };

  // 3. Cover Image Merge (Winner: Highest resolution score / highest confidence)
  const coverWinner = sorted.find((s) => s.data.coverImage && s.data.coverImage.startsWith("http")) || sorted[0];
  const coverProv: FieldProvenance<string> = {
    value: coverWinner.data.coverImage || "",
    provider: coverWinner.providerId,
    confidence: coverWinner.confidence,
    mergedAt: now,
    traceId,
  };

  const fallbackCovers = sorted
    .filter((s) => s.data.coverImage && s.data.coverImage.startsWith("http"))
    .map((s, idx) => ({
      provider: s.providerId,
      url: s.data.coverImage!,
      priority: idx + 1,
      verifiedAt: now,
      healthy: s.confidence >= 0.70,
    }));

  fieldDecisions["coverImage"] = {
    winner: coverWinner.providerId,
    reason: `Highest confidence cover image provider (${coverWinner.confidence})`,
    alternatives: sorted.map((s) => ({ provider: s.providerId, confidence: s.confidence, value: s.data.coverImage })),
  };

  // 4. Status Merge (Winner: Official provider > Trusted provider > Majority vote)
  const statusWinner = sorted.find((s) => s.data.status && s.data.status !== "UNKNOWN") || sorted[0];
  const validStatus = (statusWinner.data.status || "UNKNOWN").toUpperCase() as CanonicalManga["status"]["value"];
  const statusProv: FieldProvenance<CanonicalManga["status"]["value"]> = {
    value: validStatus,
    provider: statusWinner.providerId,
    confidence: statusWinner.confidence,
    mergedAt: now,
    traceId,
  };
  fieldDecisions["status"] = {
    winner: statusWinner.providerId,
    reason: `Highest confidence non-UNKNOWN status (${validStatus})`,
    alternatives: sorted.map((s) => ({ provider: s.providerId, confidence: s.confidence, value: s.data.status })),
  };

  // 5. Union Fields (Authors, Genres, Alternative Titles)
  const authorSet = new Map<string, { value: string; provider: string; conf: number }>();
  const genreSet = new Map<string, { value: string; provider: string; conf: number }>();
  const aliasSet = new Map<string, { value: string; provider: string; conf: number }>();

  sorted.forEach((inp) => {
    (inp.data.authors || []).forEach((a) => {
      const key = a.trim().toLowerCase();
      if (key && !authorSet.has(key)) authorSet.set(key, { value: a.trim(), provider: inp.providerId, conf: inp.confidence });
    });
    (inp.data.genres || []).forEach((g) => {
      const key = g.trim().toLowerCase();
      if (key && !genreSet.has(key)) genreSet.set(key, { value: g.trim(), provider: inp.providerId, conf: inp.confidence });
    });
    (inp.data.altTitles || []).forEach((alt: string) => {
      const key = alt.trim().toLowerCase();
      if (key && !aliasSet.has(key)) aliasSet.set(key, { value: alt.trim(), provider: inp.providerId, conf: inp.confidence });
    });
  });

  const authorsProv: FieldProvenance<string[]> = {
    value: Array.from(authorSet.values()).map((v) => v.value),
    provider: titleWinner.providerId,
    confidence: titleWinner.confidence,
    mergedAt: now,
    traceId,
  };

  const genresProv: FieldProvenance<string[]> = {
    value: Array.from(genreSet.values()).map((v) => v.value),
    provider: titleWinner.providerId,
    confidence: titleWinner.confidence,
    mergedAt: now,
    traceId,
  };

  const aliasesProv: FieldProvenance<string[]> = {
    value: Array.from(aliasSet.values()).map((v) => v.value),
    provider: titleWinner.providerId,
    confidence: titleWinner.confidence,
    mergedAt: now,
    traceId,
  };

  const canonicalId = generateCanonicalId(titleWinner.data.title);

  const providerMappings = inputs.map((i) => ({
    providerId: i.providerId,
    providerMangaId: i.data.id,
    trustScore: i.confidence ?? 0.85,
  }));

  const candidateMergeCount = inputs.filter((i) => i.confidence !== undefined && i.confidence < 0.95).length;
  const mergeConfidence = computeOverallMergeConfidence(providerMappings, candidateMergeCount);

  // Resolve Rating (never displays fake 0)
  const ratingRes = ratingsEngine.resolveRating(
    inputs.map((i) => ({
      providerId: i.providerId,
      rating: i.data.rawMetadata?.rating ?? null,
      votesCount: i.data.rawMetadata?.votesCount,
    }))
  );

  // Evaluate Quality Metrics and Tier Classification
  const partialManga: Partial<CanonicalManga> = {
    canonicalId,
    title: titleProv,
    description: descProv,
    coverImage: coverProv,
    authors: authorsProv,
    genres: genresProv,
  };
  const qualityReport = qualityPipeline.evaluateManga(partialManga, inputs.length);

  const canonical: CanonicalManga = {
    canonicalId,
    aggregationVersion: AGGREGATION_VERSION,
    title: titleProv,
    description: descProv,
    coverImage: coverProv,
    fallbackCovers,
    status: statusProv,
    authors: authorsProv,
    genres: genresProv,
    alternativeTitles: aliasesProv,
    providerMappings,
    rating: ratingRes.rating,
    formattedRating: ratingRes.formattedRating,
    quality: qualityReport.quality,
    qualityTier: qualityReport.tier,
    mergeConfidence,
    candidateMergeCount,
    createdAt: now,
    updatedAt: now,
    traceId,
  };

  const trace: AggregationDecisionTrace = {
    traceId,
    entityId: canonicalId,
    timestamp: now,
    fieldDecisions,
  };

  return { canonical, trace };
}
