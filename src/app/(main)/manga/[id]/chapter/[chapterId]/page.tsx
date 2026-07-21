import { Metadata } from "next";
import { notFound } from "next/navigation";
import { Header } from "@/components/layout/header";
import { ChapterReaderWrapper } from "@/components/reader/ChapterReaderWrapper";
import { getMangaDetail, getChapterDetail, getChaptersDetail } from "@/services/manga";

interface ChapterPageProps {
  params: Promise<{ id: string; chapterId: string }>;
}

export async function generateMetadata({ params }: ChapterPageProps): Promise<Metadata> {
  const { id, chapterId } = await params;
  const [manga, chapter] = await Promise.all([
    getMangaDetail(id),
    getChapterDetail(id, chapterId),
  ]);
  
  if (!manga || !chapter) {
    return { title: "Chapter Not Found" };
  }

  const firstPageUrl = chapter.pages && chapter.pages[0] ? chapter.pages[0].url : "";

  return {
    title: `Chapter ${chapter.number} - ${manga.title}`,
    description: `Read Chapter ${chapter.number} of ${manga.title} on MangaHub`,
    openGraph: {
      title: `Chapter ${chapter.number} - ${manga.title}`,
      description: `Read Chapter ${chapter.number} of ${manga.title} on MangaHub`,
      type: "article",
      images: firstPageUrl ? [{ url: firstPageUrl }] : [],
      siteName: "MangaHub",
    },
    twitter: {
      card: "summary_large_image",
      title: `Chapter ${chapter.number} - ${manga.title}`,
      description: `Read Chapter ${chapter.number} of ${manga.title} on MangaHub`,
      images: firstPageUrl ? [firstPageUrl] : [],
    },
  };
}

export default async function ChapterPage({ params }: ChapterPageProps) {
  const { id, chapterId } = await params;
  const t0 = performance.now();

  console.log(`[ChapterPage] Server fetching details for manga ${id}, chapter ${chapterId}...`);
  const manga = await getMangaDetail(id);
  
  if (!manga) {
    console.warn(`[ChapterPage] Manga not found for ${id} (took ${(performance.now() - t0).toFixed(1)}ms)`);
    notFound();
  }

  const chapter = await getChapterDetail(id, chapterId);
  if (!chapter) {
    console.warn(`[ChapterPage] Chapter ${chapterId} not found for manga ${id} (took ${(performance.now() - t0).toFixed(1)}ms)`);
    notFound();
  }

  const chapters = await getChaptersDetail(id);
  console.log(`[ChapterPage] Loaded all data successfully (took ${(performance.now() - t0).toFixed(1)}ms total)`);

  return (
    <div className="min-h-screen">
      <Header />
      <main className="flex-1">
        <ChapterReaderWrapper
          manga={manga}
          chapter={chapter}
          chapters={chapters}
        />
      </main>
    </div>
  );
}