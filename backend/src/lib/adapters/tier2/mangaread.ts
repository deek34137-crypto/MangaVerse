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

export class MangaReadAdapter extends BaseAdapter {
  readonly id = "mangaread";
  readonly name = "MangaRead";
  readonly baseUrl = "https://www.mangaread.org";
  readonly tier: ProviderTier = 2;

  readonly capabilities: ProviderCapabilities = {
    search: true,
    mangaDetail: true,
    chapters: true,
    pages: true,
  };

  readonly networkPolicy: ProviderNetworkPolicy = {
    allowedHosts: ["www.mangaread.org", "mangaread.org"],
    allowedHostSuffixes: ["mangaread.org", "wp.com"],
  };

  async search(query: string, options?: { limit?: number }): Promise<NormalizedSearchResult[]> {
    const url = `${this.baseUrl}/?s=${encodeURIComponent(query)}&post_type=wp-manga`;
    const html = await this.fetchHtml(url);
    const $ = cheerio.load(html);
    const results: NormalizedSearchResult[] = [];
    const max = options?.limit || 24;

    $(".c-tabs-item__content, .row.c-tabs-item__content").each((_, el) => {
      if (results.length >= max) return;
      const $el = $(el);
      const $link = $el.find(".post-title a").first();
      const href = $link.attr("href") || "";
      const match = href.match(/\/manga\/([^/]+)/);
      if (!match) return;

      const id = match[1];
      const title = $link.text().trim();
      const coverImg = $el.find(".tab-thumb img").first().attr("src") || $el.find(".tab-thumb img").first().attr("data-src");

      results.push({
        id,
        title: title || id,
        url: href,
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

    const title = $(".post-title h1").text().trim() || manga.id;
    const description = $(".description-summary .summary__content, .manga-excerpt").text().trim();
    const coverImg = $(".summary_image img").attr("src") || $(".summary_image img").attr("data-src");

    const genres: string[] = [];
    $(".genres-content a").each((_, el) => {
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
    const url = manga.url || `${this.baseUrl}/manga/${manga.id}/`;
    const html = await this.fetchHtml(url);
    const $ = cheerio.load(html);
    const chapters: NormalizedChapter[] = [];

    $("li.wp-manga-chapter a").each((_, el) => {
      const $link = $(el);
      const href = $link.attr("href") || "";
      if (!href) return;

      const match = href.match(/\/manga\/[^/]+\/([^/]+)/);
      const chId = match ? match[1] : href;
      const text = $link.text().trim();
      const numStr = this.extractChapterNumber(text);

      chapters.push({
        id: chId,
        number: numStr,
        numberValue: this.parseNumericChapter(numStr),
        title: text || `Chapter ${numStr}`,
        url: href,
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

    $(".reading-content img, .page-break img").each((idx, el) => {
      const src = $(el).attr("src") || $(el).attr("data-src");
      if (src && !src.includes("logo")) {
        pages.push({
          index: idx + 1,
          url: src.trim(),
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
