"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { ArrowUpRight, Compass } from "lucide-react";
import { cn } from "@/lib/utils";
import { getGenreUrl } from "@/lib/url";
import type { Genre } from "@/types";

/* ─── Apple Arcade / Netflix Style Category Palettes (Subtle Dark Gradients) ─── */
const GENRE_ACCENTS: Record<string, { gradient: string; border: string; glow: string }> = {
  Action:       { gradient: "from-red-950/60 via-red-900/30 to-ink-950",      border: "hover:border-red-500/50",    glow: "rgba(239,68,68,0.25)" },
  Adventure:    { gradient: "from-amber-950/60 via-amber-900/30 to-ink-950",  border: "hover:border-amber-500/50",  glow: "rgba(245,158,11,0.25)" },
  Comedy:       { gradient: "from-pink-950/60 via-pink-900/30 to-ink-950",    border: "hover:border-pink-500/50",   glow: "rgba(236,72,153,0.25)" },
  Drama:        { gradient: "from-purple-950/60 via-purple-900/30 to-ink-950", border: "hover:border-purple-500/50", glow: "rgba(168,85,247,0.25)" },
  Fantasy:      { gradient: "from-indigo-950/60 via-indigo-900/30 to-ink-950", border: "hover:border-indigo-500/50", glow: "rgba(99,102,241,0.25)" },
  Horror:       { gradient: "from-slate-950/80 via-zinc-900/50 to-ink-950",   border: "hover:border-red-600/50",    glow: "rgba(220,38,38,0.25)" },
  Romance:      { gradient: "from-rose-950/60 via-rose-900/30 to-ink-950",    border: "hover:border-rose-500/50",   glow: "rgba(244,63,94,0.25)" },
  "Sci-Fi":     { gradient: "from-cyan-950/60 via-cyan-900/30 to-ink-950",    border: "hover:border-cyan-500/50",   glow: "rgba(6,182,212,0.25)" },
  Slice_of_Life:{ gradient: "from-emerald-950/60 via-emerald-900/30 to-ink-950", border: "hover:border-emerald-500/50", glow: "rgba(16,185,129,0.25)" },
  Mystery:      { gradient: "from-blue-950/60 via-blue-900/30 to-ink-950",    border: "hover:border-blue-500/50",   glow: "rgba(59,130,246,0.25)" },
};

function getAccent(name: string) {
  const clean = name.replace(/\s+/g, "_");
  return GENRE_ACCENTS[clean] ?? GENRE_ACCENTS[name] ?? {
    gradient: "from-primary/20 via-ink-900/60 to-ink-950",
    border: "hover:border-primary/50",
    glow: "rgba(225,29,72,0.25)",
  };
}

interface GenresSectionProps {
  genres: Genre[];
  limit?: number;
  className?: string;
}

export function GenresSection({ genres, limit = 16, className }: GenresSectionProps) {
  const displayGenres = genres.slice(0, limit);

  return (
    <section className={cn("space-y-6", className)} aria-labelledby="genres-heading">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Compass className="h-5 w-5 text-primary" />
            <h2 id="genres-heading" className="text-2xl font-display font-bold text-foreground tracking-tight">
              Browse by Genre
            </h2>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Curated categories across thousands of manga & manhwa series
          </p>
        </div>
        <Link
          href="/genres"
          className="flex items-center gap-1.5 text-xs font-semibold text-primary hover:text-primary/80 transition-colors group px-3.5 py-1.5 rounded-full bg-primary/10 border border-primary/20"
        >
          View All Genres
          <ArrowUpRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
        </Link>
      </div>

      {/* Apple Arcade / Netflix Style Glass Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3.5">
        {displayGenres.map((genre, i) => {
          const accent = getAccent(genre.name);
          const count = genre.mangaCount || 100 + i * 25;

          return (
            <motion.div
              key={genre.id || genre.slug || genre.name}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.03, duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
              whileHover={{ y: -4, scale: 1.02 }}
              className="group relative"
            >
              <Link href={getGenreUrl(genre.slug || genre.name)} className="block focus-visible:outline-none rounded-2xl">
                <div
                  className={cn(
                    "relative overflow-hidden rounded-2xl p-4 min-h-[110px] flex flex-col justify-between border border-ink-800/80 bg-gradient-to-br transition-all duration-300 shadow-md backdrop-blur-md",
                    accent.gradient,
                    accent.border
                  )}
                >
                  {/* Subtle Noise Texture */}
                  <div
                    className="absolute inset-0 opacity-[0.03] mix-blend-overlay pointer-events-none"
                    style={{
                      backgroundImage: "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")",
                    }}
                  />

                  {/* Top line: Count pill */}
                  <div className="flex items-center justify-between z-10">
                    <span className="text-[10px] font-mono uppercase tracking-wider text-ink-300 bg-ink-950/60 px-2 py-0.5 rounded-full border border-ink-800/60">
                      {count.toLocaleString()} titles
                    </span>
                    <ArrowUpRight className="h-3.5 w-3.5 text-ink-400 opacity-0 group-hover:opacity-100 group-hover:text-primary transition-all" />
                  </div>

                  {/* Bottom line: Title */}
                  <div className="z-10 mt-4">
                    <h3 className="font-display font-bold text-base text-foreground group-hover:text-primary transition-colors">
                      {genre.name}
                    </h3>
                  </div>
                </div>
              </Link>
            </motion.div>
          );
        })}
      </div>
    </section>
  );
}