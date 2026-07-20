import type { Manga, Genre, Tag, Author, Artist, Chapter, MangaStatus, MangaType, Demographic, TagGroup, ScanlatorGroup, ChapterPage, UserMangaData, UserChapterData } from "@/types";

export { type Manga, type Genre, type Tag, type Author, type Artist, type Chapter, type MangaStatus, type MangaType, type Demographic, type TagGroup, type ScanlatorGroup, type ChapterPage, type UserMangaData, type UserChapterData } from "@/types";

export interface HeroManga {
  manga: Manga;
  editorial?: { slug: string; title: string };
}

export interface ContinueReadingItem extends Manga {
  progress: number;
  chapterId: string;
  readAt: string;
  currentChapter?: {
    id: string;
    number: number;
    title?: string;
  };
}

export interface Announcement {
  id: string;
  title: string;
  content: string;
  type: "info" | "maintenance" | "feature" | "event";
  priority: number;
  startsAt: string;
  endsAt: string | null;
  createdAt: string;
}

export interface SiteStats {
  totalManga: number;
  totalChapters: number;
  totalUsers: number;
  chaptersToday: number;
}

export type HomeSection =
  | { type: "hero"; priority: 10; data: HeroManga | null }
  | { type: "carousel"; id: "trending" | "latest" | "popular"; title: string; priority: 30 | 40 | 50; data: Manga[] }
  | { type: "continue-reading"; priority: 20; data: ContinueReadingItem[] }
  | { type: "recently-viewed"; priority: 25; data: Manga[] }
  | { type: "genres"; priority: 60; data: Genre[] }
  | { type: "announcements"; priority: 70; data: Announcement[] };

export interface HomePageData {
  sections: HomeSection[];
  stats: SiteStats;
  generatedAt: string;
}