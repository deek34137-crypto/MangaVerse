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

export class MangaKatanaAdapter extends BaseAdapter {
  readonly id = "mangakatana";
  readonly name = "MangaKatana";
  readonly baseUrl = "https://mangakatana.com";
  readonly tier: ProviderTier = 1;

  readonly capabilities: ProviderCapabilities = {
    search: true,
    mangaDetail: true,
    chapters: true,
    pages: true,
  };

  readonly networkPolicy: ProviderNetworkPolicy = {
    allowedHosts: ["mangakatana.com", "www.mangakatana.com"],
    allowedHostSuffixes: [
      "mangakatana.com",
      "tenmanga.com",
      "img.mangakatana.com",
      "static.mangakatana.com",
    ],
  };

  async search(query: string, options?: { limit?: number }): Promise<NormalizedSearchResult[]> {
    const searchUrl = `${this.baseUrl}/?search=${encodeURIComponent(query)}&search_by=book_name`;
    const html = await this.fetchHtml(searchUrl);
    const $ = cheerio.load(html);
    const results: NormalizedSearchResult[] = [];
    const max = options?.limit || 24;

    $("#book_list .item").each((_, element) => {
      if (results.length >= max) return;
      const $item = $(element);
      const $titleLink = $item.find("h3.title a").first();
      const title = $titleLink.text().trim();
      const url = $titleLink.attr("href");

      if (!title || !url) return;

      const urlMatch = url.match(/\/manga\/([^/]+)/);
      const id = urlMatch ? urlMatch[1] : "";
      if (!id) return;

      const coverImage = $item.find(".wrap_img img").first().attr("src");
      const latestChapterText = $item.find("h3.title span, .chapter a").first().text().trim();

      results.push({
        id,
        title,
        url: url.startsWith("http") ? url : `${this.baseUrl}${url}`,
        coverImage: coverImage || undefined,
        latestChapter: latestChapterText ? this.extractChapterNumber(latestChapterText) : undefined,
        provider: this.id,
      });
    });

    return results;
  }

  async getMangaDetail(manga: ProviderReference): Promise<NormalizedManga> {
    const url = manga.url || `${this.baseUrl}/manga/${manga.id}`;
    const html = await this.fetchHtml(url);
    const $ = cheerio.load(html);

    const title = $("h1.heading").first().text().trim() || $("title").text().split(" | ")[0].trim();
    const description = $(".summary p").text().trim();
    const coverImage = $(".cover img").first().attr("src");

    const genres: string[] = [];
    $(".genres a").each((_, el) => {
      const g = $(el).text().trim();
      if (g) genres.push(g);
    });

    const authors: string[] = [];
    $(".author a").each((_, el) => {
      const a = $(el).text().trim();
      if (a) authors.push(a);
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
    const url = manga.url || `${this.baseUrl}/manga/${manga.id}`;
    const html = await this.fetchHtml(url);
    const $ = cheerio.load(html);
    const chapters: NormalizedChapter[] = [];

    $(".chapters table tbody tr, .chapters .chapter").each((_, element) => {
      const $row = $(element);
      const $chapterLink = $row.find("a").first();
      const href = $chapterLink.attr("href");
      const chapterText = $chapterLink.text().trim();

      if (!href || !chapterText) return;

      const numStr = this.extractChapterNumber(chapterText);
      const chMatch = href.match(/\/manga\/[^/]+\/([a-zA-Z0-9_-]+)/);
      const chId = chMatch ? chMatch[1] : href.replace(/.*\/c/, "c");

      chapters.push({
        id: chId,
        number: numStr,
        numberValue: this.parseNumericChapter(numStr),
        title: chapterText,
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
    const pages: ChapterPage[] = [];

    // MangaKatana embeds image URLs in `thzq = [...]` array inside <script>
    const scriptMatch = html.match(/var\s+thzq\s*=\s*(\[[^\]]+\])/);
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
      } catch {
        // Fallback to cheerio selector
      }
    }

    if (pages.length === 0) {
      const $ = cheerio.load(html);
      $("#imgs .wrap_img img, .uk-slideshow-items img, img").each((idx, el) => {
        const src = $(el).attr("src") || $(el).attr("data-src");
        if (src && (src.includes("/media/") || src.includes(".jpg") || src.includes(".png") || src.includes(".webp"))) {
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
