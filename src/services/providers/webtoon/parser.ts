import * as cheerio from "cheerio";
import { SELECTORS } from "./selectors";
import { ParsingFailure } from "../transport";

// ---------------------------------------------------------------------------
// Raw parsed shapes — preserve more data than strictly needed today.
// This prevents future HTML changes from requiring another full parse pass.
// ---------------------------------------------------------------------------

export interface RawParsedWebtoonSearchItem {
  titleNo: string;
  /** Full canonical URL from href — use this to derive genre/slug. */
  canonicalUrl: string;
  title: string;
  author: string;
  coverUrl: string;
}

export interface RawParsedWebtoonDetail {
  title: string;
  genre: string;
  coverUrl: string;
  bannerUrl: string;
  author: string;
  description: string;
}

export interface RawParsedWebtoonEpisode {
  episodeNo: string;
  /** Full viewer URL — stored as-is, never reconstructed. */
  viewerUrl: string;
  displayTitle: string;
  dateText: string;
  thumbnailUrl: string;
  /** All data-* and other attributes on the episode item — future-proofing. */
  rawAttributes: Record<string, string>;
}

// ---------------------------------------------------------------------------
// Parser
// ---------------------------------------------------------------------------

export class WebtoonParser {
  /**
   * Parse the WEBTOON search results page.
   * Throws ProviderParseError if no cards are found (likely selector change).
   */
  public parseSearch(html: string): RawParsedWebtoonSearchItem[] {
    const $ = cheerio.load(html);
    const results: RawParsedWebtoonSearchItem[] = [];

    const cards = $(SELECTORS.SEARCH.card);

    // Selector returning 0 results might mean a site layout change — warn but don't throw,
    // since empty search results are a valid response for a query.
    cards.each((_, el) => {
      const card = $(el);

      const canonicalUrl = card.attr("href") ?? "";
      const titleNo = card.attr("data-title-no") ?? "";
      if (!titleNo || !canonicalUrl) return;

      const title  = card.find(SELECTORS.SEARCH.title).first().text().trim();
      const author = card.find(SELECTORS.SEARCH.author).first().text().trim();
      const coverUrl = card.find(SELECTORS.SEARCH.cover).first().attr("src") ?? "";

      results.push({ titleNo, canonicalUrl, title, author, coverUrl });
    });

    return results;
  }

  /**
   * Parse the series detail/episode-list page.
   * Throws ProviderParseError if the title selector yields nothing.
   */
  public parseDetail(html: string): RawParsedWebtoonDetail {
    const $ = cheerio.load(html);

    const title = $(SELECTORS.DETAIL.title).first().text().trim();
    if (!title) {
      throw new ParsingFailure(
        "WEBTOON",
        "Failed to parse title from detail page — selector may have changed"
      );
    }

    const genre       = $(SELECTORS.DETAIL.genre).first().text().trim();
    const coverUrl    = $(SELECTORS.DETAIL.cover).first().attr("src") ?? "";
    const author      = $(SELECTORS.DETAIL.author).first().text().trim().replace(/\s+/g, " ");
    const description = $(SELECTORS.DETAIL.description).first().text().trim();

    // Banner URL is embedded in inline style: background:url('...')
    const bannerStyle = $(SELECTORS.DETAIL.bannerBg).first().attr("style") ?? "";
    const bannerMatch = bannerStyle.match(/url\(['"]?([^'")\s]+)['"]?\)/);
    const bannerUrl   = bannerMatch ? bannerMatch[1] : "";

    return { title, genre, coverUrl, bannerUrl, author, description };
  }

  /**
   * Parse one page of the episode list.
   * Returns the episodes found and a count (0 = terminate pagination).
   * Termination is count-based, not pg_next-based, because some sites
   * leave the next-page button visible but disabled.
   */
  public parseEpisodesFromPage(html: string): {
    episodes: RawParsedWebtoonEpisode[];
    count: number;
  } {
    const $ = cheerio.load(html);
    const episodes: RawParsedWebtoonEpisode[] = [];

    $(SELECTORS.EPISODES.list)
      .find(SELECTORS.EPISODES.item)
      .each((_, el) => {
        const item = $(el);

        // Collect all attributes for future-proofing.
        // cheerio elements carry attribs from domhandler; access via any to avoid
        // version-specific type imports.
        const rawAttributes: Record<string, string> = {};
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const attribs = (el as any).attribs;
        if (attribs && typeof attribs === "object") {
          for (const [key, val] of Object.entries(attribs)) {
            if (typeof val === "string") rawAttributes[key] = val;
          }
        }

        const episodeNo = item.attr("data-episode-no") ?? "";
        if (!episodeNo) return;

        const anchor       = item.find(SELECTORS.EPISODES.link).first();
        const viewerUrl    = anchor.attr("href") ?? "";
        const displayTitle = anchor.find(SELECTORS.EPISODES.subjectInner).first().text().trim();
        const dateText     = anchor.find(SELECTORS.EPISODES.date).first().text().trim();
        const thumbnailUrl = anchor.find(SELECTORS.EPISODES.thumbnail).first().attr("src") ?? "";

        episodes.push({
          episodeNo,
          viewerUrl,
          displayTitle,
          dateText,
          thumbnailUrl,
          rawAttributes,
        });
      });

    return { episodes, count: episodes.length };
  }

  /**
   * Parse the episode viewer page.
   * Extracts image URLs from data-url (NOT src, which is a placeholder).
   * Throws ProviderParseError if no images are found.
   */
  public parsePages(html: string): string[] {
    const $ = cheerio.load(html);
    const pages: string[] = [];

    const container = $(SELECTORS.VIEWER.container);
    if (!container.length) {
      throw new ParsingFailure(
        "WEBTOON",
        "Episode viewer image container not found — selector may have changed"
      );
    }

    container.find(SELECTORS.VIEWER.image).each((_, el) => {
      // WEBTOON lazy-loads: src is bg_transparency.png; real URL is data-url
      const dataUrl = $(el).attr("data-url") ?? "";
      if (dataUrl && !dataUrl.includes("bg_transparency.png")) {
        pages.push(dataUrl);
      }
    });

    if (!pages.length) {
      throw new ParsingFailure(
        "WEBTOON",
        "No episode images parsed from viewer — data-url attributes may have changed"
      );
    }

    return pages;
  }
}
