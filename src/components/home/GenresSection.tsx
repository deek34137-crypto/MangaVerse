"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Genre } from "@/types";

/* ─── Genre colour palette ───────────────────────────────────────────────── */
const GENRE_STYLES: Record<string, { from: string; to: string; text: string; glow: string }> = {
  Action:       { from: "#ff4e50", to: "#f9213b", text: "#fff",     glow: "rgba(255,78,80,0.35)" },
  Adventure:    { from: "#f7971e", to: "#ffd200", text: "#1a1a1a",  glow: "rgba(247,151,30,0.35)" },
  Comedy:       { from: "#f953c6", to: "#b91d73", text: "#fff",     glow: "rgba(249,83,198,0.35)" },
  Drama:        { from: "#6a82fb", to: "#fc5c7d", text: "#fff",     glow: "rgba(106,130,251,0.35)" },
  Fantasy:      { from: "#0f3460", to: "#533483", text: "#fff",     glow: "rgba(83,52,131,0.4)"  },
  Horror:       { from: "#1a1a2e", to: "#16213e", text: "#ff4444",  glow: "rgba(255,68,68,0.25)" },
  Romance:      { from: "#ff758c", to: "#ff7eb3", text: "#fff",     glow: "rgba(255,117,140,0.4)" },
  "Sci-Fi":     { from: "#0575e6", to: "#021b79", text: "#fff",     glow: "rgba(5,117,230,0.4)"  },
  Slice_of_Life:{ from: "#56ab2f", to: "#a8e063", text: "#fff",     glow: "rgba(86,171,47,0.35)" },
  Sports:       { from: "#f80759", to: "#ff6b6b", text: "#fff",     glow: "rgba(248,7,89,0.35)"  },
  Supernatural: { from: "#7f00ff", to: "#e100ff", text: "#fff",     glow: "rgba(127,0,255,0.4)"  },
  Mystery:      { from: "#2c3e50", to: "#3498db", text: "#fff",     glow: "rgba(52,152,219,0.35)" },
  Psychological:{ from: "#434343", to: "#000000", text: "#e8b4b8",  glow: "rgba(232,180,184,0.3)" },
  Mecha:        { from: "#12c2e9", to: "#f64f59", text: "#fff",     glow: "rgba(18,194,233,0.35)" },
  Music:        { from: "#fc466b", to: "#3f5efb", text: "#fff",     glow: "rgba(252,70,107,0.4)"  },
  Isekai:       { from: "#5f2c82", to: "#49a09d", text: "#fff",     glow: "rgba(95,44,130,0.4)"  },
};

function getStyle(name: string) {
  const clean = name.replace(/\s+/g, "_");
  return GENRE_STYLES[clean] ?? GENRE_STYLES[name] ?? {
    from: "hsl(var(--color-primary))",
    to:   "hsl(var(--color-accent))",
    text: "#fff",
    glow: "rgba(var(--primary-raw), 0.3)",
  };
}

/* ─── Bento sizes — 0=small, 1=medium, 2=tall, 3=wide ───────────────────── */
const SIZE_PATTERN = [3, 0, 0, 0, 2, 0, 1, 1, 0, 0, 0, 0, 1, 0, 0, 0];

const sizeClasses: Record<number, string> = {
  0: "col-span-1 row-span-1 min-h-[100px]",
  1: "col-span-2 row-span-1 min-h-[100px]",
  2: "col-span-1 row-span-2 min-h-[212px]",
  3: "col-span-2 row-span-2 min-h-[212px]",
};

interface GenresSectionProps {
  genres: Genre[];
  limit?: number;
  className?: string;
}

export function GenresSection({ genres, limit = 16, className }: GenresSectionProps) {
  const displayGenres = genres.slice(0, limit);

  return (
    <section className={cn("space-y-5", className)} aria-labelledby="genres-heading">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 id="genres-heading" className="text-heading-md font-display font-bold text-foreground">
            Browse by Genre
          </h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            {genres.length} genres across thousands of titles
          </p>
        </div>
        <Link
          href="/genres"
          className="flex items-center gap-1.5 text-sm font-medium text-primary hover:text-primary-hover transition-colors group"
        >
          View All
          <ArrowUpRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
        </Link>
      </div>

      {/* Bento grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 auto-rows-[100px]">
        {displayGenres.map((genre, i) => {
          const style = getStyle(genre.name);
          const sizeIdx = SIZE_PATTERN[i % SIZE_PATTERN.length];
          const sizeClass = sizeClasses[sizeIdx] ?? sizeClasses[0];
          const isBig = sizeIdx === 3 || sizeIdx === 2;

          return (
            <motion.div
              key={genre.id}
              className={cn(
                "relative overflow-hidden rounded-2xl cursor-pointer group",
                sizeClass,
              )}
              initial={{ opacity: 0, y: 20, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ delay: i * 0.04, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
              whileHover={{ y: -4, scale: 1.02 }}
              style={{
                background: `linear-gradient(135deg, ${style.from}, ${style.to})`,
                boxShadow: `0 0 0 0 ${style.glow}`,
              }}
              whileFocus={{ boxShadow: `0 0 0 3px ${style.glow}` }}
            >
              {/* Noise grain overlay */}
              <div
                className="absolute inset-0 opacity-10 mix-blend-soft-light pointer-events-none"
                style={{
                  backgroundImage: "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")",
                }}
              />

              {/* Glow pulse on hover */}
              <motion.div
                className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                style={{ boxShadow: `inset 0 0 30px ${style.glow}` }}
              />

              {/* Count circle (top-right) */}
              <div
                className="absolute top-3 right-3 px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wide opacity-70 group-hover:opacity-100 transition-opacity"
                style={{ background: "rgba(0,0,0,0.25)", color: style.text }}
              >
                {(genre.mangaCount ?? 0).toLocaleString()}
              </div>

              {/* Large decorative number */}
              {isBig && (
                <div
                  className="absolute bottom-0 right-2 text-[80px] font-display font-black leading-none opacity-10 select-none pointer-events-none"
                  style={{ color: style.text }}
                  aria-hidden="true"
                >
                  {String(i + 1).padStart(2, "0")}
                </div>
              )}

              {/* Label */}
              <Link
                href={`/genres/${genre.slug}`}
                className="absolute inset-0 flex flex-col justify-end p-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50 rounded-2xl"
                aria-label={`Browse ${genre.name} manga`}
              >
                <span
                  className={cn(
                    "font-display font-bold leading-tight",
                    isBig ? "text-xl" : "text-sm",
                  )}
                  style={{ color: style.text }}
                >
                  {genre.name}
                </span>
                {isBig && (
                  <span className="text-xs mt-0.5 opacity-75" style={{ color: style.text }}>
                    {(genre.mangaCount ?? 0).toLocaleString()} titles
                  </span>
                )}
              </Link>
            </motion.div>
          );
        })}
      </div>
    </section>
  );
}