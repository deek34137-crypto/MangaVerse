import * as cheerio from "cheerio";
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

export class KaliScanAdapter extends BaseAdapter {
  readonly id = "kaliscan";
  readonly name = "KaliScan";
  readonly baseUrl = "https://kaliscan.com";
  readonly tier: ProviderTier = 2;

  readonly capabilities: ProviderCapabilities = {
    search: true,
    mangaDetail: true,
    chapters: true,
    pages: true,
  };

  readonly networkPolicy: ProviderNetworkPolicy = {
    allowedHosts: ["kaliscan.com", "www.kaliscan.com"],
    allowedHostSuffixes: ["kaliscan.com"],
  };

  async search(query: string, options?: { limit?: number }): Promise<NormalizedSearchResult[]> {
    const searchUrl = `${this.baseUrl}/search?q=${encodeURIComponent(query)}`;
    const html = await this.fetchHtml(searchUrl);
    const $ = cheerio.load(html);
    const results: NormalizedSearchResult[] = [];
    const max = options?.limit || 24;

    $(".grid-item, .manga-item, a[href*='/manga/']").each((_, element) => {
      if (results.length >= max) return;
      const $el = $(element);
      const $link = $el.is("a") ? $el : $el.find("a[href*='/manga/']").first();
      const href = $link.attr("href") || "";
      const match = href.match(/\/manga\/([^/]+)/);
      if (!match) return;

      const id = match[1];
      const title = $link.text().trim() || $el.find("h3, h4, .title").text().trim();
      const coverImg = $el.find("img").first().attr("src");

      if (title && !results.some((r) => r.id === id)) {
        results.push({
          id,
          title,
          url: href.startsWith("http") ? href : `${this.baseUrl}${href}`,
          coverImage: coverImg || undefined,
          provider: this.id,
        });
      }
    });

    return results;
  }

  async getMangaDetail(manga: ProviderReference): Promise<NormalizedManga> {
    const url = manga.url || `${this.baseUrl}/manga/${manga.id}`;
    const html = await this.fetchHtml(url);
    const $ = cheerio.load(html);

    const title = $("h1, .manga-title").first().text().trim() || manga.id;
    const description = $(".description, .summary p").first().text().trim();
    const coverImg = $(".cover img, .poster img").first().attr("src");

    return {
      id: manga.id,
      title,
      altTitles: [],
      description,
      coverImage: coverImg || undefined,
      status: "ongoing",
      genres: [],
      authors: [],
      artists: [],
      provider: this.id,
      url,
    };
  }

  async getChapters(manga: ProviderReference): Promise<NormalizedChapter[]> {
    const url = manga.url || `${this.baseUrl}/manga/${manga.id}`;
    const html = await this.fetchHtml(url);
    const $ = cheerio.load(html);
    const chapters: NormalizedChapter[] = [];

    $("a[href*='/chapter/'], a[href*='/read/']").each((_, element) => {
      const $link = $(element);
      const href = $link.attr("href") || "";
      const match = href.match(/\/(?:chapter|read)\/([^/]+)/);
      if (!match) return;

      const chId = match[1];
      const text = $link.text().trim();
      const numStr = this.extractChapterNumber(text);

      chapters.push({
        id: chId,
        number: numStr,
        numberValue: this.parseNumericChapter(numStr),
        title: text || `Chapter ${numStr}`,
        url: href.startsWith("http") ? href : `${this.baseUrl}${href}`,
        language: "en",
        languageCode: "en",
        provider: this.id,
      });
    });

    return chapters;
  }

  async getPages(chapter: ProviderReference): Promise<ChapterPage[]> {
    const url = chapter.url?.startsWith("http")
      ? chapter.url
      : `${this.baseUrl}/chapter/${chapter.id}`;
    const html = await this.fetchHtml(url);
    const $ = cheerio.load(html);
    const pages: ChapterPage[] = [];

    $(".chapter-content img, .reader-images img, #reader img").each((idx, el) => {
      const src = $(el).attr("src") || $(el).attr("data-src");
      if (src && !src.includes("logo")) {
        pages.push({
          index: idx + 1,
          url: src.startsWith("http") ? src : `${this.baseUrl}${src}`,
          headers: {
            referer: `${this.baseUrl}/`,
            origin: this.baseUrl,
          },
          provider: this.id,
        });
      }
    });

    return pages;
  }
}
