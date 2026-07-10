"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Clock, ArrowRight, BookOpen, CheckCircle } from "lucide-react";
import { Manga } from "@/types";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";

interface ContinueReadingItem extends Manga {
  progress: number;
  chapterId: string;
  readAt: string;
  currentChapter?: {
    id: string;
    number: number;
    title?: string;
  };
}

interface ContinueReadingSectionProps {
  items: ContinueReadingItem[];
}

export function ContinueReadingSection({ items }: ContinueReadingSectionProps) {
  if (!items.length) {
    return (
      <section className="space-y-4" aria-labelledby="continue-reading-heading">
        <h2 id="continue-reading-heading" className="text-heading-lg font-display font-bold text-foreground flex items-center gap-2">
          <Clock className="h-5 w-5 text-primary" aria-hidden="true" />
          Continue Reading
        </h2>
        <div className="bg-muted/50 rounded-xl p-8 text-center">
          <BookOpen className="h-12 w-12 text-muted-foreground/50 mx-auto mb-4" aria-hidden="true" />
          <h3 className="text-heading-sm font-semibold text-foreground mb-2">
            No Reading History Yet
          </h3>
          <p className="text-muted-foreground mb-6 max-w-md mx-auto">
            Start reading a manga and it will appear here so you can pick up where you left off.
          </p>
          <a href="/search">
            <Button size="lg" className="group">
              Browse Manga
              <ArrowRight className="h-5 w-5 ml-2 transition-transform group-hover:translate-x-1" aria-hidden="true" />
            </Button>
          </a>
        </div>
      </section>
    );
  }

  return (
    <section className="space-y-4" aria-labelledby="continue-reading-heading">
      <h2 id="continue-reading-heading" className="text-heading-lg font-display font-bold text-foreground flex items-center gap-2">
        <Clock className="h-5 w-5 text-primary" aria-hidden="true" />
        Continue Reading
      </h2>

      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {items.map((item, index) => (
          <motion.article
            key={item.id}
            layout
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05, duration: 0.3 }}
            className="group"
          >
            <Link
              href={`/manga/${item.id}/chapter/${item.currentChapter?.id || item.chapterId}`}
              className="block"
              aria-label={`Continue reading ${item.title} - Chapter ${item.currentChapter?.number || "?"}`}
            >
              <div className="relative aspect-[2/3] rounded-lg overflow-hidden bg-muted">
                {item.coverImage ? (
                  <motion.img
                    src={item.coverImage}
                    alt={item.title}
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                    loading="lazy"
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-muted">
                    <span className="text-4xl" aria-hidden="true">📖</span>
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-transparent to-transparent" />
              </div>
              <div className="mt-3 space-y-2">
                <h3 className="font-medium text-foreground line-clamp-1 group-hover:text-primary transition-colors">
                  {item.title}
                </h3>
                {item.currentChapter && (
                  <p className="text-sm text-muted-foreground flex items-center gap-1">
                    <BookOpen className="h-3.5 w-3.5" aria-hidden="true" />
                    Ch. {item.currentChapter.number}
                    {item.currentChapter.title && ` - ${item.currentChapter.title}`}
                  </p>
                )}
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>Progress</span>
                    <span className="font-medium text-foreground">{Math.round(item.progress)}%</span>
                  </div>
                  <Progress value={item.progress} className="h-2" aria-label={`${Math.round(item.progress)}% complete`} />
                </div>
                <p className="text-xs text-muted-foreground">
                  {new Date(item.readAt).toLocaleDateString(undefined, {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
                </p>
              </div>
            </Link>
          </motion.article>
        ))}
      </div>
    </section>
  );
}