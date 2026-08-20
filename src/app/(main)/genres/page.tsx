import { db } from "@/db";
import { genres } from "@/db/schema";
import { desc } from "drizzle-orm";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { GenresSection } from "@/components/home/GenresSection";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Browse Manga Genres | MangaHub",
  description: "Browse manga, manhwa, and manhua across all categories and genres.",
};

interface GenreDisplayItem {
  id: string;
  name: string;
  slug: string;
  mangaCount: number;
  description?: string;
}

const DEFAULT_GENRES: GenreDisplayItem[] = [
  { id: "action", name: "Action", slug: "action", mangaCount: 1540, description: "High-octane battles, intense combat, and dynamic action." },
  { id: "adventure", name: "Adventure", slug: "adventure", mangaCount: 1210, description: "Epic journeys, dungeon exploration, and world-spanning quests." },
  { id: "fantasy", name: "Fantasy", slug: "fantasy", mangaCount: 1850, description: "Magic, mythical beasts, level-ups, and otherworldly realms." },
  { id: "comedy", name: "Comedy", slug: "comedy", mangaCount: 940, description: "Hilarious moments, lighthearted gags, and witty humor." },
  { id: "drama", name: "Drama", slug: "drama", mangaCount: 820, description: "Deep emotional stories, interpersonal conflict, and drama." },
  { id: "isekai", name: "Isekai", slug: "isekai", mangaCount: 1390, description: "Reincarnation, summoned heroes, and life in fantasy worlds." },
  { id: "manhwa", name: "Manhwa", slug: "manhwa", mangaCount: 2100, description: "Full-color Korean webtoons, regression, and hunter systems." },
  { id: "manhua", name: "Manhua", slug: "manhua", mangaCount: 950, description: "Martial arts cultivation, immortals, and Chinese web comics." },
  { id: "romance", name: "Romance", slug: "romance", mangaCount: 1100, description: "Love stories, romantic tension, and heartfelt relationships." },
  { id: "sci-fi", name: "Sci-Fi", slug: "sci-fi", mangaCount: 650, description: "Cyberpunk, space exploration, mecha, and advanced tech." },
  { id: "mystery", name: "Mystery", slug: "mystery", mangaCount: 520, description: "Detective work, unsolved puzzles, and plot twists." },
  { id: "supernatural", name: "Supernatural", slug: "supernatural", mangaCount: 890, description: "Demons, ghosts, occult powers, and spiritual forces." },
  { id: "shounen", name: "Shounen", slug: "shounen", mangaCount: 1780, description: "Heroic journeys, friendship, and intense rivalries." },
  { id: "seinen", name: "Seinen", slug: "seinen", mangaCount: 1120, description: "Mature themes, psychological depth, and dark fantasy." },
  { id: "martial-arts", name: "Martial Arts", slug: "martial-arts", mangaCount: 760, description: "Murim, martial cultivation, swordplay, and ancient arts." },
  { id: "slice-of-life", name: "Slice of Life", slug: "slice-of-life", mangaCount: 480, description: "Everyday moments, school life, and peaceful stories." },
];

export default async function GenresListPage() {
  let formattedGenres: GenreDisplayItem[] = DEFAULT_GENRES;

  try {
    const allGenres = await db
      .select()
      .from(genres)
      .orderBy(desc(genres.mangaCount));

    if (allGenres && allGenres.length > 0) {
      formattedGenres = allGenres.map((g) => ({
        id: g.id,
        name: g.name,
        slug: g.slug,
        mangaCount: g.mangaCount,
        description: g.description || undefined,
      }));
    }
  } catch (err) {
    console.warn("[GenresListPage] Database unavailable during render, using fallback genres.", err);
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-1 container-padded py-10">
        <div className="max-w-7xl mx-auto">
          <GenresSection genres={formattedGenres as any} limit={formattedGenres.length} />
        </div>
      </main>
      <Footer />
    </div>
  );
}
