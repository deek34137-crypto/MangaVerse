import { db } from "@/db";
import { genres, manga, mangaGenres } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { notFound } from "next/navigation";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { MangaCard } from "@/components/manga/manga-card";
import type { Metadata } from "next";

interface GenreDetailPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: GenreDetailPageProps): Promise<Metadata> {
  const { slug } = await params;
  const genreResult = await db
    .select({ name: genres.name })
    .from(genres)
    .where(eq(genres.slug, slug))
    .limit(1);

  if (genreResult.length === 0) {
    return { title: "Genre Not Found" };
  }

  return {
    title: `${genreResult[0].name} Manga | MangaHub`,
    description: `Browse all high-quality manga, manhwa, and manhua categorized under ${genreResult[0].name}.`,
  };
}

export default async function GenreDetailPage({ params }: GenreDetailPageProps) {
  const { slug } = await params;

  // 1. Fetch the genre by slug
  const genreResult = await db
    .select()
    .from(genres)
    .where(eq(genres.slug, slug))
    .limit(1);

  if (genreResult.length === 0) {
    notFound();
  }

  const genre = genreResult[0];

  // 2. Fetch all manga matching this genre
  const mangaList = await db
    .select({
      id: manga.id,
      title: manga.title,
      coverImage: manga.coverImage,
      rating: manga.rating,
      status: manga.status,
      type: manga.type,
      chapterCount: manga.chapterCount,
      viewCount: manga.viewCount,
      updatedAt: manga.updatedAt,
    })
    .from(manga)
    .innerJoin(mangaGenres, eq(mangaGenres.mangaId, manga.id))
    .where(eq(mangaGenres.genreId, genre.id))
    .orderBy(desc(manga.finalTrendingScore));

  // 3. Format decimal columns to floats
  const formattedMangaList = mangaList.map((item) => ({
    ...item,
    rating: parseFloat(String(item.rating || 0)),
  }));

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-1 container-padded py-10">
        <div className="max-w-7xl mx-auto space-y-8">
          <div>
            <h1 className="text-display-sm font-display font-bold text-foreground">
              {genre.name}
            </h1>
            <p className="text-sm text-muted-foreground mt-1.5 max-w-2xl leading-relaxed">
              {genre.description || `Explore and read all manga titles in the ${genre.name} category. Discover top releases and trending hits.`}
            </p>
          </div>

          {formattedMangaList.length === 0 ? (
            <div className="bg-ink-900/40 border border-ink-800 rounded-2xl py-20 text-center max-w-md mx-auto">
              <p className="text-sm text-ink-400">No titles found in this category yet.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-x-4 gap-y-6">
              {formattedMangaList.map((m) => (
                <MangaCard key={m.id} manga={m as any} />
              ))}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
