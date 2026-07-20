import { editorialService } from "@/services/editorial";
import { trendingService } from "@/services/trending";
import { genreService } from "@/services/genres";
import { statsService } from "@/services/stats";
import { announcementService } from "@/services/announcements";
import { RequestProfiler } from "@/utils/profiler";
import { cacheGet, cacheSet } from "@/services/cache";
import { HomepageContentEngine } from "@/utils/homepage-content-engine";
import { HomepageEngineConfig } from "@/config/homepage-engine-config";
import type { HomepageCandidate, HomepageEngineResult } from "@/types/homepage-engine";
import type { HomePageData, HomeSection, ContinueReadingItem, SiteStats } from "./types";

export type { ContinueReadingItem } from "./types";

// Cache infrastructure version — independent of layoutVersion.
// Bump this (not layoutVersion) when the cached payload schema changes in a breaking way.
const CACHE_VERSION = "v2";

export class HomeService {
  async getHomeData(userId?: string): Promise<HomePageData> {
    const profiler = new RequestProfiler("Homepage");

    const today = new Date();
    const seed = [
      today.getUTCFullYear(),
      String(today.getUTCMonth() + 1).padStart(2, "0"),
      String(today.getUTCDate()).padStart(2, "0"),
    ].join("-");

    const cacheKey = `homepage:${CACHE_VERSION}:${seed}`;

    // ------------------------------------------------------------------
    // Cache hit path
    // ------------------------------------------------------------------
    type CachedPayload = {
      sections: HomeSection[];
      stats: SiteStats;
      generatedAt: string;
      engineResult: Pick<HomepageEngineResult, "stats" | "timings" | "rejections">;
    };

    let cached = await cacheGet<CachedPayload>(cacheKey);

    if (!cached) {
      console.log(`[HomeService] Cache miss: ${cacheKey}`);

      // Pool size = required * config factor (5)
      const poolSize = 40;

      const [
        trendingPool,
        latestPool,
        popularPool,
        genres,
        announcements,
        siteStats,
      ] = await Promise.all([
        profiler.profile("Fetch Trending Pool", () => trendingService.getTrending(poolSize, true)),
        profiler.profile("Fetch Latest Pool", () => trendingService.getLatestUpdates(poolSize, true)),
        profiler.profile("Fetch Popular Pool", () => trendingService.getPopular(poolSize, true)),
        profiler.profile("Fetch Genres", () => genreService.getAll(16)),
        profiler.profile("Fetch Announcements", () => announcementService.getActive()),
        profiler.profile("Fetch Site Stats", () => statsService.getSiteStats()),
      ]);

      const engineResult = HomepageContentEngine.buildLayout(
        {
          trending: trendingPool as HomepageCandidate[],
          latest: latestPool as HomepageCandidate[],
          popular: popularPool as HomepageCandidate[],
        },
        {
          seed,
          options: {},
          services: {
            logger: (msg) => console.log(msg),
          },
        }
      );

      // Merge engine sections with non-engine sections (genres, announcements)
      const publicSections: HomeSection[] = [
        ...engineResult.layout.sections,
        { type: "genres", priority: 60, data: genres },
        { type: "announcements", priority: 70, data: announcements },
      ] as HomeSection[];

      cached = {
        sections: publicSections,
        stats: siteStats,
        generatedAt: new Date().toISOString(),
        engineResult: {
          stats: engineResult.stats,
          timings: engineResult.timings,
          rejections: engineResult.rejections,
        },
      };

      await cacheSet(cacheKey, cached, 86400);
      console.log(
        `[HomeService] Cached homepage under ${cacheKey} ` +
        `(${engineResult.stats.selected} cards, ${engineResult.timings.totalMs}ms)`
      );
    } else {
      console.log(`[HomeService] Cache hit: ${cacheKey}`);
    }

    // ------------------------------------------------------------------
    // Inject user-specific sections (not cached)
    // ------------------------------------------------------------------
    let activeSections = [...cached.sections];

    if (userId) {
      const [continueReading, recentlyViewed] = await Promise.all([
        profiler.profile("Fetch Continue Reading", () => trendingService.getContinueReading(userId)),
        profiler.profile("Fetch Recently Viewed", () => trendingService.getRecentlyViewed(userId)),
      ]);

      if (continueReading?.length) {
        activeSections.push({ type: "continue-reading", priority: 20, data: continueReading });
      }
      if (recentlyViewed?.length) {
        activeSections.push({ type: "recently-viewed", priority: 25, data: recentlyViewed });
      }
    }

    const filteredSections = activeSections.filter(
      (s): s is HomeSection => (Array.isArray(s.data) ? s.data.length > 0 : s.data !== null)
    );

    profiler.logResult();

    return {
      sections: filteredSections.sort((a, b) => a.priority - b.priority),
      stats: cached.stats,
      generatedAt: cached.generatedAt,
    };
  }

  // Static helpers for cron/cache warming
  static async getFeatured(limit: number): Promise<{ manga: any[]; total: number }> {
    const data = await editorialService.getHeroManga();
    return { manga: data ? [data] : [], total: data ? 1 : 0 };
  }

  static async getTrending(limit: number): Promise<{ manga: any[]; total: number }> {
    const manga = await trendingService.getTrending(limit);
    return { manga, total: manga.length };
  }

  static async getPopular(limit: number): Promise<{ manga: any[]; total: number }> {
    const manga = await trendingService.getPopular(limit);
    return { manga, total: manga.length };
  }

  static async getLatest(limit: number): Promise<{ manga: any[]; total: number }> {
    const manga = await trendingService.getLatestUpdates(limit);
    return { manga, total: manga.length };
  }
}

export const homeService = new HomeService();

export const getFeatured = HomeService.getFeatured;
export const getTrending = HomeService.getTrending;
export const getPopular = HomeService.getPopular;
export const getLatest = HomeService.getLatest;
export const getHomeData = (userId?: string) => homeService.getHomeData(userId);