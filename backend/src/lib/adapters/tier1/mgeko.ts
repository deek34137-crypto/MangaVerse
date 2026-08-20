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

export class MGekoAdapter extends BaseAdapter {
  readonly id = "mgeko";
  readonly name = "MGeko";
  readonly baseUrl = "https://www.mgeko.cc";
  readonly tier: ProviderTier = 1;

  readonly capabilities: ProviderCapabilities = {
    search: true,
    mangaDetail: true,
    chapters: true,
    pages: true,
  };

  readonly networkPolicy: ProviderNetworkPolicy = {
    allowedHosts: ["www.mgeko.cc", "mgeko.cc"],
    allowedHostSuffixes: ["mgeko.cc"],
  };

  async search(query: string, options?: { limit?: number }): Promise<NormalizedSearchResult[]> {
    const searchUrl = `${this.baseUrl}/search/?search=${encodeURIComponent(query)}`;
    const html = await this.fetchHtml(searchUrl);
    const $ = cheerio.load(html);
    const results: NormalizedSearchResult[] = [];
    const max = options?.limit || 24;

    $("ul.novel-list li, .novel-item").each((_, element) => {
      if (results.length >= max) return;
      const $el = $(element);
      const $link = $el.find("a").first();
      const href = $link.attr("href") || "";
      const match = href.match(/\/manga\/([^/]+)/);
      if (!match) return;

      const id = match[1];
      const title = $link.attr("title") || $el.find(".novel-title, h4, h3").text().trim();
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
    const url = manga.url || `${this.baseUrl}/manga/${manga.id}/`;
    const html = await this.fetchHtml(url);
    const $ = cheerio.load(html);

    const title = $("h1.novel-title, h1").text().trim() || manga.id;
    const description = $(".description p, .summary").text().trim();
    const coverImg = $(".cover img, .novel-cover img").attr("src");

    const genres: string[] = [];
    $(".categories a, .genres a").each((_, el) => {
      const g = $(el).text().trim();
      if (g) genres.push(g);
    });

    return {
      id: manga.id,
      title,
      altTitles: [],
      description,
      coverImage: coverImg || undefined,
      status: "ongoing",
      genres,
      authors: [],
      artists: [],
      provider: this.id,
      url,
    };
  }

  async getChapters(manga: ProviderReference): Promise<NormalizedChapter[]> {
    const url = manga.url || `${this.baseUrl}/manga/${manga.id}/all-chapters/`;
    const html = await this.fetchHtml(url);
    const $ = cheerio.load(html);
    const chapters: NormalizedChapter[] = [];

    $("#chapter-list li a, .chapter-list li a").each((_, element) => {
      const $link = $(element);
      const href = $link.attr("href") || "";
      if (!href) return;

      const match = href.match(/\/manga\/[^/]+\/([^/]+)/);
      const chId = match ? match[1] : href;
      const text = $link.find(".chapter-title, span").text().trim() || $link.text().trim();
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
      : `${this.baseUrl}/manga/${chapter.id}`;
    const html = await this.fetchHtml(url);
    const $ = cheerio.load(html);
    const pages: ChapterPage[] = [];

    $("#chapter-reader img, .reader-content img").each((idx, el) => {
      const src = $(el).attr("src") || $(el).attr("data-src");
      if (src && !src.includes("logo")) {
        pages.push({
          index: idx + 1,
          url: src,
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
