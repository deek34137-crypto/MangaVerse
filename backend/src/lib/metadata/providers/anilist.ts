import { MetadataProvider, MetadataMatchCriteria, CandidateMetadata } from "../metadata-provider";

const ANILIST_GRAPHQL_ENDPOINT = "https://graphql.anilist.co";

const ANILIST_QUERY = `
query ($search: String, $id: Int) {
  Page(page: 1, perPage: 5) {
    media(search: $search, id: $id, type: MANGA, sort: SEARCH_MATCH) {
      id
      idMal
      title {
        romaji
        english
        native
      }
      synonyms
      description
      startDate {
        year
      }
      format
      status
      genres
      averageScore
      coverImage {
        extraLarge
        large
        medium
      }
      bannerImage
      staff(perPage: 3) {
        nodes {
          name {
            full
          }
        }
      }
    }
  }
}
`;

export class AniListMetadataProvider implements MetadataProvider {
  public readonly id = "anilist" as const;
  public readonly name = "AniList";

  public async search(criteria: MetadataMatchCriteria): Promise<CandidateMetadata[]> {
    const queryTerm = criteria.targetTitle;
    if (!queryTerm && !criteria.targetExternalId?.anilist) return [];

    const variables: Record<string, any> = {};
    if (criteria.targetExternalId?.anilist) {
      variables.id = criteria.targetExternalId.anilist;
    } else {
      variables.search = queryTerm;
    }

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 6000);

      const res = await fetch(ANILIST_GRAPHQL_ENDPOINT, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          "User-Agent": "MangaHub/2.0 (Metadata Resolver; Cloudflare Worker)",
        },
        body: JSON.stringify({ query: ANILIST_QUERY, variables }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!res.ok) {
        return [];
      }

      const json = (await res.json()) as any;
      const mediaList = json?.data?.Page?.media || [];

      return mediaList.map((m: any) => {
        const primaryTitle = m.title?.english || m.title?.romaji || m.title?.native || "";
        const authors = (m.staff?.nodes || []).map((n: any) => n.name?.full).filter(Boolean);

        const covers = [
          m.coverImage?.extraLarge && {
            url: m.coverImage.extraLarge,
            width: 460,
            height: 650,
            source: "anilist" as const,
          },
          m.coverImage?.large && {
            url: m.coverImage.large,
            width: 230,
            height: 325,
            source: "anilist" as const,
          },
          m.coverImage?.medium && {
            url: m.coverImage.medium,
            width: 100,
            height: 140,
            source: "anilist" as const,
          },
        ].filter(Boolean);

        return {
          id: String(m.id),
          title: primaryTitle,
          romajiTitle: m.title?.romaji,
          englishTitle: m.title?.english,
          nativeTitle: m.title?.native,
          altTitles: m.synonyms || [],
          description: m.description ? m.description.replace(/<[^>]+>/g, "") : undefined,
          coverImage: m.coverImage?.large || m.coverImage?.extraLarge || m.coverImage?.medium,
          coverImageLarge: m.coverImage?.large,
          coverImageExtraLarge: m.coverImage?.extraLarge,
          bannerImage: m.bannerImage,
          covers,
          authors,
          year: m.startDate?.year,
          type: m.format,
          status: m.status ? (m.status.toLowerCase() as any) : undefined,
          genres: m.genres || [],
          externalIds: {
            anilist: m.id,
            mal: m.idMal || undefined,
          },
          score: m.averageScore ? m.averageScore / 10 : undefined,
        };
      });
    } catch {
      return [];
    }
  }
}
