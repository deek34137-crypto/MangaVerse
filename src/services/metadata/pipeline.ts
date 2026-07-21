import { aniListSource, AniListSource } from "./anilist-source";
import type { MetadataSource, EnrichedMetadata } from "./metadata-source";
import { multiTierCache } from "../infrastructure/cache-service";
import { eventBus } from "../infrastructure/event-bus";

export interface FieldTTLConfig {
  descriptionTtlSeconds: number; // 30 days (2,592,000s)
  coverTtlSeconds: number;       // 7 days (604,800s)
  popularityTtlSeconds: number;  // 12 hours (43,200s)
  genresTtlSeconds: number;      // 90 days (7,776,000s)
}

export class MetadataPipeline {
  private static instance: MetadataPipeline;
  private sources: MetadataSource[] = [];

  private fieldTtl: FieldTTLConfig = {
    descriptionTtlSeconds: 2592000,
    coverTtlSeconds: 604800,
    popularityTtlSeconds: 43200,
    genresTtlSeconds: 7776000,
  };

  private constructor() {
    this.sources.push(aniListSource);
  }

  public static getInstance(): MetadataPipeline {
    if (!MetadataPipeline.instance) {
      MetadataPipeline.instance = new MetadataPipeline();
    }
    return MetadataPipeline.instance;
  }

  public registerSource(source: MetadataSource): void {
    this.sources.push(source);
  }

  /**
   * Non-blocking background enrichment of canonical manga metadata.
   */
  public async enrichMangaMetadata(canonicalMangaId: string, title: string): Promise<EnrichedMetadata | null> {
    const cacheKey = `metadata:canonical:${canonicalMangaId}`;

    // 1. Try L1/L2 Cache first
    const cached = await multiTierCache.get<EnrichedMetadata>(cacheKey);
    if (cached.data) {
      return cached.data;
    }

    // 2. Fetch asynchronously from primary MetadataSource (AniList)
    for (const source of this.sources) {
      try {
        const results = await source.searchMetadata(title);
        if (results && results.length > 0) {
          const enriched = results[0];

          // Save enriched metadata with default 7-day TTL
          await multiTierCache.set(cacheKey, enriched, this.fieldTtl.coverTtlSeconds);

          eventBus.emit("metadata:updated", {
            version: 1,
            canonicalMangaId,
            source: source.name,
            fieldName: "all",
            timestamp: Date.now(),
          });

          return enriched;
        }
      } catch (err) {
        console.warn(`[MetadataPipeline] Source ${source.name} failed for ${title}:`, err);
      }
    }

    return null;
  }
}

export const metadataPipeline = MetadataPipeline.getInstance();
export default metadataPipeline;
