import { MetadataProvider, MetadataMatchCriteria, CandidateMetadata } from "../metadata-provider";

const KITSU_API_ENDPOINT = "https://kitsu.io/api/edge/manga";

export class KitsuMetadataProvider implements MetadataProvider {
  public readonly id = "kitsu" as const;
  public readonly name = "Kitsu";

  public async search(criteria: MetadataMatchCriteria): Promise<CandidateMetadata[]> {
    const queryTerm = criteria.targetTitle;
    if (!queryTerm && !criteria.targetExternalId?.kitsu) return [];

    let url = `${KITSU_API_ENDPOINT}?page[limit]=5`;
    if (criteria.targetExternalId?.kitsu) {
      url = `${KITSU_API_ENDPOINT}/${encodeURIComponent(criteria.targetExternalId.kitsu)}`;
    } else {
      url = `${KITSU_API_ENDPOINT}?filter[text]=${encodeURIComponent(queryTerm)}&page[limit]=5`;
    }

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 6000);

      const res = await fetch(url, {
        headers: {
          Accept: "application/vnd.api+json",
          "Content-Type": "application/vnd.api+json",
          "User-Agent": "MangaHub/2.0 (Metadata Resolver; Cloudflare Worker)",
        },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!res.ok) return [];

      const json = (await res.json()) as any;
      const items = Array.isArray(json?.data) ? json.data : json?.data ? [json.data] : [];

      return items.map((item: any) => {
        const attr = item.attributes || {};
        const titles = attr.titles || {};
        const primaryTitle = attr.canonicalTitle || titles.en || titles.en_jp || titles.ja_jp || "";

        const poster = attr.posterImage || {};
        const covers = [
          poster.original && {
            url: poster.original,
            width: 550,
            height: 780,
            source: "kitsu" as const,
          },
          poster.large && {
            url: poster.large,
            width: 390,
            height: 554,
            source: "kitsu" as const,
          },
          poster.medium && {
            url: poster.medium,
            width: 284,
            height: 402,
            source: "kitsu" as const,
          },
        ].filter(Boolean);

        const year = attr.startDate ? parseInt(attr.startDate.split("-")[0], 10) : undefined;

        return {
          id: String(item.id),
          title: primaryTitle,
          romajiTitle: titles.en_jp,
          englishTitle: titles.en,
          nativeTitle: titles.ja_jp,
          altTitles: attr.abbreviatedTitles || [],
          description: attr.synopsis,
          coverImage: poster.large || poster.original || poster.medium,
          coverImageLarge: poster.large,
          coverImageExtraLarge: poster.original,
          bannerImage: attr.coverImage?.large || attr.coverImage?.original,
          covers,
          year: !isNaN(year as number) ? year : undefined,
          type: attr.subtype,
          status: attr.status ? (attr.status.toLowerCase() as any) : undefined,
          externalIds: {
            kitsu: String(item.id),
          },
          score: attr.averageRating ? parseFloat(attr.averageRating) / 10 : undefined,
        };
      });
    } catch {
      return [];
    }
  }
}
