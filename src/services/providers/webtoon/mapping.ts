import type { RawProviderManga, RawProviderChapter, RawProviderPage } from "../types";
import type {
  RawParsedWebtoonSearchItem,
  RawParsedWebtoonDetail,
  RawParsedWebtoonEpisode,
} from "./parser";

/**
 * Parse a WEBTOON series or chapter ID into its components.
 *
 * Series ID format:  "{genre}:{slug}:{titleNo}"          e.g. "fantasy:tower-of-god:95"
 * Chapter ID format: "{genre}:{slug}:{titleNo}:{episodeNo}" e.g. "fantasy:tower-of-god:95:648"
 *
 * The genre+slug components are necessary to construct all WEBTOON URLs,
 * since webtoons.com has no title_no-only endpoint.
 */
export function parseWebtoonId(id: string): {
  genre: string;
  slug: string;
  titleNo: string;
  episodeNo?: string;
} {
  const parts = id.split(":");
  if (parts.length < 3) {
    throw new Error(`WebtoonProvider: invalid ID "${id}" — expected "{genre}:{slug}:{titleNo}[:episodeNo]"`);
  }
  return {
    genre:     parts[0],
    slug:      parts[1],
    titleNo:   parts[2],
    episodeNo: parts[3],
  };
}

/** Build a series ID from its components. */
export function buildWebtoonSeriesId(genre: string, slug: string, titleNo: string): string {
  return `${genre}:${slug}:${titleNo}`;
}

/** Build a chapter ID from its components. */
export function buildWebtoonChapterId(
  genre: string,
  slug: string,
  titleNo: string,
  episodeNo: string
): string {
  return `${genre}:${slug}:${titleNo}:${episodeNo}`;
}

export class WebtoonMapper {
  /**
   * Maps a search card item to the platform's RawProviderManga.
   *
   * ID: "{genre}:{slug}:{titleNo}" — all info needed to construct detail/chapter URLs.
   * canonicalUrl is preserved in rawMetadata.
   */
  public static mapSearchItem(item: RawParsedWebtoonSearchItem): RawProviderManga {
    // Extract genre and slug from canonicalUrl:
    // https://www.webtoons.com/en/{genre}/{slug}/list?title_no={N}
    const urlMatch = item.canonicalUrl.match(
      /webtoons\.com\/en\/([^/]+)\/([^/]+)\/list/
    );
    const genre = urlMatch?.[1] ?? "";
    const slug  = urlMatch?.[2] ?? "";
    const id = buildWebtoonSeriesId(genre, slug, item.titleNo);

    return {
      id,
      title: item.title,
      coverImage: item.coverUrl,
      status: "ongoing",
      type: "manhwa",
      genres: genre ? [this.normalizeGenre(genre)] : [],
      authors: item.author ? [item.author] : [],
      rawMetadata: { canonicalUrl: item.canonicalUrl, genre, slug, titleNo: item.titleNo },
    };
  }

  /**
   * Maps the detail page to the platform's RawProviderManga.
   * mangaId is in "{genre}:{slug}:{titleNo}" format.
   */
  public static mapDetail(mangaId: string, item: RawParsedWebtoonDetail): RawProviderManga {
    const { genre, slug, titleNo } = parseWebtoonId(mangaId);
    return {
      id: mangaId,
      title: item.title,
      description: item.description,
      coverImage: item.coverUrl,
      bannerImage: item.bannerUrl || undefined,
      status: "ongoing",
      type: "manhwa",
      genres: item.genre ? [this.normalizeGenre(item.genre)] : [],
      authors: item.author ? [item.author.replace(/\s+/g, " ").trim()] : [],
      rawMetadata: { genre, slug, titleNo },
    };
  }

  /**
   * Maps a parsed episode to the platform's RawProviderChapter.
   *
   * Chapter ID: "{genre}:{slug}:{titleNo}:{episodeNo}"
   *   e.g. "fantasy:tower-of-god:95:648"
   *
   * This encodes all information needed to construct the viewer URL:
   *   /en/{genre}/{slug}/viewer?title_no={titleNo}&episode_no={episodeNo}
   *
   * Episode number: parsed from "Ep. {N}" in title; falls back to episodeNo integer.
   */
  public static mapEpisode(
    mangaId: string,
    item: RawParsedWebtoonEpisode
  ): RawProviderChapter {
    const { genre, slug, titleNo } = parseWebtoonId(mangaId);
    const id = buildWebtoonChapterId(genre, slug, titleNo, item.episodeNo);

    const number = parseInt(item.episodeNo, 10);
    const displayNumber = item.episodeNo;

    return {
      id,
      number: isNaN(number) ? null : number,
      title: item.displayTitle || undefined,
      language: "en",
      displayNumber,
      publishedAt: this.parseDate(item.dateText),
      scanlatorGroups: ["WEBTOON"],
      rawMetadata: {
        genre,
        slug,
        titleNo,
        episodeNo: item.episodeNo,
        thumbnailUrl: item.thumbnailUrl,
      },
    };
  }

  public static mapPages(urls: string[]): RawProviderPage[] {
    return urls.map((url, index) => ({ number: index + 1, url }));
  }

  // ---------------------------------------------------------------------------
  // Helpers
  // ---------------------------------------------------------------------------

  private static parseDate(dateText: string): Date {
    if (!dateText) return new Date();
    const parsed = new Date(dateText);
    return isNaN(parsed.getTime()) ? new Date() : parsed;
  }

  private static normalizeGenre(genre: string): string {
    return genre
      .split("-")
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(" ");
  }
}
