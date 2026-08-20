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

export class NovelCoolAdapter extends BaseAdapter {
  readonly id = "novelcool";
  readonly name = "NovelCool";
  readonly baseUrl = "https://www.novelcool.com";
  readonly tier: ProviderTier = 2;

  readonly capabilities: ProviderCapabilities = {
    search: true,
    mangaDetail: true,
    chapters: true,
    pages: true,
  };

  readonly networkPolicy: ProviderNetworkPolicy = {
    allowedHosts: ["www.novelcool.com", "novelcool.com"],
    allowedHostSuffixes: ["novelcool.com", "mangacdn.com"],
  };

  async search(query: string, options?: { limit?: number }): Promise<NormalizedSearchResult[]> {
    const searchUrl = `${this.baseUrl}/search?name=${encodeURIComponent(query)}`;
    const html = await this.fetchHtml(searchUrl);
    const $ = cheerio.load(html);
    const results: NormalizedSearchResult[] = [];
    const max = options?.limit || 24;

    $(".book-item, .search-result-item").each((_, element) => {
      if (results.length >= max) return;
      const $el = $(element);
      const $link = $el.find("a.book-name, a").first();
      const href = $link.attr("href") || "";
      const match = href.match(/\/novel\/([^/]+)/);
      if (!match) return;

      const id = match[1];
      const title = $link.text().trim();
      const coverImg = $el.find("img").first().attr("src") || $el.find("img").first().attr("data-src");

      results.push({
        id,
        title: title || id,
        url: href.startsWith("http") ? href : `${this.baseUrl}${href}`,
        coverImage: coverImg || undefined,
        provider: this.id,
      });
    });

    return results;
  }

  async getMangaDetail(manga: ProviderReference): Promise<NormalizedManga> {
    const url = manga.url || `${this.baseUrl}/novel/${manga.id}.html`;
    const html = await this.fetchHtml(url);
    const $ = cheerio.load(html);

    const title = $("h1.book-info-title, h1").text().trim() || manga.id;
    const description = $(".book-info-desc, .summary").text().trim();
    const coverImg = $(".book-info-cover img").attr("src");

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
    const url = manga.url || `${this.baseUrl}/novel/${manga.id}.html`;
    const html = await this.fetchHtml(url);
    const $ = cheerio.load(html);
    const chapters: NormalizedChapter[] = [];

    $(".chapter-item a, .chp-item a").each((_, element) => {
      const $link = $(element);
      const href = $link.attr("href") || "";
      if (!href) return;

      const match = href.match(/\/chapter\/([^/]+)/);
      const chId = match ? match[1] : href;
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

    $(".chapter-content img, .read-content img").each((idx, el) => {
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
