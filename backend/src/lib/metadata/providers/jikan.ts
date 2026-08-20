import { MetadataProvider, MetadataMatchCriteria, CandidateMetadata } from "../metadata-provider";

const JIKAN_API_ENDPOINT = "https://api.jikan.moe/v4/manga";

export class JikanMetadataProvider implements MetadataProvider {
  public readonly id = "jikan" as const;
  public readonly name = "Jikan (MyAnimeList)";

  public async search(criteria: MetadataMatchCriteria): Promise<CandidateMetadata[]> {
    const queryTerm = criteria.targetTitle;
    if (!queryTerm && !criteria.targetExternalId?.mal) return [];

    let url = `${JIKAN_API_ENDPOINT}?limit=5`;
    if (criteria.targetExternalId?.mal) {
      url = `${JIKAN_API_ENDPOINT}/${encodeURIComponent(criteria.targetExternalId.mal)}/full`;
    } else {
      url = `${JIKAN_API_ENDPOINT}?q=${encodeURIComponent(queryTerm)}&limit=5`;
    }

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 6000);

      const res = await fetch(url, {
        headers: {
          Accept: "application/json",
          "User-Agent": "MangaHub/2.0 (Metadata Resolver; Cloudflare Worker)",
        },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!res.ok) return [];

      const json = (await res.json()) as any;
      const dataList = Array.isArray(json?.data) ? json.data : json?.data ? [json.data] : [];

      return dataList.map((item: any) => {
        const primaryTitle = item.title_english || item.title || "";
        const images = item.images || {};
        const webp = images.webp || {};
        const jpg = images.jpg || {};

        const covers = [
          webp.large_image_url && {
            url: webp.large_image_url,
            width: 450,
            height: 650,
            source: "jikan" as const,
          },
          jpg.large_image_url && {
            url: jpg.large_image_url,
            width: 450,
            height: 650,
            source: "jikan" as const,
          },
          jpg.image_url && {
            url: jpg.image_url,
            width: 225,
            height: 320,
            source: "jikan" as const,
          },
        ].filter(Boolean);

        const authors = (item.authors || []).map((a: any) => a.name).filter(Boolean);
        const genres = (item.genres || []).map((g: any) => g.name).filter(Boolean);
        const year = item.published?.prop?.from?.year;

        const altTitles = (item.titles || [])
          .map((t: any) => t.title)
          .filter((t: string) => t && t !== primaryTitle);

        return {
          id: String(item.mal_id),
          title: primaryTitle,
          romajiTitle: item.title,
          englishTitle: item.title_english,
          nativeTitle: item.title_japanese,
          altTitles,
          description: item.synopsis,
          coverImage: webp.large_image_url || jpg.large_image_url || jpg.image_url,
          coverImageLarge: webp.large_image_url || jpg.large_image_url,
          coverImageExtraLarge: webp.large_image_url || jpg.large_image_url,
          covers,
          authors,
          year,
          type: item.type,
          status: item.status ? (item.status.toLowerCase() as any) : undefined,
          genres,
          externalIds: {
            mal: item.mal_id,
          },
          score: item.score ? item.score : undefined,
        };
      });
    } catch {
      return [];
    }
  }
}
