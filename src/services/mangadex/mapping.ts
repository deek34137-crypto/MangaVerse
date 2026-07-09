import type {
  MangaDexMangaAttributes,
  MangaDexEntity,
  MangaDexChapterAttributes,
  MangaDexTag,
  MangaDexRelationship,
} from "./types";
import type { Manga, Chapter, ChapterPage, Genre, Tag, Author, Artist, ScanlatorGroup, MangaStatus } from "@/types";

function findRelationship(relationships: MangaDexRelationship[], type: string): MangaDexRelationship | undefined {
  return relationships.find(r => r.type === type);
}

function getFileNameFromRelationship(relationships: MangaDexRelationship[]): string | null {
  const cover = findRelationship(relationships, "cover_art");
  if (cover?.attributes && "fileName" in cover.attributes) {
    return cover.attributes.fileName as string;
  }
  return null;
}

function getLocalizedString(obj: Record<string, string> | null | undefined, lang = "en"): string {
  if (!obj) return "";
  return obj[lang] || obj["ja"] || obj[Object.keys(obj)[0]] || "";
}

function mapMangaStatus(mdStatus: string): MangaStatus {
  switch (mdStatus) {
    case "ongoing": return "ongoing";
    case "completed": return "completed";
    case "hiatus": return "hiatus";
    case "cancelled": return "cancelled";
    default: return "ongoing";
  }
}

function mapMangaType(lang?: string): Manga["type"] {
  if (lang === "ko") return "manhwa";
  if (lang === "zh") return "manhua";
  return "manga";
}

export function mapManga(
  entity: MangaDexEntity<MangaDexMangaAttributes>,
  coverUrl?: string
): Manga {
  const { id, attributes, relationships } = entity;
  const fileName = getFileNameFromRelationship(relationships) || "";
  const mdGenres: Genre[] = [];
  const mdTags: Tag[] = [];
  const mdAuthors: Author[] = [];
  const mdArtists: Artist[] = [];

  for (const rel of relationships) {
    if (rel.type === "author" && rel.attributes) {
      const attr = rel.attributes as { name?: string };
      mdAuthors.push({
        id: rel.id,
        name: attr.name || "Unknown",
        slug: (attr.name || "unknown").toLowerCase().replace(/\s+/g, "-"),
        mangaCount: 0,
      });
    }
    if (rel.type === "artist" && rel.attributes) {
      const attr = rel.attributes as { name?: string };
      mdArtists.push({
        id: rel.id,
        name: attr.name || "Unknown",
        slug: (attr.name || "unknown").toLowerCase().replace(/\s+/g, "-"),
        mangaCount: 0,
      });
    }
  }

  for (const tag of attributes.tags || []) {
    const tagName = getLocalizedString(tag.attributes.name);
    if (tag.attributes.group === "genre") {
      mdGenres.push({
        id: tag.id,
        name: tagName,
        slug: tagName.toLowerCase().replace(/\s+/g, "-"),
        mangaCount: 0,
      });
    } else {
      mdTags.push({
        id: tag.id,
        name: tagName,
        slug: tagName.toLowerCase().replace(/\s+/g, "-"),
        group: { id: tag.attributes.group, name: tag.attributes.group, slug: tag.attributes.group },
        mangaCount: 0,
      });
    }
  }

  return {
    id,
    title: getLocalizedString(attributes.title),
    altTitles: (attributes.altTitles || []).map(t => getLocalizedString(t)),
    description: getLocalizedString(attributes.description),
    coverImage: coverUrl || `https://uploads.mangadex.org/covers/${id}/${fileName}.512.jpg` || "",
    status: mapMangaStatus(attributes.status),
    type: mapMangaType(attributes.originalLanguage),
    genres: mdGenres,
    tags: mdTags,
    authors: mdAuthors,
    artists: mdArtists,
    demographic: (attributes.publicationDemographic as Manga["demographic"]) || undefined,
    rating: 0,
    ratingCount: 0,
    followCount: 0,
    viewCount: 0,
    chapterCount: 0,
    volumeCount: 0,
    startDate: attributes.year ? String(attributes.year) : undefined,
    createdAt: attributes.createdAt,
    updatedAt: attributes.updatedAt,
    latestChapter: undefined,
  };
}

export function mapMangaChapter(
  entity: MangaDexEntity<MangaDexChapterAttributes>,
  mangaId: string
): Chapter {
  const { id, attributes, relationships } = entity;
  const scanlatorGroups: ScanlatorGroup[] = [];

  for (const rel of relationships) {
    if (rel.type === "scanlation_group" && rel.attributes) {
      const attr = rel.attributes as { name?: string; website?: string; discord?: string };
      scanlatorGroups.push({
        id: rel.id,
        name: attr.name || "Unknown",
        slug: (attr.name || "unknown").toLowerCase().replace(/\s+/g, "-"),
        website: attr.website,
        discord: attr.discord,
      });
    }
  }

  return {
    id,
    mangaId,
    number: parseFloat(attributes.chapter || "0"),
    volume: attributes.volume ? parseInt(attributes.volume) : undefined,
    title: attributes.title || undefined,
    language: attributes.translatedLanguage,
    pages: [],
    pageCount: attributes.pages || 0,
    publishedAt: attributes.publishAt || attributes.createdAt,
    createdAt: attributes.createdAt,
    updatedAt: attributes.updatedAt,
    scanlatorGroups,
  };
}

export function mapMangaPages(
  baseUrl: string,
  hash: string,
  filenames: string[],
  chapterId: string,
  dataSaver = false
): ChapterPage[] {
  const qualityPath = dataSaver ? "data-saver" : "data";
  return filenames.map((filename, i) => ({
    id: `${chapterId}-page-${i + 1}`,
    chapterId,
    number: i + 1,
    url: `${baseUrl}/${qualityPath}/${hash}/${filename}`,
    width: 0,
    height: 0,
    size: 0,
  }));
}