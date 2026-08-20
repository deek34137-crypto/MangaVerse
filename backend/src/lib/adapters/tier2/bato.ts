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

export class BatoAdapter extends BaseAdapter {
  readonly id = "bato";
  readonly name = "Bato";
  readonly baseUrl = "https://bato.to";
  readonly tier: ProviderTier = 2;

  readonly capabilities: ProviderCapabilities = {
    search: true,
    mangaDetail: true,
    chapters: true,
    pages: true,
  };

  readonly networkPolicy: ProviderNetworkPolicy = {
    allowedHosts: ["bato.to", "www.bato.to", "battwo.com"],
    allowedHostSuffixes: ["bato.to", "battwo.com", "batcache.com"],
  };

  async search(query: string, options?: { limit?: number }): Promise<NormalizedSearchResult[]> {
    const searchUrl = `${this.baseUrl}/v3x-search?word=${encodeURIComponent(query)}`;
    const html = await this.fetchHtml(searchUrl);
    const $ = cheerio.load(html);
    const results: NormalizedSearchResult[] = [];
    const max = options?.limit || 24;

    $("#series-list .item, .line-b").each((_, element) => {
      if (results.length >= max) return;
      const $el = $(element);
      const $link = $el.find("a.item-title, a[href*='/series/'], a[href*='/title/']").first();
      const href = $link.attr("href") || "";
      const match = href.match(/\/(?:series|title)\/([a-zA-Z0-9_-]+)/);
      if (!match) return;

      const id = match[1];
      const title = $link.text().trim();
      const coverImg = $el.find("img").first().attr("src");

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
    const url = manga.url || `${this.baseUrl}/series/${manga.id}`;
    const html = await this.fetchHtml(url);
    const $ = cheerio.load(html);

    const title = $("h3.item-title, h1").text().trim() || manga.id;
    const description = $(".limit-html, .summary").text().trim();
    const coverImg = $(".attr-cover img, .item-cover img").attr("src");

    const genres: string[] = [];
    $(".genres span, .genres a").each((_, el) => {
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
    const url = manga.url || `${this.baseUrl}/series/${manga.id}`;
    const html = await this.fetchHtml(url);
    const $ = cheerio.load(html);
    const chapters: NormalizedChapter[] = [];

    $(".main .item a.visited, .episode-list a").each((_, element) => {
      const $link = $(element);
      const href = $link.attr("href") || "";
      if (!href.includes("/chapter/")) return;

      const match = href.match(/\/chapter\/([a-zA-Z0-9_-]+)/);
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
    const pages: ChapterPage[] = [];

    // Check embedded crypto/JSON or img list
    const scriptMatch = html.match(/const\s+imgHttps\s*=\s*(\[[^\]]+\])/);
    if (scriptMatch) {
      try {
        const rawUrls: string[] = JSON.parse(scriptMatch[1]);
        rawUrls.forEach((imgUrl, idx) => {
          pages.push({
            index: idx + 1,
            url: imgUrl,
            headers: {
              referer: `${this.baseUrl}/`,
              origin: this.baseUrl,
            },
            provider: this.id,
          });
        });
      } catch {}
    }

    if (pages.length === 0) {
      const $ = cheerio.load(html);
      $(".page-img, img.page-img, .image-container img").each((idx, el) => {
        const src = $(el).attr("src") || $(el).attr("data-src");
        if (src) {
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
    }

    return pages;
  }
}
