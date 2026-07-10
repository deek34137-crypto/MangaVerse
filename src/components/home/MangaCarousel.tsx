"use client";

import { motion } from "framer-motion";
import { useState, useRef } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight, TrendingUp, Flame, Clock, Trophy } from "lucide-react";
import { Manga } from "@/types";
import { cn } from "@/lib/utils";

interface MangaCarouselProps {
  title: string;
  icon?: React.ReactNode;
  manga: Manga[];
  href?: string;
  emptyMessage?: string;
}

export function MangaCarousel({
  title,
  icon,
  manga,
  href,
  emptyMessage = "No manga available",
}: MangaCarouselProps) {
  if (!manga.length) {
    return (
      <section className="space-y-4" aria-labelledby={`${title.toLowerCase().replace(/\s+/g, "-")}-heading`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {icon && <span className="h-5 w-5 text-primary" aria-hidden="true">{icon}</span>}
            <h2 id={`${title.toLowerCase().replace(/\s+/g, "-")}-heading`} className="text-heading-lg font-display font-bold text-foreground">
              {title}
            </h2>
          </div>
        </div>
        <div className="text-center py-12 bg-muted/50 rounded-xl">
          <p className="text-muted-foreground">{emptyMessage}</p>
        </div>
      </section>
    );
  }

  const [scrollPosition, setScrollPosition] = useState(0);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const scrollLeft = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: -300, behavior: "smooth" });
    }
  };

  const scrollRight = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: 300, behavior: "smooth" });
    }
  };

  return (
    <section className="space-y-4" aria-labelledby={`${title.toLowerCase().replace(/\s+/g, "-")}-heading`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {icon && <span className="h-5 w-5 text-primary" aria-hidden="true">{icon}</span>}
          <h2 id={`${title.toLowerCase().replace(/\s+/g, "-")}-heading`} className="text-heading-lg font-display font-bold text-foreground">
            {title}
          </h2>
        </div>
        {href && (
          <Link
            href={href}
            className="text-sm text-primary hover:underline flex items-center gap-1"
          >
            View All
            <ChevronRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        )}
      </div>

      <div className="relative group">
        <div
          ref={scrollContainerRef}
          className="flex gap-4 overflow-x-auto scrollbar-hide pb-4 -mx-4 px-4"
          onScroll={(e) => setScrollPosition((e.currentTarget as HTMLDivElement).scrollLeft)}
          role="list"
          aria-label={`${title} manga`}
        >
          {manga.map((item, index) => (
            <motion.div
              key={item.id}
              layout
              role="listitem"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05, duration: 0.3 }}
              className="flex-shrink-0"
            >
              <Link
                href={`/manga/${item.id}`}
                className="group flex flex-col w-40 transition-transform duration-300"
                aria-label={`View ${item.title}`}
              >
                <div className="relative aspect-[2/3] rounded-lg overflow-hidden bg-muted">
                  {item.coverImage ? (
                    <motion.img
                      src={item.coverImage}
                      alt={item.title}
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                      loading="lazy"
                      sizes="(max-width: 640px) 160px, 140px"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-muted">
                      <span className="text-4xl" aria-hidden="true">📖</span>
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
                <div className="mt-2 space-y-1">
                  <h3 className="text-sm font-medium text-foreground line-clamp-1 group-hover:text-primary transition-colors">
                    {item.title}
                  </h3>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    {item.rating && item.rating > 0 && (
                      <span className="flex items-center gap-1 text-yellow-500">
                        <span>★</span> {item.rating.toFixed(1)}
                      </span>
                    )}
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>

        <motion.button
          onClick={scrollLeft}
          className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-3 h-10 w-10 rounded-full bg-background/90 backdrop-blur-sm border border-border flex items-center justify-center text-foreground hover:bg-background hover:border-primary transition-all z-10 opacity-0 group-hover:opacity-100"
          aria-label="Scroll left"
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
        >
          <ChevronLeft className="h-5 w-5" aria-hidden="true" />
        </motion.button>

        <motion.button
          onClick={scrollRight}
          className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-3 h-10 w-10 rounded-full bg-background/90 backdrop-blur-sm border border-border flex items-center justify-center text-foreground hover:bg-background hover:border-primary transition-all z-10 opacity-0 group-hover:opacity-100"
          aria-label="Scroll right"
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
        >
          <ChevronRight className="h-5 w-5" aria-hidden="true" />
        </motion.button>
      </div>
    </section>
  );
}