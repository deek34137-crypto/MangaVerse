import * as cheerio from "cheerio";
import { SELECTORS } from "./selectors";
import { MANGABUDDY_CONSTANTS } from "./constants";
import { ParsingFailure } from "../shared/errors";
import { RawProviderManga, RawProviderChapter, RawProviderPage } from "../shared/types";
import { checkAntiBotSignatures } from "../shared/html/antiBot";
import { resolveAbsoluteUrl } from "../shared/html/url";

export interface MangaBuddySearchItem {
  comic_id?: number;
  title?: string;
  slug?: string;
  slug_hash?: string;
  image?: string;
}

export interface MangaBuddySearchPayload {
  comics?: MangaBuddySearchItem[];
}

export function checkAntiBotChallenge(html: string): void {
  checkAntiBotSignatures(
    html,
    MANGABUDDY_CONSTANTS.DISPLAY_NAME,
    MANGABUDDY_CONSTANTS.ANTI_BOT_SIGNATURES
  );
}

export function parseSearchJsonResponse(jsonStr: string): RawProviderManga[] {
  const results: RawProviderManga[] = [];
  try {
    const payload: MangaBuddySearchPayload = JSON.parse(jsonStr);
    if (payload.comics && Array.isArray(payload.comics)) {
      for (const item of payload.comics) {
        if (!item.title || !item.slug_hash) continue;
        const coverUrl = item.image ? resolveAbsoluteUrl(item.image, MANGABUDDY_CONSTANTS.BASE_URL) : "";
        results.push({
          id: item.slug_hash,
          title: item.title,
          coverImage: coverUrl,
        });
      }
    }
  } catch {}
  return results;
}

export function parseSearchHtmlResponse(html: string): RawProviderManga[] {
  checkAntiBotChallenge(html);
  const $ = cheerio.load(html);
  const results: RawProviderManga[] = [];

  $(SELECTORS.SEARCH.CARD).each((_, element) => {
    const card = $(element);
    const titleEl = card.find(SELECTORS.SEARCH.TITLE).first();
    const title = titleEl.text().trim();

    const linkEl = card.find(SELECTORS.SEARCH.LINK).first();
    const href = linkEl.attr("href") || card.attr("href") || "";

    const imgEl = card.find(SELECTORS.SEARCH.COVER).first();
    const coverUrl = imgEl.attr("data-src") || imgEl.attr("src") || "";

    if (!title || !href) return;

    const seriesMatch = href.match(/\/series\/([^/?#]+)/i);
    const providerId = seriesMatch ? seriesMatch[1] : href.replace(/^\/series\//, "").replace(/^\//, "");

    results.push({
      id: providerId,
      title,
      coverImage: resolveAbsoluteUrl(coverUrl, MANGABUDDY_CONSTANTS.BASE_URL),
    });
  });

  return results;
}

import { ParserError } from "../shared/errors";
import { cleanText, parseMangaStatus } from "../shared/html";

export function parseDetailResponse(html: string, providerMangaId: string): RawProviderManga {
  checkAntiBotChallenge(html);
  const $ = cheerio.load(html);

  let title = "";
  $(SELECTORS.DETAIL.TITLE).each((_, el) => {
    const candidate = cleanText($(el));
    if (
      candidate &&
      candidate !== "Status" &&
      candidate !== "Type" &&
      candidate !== "Author" &&
      candidate !== "Chapters" &&
      !title
    ) {
      title = candidate;
    }
  });

  if (!title || title === "404" || title.toLowerCase().includes("not found")) {
    throw new ParserError(
      MANGABUDDY_CONSTANTS.DISPLAY_NAME,
      "title",
      `Failed to parse detail title for ID "${providerMangaId}". Page returned empty/404.`
    );
  }

  const description = cleanText($(SELECTORS.DETAIL.DESCRIPTION));
  const coverImg = $(SELECTORS.DETAIL.COVER).first();
  const coverUrl = coverImg.attr("data-src") || coverImg.attr("src") || "";
  const author = cleanText($(SELECTORS.DETAIL.AUTHOR).first()) || "Unknown";
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
    coverImage: resolveAbsoluteUrl(coverUrl, MANGABUDDY_CONSTANTS.BASE_URL),
    authors: author && author !== "Unknown" ? [author] : [],
    genres,
    status: parseMangaStatus(rawStatus),
  };
}

export function parseChapterList(html: string, providerMangaId: string): RawProviderChapter[] {
  checkAntiBotChallenge(html);
  const $ = cheerio.load(html);
  const chapters: RawProviderChapter[] = [];

  const chapterElements = $(SELECTORS.DETAIL.CHAPTER_LIST);

  chapterElements.each((index, element) => {
    const el = $(element);
    const rawText = el.text().trim();
    const href = el.attr("href") || el.find("a").attr("href") || "";

    // Skip header hero action buttons like "Read Chapter 1"
    if (rawText.toLowerCase().startsWith("read chapter")) return;

    const chapterMatch = href.match(/chapter-([^/?#]+)/i);
    const chapterId = chapterMatch ? chapterMatch[1] : `chapter-${index + 1}`;

    const numMatch = rawText.match(/(?:ep|episode|ch|chapter)\.?\s*(\d+(?:\.\d+)?)/i) || rawText.match(/^(\d+(?:\.\d+)?)/);
    const chapterNumber = numMatch ? parseFloat(numMatch[1]) : index + 1;

    chapters.push({
      id: chapterId,
      number: isNaN(chapterNumber) ? null : chapterNumber,
      title: rawText ? rawText.split("\n")[0].trim() : `Chapter ${chapterNumber}`,
      language: "en",
    });
  });

  return chapters;
}

export function parsePageList(html: string, providerChapterId: string): RawProviderPage[] {
  checkAntiBotChallenge(html);
  const $ = cheerio.load(html);
  const pages: RawProviderPage[] = [];

  const imgElements = $(SELECTORS.READER.PAGE_IMAGE);

  imgElements.each((index, img) => {
    const el = $(img);
    const src = el.attr("data-src") || el.attr("src") || el.attr("data-original") || "";

    if (src && !src.includes(".png") && !src.includes("logo") && !src.includes("placeholder")) {
      pages.push({
        number: index + 1,
        url: resolveAbsoluteUrl(src, MANGABUDDY_CONSTANTS.BASE_URL),
      });
    }
  });

  if (pages.length === 0) {
    const scriptText = $("script").text();
    const jsonMatch = scriptText.match(/var\s+(?:chapImages|images|pages)\s*=\s*(\[[^\]]+\])/i) || scriptText.match(/(\["https?:[^"]+"[^\]]*\])/);
    if (jsonMatch) {
      try {
        const urls: string[] = JSON.parse(jsonMatch[1]);
        urls.forEach((url, index) => {
          if (url.includes(".jpg") || url.includes(".png") || url.includes(".webp")) {
            pages.push({
              number: index + 1,
              url: resolveAbsoluteUrl(url, MANGABUDDY_CONSTANTS.BASE_URL),
            });
          }
        });
      } catch {}
    }
  }

  if (pages.length === 0) {
    throw new ParserError(
      MANGABUDDY_CONSTANTS.DISPLAY_NAME,
      "page.url",
      `Failed to extract chapter pages for chapter ID "${providerChapterId}". Zero image elements found.`
    );
  }

  return pages;
}
