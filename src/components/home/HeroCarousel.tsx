"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { ChevronLeft, ChevronRight, Star, BookOpen, ArrowRight } from "lucide-react";
import { Manga } from "@/types";
import { cn } from "@/lib/utils";

interface HeroCarouselProps {
  featured: Manga[];
}

export function HeroCarousel({ featured }: HeroCarouselProps) {
  if (!featured.length) {
    return (
      <section className="relative h-[60vh] min-h-[400px] flex items-center justify-center bg-gradient-to-b from-primary/10 to-transparent">
        <div className="text-center space-y-4">
          <Star className="h-16 w-16 text-primary/30 mx-auto" />
          <h2 className="text-display-md font-display font-bold text-foreground">
            Discover Your Next Favorite
          </h2>
          <p className="text-body-lg text-muted-foreground max-w-2xl mx-auto">
            Featured manga will appear here. Start exploring the library!
          </p>
          <Link href="/search">
            <button className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-colors">
              Browse Manga
              <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
            </button>
          </Link>
        </div>
      </section>
    );
  }

  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);
  const [isHovered, setIsHovered] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const itemCount = featured.length;

  const goTo = useCallback((index: number) => {
    setCurrentIndex((prev) => (index + itemCount) % itemCount);
  }, [itemCount]);

  const goNext = useCallback(() => {
    setCurrentIndex((prev) => (prev + 1) % itemCount);
  }, [itemCount]);

  const goPrev = useCallback(() => {
    setCurrentIndex((prev) => (prev - 1 + itemCount) % itemCount);
  }, [itemCount]);

  const toggleAutoPlay = useCallback(() => {
    setIsAutoPlaying((prev) => !prev);
  }, []);

  useEffect(() => {
    if (isAutoPlaying && !isHovered) {
      intervalRef.current = setInterval(() => {
        goNext();
      }, 5000);
    } else if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isAutoPlaying, isHovered, goNext]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowLeft") goPrev();
    if (e.key === "ArrowRight") goNext();
    if (e.key === " ") {
      e.preventDefault();
      toggleAutoPlay();
    }
  };

  return (
    <section
      className="relative h-[60vh] min-h-[400px] overflow-hidden"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onKeyDown={handleKeyDown}
      tabIndex={0}
      role="region"
      aria-label="Featured manga carousel"
    >
      <AnimatePresence mode="wait">
        {featured.map((manga, index) => (
          <motion.div
            key={manga.id}
            initial={{ opacity: 0 }}
            animate={{ opacity: index === currentIndex ? 1 : 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5, ease: "easeInOut" }}
            className={cn(
              "absolute inset-0 transition-opacity duration-500",
              index === currentIndex ? "z-10 opacity-100" : "z-0 opacity-0"
            )}
          >
            {manga.coverImage && (
              <img
                src={manga.coverImage}
                alt={manga.title}
                className="w-full h-full object-cover"
                loading={index === 0 ? "eager" : "lazy"}
              />
            )}
            <div className="absolute inset-0 bg-gradient-to-r from-background/90 via-background/50 to-transparent" />
          </motion.div>
        ))}
      </AnimatePresence>

      <div className="relative z-20 h-full container-padded flex items-center">
        {itemCount > 1 && (
          <>
            <motion.button
              onClick={goPrev}
              className="absolute left-4 top-1/2 -translate-y-1/2 h-12 w-12 rounded-full bg-background/80 backdrop-blur-sm border border-border flex items-center justify-center text-foreground hover:bg-background hover:border-primary transition-all z-20 disabled:opacity-50 disabled:pointer-events-none"
              disabled={false}
              aria-label="Previous"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
            >
              <ChevronLeft className="h-6 w-6" />
            </motion.button>

            <div className="max-w-4xl mx-auto px-4">
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentIndex}
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -30 }}
                  transition={{ duration: 0.4, ease: "easeOut" }}
                >
                  <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">
                    <Star className="h-4 w-4" />
                    Featured
                  </span>
                  <h1 className="text-display-xl font-display font-bold text-foreground mb-4 line-clamp-2">
                    {featured[currentIndex].title}
                  </h1>
                  {featured[currentIndex].description && (
                    <p className="text-body-lg text-muted-foreground mb-6 line-clamp-3 max-w-2xl">
                      {featured[currentIndex].description}
                    </p>
                  )}
                  <div className="flex flex-wrap items-center gap-4">
                    <Link href={`/manga/${featured[currentIndex].id}`}>
                      <button className="group inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-colors">
                        Start Reading
                        <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
                      </button>
                    </Link>
                    <Link href={`/manga/${featured[currentIndex].id}`}>
                      <button className="group inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-border bg-transparent hover:bg-accent hover:text-accent-foreground transition-colors">
                        <BookOpen className="h-5 w-5" />
                        Details
                      </button>
                    </Link>
                  </div>
                </motion.div>
              </AnimatePresence>
            </div>

            <motion.button
              onClick={goNext}
              className="absolute right-4 top-1/2 -translate-y-1/2 h-12 w-12 rounded-full bg-background/80 backdrop-blur-sm border border-border flex items-center justify-center text-foreground hover:bg-background hover:border-primary transition-all z-20"
              aria-label="Next"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
            >
              <ChevronRight className="h-6 w-6" />
            </motion.button>
          </>
        )}
      </div>

      {itemCount > 1 && (
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-2 z-20">
          {featured.map((_, i) => (
            <motion.button
              key={i}
              onClick={() => setCurrentIndex(i)}
              className={cn(
                "h-2 w-2 rounded-full transition-all",
                i === currentIndex
                  ? "w-8 bg-primary"
                  : "bg-border hover:bg-primary/50"
              )}
              whileHover={{ scale: 1.2 }}
              aria-label={`Go to slide ${i + 1}`}
              aria-current={i === currentIndex ? "true" : "false"}
            />
          ))}
        </div>
      )}

      <div className="absolute bottom-4 right-4 flex items-center gap-2 z-20">
        <motion.button
          onClick={toggleAutoPlay}
          className="p-2 rounded-full bg-background/80 backdrop-blur-sm border border-border text-foreground hover:bg-background hover:border-primary transition-all"
          aria-label={isAutoPlaying ? "Pause auto-play" : "Resume auto-play"}
          whileHover={{ scale: 1.1 }}
        >
          {isAutoPlaying ? (
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
              <rect x="6" y="4" width="4" height="16" />
              <rect x="14" y="4" width="4" height="16" />
            </svg>
          ) : (
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
              <path d="M8 5v14l11-7z" />
            </svg>
          )}
        </motion.button>
      </div>
    </section>
  );
}