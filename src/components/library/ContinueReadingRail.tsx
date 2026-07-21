"use client";

import Link from "next/link";
import Image from "next/image";
import { BookOpen, Play, Clock } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { formatRelativeTime } from "@/lib/utils";
import { useHaptic } from "@/hooks/useHaptic";
import type { Manga } from "@/types";

interface ContinueReadingItem {
  manga: Manga;
  chapterId: string;
  chapterNumber: string;
  lastReadAt: string;
  progressPercent: number;
}

interface ContinueReadingRailProps {
  items: ContinueReadingItem[];
}

export function ContinueReadingRail({ items }: ContinueReadingRailProps) {
  const { triggerHaptic } = useHaptic();

  if (!items || items.length === 0) return null;

  return (
    <div className="w-full space-y-3">
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-2">
          <BookOpen className="w-4 h-4 text-primary" />
          <h2 className="font-display font-semibold text-lg text-foreground tracking-tight">
            Continue Reading
          </h2>
        </div>
      </div>

      <div className="flex gap-4 overflow-x-auto pb-2 pt-1 px-1 momentum-scroll scrollbar-none">
        {items.map(({ manga, chapterId, chapterNumber, lastReadAt, progressPercent }) => (
          <Link
            key={manga.id}
            href={`/manga/${manga.id}/chapter/${chapterId}`}
            onClick={() => triggerHaptic("light")}
            className="flex-shrink-0 w-64 p-3 rounded-xl bg-ink-900/90 border border-ink-800 hover:border-primary/50 transition-all group active-press"
          >
            <div className="flex gap-3">
              <div className="relative w-16 h-22 rounded-lg overflow-hidden shrink-0 bg-ink-800">
                <Image
                  src={manga.coverImage}
                  alt={manga.title}
                  fill
                  sizes="64px"
                  className="object-cover group-hover:scale-105 transition-transform duration-300"
                />
              </div>

              <div className="flex-1 min-w-0 flex flex-col justify-between">
                <div>
                  <h3 className="font-medium text-sm text-foreground truncate group-hover:text-primary transition-colors">
                    {manga.title}
                  </h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Chapter {chapterNumber}
                  </p>
                </div>

                <div className="space-y-1.5 mt-2">
                  <div className="flex items-center justify-between text-[10px] text-ink-400">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {formatRelativeTime(lastReadAt)}
                    </span>
                    <span>{progressPercent}%</span>
                  </div>
                  <Progress value={progressPercent} className="h-1 bg-ink-800" />
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
