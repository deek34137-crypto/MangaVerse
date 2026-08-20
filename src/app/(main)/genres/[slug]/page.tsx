import { db } from "@/db";
import { genres, manga, mangaGenres } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { MangaCard } from "@/components/manga/manga-card";
import { backendClient } from "@/lib/backend-client";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

interface GenreDetailPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: GenreDetailPageProps): Promise<Metadata> {
  const { slug } = await params;
  const capitalized = slug.charAt(0).toUpperCase() + slug.slice(1).replace(/-/g, " ");

  try {
    const genreResult = await db
      .select({ name: genres.name })
      .from(genres)
      .where(eq(genres.slug, slug))
      .limit(1);

    if (genreResult.length > 0) {
      return {
        title: `${genreResult[0].name} Manga | MangaHub`,
        description: `Browse all high-quality manga, manhwa, and manhua categorized under ${genreResult[0].name}.`,
      };
    }
  } catch {
    // fallback
  }

  return {
    title: `${capitalized} Manga | MangaHub`,
    description: `Browse all high-quality manga, manhwa, and manhua categorized under ${capitalized}.`,
  };
}

export default async function GenreDetailPage({ params }: GenreDetailPageProps) {
  const { slug } = await params;
  const genreTitle = slug.charAt(0).toUpperCase() + slug.slice(1).replace(/-/g, " ");

  let genreName = genreTitle;
  let genreDescription = `Explore and read all manga titles in the ${genreTitle} category. Discover top releases and trending hits.`;
  let formattedMangaList: any[] = [];

  try {
    // 1. Fetch the genre by slug from DB
    const genreResult = await db
      .select()
      .from(genres)
      .where(eq(genres.slug, slug))
      .limit(1);

    if (genreResult.length > 0) {
      const genre = genreResult[0];
      genreName = genre.name;
      if (genre.description) genreDescription = genre.description;

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

      formattedMangaList = mangaList.map((item) => ({
        ...item,
        rating: parseFloat(String(item.rating || 0)),
      }));
    }
  } catch (err) {
    console.warn(`[GenreDetailPage] DB query failed for ${slug}, falling back to worker search.`, err);
  }

  // If DB was empty or failed, fetch live items via backend worker search
  if (formattedMangaList.length === 0) {
    try {
      const searchRes = await backendClient.search(genreName, "all", 24);
      if (searchRes.results && searchRes.results.length > 0) {
        formattedMangaList = searchRes.results.map((item) => ({
          id: `${item.provider}_${item.id}`,
          title: item.title,
          coverImage: backendClient.getImageProxyUrl(item.provider, item.coverImage || ""),
          rating: item.rating ? parseFloat(String(item.rating)) : 8.5,
          status: "ongoing",
          type: "manga",
          chapterCount: item.latestChapter ? parseInt(item.latestChapter, 10) || 10 : 10,
          viewCount: 15400,
          updatedAt: item.lastUpdated || new Date().toISOString(),
        }));
      }
    } catch {
      // ignore
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-1 container-padded py-10">
        <div className="max-w-7xl mx-auto space-y-8">
          <div>
            <h1 className="text-display-sm font-display font-bold text-foreground">
              {genreName}
            </h1>
            <p className="text-sm text-muted-foreground mt-1.5 max-w-2xl leading-relaxed">
              {genreDescription}
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
