"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { Search, Sparkles, TrendingUp, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { staggerContainer, staggerChild } from "@/animations/motion";

const FEATURED_GENRES = [
  "Action", "Romance", "Fantasy", "Mystery",
  "Sci-Fi", "Slice of Life", "Horror", "Comedy",
];

const TRENDING_SEARCHES = [
  "One Piece", "Jujutsu Kaisen", "Chainsaw Man",
  "Solo Leveling", "Blue Lock", "Spy × Family",
];

interface SearchEmptyStateProps {
  /** If true, shows the pre-search landing state (no query entered yet) */
  isPreSearch?: boolean;
  /** If false (active search), shows the no-results state */
  hasQuery?: boolean;
  query?: string;
  onClearFilters?: () => void;
}

/**
 * SearchEmptyState — shown in two scenarios:
 * 1. Pre-search: user opened search page without typing (featured genres + trending)
 * 2. No results: search returned 0 items
 */
export function SearchEmptyState({
  isPreSearch = false,
  hasQuery = false,
  query,
  onClearFilters,
}: SearchEmptyStateProps) {
  if (isPreSearch) {
    return (
      <motion.div
        variants={staggerContainer()}
        initial="hidden"
        animate="visible"
        className="py-8 space-y-10"
      >
        {/* Trending searches */}
        <motion.section variants={staggerChild} aria-labelledby="trending-heading">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="h-4 w-4 text-primary" aria-hidden="true" />
            <h2
              id="trending-heading"
              className="text-sm font-bold text-foreground uppercase tracking-wider"
            >
              Trending
            </h2>
          </div>
          <div className="flex flex-wrap gap-2">
            {TRENDING_SEARCHES.map((s) => (
              <Link
                key={s}
                href={`/search?q=${encodeURIComponent(s)}`}
                className="px-4 py-2 rounded-full bg-muted/80 text-sm text-muted-foreground hover:bg-primary/10 hover:text-primary border border-border hover:border-primary/40 transition-all duration-200"
              >
                {s}
              </Link>
            ))}
          </div>
        </motion.section>

        {/* Featured genres */}
        <motion.section variants={staggerChild} aria-labelledby="browse-genres-heading">
          <div className="flex items-center gap-2 mb-4">
            <Sparkles className="h-4 w-4 text-primary" aria-hidden="true" />
            <h2
              id="browse-genres-heading"
              className="text-sm font-bold text-foreground uppercase tracking-wider"
            >
              Browse by Genre
            </h2>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {FEATURED_GENRES.map((genre, i) => (
              <Link
                key={genre}
                href={`/search?genre=${encodeURIComponent(genre)}`}
                className="group flex items-center gap-3 p-3 rounded-xl bg-card border border-border hover:border-primary/50 hover:bg-primary/5 transition-all duration-200"
              >
                <BookOpen
                  className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors flex-shrink-0"
                  aria-hidden="true"
                />
                <span className="text-sm font-medium text-foreground group-hover:text-primary transition-colors">
                  {genre}
                </span>
              </Link>
            ))}
          </div>
        </motion.section>
      </motion.div>
    );
  }

  /* ── No results state ── */
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
      className="flex flex-col items-center justify-center py-24 px-6 text-center"
      role="status"
      aria-live="polite"
    >
      <div
        className="mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-muted text-muted-foreground"
        aria-hidden="true"
      >
        <Search className="h-10 w-10 opacity-50" />
      </div>

      <h3 className="text-xl font-display font-bold text-foreground mb-2">
        No results found
      </h3>

      <p className="text-muted-foreground text-sm max-w-sm leading-relaxed mb-8">
        {query
          ? `We couldn't find anything for "${query}". Try different keywords or adjust your filters.`
          : "Try adjusting your search terms or removing some filters."}
      </p>

      <div className="flex flex-col sm:flex-row items-center gap-3">
        {onClearFilters && (
          <Button variant="outline" onClick={onClearFilters} size="sm">
            Clear filters
          </Button>
        )}
        <Button asChild size="sm">
          <Link href="/search">Browse all manga</Link>
        </Button>
      </div>

      {/* Trending suggestions below */}
      <div className="mt-10 w-full max-w-md">
        <p className="text-xs text-muted-foreground mb-3 font-medium">Try searching for:</p>
        <div className="flex flex-wrap justify-center gap-2">
          {TRENDING_SEARCHES.slice(0, 4).map((s) => (
            <Link
              key={s}
              href={`/search?q=${encodeURIComponent(s)}`}
              className="px-3 py-1.5 rounded-full bg-muted text-xs text-muted-foreground hover:bg-primary/10 hover:text-primary border border-border hover:border-primary/40 transition-all"
            >
              {s}
            </Link>
          ))}
        </div>
      </div>
    </motion.div>
  );
}
