import { Metadata } from "next";
import { notFound } from "next/navigation";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { MangaDetail } from "@/components/manga/manga-detail";
import { MangaCard } from "@/components/manga/manga-card";

interface MangaPageProps {
  params: Promise<{ id: string }>;
}

import { getMangaDetail, getChaptersDetail } from "@/services/manga";

interface MangaPageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: MangaPageProps): Promise<Metadata> {
  const { id } = await params;
  const manga = await getMangaDetail(id);
  
  if (!manga) {
    return { title: "Manga Not Found" };
  }

  return {
    title: manga.title,
    description: manga.description?.slice(0, 160) || `Read ${manga.title} on MangaHub`,
    openGraph: {
      title: manga.title,
      description: manga.description?.slice(0, 160) || `Read ${manga.title} on MangaHub`,
      images: manga.coverImage ? [{ url: manga.coverImage }] : [],
      siteName: "MangaHub",
    },
    twitter: {
      card: "summary_large_image",
      title: manga.title,
      description: manga.description?.slice(0, 160) || `Read ${manga.title} on MangaHub`,
      images: manga.coverImage ? [manga.coverImage] : [],
    },
  };
}

export default async function MangaPage({ params }: MangaPageProps) {
  const { id } = await params;
  const t0 = performance.now();

  // Load sequentially to prevent concurrent MangaDex sync collisions
  console.log(`[MangaPage] Server fetching details for ${id}...`);
  const manga = await getMangaDetail(id);
  
  if (!manga) {
    console.warn(`[MangaPage] Manga details empty for ${id} (took ${(performance.now() - t0).toFixed(1)}ms)`);
    notFound();
  }

  const chapters = await getChaptersDetail(id);
  console.log(`[MangaPage] Fetched ${chapters.length} chapters (took ${(performance.now() - t0).toFixed(1)}ms total)`);

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1">
        <MangaDetail manga={manga} chapters={chapters} />
      </main>
      <Footer />
    </div>
  );
}