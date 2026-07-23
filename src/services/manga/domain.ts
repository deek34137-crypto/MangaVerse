/**
 * Canonical Domain Model Layer (RFC-002)
 * Decouples provider-specific schemas (MangaDex, Comick, Webtoon, etc.) from persistence and UI viewmodels.
 * Pipeline: Provider -> Provider DTO -> Canonical Domain Model -> Persistence -> ViewModel -> UI
 */

export interface ProviderCapabilities {
  supportsSearch: boolean;
  supportsLatest: boolean;
  supportsCovers: boolean;
  supportsWebP: boolean;
  supportsMetadata: boolean;
  supportsPagination: boolean;
  confidenceScore: number; // 0 to 100
}

export interface ProviderCapabilityRegistry {
  mangadex: ProviderCapabilities;
  comick: ProviderCapabilities;
  mangasee: ProviderCapabilities;
  manganato: ProviderCapabilities;
  mangatown: ProviderCapabilities;
  weebcentral: ProviderCapabilities;
  [providerId: string]: ProviderCapabilities;
}

export const DEFAULT_PROVIDER_CAPABILITIES: ProviderCapabilityRegistry = {
  mangadex: {
    supportsSearch: true,
    supportsLatest: true,
    supportsCovers: true,
    supportsWebP: true,
    supportsMetadata: true,
    supportsPagination: true,
    confidenceScore: 99,
  },
  comick: {
    supportsSearch: true,
    supportsLatest: true,
    supportsCovers: true,
    supportsWebP: true,
    supportsMetadata: true,
    supportsPagination: true,
    confidenceScore: 92,
  },
  mangasee: {
    supportsSearch: true,
    supportsLatest: true,
    supportsCovers: true,
    supportsWebP: false,
    supportsMetadata: true,
    supportsPagination: true,
    confidenceScore: 88,
  },
  manganato: {
    supportsSearch: true,
    supportsLatest: true,
    supportsCovers: true,
    supportsWebP: false,
    supportsMetadata: true,
    supportsPagination: true,
    confidenceScore: 85,
  },
  mangatown: {
    supportsSearch: true,
    supportsLatest: true,
    supportsCovers: true,
    supportsWebP: false,
    supportsMetadata: true,
    supportsPagination: true,
    confidenceScore: 82,
  },
  weebcentral: {
    supportsSearch: true,
    supportsLatest: true,
    supportsCovers: true,
    supportsWebP: true,
    supportsMetadata: true,
    supportsPagination: true,
    confidenceScore: 86,
  },
};

export interface CanonicalMangaDomain {
  canonicalId: string;
  slug: string;
  title: string;
  altTitles: string[];
  description: string;
  coverImage: string;
  bannerImage?: string;
  status: "ONGOING" | "COMPLETED" | "HIATUS" | "CANCELLED" | "UNKNOWN";
  type: "MANGA" | "MANHWA" | "MANHUA" | "NOVEL" | "ONESHOT" | "UNKNOWN";
  authors: string[];
  artists: string[];
  genres: string[];
  tags: string[];
  demographic?: string;
  rating: number;
  ratingCount: number;
  followCount: number;
  viewCount: number;
  chapterCount: number;
  volumeCount: number;
  primaryProvider: string;
  providerMappings: Array<{
    providerId: string;
    providerMangaId: string;
    trustScore: number;
  }>;
  createdAt: string;
  updatedAt: string;
}

export interface CanonicalChapterDomain {
  canonicalChapterId: string;
  mangaId: string;
  chapterNumber: number | null;
  volumeNumber?: number;
  title: string;
  language: string;
  pageCount: number;
  pages: Array<{
    pageNumber: number;
    url: string;
    width?: number;
    height?: number;
  }>;
  publishedAt: string;
  primaryProvider: string;
  providerChapterId: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Versioned Provider Adapter Interface (V1/V2)
 */
export interface ProviderAdapterContractV1 {
  version: "1.0";
  providerId: string;
  capabilities: ProviderCapabilities;
  getManga(providerMangaId: string): Promise<CanonicalMangaDomain | null>;
  getChapters(providerMangaId: string): Promise<CanonicalChapterDomain[]>;
  getPages(providerChapterId: string): Promise<Array<{ pageNumber: number; url: string }>>;
}
