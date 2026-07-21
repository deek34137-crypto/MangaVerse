import type { MetadataSource, EnrichedMetadata, MangaRelation } from "./metadata-source";

const ANILIST_GRAPHQL_URL = "https://graphql.anilist.co";

const MANGA_QUERY = `
query ($id: Int, $search: String, $page: Int, $perPage: Int) {
  Page(page: $page, perPage: $perPage) {
    media(id: $id, search: $search, type: MANGA) {
      id
      title {
        userPreferred
        romaji
        english
        native
      }
      synonyms
      description
      coverImage {
        extraLarge
        large
      }
      bannerImage
      status
      format
      genres
      tags {
        name
      }
      staff {
        nodes {
          name {
            full
          }
        }
      }
      averageScore
      popularity
      startDate {
        year
        month
        day
      }
      relations {
        edges {
          relationType
          node {
            id
            title {
              userPreferred
              english
              romaji
            }
            coverImage {
              extraLarge
              large
            }
            format
            status
            averageScore
          }
        }
      }
    }
  }
}
`;

export class AniListSource implements MetadataSource {
  public readonly name = "anilist";

  public async searchMetadata(query: string): Promise<EnrichedMetadata[]> {
    try {
      const response = await fetch(ANILIST_GRAPHQL_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          query: MANGA_QUERY,
          variables: { search: query, page: 1, perPage: 5 },
        }),
      });

      if (!response.ok) {
        throw new Error(`AniList GraphQL HTTP error: ${response.status}`);
      }

      const json = await response.json();
      const mediaList = json?.data?.Page?.media || [];

      return mediaList.map((m: any) => this.mapMediaToEnriched(m));
    } catch (err) {
      console.warn("[AniListSource] Search metadata failed:", err);
      return [];
    }
  }

  public async getMetadataById(id: string): Promise<EnrichedMetadata | null> {
    try {
      const numericId = parseInt(id, 10);
      if (isNaN(numericId)) return null;

      const response = await fetch(ANILIST_GRAPHQL_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          query: MANGA_QUERY,
          variables: { id: numericId },
        }),
      });

      if (!response.ok) return null;

      const json = await response.json();
      const media = json?.data?.Page?.media?.[0];

      return media ? this.mapMediaToEnriched(media) : null;
    } catch (err) {
      console.warn("[AniListSource] Get metadata by ID failed:", err);
      return null;
    }
  }

  private mapMediaToEnriched(media: any): EnrichedMetadata {
    const titles = [
      media.title?.userPreferred,
      media.title?.english,
      media.title?.romaji,
      media.title?.native,
      ...(media.synonyms || []),
    ].filter((t): t is string => typeof t === "string" && t.trim().length > 0);

    const primaryTitle = media.title?.userPreferred || media.title?.english || media.title?.romaji || "Unknown Title";
    const altTitles = Array.from(new Set(titles.filter((t) => t !== primaryTitle)));

    const cleanDescription = typeof media.description === "string"
      ? media.description.replace(/<[^>]*>?/gm, "").trim()
      : undefined;

    const relations: MangaRelation[] = Array.isArray(media.relations?.edges)
      ? media.relations.edges
          .filter((edge: any) => edge?.node)
          .map((edge: any) => ({
            id: String(edge.node.id),
            relationType: edge.relationType || "ADAPTATION",
            title: edge.node.title?.userPreferred || edge.node.title?.english || edge.node.title?.romaji || "Unknown",
            coverImage: edge.node.coverImage?.extraLarge || edge.node.coverImage?.large,
            type: edge.node.format ? String(edge.node.format).toLowerCase() : "manga",
            status: edge.node.status ? String(edge.node.status).toLowerCase() : "ongoing",
            rating: typeof edge.node.averageScore === "number" ? parseFloat((edge.node.averageScore / 10).toFixed(2)) : undefined,
          }))
      : [];

    return {
      sourceId: String(media.id),
      sourceName: this.name,
      title: primaryTitle,
      altTitles,
      description: cleanDescription,
      coverImage: media.coverImage?.extraLarge || media.coverImage?.large,
      bannerImage: media.bannerImage || undefined,
      status: media.status ? String(media.status).toLowerCase() : undefined,
      type: media.format ? String(media.format).toLowerCase() : "manga",
      genres: Array.isArray(media.genres) ? media.genres : [],
      tags: Array.isArray(media.tags) ? media.tags.map((t: any) => t.name).filter(Boolean) : [],
      authors: Array.isArray(media.staff?.nodes) ? media.staff.nodes.map((s: any) => s.name?.full).filter(Boolean) : [],
      artists: [],
      rating: typeof media.averageScore === "number" ? parseFloat((media.averageScore / 10).toFixed(2)) : undefined,
      popularity: media.popularity || undefined,
      relations,
    };
  }
}

export const aniListSource = new AniListSource();
export default aniListSource;
