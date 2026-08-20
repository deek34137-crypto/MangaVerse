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

export class DemonicScansAdapter extends BaseAdapter {
  readonly id = "demonicscans";
  readonly name = "DemonicScans";
  readonly baseUrl = "https://demonicscans.org";
  readonly tier: ProviderTier = 2;

  readonly capabilities: ProviderCapabilities = {
    search: true,
    mangaDetail: true,
    chapters: true,
    pages: true,
  };

  readonly networkPolicy: ProviderNetworkPolicy = {
    allowedHosts: ["demonicscans.org", "www.demonicscans.org"],
    allowedHostSuffixes: ["demonicscans.org"],
  };

  async search(query: string, options?: { limit?: number }): Promise<NormalizedSearchResult[]> {
    const url = `${this.baseUrl}/title/list?search=${encodeURIComponent(query)}`;
    const html = await this.fetchHtml(url);
    const $ = cheerio.load(html);
    const results: NormalizedSearchResult[] = [];
    const max = options?.limit || 24;

    $(".col-6.col-md-3, .card, .manga-card").each((_, element) => {
      if (results.length >= max) return;
      const $el = $(element);
      const $link = $el.find("a[href*='/title/']").first();
      const href = $link.attr("href") || "";
      const match = href.match(/\/title\/([a-zA-Z0-9_-]+)/);
      if (!match) return;

      const id = match[1];
      const title = $link.text().trim() || $el.find(".card-title, h5").text().trim();
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
    const url = manga.url || `${this.baseUrl}/title/${manga.id}`;
    const html = await this.fetchHtml(url);
    const $ = cheerio.load(html);

    const title = $("h1, .title").first().text().trim() || manga.id;
    const description = $(".description, .synopsis, p").first().text().trim();
    const coverImg = $("img.img-fluid, .cover img").first().attr("src");

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
    const url = manga.url || `${this.baseUrl}/title/${manga.id}`;
    const html = await this.fetchHtml(url);
    const $ = cheerio.load(html);
    const chapters: NormalizedChapter[] = [];

    $("a[href*='/chapter/']").each((_, element) => {
      const $link = $(element);
      const href = $link.attr("href") || "";
      const match = href.match(/\/chapter\/([a-zA-Z0-9_-]+)/);
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

    $("#reader img, .chapter-images img, img.img-fluid").each((idx, el) => {
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
