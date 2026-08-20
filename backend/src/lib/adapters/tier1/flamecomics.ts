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

export class FlameComicsAdapter extends BaseAdapter {
  readonly id = "flamecomics";
  readonly name = "FlameComics";
  readonly baseUrl = "https://flamecomics.xyz";
  readonly tier: ProviderTier = 1;

  readonly capabilities: ProviderCapabilities = {
    search: true,
    mangaDetail: true,
    chapters: true,
    pages: true,
  };

  readonly networkPolicy: ProviderNetworkPolicy = {
    allowedHosts: ["flamecomics.xyz", "www.flamecomics.xyz", "flamecomics.com"],
    allowedHostSuffixes: ["flamecomics.xyz", "flamecomics.com"],
  };

  async search(query: string, options?: { limit?: number }): Promise<NormalizedSearchResult[]> {
    const searchUrl = `${this.baseUrl}/?s=${encodeURIComponent(query)}`;
    const html = await this.fetchHtml(searchUrl);
    const $ = cheerio.load(html);
    const results: NormalizedSearchResult[] = [];
    const max = options?.limit || 24;

    $(".bsx, .animposx, article").each((_, element) => {
      if (results.length >= max) return;
      const $el = $(element);
      const $link = $el.find("a").first();
      const href = $link.attr("href") || "";
      const match = href.match(/\/series\/([a-zA-Z0-9_-]+)/);
      if (!match) return;

      const id = match[1];
      const title = $link.attr("title") || $el.find(".tt, h2, h3").text().trim();
      const coverImg = $el.find("img").first().attr("src");

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
    const url = manga.url || `${this.baseUrl}/series/${manga.id}`;
    const html = await this.fetchHtml(url);
    const $ = cheerio.load(html);

    const title = $("h1.entry-title").text().trim() || manga.id;
    const description = $(".entry-content p, .synopsis").text().trim();
    const coverImage = $(".thumb img").attr("src");

    const genres: string[] = [];
    $(".mgen a, .genres a").each((_, el) => {
      const g = $(el).text().trim();
      if (g) genres.push(g);
    });

    return {
      id: manga.id,
      title,
      altTitles: [],
      description,
      coverImage: coverImage || undefined,
      status: "ongoing",
      genres,
      authors: [],
      artists: [],
      provider: this.id,
      url,
    };
  }

  async getChapters(manga: ProviderReference): Promise<NormalizedChapter[]> {
    const url = manga.url || `${this.baseUrl}/series/${manga.id}`;
    const html = await this.fetchHtml(url);
    const $ = cheerio.load(html);
    const chapters: NormalizedChapter[] = [];

    $("#chapterlist li, .eplist li").each((_, element) => {
      const $el = $(element);
      const $link = $el.find("a").first();
      const href = $link.attr("href") || "";
      if (!href) return;

      const chMatch = href.match(/\/([^/]+)\/?$/);
      const chId = chMatch ? chMatch[1] : href;
      const numText = $el.find(".chapternum").text().trim() || $link.text().trim();
      const numStr = this.extractChapterNumber(numText);

      chapters.push({
        id: chId,
        number: numStr,
        numberValue: this.parseNumericChapter(numStr),
        title: numText,
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
      : `${this.baseUrl}/${chapter.id}`;
    const html = await this.fetchHtml(url);
    const $ = cheerio.load(html);
    const pages: ChapterPage[] = [];

    $("#readerarea img").each((idx, el) => {
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
