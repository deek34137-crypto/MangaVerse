import * as cheerio from "cheerio";
import { SELECTORS } from "./selectors";
import { MANGATOON_CONSTANTS } from "./constants";
import { ParsingFailure, ProviderBlocked } from "../shared/errors";
import { RawProviderManga, RawProviderChapter, RawProviderPage } from "../shared/types";

export function checkAntiBotChallenge(html: string): void {
  const lowerHtml = html.toLowerCase();
  for (const signature of MANGATOON_CONSTANTS.ANTI_BOT_SIGNATURES) {
    if (lowerHtml.includes(signature)) {
      throw new ProviderBlocked(
        MANGATOON_CONSTANTS.DISPLAY_NAME,
        `Anti-bot or Cloudflare challenge detected ("${signature}")`
      );
    }
  }
}

export function parseSearchResponse(html: string): RawProviderManga[] {
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
    // Skip noveltoon.mobi user novel links (we only aggregate comics/manga)
    if (href.includes("noveltoon.mobi") || href.includes("/comments")) return;

    let targetPath = href;
    if (targetPath.startsWith("http://") || targetPath.startsWith("https://")) {
      try {
        const parsed = new URL(targetPath);
        targetPath = parsed.pathname + parsed.search;
      } catch {}
    }

    const cleanHref = targetPath.startsWith("/en/")
      ? targetPath.slice(4)
      : targetPath.startsWith("/")
        ? targetPath.slice(1)
        : targetPath;

    results.push({
      id: cleanHref,
      title,
      coverImage: coverUrl.startsWith("//") ? `https:${coverUrl}` : coverUrl,
    });
  });

  return results;
}

export function parseDetailResponse(html: string, providerMangaId: string): RawProviderManga {
  checkAntiBotChallenge(html);
  const $ = cheerio.load(html);

  const title = $(SELECTORS.DETAIL.TITLE).first().text().trim();
  if (!title || title === "404" || title.toLowerCase().includes("not found")) {
    throw new ParsingFailure(
      MANGATOON_CONSTANTS.DISPLAY_NAME,
      `Failed to parse manga detail title for ID "${providerMangaId}". Page returned 404/Not Found.`
    );
  }

  const description = $(SELECTORS.DETAIL.DESCRIPTION).text().trim();
  const coverImg = $(SELECTORS.DETAIL.COVER).first();
  const coverUrl = coverImg.attr("data-src") || coverImg.attr("src") || "";
  const author = $(SELECTORS.DETAIL.AUTHOR).text().trim() || "Unknown";
  const statusText = $(SELECTORS.DETAIL.STATUS).text().trim().toLowerCase();

  const genres: string[] = [];
  $(SELECTORS.DETAIL.GENRES).each((_, tag) => {
    const text = $(tag).text().trim();
    if (text) genres.push(text);
  });

  return {
    id: providerMangaId,
    title,
    description,
    coverImage: coverUrl.startsWith("//") ? `https:${coverUrl}` : coverUrl,
    authors: author ? [author] : [],
    genres,
    status: statusText.includes("ongoing") ? "ongoing" : statusText.includes("completed") ? "completed" : "ongoing",
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

    // MangaToon chapter link format: /en/watch/5246661/188768 -> "watch/5246661/188768" or "5246661/188768"
    let targetPath = href;
    if (targetPath.startsWith("http://") || targetPath.startsWith("https://")) {
      try {
        const parsed = new URL(targetPath);
        targetPath = parsed.pathname;
      } catch {}
    }
    const cleanChapterId = targetPath.startsWith("/en/watch/")
      ? targetPath.slice(10)
      : targetPath.startsWith("/watch/")
        ? targetPath.slice(7)
        : targetPath.startsWith("/")
          ? targetPath.slice(1)
          : targetPath;

    const numMatch = rawText.match(/(?:ep|episode|ch|chapter)\.?\s*(\d+(?:\.\d+)?)/i) || rawText.match(/^(\d+)/);
    const chapterNumber = numMatch ? parseFloat(numMatch[1]) : index + 1;

    chapters.push({
      id: cleanChapterId,
      number: isNaN(chapterNumber) ? null : chapterNumber,
      title: `Episode ${chapterNumber}`,
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

    if (src && !src.includes(".png") && !src.includes("icon") && !src.includes("placeholder")) {
      const fullUrl = src.startsWith("//") ? `https:${src}` : src;
      pages.push({
        number: index + 1,
        url: fullUrl,
      });
    }
  });

  if (pages.length === 0) {
    // Fallback JSON embed check
    const scriptText = $("script").text();
    const jsonMatch = scriptText.match(/pictures\s*:\s*(\[[^\]]+\])/i);
    if (jsonMatch) {
      try {
        const urls: string[] = JSON.parse(jsonMatch[1]);
        urls.forEach((url, index) => {
          pages.push({
            number: index + 1,
            url: url.startsWith("//") ? `https:${url}` : url,
          });
        });
      } catch {}
    }
  }

  if (pages.length === 0) {
    throw new ParsingFailure(
      MANGATOON_CONSTANTS.DISPLAY_NAME,
      `Failed to extract chapter pages for chapter ID "${providerChapterId}". Zero image elements found.`
    );
  }

  return pages;
}
