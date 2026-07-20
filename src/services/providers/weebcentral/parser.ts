import * as cheerio from "cheerio";
import { SELECTORS } from "./selectors";
import { BASE_URL } from "./constants";
import { ParsingFailure } from "../transport";

export interface RawParsedSearchItem {
  id: string;
  slug: string;
  title: string;
  coverUrl: string;
  type: string;
  status: string;
  releasedYear?: number;
  authors: string[];
  genres: string[];
}

export interface RawParsedDetail {
  title: string;
  coverUrl: string;
  altTitles: string[];
  authors: string[];
  artists: string[];
  type: string;
  status: string;
  releasedYear?: number;
  description: string;
  genres: string[];
}

export interface RawParsedChapterItem {
  id: string;
  number: number | null;
  title?: string;
  publishedAt?: string;
  scanlatorGroups: string[];
}

export class WeebCentralParser {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private static extractImgUrl(img: cheerio.Cheerio<any>): string {
    const src = img.attr("src") || 
                img.attr("data-src") || 
                img.attr("data-lazy") || 
                img.attr("data-original") || 
                "";
    const cleaned = src.trim();
    if (cleaned && cleaned.startsWith("/")) {
      return `${BASE_URL}${cleaned}`;
    }
    return cleaned;
  }

  public parseSearch(html: string): RawParsedSearchItem[] {
    const $ = cheerio.load(html);
    const results: RawParsedSearchItem[] = [];

    const cards = $(SELECTORS.searchCard);
    cards.each((_, el) => {
      const card = $(el);

      // Extract Link & ID/Slug
      const anchor = card.find(SELECTORS.searchLink).first();
      const href = anchor.attr("href") || "";
      const match = href.match(/\/series\/([^/]+)\/([^"]+)/);
      if (!match) return; // Skip if no valid series link

      const id = match[1];
      const slug = match[2];

      // Extract Title
      const titleLink = card.find("a[href*='/series/'].link").first();
      const title = titleLink.text().trim() || "Unknown Title";

      // Extract Cover
      const img = card.find("img").filter((_, imgEl) => {
        const alt = $(imgEl).attr("alt") || "";
        const src = $(imgEl).attr("src") || "";
        return alt.toLowerCase().includes("cover") || src.includes("/cover/");
      }).first();
      const coverUrl = WeebCentralParser.extractImgUrl(img);

      // Extract metadata fields from the card's inner text
      const innerText = card.text().replace(/\s+/g, ' ');
      
      let status = "ongoing";
      const statusMatch = innerText.match(/Status:\s*(\w+)/i);
      if (statusMatch) {
        status = statusMatch[1].toLowerCase();
      }

      let type = "manga";
      const typeMatch = innerText.match(/Type:\s*(\w+)/i);
      if (typeMatch) {
        type = typeMatch[1].toLowerCase();
      }

      let releasedYear: number | undefined = undefined;
      const yearMatch = innerText.match(/Year:\s*(\d{4})/i);
      if (yearMatch) {
        releasedYear = parseInt(yearMatch[1], 10);
      }

      // Authors
      const authors: string[] = [];
      const authorMatch = innerText.match(/Author\(s\):\s*([^T]+)/i); // Extract text until "Tag(s):" or end
      if (authorMatch) {
        // Clean and split by comma
        const rawAuthors = authorMatch[1].split("Tag(s):")[0].trim();
        rawAuthors.split(",").forEach(a => {
          const cleanName = a.trim();
          if (cleanName) authors.push(cleanName);
        });
      }

      // Genres/Tags
      const genres: string[] = [];
      const tagMatch = innerText.match(/Tag\(s\):\s*(.+)/i);
      if (tagMatch) {
        const rawTags = tagMatch[1].trim();
        rawTags.split(",").forEach(t => {
          const cleanTag = t.trim();
          if (cleanTag) genres.push(cleanTag);
        });
      }

      results.push({
        id,
        slug,
        title,
        coverUrl,
        type,
        status,
        releasedYear,
        authors,
        genres,
      });
    });

    return results;
  }

  public parseDetail(html: string): RawParsedDetail {
    const $ = cheerio.load(html);

    const title = $(SELECTORS.detailTitle).first().text().trim();
    if (!title) {
      throw new ParsingFailure("WeebCentral", "Failed to parse title from series page (title selector returned empty)");
    }

    let coverUrl = "";
    $("img").each((_, el) => {
      const alt = $(el).attr("alt") || "";
      const src = WeebCentralParser.extractImgUrl($(el));
      if (alt.toLowerCase().includes("cover") && src.includes("/cover/")) {
        coverUrl = src;
        return false;
      }
    });

    let type = "manga";
    let status = "ongoing";
    let releasedYear: number | undefined = undefined;
    const authors: string[] = [];
    const artists: string[] = [];
    const genres: string[] = [];
    const altTitles: string[] = [];
    let description = "";

    $(SELECTORS.metadataItem).each((_, el) => {
      const item = $(el);
      const labelText = item.find(SELECTORS.metadataLabel).text().trim().toLowerCase();

      if (labelText.startsWith("author(s):")) {
        item.find(SELECTORS.metadataAuthorLink).each((_, a) => {
          const name = $(a).text().trim();
          if (name) authors.push(name);
        });
      } else if (labelText.startsWith("artist(s):")) {
        item.find(SELECTORS.metadataAuthorLink).each((_, a) => {
          const name = $(a).text().trim();
          if (name) artists.push(name);
        });
      } else if (labelText.startsWith("type:")) {
        type = item.text().replace(/type:/i, "").trim().toLowerCase();
      } else if (labelText.startsWith("status:")) {
        status = item.text().replace(/status:/i, "").trim().toLowerCase();
      } else if (labelText.startsWith("released:")) {
        const yr = parseInt(item.text().replace(/released:/i, "").trim(), 10);
        if (!isNaN(yr)) releasedYear = yr;
      } else if (labelText.startsWith("tags(s):")) {
        item.find(SELECTORS.metadataTagLink).each((_, a) => {
          const genreName = $(a).text().trim();
          if (genreName) genres.push(genreName);
        });
      } else if (labelText.startsWith("associated name(s)")) {
        item.find(SELECTORS.metadataAltTitlesList).each((_, li) => {
          const altName = $(li).text().trim();
          if (altName) altTitles.push(altName);
        });
      } else if (labelText === "description") {
        description = item.find("p").text().trim();
      }
    });

    return {
      title,
      coverUrl,
      altTitles,
      authors,
      artists,
      type,
      status,
      releasedYear,
      description,
      genres,
    };
  }

  public parseChapters(html: string): RawParsedChapterItem[] {
    const $ = cheerio.load(html);
    const results: RawParsedChapterItem[] = [];

    const anchors = $(SELECTORS.chapterLink);
    anchors.each((_, el) => {
      const anchor = $(el);
      const href = anchor.attr("href") || "";
      const match = href.match(/\/chapters\/([^/]+)/);
      if (!match) return; // Skip if invalid chapter link

      const id = match[1];

      // Extract chapter number from text, e.g. "Chapter 1188"
      const anchorText = anchor.text().replace(/\s+/g, ' ');
      const chNumMatch = anchorText.match(/Chapter\s+([0-9.]+)/i);
      const number = chNumMatch ? parseFloat(chNumMatch[1]) : null;

      // Extract datetime attribute
      const timeTag = anchor.find(SELECTORS.chapterDate);
      const publishedAt = timeTag.attr("datetime") || undefined;

      results.push({
        id,
        number,
        publishedAt,
        scanlatorGroups: [], // WeebCentral compiles scanlations without detailing individual groups on the listing
      });
    });

    return results;
  }

  public parsePages(html: string): string[] {
    const $ = cheerio.load(html);
    const pages: string[] = [];

    const imgs = $(SELECTORS.pageImage);
    imgs.each((_, el) => {
      const img = $(el);
      const src = WeebCentralParser.extractImgUrl(img);
      
      // WeebCentral uses a branding logo and a broken placeholder image. We exclude those!
      if (src && 
          !src.includes("brand.png") && 
          !src.includes("logo") && 
          !src.includes("broken_image") &&
          !src.includes("400.png")) {
        pages.push(src);
      }
    });

    return pages;
  }
}
