import * as cheerio from "cheerio";
import { SELECTORS } from "./selectors";
import { BASE_URL } from "./constants";
import { ParsingFailure } from "../transport";

export interface RawParsedMangaKatanaSearch {
  id: string;
  title: string;
  coverUrl: string;
}

export interface RawParsedMangaKatanaDetail {
  title: string;
  coverUrl: string;
  description: string;
  genres: string[];
  status: string;
  authors: string[];
}

export interface RawParsedMangaKatanaChapter {
  id: string; // The relative path, e.g. manga/one-piece.49/c1188
  number: number | null;
  title: string;
  url: string; // Normalised absolute URL
  publishedAt?: Date;
}

export class MangaKatanaParser {
  private static normalizeUrl(href: string): string {
    const cleaned = href.trim();
    if (!cleaned) return "";
    try {
      return new URL(cleaned, BASE_URL).href;
    } catch {
      return cleaned;
    }
  }

  public parseSearch(html: string): RawParsedMangaKatanaSearch[] {
    const $ = cheerio.load(html);
    const results: RawParsedMangaKatanaSearch[] = [];

    const cards = $(SELECTORS.searchCard);
    cards.each((_, el) => {
      const card = $(el);
      const anchor = card.find(SELECTORS.searchLink).first();
      const href = anchor.attr("href") || "";
      const mangaId = href.split("/").pop();
      if (!mangaId) return;

      const title = anchor.text().trim();
      const img = card.find(SELECTORS.searchCover).first();
      const rawSrc = img.attr("src") || img.attr("data-src") || "";
      const coverUrl = MangaKatanaParser.normalizeUrl(rawSrc);

      results.push({
        id: mangaId,
        title,
        coverUrl,
      });
    });

    if (results.length === 0 && html.includes("Search result")) {
      throw new ParsingFailure("MangaKatana", "Search parser failed to return any items");
    }

    return results;
  }

  public parseDetail(html: string): RawParsedMangaKatanaDetail {
    const $ = cheerio.load(html);
    const title = $(SELECTORS.detailTitle).first().text().trim();
    if (!title) {
      throw new ParsingFailure("MangaKatana", "Title not found on series page");
    }

    const img = $(SELECTORS.detailCover).first();
    const rawSrc = img.attr("src") || img.attr("data-src") || "";
    const coverUrl = MangaKatanaParser.normalizeUrl(rawSrc);
    
    let status = "ongoing";
    const genres: string[] = [];
    const authors: string[] = [];
    
    // Parse metadata rows robustly by checking label
    $(SELECTORS.metadataMetaRow).each((_, el) => {
      const row = $(el);
      const label = row.find(".label").text().trim().toLowerCase();
      const value = row.find(".value").text().trim();

      if (label.includes("status")) {
        status = value.toLowerCase();
      }
    });

    $(SELECTORS.genresLink).each((_, el) => {
      const g = $(el).text().trim();
      if (g) genres.push(g);
    });

    $(SELECTORS.authorsLink).each((_, el) => {
      const a = $(el).text().trim();
      if (a) authors.push(a);
    });

    const description = $(SELECTORS.descriptionText).text().trim();

    return {
      title,
      coverUrl,
      description,
      genres,
      status,
      authors,
    };
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  public parseChapters(html: string, _mangaId: string): RawParsedMangaKatanaChapter[] {
    const $ = cheerio.load(html);
    const results: RawParsedMangaKatanaChapter[] = [];

    // Parse chapters listed inside the flat grid layout
    $(".chapters .chapter").each((_, el) => {
      const chapterDiv = $(el);
      const anchor = chapterDiv.find("a").first();
      const href = anchor.attr("href") || "";
      // Strip domain and leading slash to use relative path as ID (e.g. manga/one-piece.49/c1188)
      const chapterId = href.replace(BASE_URL, "").replace(/^\//, "");
      if (!chapterId) return;

      const title = anchor.text().trim();
      const numMatch = title.match(/Chapter\s+([0-9.]+)/i);
      const number = numMatch ? parseFloat(numMatch[1]) : null;

      // Extract date from sibling element in grid or table layout
      const parent = chapterDiv.parent();
      const nextSibling = parent.next();
      const dateText = nextSibling.find(".update_time").text().trim();
      
      let publishedAt: Date | undefined = undefined;
      if (dateText) {
        const parsedDate = new Date(dateText);
        if (!isNaN(parsedDate.getTime())) {
          publishedAt = parsedDate;
        }
      }

      results.push({
        id: chapterId,
        number,
        title,
        url: MangaKatanaParser.normalizeUrl(href),
        publishedAt,
      });
    });

    if (results.length === 0) {
      throw new ParsingFailure("MangaKatana", "Chapters parser returned 0 items on series detail page");
    }

    return results;
  }

  public parsePages(html: string): string[] {
    const $ = cheerio.load(html);
    let allUrls: string[] = [];

    // Robust extraction: searches for javascript arrays holding cdn urls
    $("script").each((_, el) => {
      const content = $(el).html() || "";
      if (content.includes("mangakatana.com/token/") || content.includes(".jpg")) {
        const matches = content.matchAll(/var\s+(\w+)\s*=\s*\[(.*?)\]\s*;/g);
        for (const m of matches) {
          const arrayContent = m[2];
          const items = arrayContent.split(",").map(i => i.replace(/['"\s]/g, ""));
          const urls = items.filter(i => i.startsWith("http") && i.includes("mangakatana.com"));
          if (urls.length > allUrls.length) {
            allUrls = urls;
          }
        }
      }
    });

    if (allUrls.length === 0) {
      throw new ParsingFailure("MangaKatana", "Failed to locate page image array in chapter script tags");
    }

    return allUrls;
  }
}
