import { fetchMangadex } from "./client";
import { buildMangaDexCoverUrl } from "@/lib/cover-url";
import type {
  MangaDexMangaAttributes,
  MangaDexEntity,
  MangaDexResponse,
  MangaDexListResponse,
  MangaDexChapterAttributes,
  MangaDexChapterImages,
  MangaDexRelationship,
  MangaDexTag,
  MangaDexSearchParams,
} from "./types";

export async function getManga(id: string): Promise<MangaDexEntity<MangaDexMangaAttributes>> {
  const res = await fetchMangadex<MangaDexResponse<MangaDexEntity<MangaDexMangaAttributes>>>(`/manga/${id}`, {
    params: { "includes[]": ["author", "artist", "cover_art"] },
  });
  return res.data;
}

export async function searchManga(params: MangaDexSearchParams): Promise<MangaDexListResponse<MangaDexEntity<MangaDexMangaAttributes>>> {
  const order: Record<string, string> = {};
  if (params.order) {
    Object.entries(params.order).forEach(([k, v]) => {
      order[`order[${k}]`] = v;
    });
  }
  const flatParams: Record<string, string | string[] | number | undefined> = {
    ...params,
    ...order,
    order: undefined,
    includes: params.includes ? params.includes : undefined,
  };
  if (flatParams.includes) {
    flatParams["includes[]"] = flatParams.includes;
    delete flatParams.includes;
  }
  if (flatParams.contentRating) {
    flatParams["contentRating[]"] = flatParams.contentRating;
    delete flatParams.contentRating;
  }
  if (flatParams.includedTags) {
    flatParams["includedTags[]"] = flatParams.includedTags;
    delete flatParams.includedTags;
  }
  if (flatParams.excludedTags) {
    flatParams["excludedTags[]"] = flatParams.excludedTags;
    delete flatParams.excludedTags;
  }
  if (flatParams.authors) {
    flatParams["authors[]"] = flatParams.authors;
    delete flatParams.authors;
  }
  if (flatParams.artists) {
    flatParams["artists[]"] = flatParams.artists;
    delete flatParams.artists;
  }
  if (flatParams.status) {
    flatParams["status[]"] = flatParams.status;
    delete flatParams.status;
  }
  if (flatParams.originalLanguage) {
    flatParams["originalLanguage[]"] = flatParams.originalLanguage;
    delete flatParams.originalLanguage;
  }
  if (flatParams.publicationDemographic) {
    flatParams["publicationDemographic[]"] = flatParams.publicationDemographic;
    delete flatParams.publicationDemographic;
  }
  return fetchMangadex<MangaDexListResponse<MangaDexEntity<MangaDexMangaAttributes>>>("/manga", {
    params: flatParams as Record<string, string | string[] | number | undefined>,
  });
}

export async function getMangaFeed(
  mangaId: string,
  options: {
    limit?: number;
    offset?: number;
    translatedLanguage?: string[];
    order?: Record<string, "asc" | "desc">;
  } = {}
): Promise<MangaDexListResponse<MangaDexEntity<MangaDexChapterAttributes>>> {
  const order: Record<string, string> = {};
  if (options.order) {
    Object.entries(options.order).forEach(([k, v]) => {
      order[`order[${k}]`] = v;
    });
  }
  return fetchMangadex<MangaDexListResponse<MangaDexEntity<MangaDexChapterAttributes>>>(`/manga/${mangaId}/feed`, {
    params: {
      limit: options.limit ?? 100,
      offset: options.offset ?? 0,
      "translatedLanguage[]": options.translatedLanguage ?? ["en"],
      ...order,
      "contentRating[]": ["safe", "suggestive", "erotica", "pornographic"],
      includeFuturePublishAt: "0",
    } as Record<string, string | string[] | number | undefined>,
  });
}

export async function getChapter(chapterId: string): Promise<MangaDexEntity<MangaDexChapterAttributes>> {
  const res = await fetchMangadex<MangaDexResponse<MangaDexEntity<MangaDexChapterAttributes>>>(`/chapter/${chapterId}`, {
    params: { "includes[]": ["scanlation_group", "manga"] },
  });
  return res.data;
}

export async function getChapterImages(
  chapterId: string
): Promise<MangaDexChapterImages> {
  return fetchMangadex<MangaDexChapterImages>(`/at-home/server/${chapterId}`);
}

export async function getCoverArt(
  mangaId: string,
  coverFileName: string
): Promise<string> {
  return buildMangaDexCoverUrl(mangaId, coverFileName, 512);
}

export async function getLatestManga(
  limit = 20,
  offset = 0
): Promise<MangaDexListResponse<MangaDexEntity<MangaDexMangaAttributes>>> {
  return searchManga({
    order: { updatedAt: "desc" },
    limit,
    offset,
    contentRating: ["safe", "suggestive", "erotica", "pornographic"],
    includes: ["cover_art", "author", "artist"],
  });
}

export async function getPopularManga(
  limit = 20,
  offset = 0,
  demographic?: string
): Promise<MangaDexListResponse<MangaDexEntity<MangaDexMangaAttributes>>> {
  return searchManga({
    order: { followedCount: "desc" },
    limit,
    offset,
    contentRating: ["safe", "suggestive", "erotica", "pornographic"],
    includes: ["cover_art", "author", "artist"],
    ...(demographic ? { publicationDemographic: [demographic] } : {}),
  });
}

export async function getMangaStats(mangaId: string): Promise<any> {
  const res = await fetchMangadex<any>(`/statistics/manga/${mangaId}`);
  return res.statistics?.[mangaId] || null;
}