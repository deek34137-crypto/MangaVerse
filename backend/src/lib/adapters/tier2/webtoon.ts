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

export class WebtoonAdapter extends BaseAdapter {
  readonly id = "webtoon";
  readonly name = "WEBTOON";
  readonly baseUrl = "https://www.webtoons.com";
  readonly tier: ProviderTier = 2;

  readonly capabilities: ProviderCapabilities = {
    search: true,
    mangaDetail: true,
    chapters: true,
    pages: true,
  };

  readonly networkPolicy: ProviderNetworkPolicy = {
    allowedHosts: ["www.webtoons.com", "webtoons.com", "webtoon-phinf.pstatic.net"],
    allowedHostSuffixes: ["webtoons.com", "pstatic.net"],
  };

  async search(query: string, options?: { limit?: number }): Promise<NormalizedSearchResult[]> {
    const searchUrl = `${this.baseUrl}/en/search?keyword=${encodeURIComponent(query)}`;
    const html = await this.fetchHtml(searchUrl);
    const $ = cheerio.load(html);
    const results: NormalizedSearchResult[] = [];
    const max = options?.limit || 24;

    $("ul.card_lst li a, .challenge_lst li a").each((_, element) => {
      if (results.length >= max) return;
      const $link = $(element);
      const href = $link.attr("href") || "";
      const titleNoMatch = href.match(/title_no=(\d+)/);
      if (!titleNoMatch) return;

      const id = titleNoMatch[1];
      const title = $link.find(".subj, .info .title").text().trim();
      const coverImg = $link.find("img").attr("src");

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
    const url = manga.url || `${this.baseUrl}/en/fantasy/title/list?title_no=${manga.id}`;
    const html = await this.fetchHtml(url);
    const $ = cheerio.load(html);

    const title = $("h1.subj").text().trim() || manga.id;
    const description = $("p.summary").text().trim();
    const coverImg = $(".detail_header img, .thmb img").attr("src");
    const genre = $("h2.genre").text().trim();

    return {
      id: manga.id,
      title,
      altTitles: [],
      description,
      coverImage: coverImg || undefined,
      status: "ongoing",
      genres: genre ? [genre] : [],
      authors: [],
      artists: [],
      provider: this.id,
      url,
    };
  }

  async getChapters(manga: ProviderReference): Promise<NormalizedChapter[]> {
    const url = manga.url || `${this.baseUrl}/en/fantasy/title/list?title_no=${manga.id}`;
    const html = await this.fetchHtml(url);
    const $ = cheerio.load(html);
    const chapters: NormalizedChapter[] = [];

    $("#_listUl li a, .detail_lst li a").each((_, element) => {
      const $link = $(element);
      const href = $link.attr("href") || "";
      const episodeMatch = href.match(/episode_no=(\d+)/);
      if (!episodeMatch) return;

      const chId = episodeMatch[1];
      const text = $link.find(".subj span").text().trim() || $link.text().trim();
      const numStr = this.extractChapterNumber(text) || chId;

      chapters.push({
        id: chId,
        number: numStr,
        numberValue: this.parseNumericChapter(numStr),
        title: text || `Episode ${numStr}`,
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
      : `${this.baseUrl}/en/viewer?title_no=${chapter.id}`;
    const html = await this.fetchHtml(url);
    const $ = cheerio.load(html);
    const pages: ChapterPage[] = [];

    $("#_imageList img, .viewer_img img").each((idx, el) => {
      const src = $(el).attr("data-url") || $(el).attr("src");
      if (src) {
        pages.push({
          index: idx + 1,
          url: src,
          headers: {
            referer: "https://www.webtoons.com/",
            origin: "https://www.webtoons.com",
          },
          provider: this.id,
        });
      }
    });

    return pages;
  }
}
