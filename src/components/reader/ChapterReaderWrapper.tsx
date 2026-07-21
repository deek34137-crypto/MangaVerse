"use client";

import { useRouter } from "next/navigation";
import { Reader } from "./reader";
import type { Manga, Chapter } from "@/types";

interface ChapterReaderWrapperProps {
  manga: Manga;
  chapter: Chapter;
  chapters: Chapter[];
}

export function ChapterReaderWrapper({ manga, chapter, chapters }: ChapterReaderWrapperProps) {
  const router = useRouter();

  const handleChapterChange = (newChapterId: string) => {
    // Replace state so chapter jumps (Ch 10 -> Ch 11 -> Ch 12) do not pollute history stack
    router.replace(`/manga/${manga.id}/chapter/${newChapterId}`);
  };

  const handleClose = () => {
    // Smoothly step back to Manga Details page
    router.push(`/manga/${manga.id}`);
  };

  return (
    <Reader
      manga={manga}
      chapter={chapter}
      chapters={chapters}
      onChapterChange={handleChapterChange}
      onClose={handleClose}
    />
  );
}
