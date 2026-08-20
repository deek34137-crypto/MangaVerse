import { NormalizedManga, MangaCover } from "../../types";
import {
  MetadataMatchCriteria,
  CandidateMetadata,
  MetadataMatchResult,
  calculateWeightedMatch,
  MetadataProvider,
} from "./metadata-provider";
import { AniListMetadataProvider } from "./providers/anilist";
import { KitsuMetadataProvider } from "./providers/kitsu";
import { JikanMetadataProvider } from "./providers/jikan";
import { edgeCache } from "../cache/edge-cache";

export interface EnrichedMetadataResult {
  manga: Partial<NormalizedManga>;
  confidence: number;
  source: "anilist" | "kitsu" | "jikan" | "provider";
  matchSignals: string[];
}

export class MetadataResolver {
  private anilistProvider = new AniListMetadataProvider();
  private kitsuProvider = new KitsuMetadataProvider();
  private jikanProvider = new JikanMetadataProvider();

  /**
   * Resolve high-quality metadata with short-circuit cascade and Edge Caching.
   */
  public async resolveMangaMetadata(
    baseManga: NormalizedManga
  ): Promise<EnrichedMetadataResult> {
    const canonicalKey = `mangahub:metadata:${baseManga.provider}:${baseManga.id}`;

    // 1. Check Edge / Memory Cache
    const cached = await edgeCache.get<EnrichedMetadataResult>(canonicalKey);
    if (cached) {
      return cached;
    }

    const criteria: MetadataMatchCriteria = {
      targetTitle: baseManga.title,
      targetAltTitles: baseManga.altTitles,
      targetAuthor: baseManga.authors?.[0],
      targetType: "manga",
      targetExternalId: baseManga.externalIds,
    };

    let bestCandidate: CandidateMetadata | undefined = undefined;
    let bestResult: MetadataMatchResult | undefined = undefined;
    let selectedSource: "anilist" | "kitsu" | "jikan" | "provider" = "provider";

    // --- Priority 1: AniList ---
    try {
      const anilistCandidates = await this.anilistProvider.search(criteria);
      for (const candidate of anilistCandidates) {
        const match = calculateWeightedMatch(criteria, candidate);
        if (match.isStrongMatch) {
          // Short-circuit immediately!
          bestCandidate = candidate;
          bestResult = match;
          selectedSource = "anilist";
          break;
        } else if (match.isAcceptableMatch && (!bestResult || match.confidence > bestResult.confidence)) {
          bestCandidate = candidate;
          bestResult = match;
          selectedSource = "anilist";
        }
      }
    } catch {
      // Non-blocking fallback
    }

    // --- Priority 2: Kitsu (only if no strong AniList match) ---
    if (!bestResult?.isStrongMatch) {
      try {
        const kitsuCandidates = await this.kitsuProvider.search(criteria);
        for (const candidate of kitsuCandidates) {
          const match = calculateWeightedMatch(criteria, candidate);
          if (match.isStrongMatch) {
            // Short-circuit!
            bestCandidate = candidate;
            bestResult = match;
            selectedSource = "kitsu";
            break;
          } else if (match.isAcceptableMatch && (!bestResult || match.confidence > bestResult.confidence)) {
            bestCandidate = candidate;
            bestResult = match;
            selectedSource = "kitsu";
          }
        }
      } catch {
        // Non-blocking fallback
      }
    }

    // --- Priority 3: Jikan / MyAnimeList (only if still no strong match) ---
    if (!bestResult?.isStrongMatch) {
      try {
        const jikanCandidates = await this.jikanProvider.search(criteria);
        for (const candidate of jikanCandidates) {
          const match = calculateWeightedMatch(criteria, candidate);
          if (match.isAcceptableMatch && (!bestResult || match.confidence > bestResult.confidence)) {
            bestCandidate = candidate;
            bestResult = match;
            selectedSource = "jikan";
          }
        }
      } catch {
        // Non-blocking fallback
      }
    }

    // --- Priority 4: Final Selection & Native Fallback ---
    let result: EnrichedMetadataResult;

    if (bestCandidate && bestResult?.isAcceptableMatch) {
      // Find highest resolution cover available
      const allCovers: MangaCover[] = [
        ...(bestCandidate.covers || []),
        baseManga.coverImage && {
          url: baseManga.coverImage,
          source: "provider" as const,
        },
      ].filter(Boolean) as MangaCover[];

      // Sort by area if dimensions exist
      allCovers.sort((a, b) => {
        const areaA = (a.width || 0) * (a.height || 0);
        const areaB = (b.width || 0) * (b.height || 0);
        return areaB - areaA;
      });

      const highestResCover = allCovers[0]?.url || bestCandidate.coverImageExtraLarge || bestCandidate.coverImageLarge || bestCandidate.coverImage || baseManga.coverImage;

      result = {
        manga: {
          ...baseManga,
          nativeCoverImage: baseManga.coverImage,
          coverImage: highestResCover,
          coverImageLarge: bestCandidate.coverImageLarge || highestResCover,
          coverImageExtraLarge: bestCandidate.coverImageExtraLarge || highestResCover,
          bannerImage: bestCandidate.bannerImage || baseManga.bannerImage,
          description: bestCandidate.description || baseManga.description,
          externalIds: {
            ...baseManga.externalIds,
            ...bestCandidate.externalIds,
          },
          metadataSource: selectedSource,
          metadataConfidence: bestResult.confidence,
          covers: allCovers,
        },
        confidence: bestResult.confidence,
        source: selectedSource,
        matchSignals: bestResult.signals,
      };
    } else {
      // Fallback strictly to provider-native artwork
      result = {
        manga: {
          ...baseManga,
          nativeCoverImage: baseManga.coverImage,
          metadataSource: "provider",
          metadataConfidence: 100,
          covers: baseManga.coverImage
            ? [{ url: baseManga.coverImage, source: "provider" }]
            : [],
        },
        confidence: 100,
        source: "provider",
        matchSignals: ["NativeFallback"],
      };
    }

    // Cache enriched metadata for 24 hours (86400s)
    await edgeCache.set(canonicalKey, result, 86400);

    return result;
  }
}

export const metadataResolver = new MetadataResolver();
