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

export class WeebCentralAdapter extends BaseAdapter {
  readonly id = "weebcentral";
  readonly name = "WeebCentral";
  readonly baseUrl = "https://weebcentral.com";
  readonly tier: ProviderTier = 1;

  readonly capabilities: ProviderCapabilities = {
    search: true,
    mangaDetail: true,
    chapters: true,
    pages: true,
  };

  readonly networkPolicy: ProviderNetworkPolicy = {
    allowedHosts: ["weebcentral.com", "www.weebcentral.com"],
    allowedHostSuffixes: ["weebcentral.com", "wixmp.com", "mangadex.network"],
  };

  async search(query: string, options?: { limit?: number }): Promise<NormalizedSearchResult[]> {
    const url = `${this.baseUrl}/search/data?text=${encodeURIComponent(query)}&display_mode=Full+Display&adult=Any`;
    const html = await this.fetchHtml(url, {
      headers: {
        "HX-Request": "true",
      },
    });

    const $ = cheerio.load(html);
    const results: NormalizedSearchResult[] = [];
    const max = options?.limit || 24;

    $("article.bg-base-200, article").each((_, el) => {
      if (results.length >= max) return;
      const $el = $(el);

      const $link = $el.find("a[href*='/series/']").first();
      const href = $link.attr("href") || "";
      const idMatch = href.match(/\/series\/([a-zA-Z0-9_-]+)/);
      if (!idMatch) return;

      const id = idMatch[1];
      const title = $el.find("a.link, h2, h3, .font-bold").first().text().trim();
      const coverImage = $el.find("img").first().attr("src") || undefined;
      const latestChapterText = $el.find("a[href*='/chapters/']").first().text().trim();

      results.push({
        id,
        title: title || id,
        url: href.startsWith("http") ? href : `${this.baseUrl}${href}`,
        coverImage,
        latestChapter: latestChapterText ? this.extractChapterNumber(latestChapterText) : undefined,
        provider: this.id,
      });
    });

    return results;
  }

  async getMangaDetail(manga: ProviderReference): Promise<NormalizedManga> {
    const url = manga.url || `${this.baseUrl}/series/${manga.id}`;
    const html = await this.fetchHtml(url);
    const $ = cheerio.load(html);

    const title = $("h1").first().text().trim() || $("title").text().split(" - ")[0].trim();
    const description = $("section p, .description, [itemprop='description']").first().text().trim();
    const coverImage = $("img[alt*='cover'], section img").first().attr("src");

    const genres: string[] = [];
    $("a[href*='/search?genre='], .badge").each((_, el) => {
      const g = $(el).text().trim();
      if (g && !genres.includes(g)) genres.push(g);
    });

    const authors: string[] = [];
    $("a[href*='/search?author='], [itemprop='author']").each((_, el) => {
      const a = $(el).text().trim();
      if (a && !authors.includes(a)) authors.push(a);
    });

    return {
      id: manga.id,
      title: title || manga.id,
      altTitles: [],
      description,
      coverImage: coverImage || undefined,
      status: "ongoing",
      genres,
      authors,
      artists: [],
      provider: this.id,
      url,
    };
  }

  async getChapters(manga: ProviderReference): Promise<NormalizedChapter[]> {
    const url = `${this.baseUrl}/series/${manga.id}/full-chapter-list`;
    const html = await this.fetchHtml(url, {
      headers: { "HX-Request": "true" },
    });
    const $ = cheerio.load(html);
    const chapters: NormalizedChapter[] = [];

    $("a[href*='/chapters/']").each((_, el) => {
      const $link = $(el);
      const href = $link.attr("href") || "";
      const match = href.match(/\/chapters\/([a-zA-Z0-9_-]+)/);
      if (!match) return;

      const chId = match[1];
      const fullText = $link.text().trim();
      const numStr = this.extractChapterNumber(fullText);

      chapters.push({
        id: chId,
        number: numStr,
        numberValue: this.parseNumericChapter(numStr),
        title: fullText || `Chapter ${numStr}`,
        url: href.startsWith("http") ? href : `${this.baseUrl}${href}`,
        language: "en",
        languageCode: "en",
        provider: this.id,
      });
    });

    return chapters;
  }

  async getPages(chapter: ProviderReference): Promise<ChapterPage[]> {
    const url = `${this.baseUrl}/chapters/${chapter.id}/images?is_prev=False&current_page=1&reading_style=long_strip`;
    const html = await this.fetchHtml(url, {
      headers: {
        "HX-Request": "true",
        Referer: `${this.baseUrl}/chapters/${chapter.id}`,
      },
    });

    const $ = cheerio.load(html);
    const pages: ChapterPage[] = [];

    $("img").each((index, el) => {
      const src = $(el).attr("src") || $(el).attr("data-src");
      if (src && !src.includes("logo") && !src.includes("icon")) {
        pages.push({
          index: index + 1,
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
