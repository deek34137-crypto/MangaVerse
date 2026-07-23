import * as cheerio from "cheerio";
import { SELECTORS } from "./selectors";
import { MANGATOWN_CONSTANTS } from "./constants";
import { ParserError } from "../shared/errors";
import { RawProviderManga, RawProviderChapter, RawProviderPage } from "../shared/types";
import {
  checkAntiBotSignatures,
  resolveAbsoluteUrl,
  cleanText,
  parseMangaStatus,
  parseRelativeDate,
  parseNumber,
} from "../shared/html";

export function checkAntiBotChallenge(html: string): void {
  checkAntiBotSignatures(
    html,
    MANGATOWN_CONSTANTS.DISPLAY_NAME,
    MANGATOWN_CONSTANTS.ANTI_BOT_SIGNATURES
  );
}

export function parseSearchHtmlResponse(html: string): RawProviderManga[] {
  checkAntiBotChallenge(html);
  const $ = cheerio.load(html);
  const results: RawProviderManga[] = [];

  $(SELECTORS.SEARCH.CARD).each((_, element) => {
    const card = $(element);
    const titleLink = card.find(SELECTORS.SEARCH.TITLE).first();
    const title = titleLink.attr("title") || cleanText(titleLink);
    const href = titleLink.attr("href") || "";

    const imgEl = card.find(SELECTORS.SEARCH.COVER).first();
    const coverUrl = imgEl.attr("src") || imgEl.attr("data-src") || "";

    if (!title || !href) return;

    const slugMatch = href.match(/\/manga\/([^/?#]+)/i);
    const providerId = slugMatch ? slugMatch[1] : href.replace(/^\/manga\//, "").replace(/\/$/, "");

    results.push({
      id: providerId,
      title,
      coverImage: resolveAbsoluteUrl(coverUrl, MANGATOWN_CONSTANTS.BASE_URL),
    });
  });

  return results;
}

export function parseDetailResponse(html: string, providerMangaId: string): RawProviderManga {
  checkAntiBotChallenge(html);
  const $ = cheerio.load(html);

  const title = cleanText($(SELECTORS.DETAIL.TITLE).first());
  if (!title || title === "404" || title.toLowerCase().includes("not found")) {
    throw new ParserError(
      MANGATOWN_CONSTANTS.DISPLAY_NAME,
      "title",
      `Failed to parse detail title for ID "${providerMangaId}". Page returned empty/404.`
    );
  }

  const description = cleanText($(SELECTORS.DETAIL.DESCRIPTION).first());
  const coverImg = $(SELECTORS.DETAIL.COVER).first();
  const coverUrl = coverImg.attr("src") || coverImg.attr("data-src") || "";
  const author = cleanText($(SELECTORS.DETAIL.AUTHOR).first());
  const rawStatus = cleanText($(SELECTORS.DETAIL.STATUS));

  const genres: string[] = [];
  $(SELECTORS.DETAIL.GENRES).each((_, tag) => {
    const text = cleanText($(tag));
    if (text) genres.push(text);
  });

  return {
    id: providerMangaId,
    title,
    description: description || undefined,
    coverImage: resolveAbsoluteUrl(coverUrl, MANGATOWN_CONSTANTS.BASE_URL),
    authors: author ? [author] : [],
    genres,
    status: parseMangaStatus(rawStatus),
  };
}

export function parseChapterList(html: string, providerMangaId: string): RawProviderChapter[] {
  checkAntiBotChallenge(html);
  const $ = cheerio.load(html);
  const chapters: RawProviderChapter[] = [];

  const chapterAnchors = $(SELECTORS.DETAIL.CHAPTER_LIST);

  chapterAnchors.each((index, element) => {
    const a = $(element);
    const rawText = cleanText(a);
    const href = a.attr("href") || "";
    if (!href || !href.includes("/manga/")) return;

    // Format: /manga/one_piece/v01/c001/ or /manga/one_piece/c001/1.html
    const relMatch = href.match(/\/manga\/(.+)$/i);
    const chapterId = relMatch ? relMatch[1].replace(/\/$/, "") : href.replace(/^\/manga\//, "").replace(/\/$/, "");

    const parsedNum = parseNumber(rawText) ?? (index + 1);

    const spanDate = cleanText(a.parent().find(SELECTORS.DETAIL.CHAPTER_DATE));
    const publishedAt = parseRelativeDate(spanDate) ?? undefined;

    chapters.push({
      id: chapterId,
      number: parsedNum,
      title: rawText || `Chapter ${parsedNum}`,
      language: "en",
      publishedAt,
    });
  });

  return chapters;
}

export function parsePageList(html: string, providerChapterId: string): RawProviderPage[] {
  checkAntiBotChallenge(html);
  const $ = cheerio.load(html);
  const pages: RawProviderPage[] = [];

  // Extract total_pages variable from script
  let totalPages = 0;
  $("script").each((_, script) => {
    const text = $(script).text();
    const match = text.match(/total_pages\s*=\s*(\d+)/i) || text.match(/var\s+total_pages\s*=\s*(\d+)/i);
    if (match) {
      totalPages = parseInt(match[1], 10);
    }
  });

  const imgEl = $(SELECTORS.READER.PAGE_IMAGE).first();
  const baseImgUrl = imgEl.attr("src") || "";

  if (baseImgUrl && totalPages > 0) {
    // Determine base pattern for sequential page image URLs
    // MangaTown image URLs typically end with .../1.jpg or .../001.jpg
    const extMatch = baseImgUrl.match(/(\d+)\.(jpg|png|webp|gif)(\?.*)?$/i);
    for (let i = 1; i <= totalPages; i++) {
      let pageUrl = baseImgUrl;
      if (extMatch) {
        const numStr = extMatch[1];
        const ext = extMatch[2];
        const query = extMatch[3] || "";
        const paddedNum = i.toString().padStart(numStr.length, "0");
        pageUrl = baseImgUrl.replace(/(\d+)\.(jpg|png|webp|gif)(\?.*)?$/i, `${paddedNum}.${ext}${query}`);
      } else if (i > 1) {
        // Append query index as distinct fallback URL
        pageUrl = `${baseImgUrl}?page=${i}`;
      }

      pages.push({
        number: i,
        url: resolveAbsoluteUrl(pageUrl, MANGATOWN_CONSTANTS.BASE_URL),
      });
    }
  } else if (baseImgUrl) {
    pages.push({
      number: 1,
      url: resolveAbsoluteUrl(baseImgUrl, MANGATOWN_CONSTANTS.BASE_URL),
    });
  }

  // Validate image URLs and scheme
  const validPages = pages.filter((p) => p.url && (p.url.startsWith("http://") || p.url.startsWith("https://")));

  if (validPages.length === 0) {
    throw new ParserError(
      MANGATOWN_CONSTANTS.DISPLAY_NAME,
      "page.url",
      `Failed to extract chapter pages for chapter ID "${providerChapterId}". Zero valid image elements found.`
    );
  }

  return validPages;
}
