import { cacheGet, cacheSet } from "@/services/cache";

const TAGS_CACHE_KEY = "mangadex:tags:mapping";
const CACHE_TTL_24H = 24 * 60 * 60; // 24 hours in seconds

export class TagService {
  private static tagMap: Record<string, string> | null = null;
  private static lastFetched: number = 0;
  private static isFetching: boolean = false;

  /**
   * Initializes the tag map lazy loading.
   */
  private static async init(): Promise<Record<string, string>> {
    if (this.tagMap && (Date.now() - this.lastFetched < CACHE_TTL_24H * 1000)) {
      return this.tagMap;
    }

    // Try reading from cache first
    try {
      const cached = await cacheGet<Record<string, string>>(TAGS_CACHE_KEY);
      if (cached && Object.keys(cached).length > 0) {
        console.log("[TagService] Cache hit. Loaded tag mapping.");
        this.tagMap = cached;
        this.lastFetched = Date.now();
        return this.tagMap;
      }
    } catch (err) {
      console.error("[TagService] Failed to read from cache backend:", err);
    }

    // If cache miss or expired, fetch from MangaDex
    return this.refresh();
  }

  /**
   * Refreshes the tag map from MangaDex API, saving to Redis/memory cache.
   */
  public static async refresh(): Promise<Record<string, string>> {
    if (this.isFetching) {
      // Return current map if fetching is in progress to avoid concurrent fetches
      return this.tagMap || {};
    }

    this.isFetching = true;
    console.log("[TagService] Fetching tags from MangaDex API...");

    try {
      const res = await fetch("https://api.mangadex.org/manga/tag", {
        headers: { "User-Agent": "MangaHub/1.0" },
      });

      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }

      const data = await res.json();
      const map: Record<string, string> = {};

      if (data && Array.isArray(data.data)) {
        data.data.forEach((tag: any) => {
          const name = tag.attributes?.name?.en;
          if (name && tag.id) {
            map[name.toLowerCase()] = tag.id;
          }
        });
      }

      if (Object.keys(map).length > 0) {
        this.tagMap = map;
        this.lastFetched = Date.now();
        await cacheSet(TAGS_CACHE_KEY, map, CACHE_TTL_24H);
        console.log(`[TagService] Successfully refreshed and cached ${Object.keys(map).length} tags.`);
      } else {
        throw new Error("No tags parsed from response");
      }
    } catch (err) {
      console.error("[TagService] Failed to refresh tag mapping:", err);
      // Graceful fallback: return existing tagMap if any
      if (this.tagMap) {
        console.log("[TagService] Falling back to previously loaded in-memory tag map.");
      } else {
        console.log("[TagService] No tag map available. Returning empty fallback.");
        return {};
      }
    } finally {
      this.isFetching = false;
    }

    return this.tagMap || {};
  }

  /**
   * Resolves a tag name/slug to MangaDex UUID.
   */
  public static async getUUID(name: string): Promise<string | null> {
    const map = await this.init();
    return map[name.toLowerCase()] || null;
  }

  /**
   * Resolves an array of genres/tags to MangaDex UUIDs.
   */
  public static async getUUIDs(names: string[]): Promise<string[]> {
    if (!names || names.length === 0) return [];
    const map = await this.init();
    return names
      .map(name => map[name.toLowerCase()])
      .filter((uuid): uuid is string => !!uuid);
  }
}
