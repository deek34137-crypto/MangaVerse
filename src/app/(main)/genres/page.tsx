import { db } from "@/db";
import { genres } from "@/db/schema";
import { desc } from "drizzle-orm";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { GenresSection } from "@/components/home/GenresSection";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Browse Manga Genres | MangaHub",
  description: "Browse manga, manhwa, and manhua across all categories and genres.",
};

export default async function GenresListPage() {
  // Query all genres sorted by manga count
  const allGenres = await db
    .select()
    .from(genres)
    .orderBy(desc(genres.mangaCount));

  const formattedGenres = allGenres.map((g) => ({
    ...g,
    description: g.description ?? undefined,
  }));

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-1 container-padded py-10">
        <div className="max-w-7xl mx-auto">
          <GenresSection genres={formattedGenres} limit={formattedGenres.length} />
        </div>
      </main>
      <Footer />
    </div>
  );
}
