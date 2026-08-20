export interface ProviderCapabilities {
  search: boolean;
  mangaDetail: boolean;
  chapters: boolean;
  pages: boolean;
}

export type ProviderTier = 1 | 2 | 3;
export type ProviderStatus = "healthy" | "degraded" | "down" | "unknown";

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

export interface FrontpageApiResponse {
  source: string;
  sourceName: string;
  section: {
    id: string;
    title: string;
    type: string;
    items: NormalizedSearchResult[];
    supportsPagination: boolean;
  };
  fetchedAt: number;
}

export interface BatchPageCountsApiRequest {
  chapters: {
    provider: string;
    id: string;
  }[];
}

export interface BatchPageCountsApiResponse {
  counts: {
    chapterId: string;
    provider: string;
    pageCount: number | null;
  }[];
}

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

export class BackendClient {
  private getBaseUrl(): string {
    if (typeof window === "undefined") {
      // Server-side
      return (
        process.env.BACKEND_API_URL ||
        process.env.NEXT_PUBLIC_BACKEND_API_URL ||
        "http://localhost:8787"
      );
    }
    // Client-side
    return process.env.NEXT_PUBLIC_BACKEND_API_URL || "http://localhost:8787";
  }

  private async request<T>(
    endpoint: string,
    options: {
      method?: "GET" | "POST";
      body?: any;
      query?: Record<string, string>;
      revalidate?: number;
    } = {}
  ): Promise<T> {
    const { method = "GET", body, query, revalidate } = options;
    const baseUrl = this.getBaseUrl().replace(/\/$/, "");

    let url = `${baseUrl}${endpoint.startsWith("/") ? endpoint : `/${endpoint}`}`;

    if (query) {
      const searchParams = new URLSearchParams();
      for (const [k, v] of Object.entries(query)) {
        if (v !== undefined && v !== null) {
          searchParams.append(k, v);
        }
      }
      const qs = searchParams.toString();
      if (qs) {
        url += (url.includes("?") ? "&" : "?") + qs;
      }
    }

    const headers: Record<string, string> = {
      Accept: "application/json",
    };

    if (body) {
      headers["Content-Type"] = "application/json";
    }

    const fetchOptions: RequestInit & { next?: { revalidate?: number } } = {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    };

    if (revalidate !== undefined) {
      fetchOptions.next = { revalidate };
    }

    const res = await fetch(url, fetchOptions);

    if (!res.ok) {
      let errorMessage = `Backend API Error ${res.status}: ${res.statusText}`;
      try {
        const errorData = await res.json();
        if (errorData.error) errorMessage = errorData.error;
      } catch {
        // use default statusText
      }
      throw new Error(errorMessage);
    }

    return (await res.json()) as T;
  }

  public async search(
    query: string,
    source: string = "all",
    limit: number = 24
  ): Promise<SearchApiResponse> {
    return this.request<SearchApiResponse>("/api/search", {
      method: "POST",
      body: { query, source, limit },
      revalidate: 60,
    });
  }

  public async getMangaDetail(
    provider: string,
    id: string,
    url?: string
  ): Promise<NormalizedManga | null> {
    try {
      const query: Record<string, string> = { provider, id };
      if (url) query.url = url;
      return await this.request<NormalizedManga>("/api/manga/detail", {
        method: "GET",
        query,
        revalidate: 3600,
      });
    } catch (err) {
      console.error(`[BackendClient] getMangaDetail failed for ${provider}:${id}`, err);
      return null;
    }
  }

  public async getMangaMetadata(req: MetadataApiRequest): Promise<MetadataApiResponse | null> {
    try {
      return await this.request<MetadataApiResponse>("/api/manga/metadata", {
        method: "POST",
        body: req,
        revalidate: 86400,
      });
    } catch (err) {
      console.error(`[BackendClient] getMangaMetadata failed for ${req.title}`, err);
      return null;
    }
  }

  public async getChapters(
    provider: string,
    id: string,
    url?: string
  ): Promise<NormalizedChapter[]> {
    try {
      const query: Record<string, string> = { provider, id };
      if (url) query.url = url;
      const res = await this.request<{ chapters: NormalizedChapter[] }>("/api/chapters", {
        method: "GET",
        query,
        revalidate: 1800,
      });
      return res.chapters || [];
    } catch (err) {
      console.error(`[BackendClient] getChapters failed for ${provider}:${id}`, err);
      return [];
    }
  }

  public async getChapterPageCounts(
    req: BatchPageCountsApiRequest
  ): Promise<BatchPageCountsApiResponse> {
    try {
      return await this.request<BatchPageCountsApiResponse>("/api/chapter-page-counts", {
        method: "POST",
        body: req,
      });
    } catch (err) {
      console.error("[BackendClient] getChapterPageCounts failed", err);
      return { counts: [] };
    }
  }

  public async getPages(
    provider: string,
    chapterId: string,
    url?: string
  ): Promise<ChapterPage[]> {
    const query: Record<string, string> = { provider, chapterId };
    if (url) query.url = url;
    const res = await this.request<PagesApiResponse>("/api/pages", {
      method: "GET",
      query,
      revalidate: 86400,
    });
    return res.pages || [];
  }

  public async getFrontpage(
    source: string = "weebcentral",
    section: string = "popular",
    limit: number = 30
  ): Promise<FrontpageApiResponse | null> {
    try {
      return await this.request<FrontpageApiResponse>("/api/frontpage", {
        method: "GET",
        query: { source, section, limit: String(limit) },
        revalidate: 600,
      });
    } catch {
      return null;
    }
  }

  public getImageProxyUrl(provider: string, imageUrl: string): string {
    if (!imageUrl) return "/placeholders/cover.jpg";
    if (imageUrl.startsWith("/") && !imageUrl.startsWith("/api/proxy")) {
      return imageUrl;
    }
    const baseUrl = this.getBaseUrl().replace(/\/$/, "");
    return `${baseUrl}/api/proxy/image?provider=${encodeURIComponent(
      provider
    )}&url=${encodeURIComponent(imageUrl)}`;
  }
}

export const backendClient = new BackendClient();
