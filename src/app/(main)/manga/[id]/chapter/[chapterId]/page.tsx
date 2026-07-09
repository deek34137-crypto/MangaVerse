import { Metadata } from "next";
import { notFound } from "next/navigation";
import { Header } from "@/components/layout/header";
import { Reader } from "@/components/reader/reader";

interface ChapterPageProps {
  params: Promise<{ id: string; chapterId: string }>;
}

async function getMangaData(id: string) {
  const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000"}/api/manga/${id}`, {
    next: { revalidate: 60 },
  });
  if (!response.ok) return null;
  return response.json();
}

async function getChapterData(mangaId: string, chapterId: string) {
  const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000"}/api/manga/${mangaId}/chapters/${chapterId}`, {
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

export async function generateMetadata({ params }: ChapterPageProps): Promise<Metadata> {
  const { id, chapterId } = await params;
  const [manga, chapter] = await Promise.all([
    getMangaData(id),
    getChapterData(id, chapterId),
  ]);
  
  if (!manga || !chapter) {
    return { title: "Chapter Not Found" };
  }

  return {
    title: `Chapter ${chapter.number} - ${manga.title}`,
    description: `Read Chapter ${chapter.number} of ${manga.title} on MangaHub`,
    openGraph: {
      title: `Chapter ${chapter.number} - ${manga.title}`,
      description: `Read Chapter ${chapter.number} of ${manga.title} on MangaHub`,
      type: "article",
      images: chapter.pages[0] ? [{ url: chapter.pages[0].url }] : [],
      siteName: "MangaHub",
    },
    twitter: {
      card: "summary_large_image",
      title: `Chapter ${chapter.number} - ${manga.title}`,
      description: `Read Chapter ${chapter.number} of ${manga.title} on MangaHub`,
      images: chapter.pages[0] ? [chapter.pages[0].url] : [],
    },
  };
}

export default async function ChapterPage({ params }: ChapterPageProps) {
  const { id, chapterId } = await params;
  const [manga, chapter, chapters] = await Promise.all([
    getMangaData(id),
    getChapterData(id, chapterId),
    getChaptersData(id),
  ]);

  if (!manga || !chapter) {
    notFound();
  }

  return (
    <div className="min-h-screen">
      <Header />
      <main className="flex-1">
        <Reader
          manga={manga}
          chapter={chapter}
          chapters={chapters}
          onChapterChange={(chapterId) => {
            window.location.href = `/manga/${id}/chapter/${chapterId}`;
          }}
          onClose={() => {
            window.location.href = `/manga/${id}`;
          }}
        />
      </main>
    </div>
  );
}