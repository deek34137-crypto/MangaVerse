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

export class AsuraScanAdapter extends BaseAdapter {
  readonly id = "asurascan";
  readonly name = "AsuraScans";
  readonly baseUrl = "https://asuracomic.net";
  readonly tier: ProviderTier = 1;

  readonly capabilities: ProviderCapabilities = {
    search: true,
    mangaDetail: true,
    chapters: true,
    pages: true,
  };

  readonly networkPolicy: ProviderNetworkPolicy = {
    allowedHosts: [
      "asuracomic.net",
      "www.asuracomic.net",
      "asurascans.com",
      "gg.asuracomic.net",
    ],
    allowedHostSuffixes: ["asuracomic.net", "asurascans.com"],
  };

  async search(query: string, options?: { limit?: number }): Promise<NormalizedSearchResult[]> {
    const searchUrl = `${this.baseUrl}/series?page=1&name=${encodeURIComponent(query)}`;
    const html = await this.fetchHtml(searchUrl, {
      headers: { Referer: `${this.baseUrl}/` },
    });
    const $ = cheerio.load(html);
    const results: NormalizedSearchResult[] = [];
    const max = options?.limit || 24;

    $("a[href*='/series/']").each((_, element) => {
      if (results.length >= max) return;
      const $link = $(element);
      const href = $link.attr("href") || "";
      const match = href.match(/\/series\/([a-zA-Z0-9_-]+)/);
      if (!match) return;

      const id = match[1];
      const title = $link.find("span.font-bold, h2, h3, .title").first().text().trim() || $link.text().trim();
      const coverImg = $link.find("img").first().attr("src");

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
    const url = manga.url || `${this.baseUrl}/series/${manga.id}`;
    const html = await this.fetchHtml(url, {
      headers: { Referer: `${this.baseUrl}/` },
    });
    const $ = cheerio.load(html);

    const title = $("h1, .text-xl.font-bold").first().text().trim() || manga.id;
    const description = $("span.font-medium.text-sm, .synopsis, p").first().text().trim();
    const coverImage = $("img[alt*='poster'], img[alt*='cover'], .w-full.rounded-md img").first().attr("src");

    const genres: string[] = [];
    $("button, .badge, a[href*='/genres/']").each((_, el) => {
      const g = $(el).text().trim();
      if (g && g.length < 25 && !genres.includes(g)) genres.push(g);
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
    const html = await this.fetchHtml(url, {
      headers: { Referer: `${this.baseUrl}/` },
    });
    const $ = cheerio.load(html);
    const chapters: NormalizedChapter[] = [];

    $("a[href*='/chapter/'], a[href*='/series/']").each((_, element) => {
      const $link = $(element);
      const href = $link.attr("href") || "";
      if (!href.includes("chapter")) return;

      const chMatch = href.match(/\/chapter\/([a-zA-Z0-9_-]+)/) || href.match(/\/series\/[^/]+\/([a-zA-Z0-9_-]+)/);
      const chId = chMatch ? chMatch[1] : href;
      const text = $link.text().trim();
      const numStr = this.extractChapterNumber(text);

      if (!chapters.some((c) => c.id === chId)) {
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
      }
    });

    return chapters;
  }

  async getPages(chapter: ProviderReference): Promise<ChapterPage[]> {
    const url = chapter.url?.startsWith("http")
      ? chapter.url
      : `${this.baseUrl}/series/${chapter.id}`;
    const html = await this.fetchHtml(url, {
      headers: { Referer: `${this.baseUrl}/` },
    });
    const $ = cheerio.load(html);
    const pages: ChapterPage[] = [];

    $("img").each((idx, el) => {
      const src = $(el).attr("src") || $(el).attr("data-src");
      if (src && (src.includes("asuracomic") || src.includes(".webp") || src.includes(".jpg") || src.includes(".png"))) {
        if (!src.includes("logo") && !src.includes("icon") && !src.includes("badge")) {
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
      }
    });

    return pages;
  }
}
