import { Metadata } from "next";
import { notFound } from "next/navigation";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { MangaDetail } from "@/components/manga/manga-detail";
import { MangaCard } from "@/components/manga/manga-card";

interface MangaPageProps {
  params: Promise<{ id: string }>;
}

async function getMangaData(id: string) {
  const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000"}/api/manga/${id}`, {
    next: { revalidate: 60 },
  });
  if (!response.ok) return null;
  return response.json();
}

async function getChaptersData(id: string) {
  const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000"}/api/manga/${id}/chapters`, {
    next: { revalidate: 60 },
  });
  if (!response.ok) return [];
  return response.json();
}

export async function generateMetadata({ params }: MangaPageProps): Promise<Metadata> {
  const { id } = await params;
  const manga = await getMangaData(id);
  
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
  const [manga, chapters] = await Promise.all([
    getMangaData(id),
    getChaptersData(id),
  ]);

  if (!manga) {
    notFound();
  }

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