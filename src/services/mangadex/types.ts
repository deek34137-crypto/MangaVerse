export interface MangaDexMangaAttributes {
  title: Record<string, string>;
  altTitles: Record<string, string>[];
  description: Record<string, string>;
  isLocked: boolean;
  links: Record<string, string> | null;
  originalLanguage: string;
  lastVolume: string | null;
  lastChapter: string | null;
  publicationDemographic: string | null;
  status: string;
  year: number | null;
  contentRating: string;
  tags: MangaDexTag[];
  state: string;
  chapterNumbersResetOnNewVolume: boolean;
  createdAt: string;
  updatedAt: string;
  version: number;
}

export interface MangaDexTag {
  id: string;
  type: "tag";
  attributes: {
    name: Record<string, string>;
    description: Record<string, string>;
    group: string;
    version: number;
  };
  relationships: unknown[];
}

export interface MangaDexRelationship {
  id: string;
  type: string;
  attributes?: Record<string, unknown>;
}

export interface MangaDexEntity<T> {
  id: string;
  type: string;
  attributes: T;
  relationships: MangaDexRelationship[];
}

export interface MangaDexChapterAttributes {
  title: string | null;
  volume: string | null;
  chapter: string | null;
  pages: number;
  translatedLanguage: string;
  externalUrl: string | null;
  version: number;
  createdAt: string;
  updatedAt: string;
  publishAt: string;
  readableAt: string;
}

export interface MangaDexResponse<T> {
  result: string;
  response: string;
  data: T;
  limit?: number;
  offset?: number;
  total?: number;
}

export interface MangaDexListResponse<T> {
  result: string;
  response: string;
  data: T[];
  limit: number;
  offset: number;
  total: number;
}

export interface MangaDexChapterImages {
  result: "ok";
  baseUrl: string;
  chapter: {
    hash: string;
    data: string[];
    dataSaver: string[];
  };
}

export type MangaDexSearchSort =
  | "relevance"
  | "rating"
  | "followedCount"
  | "createdAt"
  | "updatedAt"
  | "title";

export interface MangaDexSearchParams {
  title?: string;
  authors?: string[];
  artists?: string[];
  year?: number;
  includedTags?: string[];
  excludedTags?: string[];
  includedTagsMode?: "AND" | "OR";
  excludedTagsMode?: "AND" | "OR";
  status?: string[];
  originalLanguage?: string[];
  publicationDemographic?: string[];
  contentRating?: string[];
  createdAtSince?: string;
  updatedAtSince?: string;
  order?: Partial<Record<MangaDexSearchSort, "asc" | "desc">>;
  limit?: number;
  offset?: number;
  includes?: string[];
}