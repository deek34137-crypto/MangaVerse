import { backendClient } from "@/lib/backend-client";
import { MangaDetailResultViewModel, toMangaDetailViewModel } from "../manga.viewmodel";
import { CanonicalManga, CanonicalChapter, AGGREGATION_VERSION } from "../../aggregation/types";
import { parseProviderAndId } from "@/services/manga";

function normalizeStatus(status?: string): "ONGOING" | "COMPLETED" | "HIATUS" | "CANCELLED" | "UNKNOWN" {
  const upper = (status || "").toUpperCase();
  if (upper.includes("COMPLET")) return "COMPLETED";
  if (upper.includes("HIATUS")) return "HIATUS";
  if (upper.includes("CANCEL")) return "CANCELLED";
  if (upper.includes("ONGOING")) return "ONGOING";
  return "ONGOING";
}

export async function loadMangaDetailPage(canonicalId: string): Promise<MangaDetailResultViewModel> {
  try {
    const { provider, id } = parseProviderAndId(canonicalId);
    let mangaDetail = await backendClient.getMangaDetail(provider, id);

    if (!mangaDetail) {
      // Search across all providers to resolve
      const searchRes = await backendClient.search(canonicalId, "all", 1);
      if (searchRes.results && searchRes.results.length > 0) {
        const match = searchRes.results[0];
        mangaDetail = await backendClient.getMangaDetail(match.provider, match.id);
      }
    }

    if (!mangaDetail) {
      return {
        type: "ERROR",
        errorMessage: "Manga series not found or unavailable.",
        retryActionText: "Back to Home",
      };
    }

    const actualProvider = mangaDetail.provider || provider;
    const actualId = mangaDetail.id || id;
    const rawChapters = await backendClient.getChapters(actualProvider, actualId);

    const now = new Date().toISOString();
    const traceId = `trace_${actualProvider}_${actualId}`;

    // Select the highest quality available cover
    const bestCover =
      mangaDetail.coverImageExtraLarge ||
      mangaDetail.coverImageLarge ||
      mangaDetail.coverImage ||
      mangaDetail.nativeCoverImage ||
      "";

    const coverProvider = mangaDetail.metadataSource || actualProvider;

    const canonicalManga: CanonicalManga = {
      canonicalId,
      aggregationVersion: AGGREGATION_VERSION,
      qualityTier: "TIER_A_PRODUCTION",
      title: { value: mangaDetail.title, confidence: 1.0, provider: actualProvider, mergedAt: now, traceId },
      alternativeTitles: { value: mangaDetail.altTitles || [], confidence: 1.0, provider: actualProvider, mergedAt: now, traceId },
      description: { value: mangaDetail.description || "", confidence: 1.0, provider: actualProvider, mergedAt: now, traceId },
      coverImage: {
        value: backendClient.getImageProxyUrl(coverProvider, bestCover),
        confidence: 1.0,
        provider: coverProvider,
        mergedAt: now,
        traceId,
      },
      status: { value: normalizeStatus(mangaDetail.status), confidence: 1.0, provider: actualProvider, mergedAt: now, traceId },
      genres: { value: mangaDetail.genres || [], confidence: 1.0, provider: actualProvider, mergedAt: now, traceId },
      authors: { value: mangaDetail.authors || [], confidence: 1.0, provider: actualProvider, mergedAt: now, traceId },
      providerMappings: [{ providerId: actualProvider, providerMangaId: actualId, trustScore: 0.95 }],
      rating: mangaDetail.rating ?? 8.5,
      formattedRating: mangaDetail.rating ? mangaDetail.rating.toFixed(1) : "8.5",
      quality: {
        metadata: 100,
        reader: 100,
        images: 100,
        chapters: 100,
        overall: 100,
      },
      mergeConfidence: 0.95,
      candidateMergeCount: 1,
      createdAt: now,
      updatedAt: now,
      traceId,
    };

    const canonicalChapters: CanonicalChapter[] = rawChapters.map((ch, idx) => ({
      id: ch.id,
      canonicalChapterId: `${actualProvider}_${ch.id}`,
      aggregationVersion: "1.0",
      canonicalMangaId: canonicalId,
      chapterNumber: ch.numberValue ?? (idx + 1),
      key: { chapter: ch.numberValue ?? (idx + 1), key: `c${(ch.numberValue ?? idx + 1).toString().padStart(4, "0")}` },
      title: ch.title || `Chapter ${ch.number}`,
      sources: [{ providerId: actualProvider, providerChapterId: ch.id, sourceScore: 0.95, url: ch.url }],
      providerIds: [actualProvider],
      releasedAt: ch.publishedAt || now,
      updatedAt: ch.publishedAt || now,
      lastValidated: now,
      traceId: `trace_${ch.id}`,
      pageCount: ch.pageCount,
    } as any));

    return toMangaDetailViewModel(canonicalManga, canonicalChapters, []);
  } catch (error: any) {
    return {
      type: "ERROR",
      errorMessage: error?.message || "Failed to load manga detail page.",
      retryActionText: "Retry",
    };
  }
}
