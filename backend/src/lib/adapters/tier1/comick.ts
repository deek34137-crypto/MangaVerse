import { BaseAdapter } from "../base";
import {
  ChapterPage,
  NormalizedChapter,
  NormalizedManga,
  NormalizedSearchResult,
  ProviderCapabilities,
  ProviderNetworkPolicy,
  ProviderReference,
  ProviderTier,
} from "../../../types";

function buildComicKCoverUrl(coverUrl?: string, b2key?: string): string | undefined {
  if (b2key) return `https://meo.comick.pictures/${b2key}`;
  if (!coverUrl) return undefined;
  if (coverUrl.startsWith("http://") || coverUrl.startsWith("https://")) {
    return coverUrl;
  }
  return `https://meo.comick.pictures/${coverUrl}`;
}

export class ComicKAdapter extends BaseAdapter {
  readonly id = "comick";
  readonly name = "ComicK";
  readonly baseUrl = "https://api.comick.fun";
  readonly tier: ProviderTier = 1;

  readonly capabilities: ProviderCapabilities = {
    search: true,
    mangaDetail: true,
    chapters: true,
    pages: true,
  };

  readonly networkPolicy: ProviderNetworkPolicy = {
    allowedHosts: [
      "api.comick.fun",
      "comick.io",
      "meo.comick.pictures",
      "meo3.comick.pictures",
    ],
    allowedHostSuffixes: ["comick.pictures", "comick.fun", "comick.io"],
  };

  async search(query: string, options?: { limit?: number }): Promise<NormalizedSearchResult[]> {
    const limit = options?.limit || 24;
    const url = `${this.baseUrl}/v1.0/search?q=${encodeURIComponent(query)}&limit=${limit}&tachiyomi=true`;
    const items = await this.fetchJson<any[]>(url);

    const results: NormalizedSearchResult[] = [];
    if (!Array.isArray(items)) return results;

    for (const item of items) {
      const hid = item.hid;
      const title = item.title || "Untitled";
      const coverUrl = buildComicKCoverUrl(item.cover_url, item.md_covers?.[0]?.b2key);

      const altTitles: string[] = [];
      if (Array.isArray(item.md_titles)) {
        item.md_titles.forEach((t: any) => {
          if (t.title) altTitles.push(t.title);
        });
      }

      results.push({
        id: hid,
        title,
        altTitles,
        url: `https://comick.io/comic/${hid}`,
        coverImage: coverUrl,
        rating: item.rating ? parseFloat(String(item.rating)) : undefined,
        provider: this.id,
      });
    }

    return results;
  }

  async getMangaDetail(manga: ProviderReference): Promise<NormalizedManga> {
    const url = `${this.baseUrl}/comic/${manga.id}?tachiyomi=true`;
    const data = await this.fetchJson<any>(url);
    const comic = data?.comic || data;

    const title = comic?.title || manga.id;
    const description = comic?.desc || "";
    const coverUrl = buildComicKCoverUrl(comic?.cover_url, comic?.md_covers?.[0]?.b2key);

    const genres: string[] = [];
    if (Array.isArray(comic?.md_comic_md_genres)) {
      comic.md_comic_md_genres.forEach((g: any) => {
        if (g.md_genres?.name) genres.push(g.md_genres.name);
      });
    }

    const authors: string[] = [];
    const artists: string[] = [];
    if (Array.isArray(comic?.authors)) {
      comic.authors.forEach((a: any) => {
        if (a.name) authors.push(a.name);
      });
    }
    if (Array.isArray(comic?.artists)) {
      comic.artists.forEach((a: any) => {
        if (a.name) artists.push(a.name);
      });
    }

    return {
      id: manga.id,
      title,
      altTitles: [],
      description,
      coverImage: coverUrl,
      status: comic?.status === 1 ? "ongoing" : "completed",
      genres,
      authors,
      artists,
      rating: comic?.rating ? parseFloat(String(comic.rating)) : undefined,
      provider: this.id,
      url: `https://comick.io/comic/${manga.id}`,
    };
  }

  async getChapters(manga: ProviderReference): Promise<NormalizedChapter[]> {
    const url = `${this.baseUrl}/comic/${manga.id}/chapters?lang=en&limit=1000`;
    const data = await this.fetchJson<any>(url);
    const chaptersList = data?.chapters || data;

    const chapters: NormalizedChapter[] = [];
    if (!Array.isArray(chaptersList)) return chapters;

    for (const item of chaptersList) {
      const hid = item.hid;
      const numStr = item.chap || "1";
      const title = item.title || `Chapter ${numStr}`;

      chapters.push({
        id: hid,
        number: numStr,
        numberValue: this.parseNumericChapter(numStr),
        title,
        url: `https://comick.io/comic/${manga.id}/${hid}`,
        language: "en",
        languageCode: "en",
        publishedAt: item.created_at || item.updated_at,
        provider: this.id,
      });
    }

    return chapters;
  }

  async getPages(chapter: ProviderReference): Promise<ChapterPage[]> {
    const url = `${this.baseUrl}/chapter/${chapter.id}?tachiyomi=true`;
    const data = await this.fetchJson<any>(url);
    const chapterData = data?.chapter || data;

    const pages: ChapterPage[] = [];
    if (!chapterData?.images || !Array.isArray(chapterData.images)) {
      return pages;
    }

    chapterData.images.forEach((img: any, idx: number) => {
      const imgUrl = img.b2key
        ? `https://meo.comick.pictures/${img.b2key}`
        : img.url;

      if (imgUrl) {
        pages.push({
          index: idx + 1,
          url: imgUrl,
          headers: {
            referer: "https://comick.io/",
            origin: "https://comick.io",
          },
          provider: this.id,
        });
      }
    });

    return pages;
  }
}
