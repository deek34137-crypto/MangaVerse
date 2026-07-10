"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { BookOpen, Grid } from "lucide-react";
import { Manga } from "@/types";
import { cn } from "@/lib/utils";

interface GenreItem {
  id: string;
  name: string;
  slug: string;
  mangaCount: number;
}

interface GenresSectionProps {
  genres: GenreItem[];
}

export function GenresSection({ genres }: GenresSectionProps) {
  if (!genres.length) return null;

  const topGenres = genres
    .sort((a, b) => b.mangaCount - a.mangaCount)
    .slice(0, 12);

  return (
    <section className="space-y-4" aria-labelledby="genres-heading">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <BookOpen className="h-5 w-5 text-primary" aria-hidden="true" />
          <h2 id="genres-heading" className="text-heading-lg font-display font-bold text-foreground">
            Browse by Genre
          </h2>
        </div>
      </div>

      <div className="grid gap-4 grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
        {topGenres.map((genre, index) => (
          <motion.article
            key={genre.id}
            layout
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.03, duration: 0.2 }}
          >
            <Link
              href={`/search?genres=${genre.slug}`}
              className={cn(
                "group block rounded-xl overflow-hidden bg-gradient-to-br from-primary/10 to-transparent border border-border hover:border-primary/50 hover:shadow-lg transition-all duration-300",
                "p-5 flex flex-col items-center text-center"
              )}
              aria-label={`Browse ${genre.name} manga (${genre.mangaCount} titles)`}
            >
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors mb-3">
                <Grid className="h-8 w-8" aria-hidden="true" />
              </div>
              <h3 className="font-medium text-foreground group-hover:text-primary transition-colors line-clamp-1">
                {genre.name}
              </h3>
              <p className="text-xs text-muted-foreground mt-1">
                {genre.mangaCount.toLocaleString()} titles
              </p>
            </Link>
          </motion.article>
        ))}
      </div>

      <div className="text-center mt-6">
        <Link
          href="/search?view=genres"
          className="inline-flex items-center gap-2 text-primary hover:underline font-medium"
        >
          View All Genres
          <Grid className="h-4 w-4" aria-hidden="true" />
        </Link>
      </div>
    </section>
  );
}