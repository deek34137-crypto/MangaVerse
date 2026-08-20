export type ProviderTier = 1 | 2 | 3;
export type ProviderStatus = "healthy" | "degraded" | "down" | "unknown";

export interface ProviderCapabilities {
  search: boolean;
  mangaDetail: boolean;
  chapters: boolean;
  pages: boolean;
}

export interface ProviderNetworkPolicy {
  allowedHosts: string[];
  allowedHostSuffixes?: string[];
}

export interface ProviderReference {
  provider: string;
  id: string;
  url?: string;
}

export interface NormalizedSearchResult {
  id: string;
  title: string;
  altTitles?: string[];
  url: string;
  coverImage?: string;
  latestChapter?: string;
  lastUpdated?: string;
  rating?: number;
  provider: string;
}

export interface MangaCover {
  url: string;
  width?: number;
  height?: number;
  source: "anilist" | "kitsu" | "jikan" | "provider";
}

export interface NormalizedManga {
  id: string;
  title: string;
  altTitles: string[];
  description?: string;
  coverImage?: string;
  coverImageLarge?: string;
  coverImageExtraLarge?: string;
  nativeCoverImage?: string;
  bannerImage?: string;
  status: "ongoing" | "completed" | "hiatus" | "cancelled" | "unknown";
  genres: string[];
  authors: string[];
  artists: string[];
  rating?: number;
  provider: string;
  url: string;
  externalIds?: {
    anilist?: number;
    mal?: number;
    kitsu?: string;
  };
  metadataSource?: "anilist" | "kitsu" | "jikan" | "provider";
  metadataConfidence?: number;
  covers?: MangaCover[];
}

export interface NormalizedChapter {
  id: string;
  number: string;
  numberValue?: number;
  title?: string;
  url: string;
  language?: string;
  languageCode?: string;
  publishedAt?: string;
  provider: string;
  /**
   * Number of readable pages in this chapter.
   * Optional/null when the provider cannot determine it cheaply.
   */
  pageCount?: number | null;
}

export interface ChapterPage {
  index: number;
  url: string;
  width?: number;
  height?: number;
  headers?: {
    referer?: string;
    origin?: string;
  };
  provider: string;
}

export interface ProviderAdapter {
  readonly id: string;
  readonly name: string;
  readonly baseUrl: string;
  readonly tier: ProviderTier;
  readonly capabilities: ProviderCapabilities;
  readonly networkPolicy: ProviderNetworkPolicy;

  search(query: string, options?: { limit?: number }): Promise<NormalizedSearchResult[]>;
  getMangaDetail(manga: ProviderReference): Promise<NormalizedManga>;
  getChapters(manga: ProviderReference): Promise<NormalizedChapter[]>;
  getPages(chapter: ProviderReference): Promise<ChapterPage[]>;
}

export interface ProviderHealth {
  provider: string;
  status: ProviderStatus;
  latencyMs?: number;
  lastChecked: number;
  consecutiveFailures: number;
  lastError?: string;
}

// Page count resolution types
export type PageCountResolution =
  | { status: "resolved"; count: number }
  | { status: "unavailable" }
  | { status: "failed"; error?: string };

export interface ChapterPageCountItem {
  provider: string;
  id: string;
}

export interface BatchPageCountsApiRequest {
  chapters: ChapterPageCountItem[];
}

export interface BatchPageCountsApiResponse {
  counts: {
    chapterId: string;
    provider: string;
    pageCount: number | null;
  }[];
}

// Metadata resolution types
export interface MetadataApiRequest {
  title: string;
  altTitles?: string[];
  author?: string;
  year?: number;
  type?: string;
  provider?: string;
  providerId?: string;
}

export interface MetadataApiResponse {
  manga: Partial<NormalizedManga>;
  confidence: number;
  source: "anilist" | "kitsu" | "jikan" | "provider";
}

// API Response Types
export interface SourcesApiResponse {
  sources: {
    id: string;
    name: string;
    baseUrl: string;
    tier: ProviderTier;
    capabilities: ProviderCapabilities;
    status: ProviderStatus;
  }[];
}

export interface SearchApiResponse {
  results: NormalizedSearchResult[];
  totalResults: number;
  sources: {
    completed: string[];
    failed: string[];
    skipped: string[];
  };
}

export interface PagesApiResponse {
  mangaId?: string;
  chapterId: string;
  chapterNumber?: string;
  provider: string;
  pages: ChapterPage[];
  totalPages: number;
}

export interface PublicHealthApiResponse {
  status: "ok" | "degraded" | "down";
  timestamp: string;
  providers: Record<string, ProviderStatus>;
}
