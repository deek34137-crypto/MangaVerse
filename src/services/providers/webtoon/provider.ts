import { BaseProvider } from "../shared/base-provider";
import {
  ProviderCapabilities,
  ProviderHealth,
  RawProviderManga,
  RawProviderChapter,
  RawProviderPage,
  SearchOptions,
} from "../shared/types";
import { WebtoonClient } from "./client";
import { WebtoonParser } from "./parser";
import { WebtoonMapper, parseWebtoonId } from "./mapping";
import { BASE_URL } from "./constants";
import manifest from "./provider.json";

export class WebtoonProvider extends BaseProvider {
  public readonly name = "WEBTOON";
  public readonly version = manifest.providerVersion;

  private client: WebtoonClient;
  private parser: WebtoonParser;

  constructor() {
    const capabilities: ProviderCapabilities = {
      search:   manifest.capabilities.search,
      latest:   manifest.capabilities.latest,
      trending: manifest.capabilities.trending,
      merge:    manifest.capabilities.merge,
      reader:   manifest.capabilities.reader,
    };
    super(manifest, capabilities);

    this.client = new WebtoonClient();
    this.parser = new WebtoonParser();
  }

  // ---------------------------------------------------------------------------
  // Search
  // ---------------------------------------------------------------------------

  public async searchManga(
    query: string,
    options?: SearchOptions
  ): Promise<RawProviderManga[]> {
    const html = await this.client.fetchSearch(query);
    const items = this.parser.parseSearch(html);
    const limited = options?.limit ? items.slice(0, options.limit) : items;
    return limited.map((item) => WebtoonMapper.mapSearchItem(item));
  }

  // ---------------------------------------------------------------------------
  // Detail
  // ---------------------------------------------------------------------------

  /**
   * providerMangaId format: "{genre}:{slug}:{titleNo}"
   * e.g. "fantasy:tower-of-god:95"
   *
   * This allows constructing the exact detail URL:
   *   /en/{genre}/{slug}/list?title_no={titleNo}
   */
  public async getMangaDetail(providerMangaId: string): Promise<RawProviderManga> {
    const { genre, slug, titleNo } = parseWebtoonId(providerMangaId);
    const detailUrl = `${BASE_URL}/en/${genre}/${slug}/list?title_no=${titleNo}`;
    const html = await this.client.fetchDetailByUrl(detailUrl, titleNo);
    const detail = this.parser.parseDetail(html);
    return WebtoonMapper.mapDetail(providerMangaId, detail);
  }

  // ---------------------------------------------------------------------------
  // Chapters (paginated)
  // ---------------------------------------------------------------------------

  /**
   * providerMangaId format: "{genre}:{slug}:{titleNo}"
   *
   * Fetches all episode pages until an empty page is returned.
   * Returns chapters in ascending episode order.
   */
  public async getChapters(providerMangaId: string): Promise<RawProviderChapter[]> {
    const { genre, slug, titleNo } = parseWebtoonId(providerMangaId);

    const allEpisodes: ReturnType<WebtoonParser["parseEpisodesFromPage"]>["episodes"] = [];
    const seenEpisodes = new Set<string>();
    let page = 1;

    // Terminate when a page returns 0 episodes or if we start seeing duplicate episodes
    // (WEBTOON returns the last page repeatedly when requesting out-of-bounds pages).
    while (true) {
      const pageHtml = await this.client.fetchChapterPage(titleNo, genre, slug, page);
      const { episodes, count } = this.parser.parseEpisodesFromPage(pageHtml);
      if (count === 0) break;

      // Check if any of the parsed episodes have already been fetched
      const hasDuplicates = episodes.some((ep) => seenEpisodes.has(ep.episodeNo));
      if (hasDuplicates) {
        break;
      }

      // Add to seen list and append
      for (const ep of episodes) {
        seenEpisodes.add(ep.episodeNo);
      }
      allEpisodes.push(...episodes);
      page++;
    }

    // WEBTOON lists episodes newest-first; reverse to ascending order
    const ascending = allEpisodes.reverse();
    return ascending.map((ep) => WebtoonMapper.mapEpisode(providerMangaId, ep));
  }

  // ---------------------------------------------------------------------------
  // Pages
  // ---------------------------------------------------------------------------

  /**
   * providerChapterId format: "{genre}:{slug}:{titleNo}:{episodeNo}"
   * e.g. "fantasy:tower-of-god:95:1"
   *
   * Constructs the viewer URL as:
   *   /en/{genre}/{slug}/viewer?title_no={titleNo}&episode_no={episodeNo}
   *
   * Note: WEBTOON viewer URLs normally include an episode-specific slug
   * (e.g. /season-1-ep-0/viewer), but WEBTOON accepts the URL without it
   * and redirects to the canonical form. The query params title_no+episode_no
   * are the true identifiers.
   */
  public async getChapterPages(providerChapterId: string): Promise<RawProviderPage[]> {
    const { genre, slug, titleNo, episodeNo } = parseWebtoonId(providerChapterId);
    if (!episodeNo) {
      throw new Error(
        `WebtoonProvider: chapter ID "${providerChapterId}" is missing episodeNo — expected "{genre}:{slug}:{titleNo}:{episodeNo}"`
      );
    }

    const viewerUrl = `${BASE_URL}/en/${genre}/${slug}/episode/viewer?title_no=${titleNo}&episode_no=${episodeNo}`;
    const html = await this.client.fetchPages(viewerUrl, titleNo, episodeNo);
    const pageUrls = this.parser.parsePages(html);
    return WebtoonMapper.mapPages(pageUrls);
  }

  // ---------------------------------------------------------------------------
  // Health
  // ---------------------------------------------------------------------------

  /** Ping the base URL — does not depend on search or detail being functional. */
  public async healthCheck(): Promise<ProviderHealth> {
    const start = Date.now();
    try {
      await this.client.pingBase();
      return {
        status: "ONLINE",
        latencyMs: Date.now() - start,
        lastSuccessAt: new Date(),
        errorRate: 0,
        consecutiveFailures: 0,
      };
    } catch {
      return {
        status: "OFFLINE",
        latencyMs: Date.now() - start,
        lastSuccessAt: new Date(0),
        errorRate: 1.0,
        consecutiveFailures: 1,
      };
    }
  }
}
