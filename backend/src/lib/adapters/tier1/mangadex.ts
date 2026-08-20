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

export class MangaDexAdapter extends BaseAdapter {
  readonly id = "mangadex";
  readonly name = "MangaDex";
  readonly baseUrl = "https://api.mangadex.org";
  readonly tier: ProviderTier = 1;

  readonly capabilities: ProviderCapabilities = {
    search: true,
    mangaDetail: true,
    chapters: true,
    pages: true,
  };

  readonly networkPolicy: ProviderNetworkPolicy = {
    allowedHosts: ["api.mangadex.org", "uploads.mangadex.org"],
    allowedHostSuffixes: ["mangadex.org", "mangadex.network"],
  };

  async search(query: string, options?: { limit?: number }): Promise<NormalizedSearchResult[]> {
    const limit = options?.limit || 24;
    const url = `${this.baseUrl}/manga?title=${encodeURIComponent(query)}&limit=${limit}&includes[]=cover_art&contentRating[]=safe&contentRating[]=suggestive&contentRating[]=erotica`;
    const data = await this.fetchJson<any>(url);

    const results: NormalizedSearchResult[] = [];
    if (!data?.data || !Array.isArray(data.data)) return results;

    for (const item of data.data) {
      const id = item.id;
      const titleObj = item.attributes?.title || {};
      const title = titleObj.en || Object.values(titleObj)[0] || "Untitled";

      let coverFileName: string | undefined;
      const coverRel = item.relationships?.find((r: any) => r.type === "cover_art");
      if (coverRel?.attributes?.fileName) {
        coverFileName = coverRel.attributes.fileName;
      }

      const coverImage = coverFileName
        ? `https://uploads.mangadex.org/covers/${id}/${coverFileName}.512.jpg`
        : undefined;

      const altTitles: string[] = [];
      if (Array.isArray(item.attributes?.altTitles)) {
        item.attributes.altTitles.forEach((at: any) => {
          const val = Object.values(at)[0];
          if (typeof val === "string") altTitles.push(val);
        });
      }

      results.push({
        id,
        title,
        altTitles,
        url: `https://mangadex.org/title/${id}`,
        coverImage,
        provider: this.id,
      });
    }

    return results;
  }

  async getMangaDetail(manga: ProviderReference): Promise<NormalizedManga> {
    const url = `${this.baseUrl}/manga/${manga.id}?includes[]=author&includes[]=artist&includes[]=cover_art`;
    const data = await this.fetchJson<any>(url);
    const item = data?.data;

    const titleObj = item?.attributes?.title || {};
    const title = titleObj.en || Object.values(titleObj)[0] || manga.id;
    const descObj = item?.attributes?.description || {};
    const description = descObj.en || Object.values(descObj)[0] || "";

    let coverFileName: string | undefined;
    const coverRel = item?.relationships?.find((r: any) => r.type === "cover_art");
    if (coverRel?.attributes?.fileName) {
      coverFileName = coverRel.attributes.fileName;
    }

    const coverImage = coverFileName
      ? `https://uploads.mangadex.org/covers/${manga.id}/${coverFileName}.512.jpg`
      : undefined;

    const genres: string[] = [];
    if (Array.isArray(item?.attributes?.tags)) {
      item.attributes.tags.forEach((t: any) => {
        const name = t.attributes?.name?.en;
        if (name) genres.push(name);
      });
    }

    const authors: string[] = [];
    const artists: string[] = [];
    if (Array.isArray(item?.relationships)) {
      item.relationships.forEach((r: any) => {
        if (r.type === "author" && r.attributes?.name) authors.push(r.attributes.name);
        if (r.type === "artist" && r.attributes?.name) artists.push(r.attributes.name);
      });
    }

    const altTitles: string[] = [];
    if (Array.isArray(item?.attributes?.altTitles)) {
      item.attributes.altTitles.forEach((at: any) => {
        const val = Object.values(at)[0];
        if (typeof val === "string") altTitles.push(val);
      });
    }

    return {
      id: manga.id,
      title,
      altTitles,
      description,
      coverImage,
      status: item?.attributes?.status || "ongoing",
      genres,
      authors,
      artists,
      provider: this.id,
      url: `https://mangadex.org/title/${manga.id}`,
    };
  }

  async getChapters(manga: ProviderReference): Promise<NormalizedChapter[]> {
    const url = `${this.baseUrl}/manga/${manga.id}/feed?translatedLanguage[]=en&order[chapter]=desc&limit=500`;
    const data = await this.fetchJson<any>(url);

    const chapters: NormalizedChapter[] = [];
    if (!data?.data || !Array.isArray(data.data)) return chapters;

    for (const item of data.data) {
      const chNum = item.attributes?.chapter || "1";
      const title = item.attributes?.title || `Chapter ${chNum}`;

      chapters.push({
        id: item.id,
        number: chNum,
        numberValue: this.parseNumericChapter(chNum),
        title,
        url: `https://mangadex.org/chapter/${item.id}`,
        language: "en",
        languageCode: "en",
        publishedAt: item.attributes?.publishAt,
        provider: this.id,
      });
    }

    return chapters;
  }

  async getPages(chapter: ProviderReference): Promise<ChapterPage[]> {
    const url = `${this.baseUrl}/at-home/server/${chapter.id}`;
    const data = await this.fetchJson<any>(url);

    const baseUrl = data?.baseUrl;
    const hash = data?.chapter?.hash;
    const fileNames: string[] = data?.chapter?.data || [];

    const pages: ChapterPage[] = [];
    if (!baseUrl || !hash || !Array.isArray(fileNames)) return pages;

    fileNames.forEach((file, idx) => {
      pages.push({
        index: idx + 1,
        url: `${baseUrl}/data/${hash}/${file}`,
        headers: {
          referer: "https://mangadex.org/",
          origin: "https://mangadex.org",
        },
        provider: this.id,
      });
    });

    return pages;
  }
}
