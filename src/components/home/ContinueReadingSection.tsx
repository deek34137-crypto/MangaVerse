import { useRef, useState, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { Clock, BookOpen, ChevronLeft, ChevronRight } from "lucide-react";
import { Manga } from "@/types";
import { cn, formatRelativeTime, getProxiedImageUrl } from "@/lib/utils";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { stagger, transition } from "@/animations/motion";

export interface ContinueReadingItem extends Manga {
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
  className?: string;
}

const SCROLL_AMOUNT = 300;

export function ContinueReadingSection({ items, className }: ContinueReadingSectionProps) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const updateScrollState = useCallback(() => {
    const el = trackRef.current;
    if (!el) return;
    const { scrollLeft, scrollWidth, clientWidth } = el;
    setCanScrollLeft(scrollLeft > 4);
    setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 4);
  }, []);

  useEffect(() => {
    const el = trackRef.current;
    if (!el) return;
    updateScrollState();
    el.addEventListener("scroll", updateScrollState, { passive: true });
    const ro = new ResizeObserver(updateScrollState);
    ro.observe(el);
    return () => {
      el.removeEventListener("scroll", updateScrollState);
      ro.disconnect();
    };
  }, [updateScrollState, items]);

  const scrollBy = useCallback((delta: number) => {
    trackRef.current?.scrollBy({ left: delta, behavior: "smooth" });
  }, []);

  if (!items.length) {
    return (
      <section className={cn("space-y-4", className)} aria-labelledby="continue-reading-heading">
        <SectionHeader
          id="continue-reading-heading"
          title="Continue Reading"
          subtitle="Pick up where you left off"
        />
        <div className="bg-ink-900/40 border border-ink-800 rounded-2xl p-8 text-center max-w-lg mx-auto">
          <BookOpen className="h-10 w-10 text-ink-500 mx-auto mb-3" />
          <h3 className="text-sm font-bold text-foreground mb-1">No Reading History Yet</h3>
          <p className="text-xs text-ink-400 mb-5 leading-normal max-w-sm mx-auto">
            Start reading a manga and it will appear here so you can pick up where you left off.
          </p>
          <Link href="/search">
            <button className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-primary text-primary-foreground font-semibold text-xs hover:bg-primary/95 transition-all cursor-pointer">
              <BookOpen className="h-3.5 w-3.5" />
              Start Reading
            </button>
          </Link>
        </div>
      </section>
    );
  }

  return (
    <section className={cn("space-y-4", className)} aria-labelledby="continue-reading-heading">
      <div className="flex items-center justify-between gap-4">
        <SectionHeader
          id="continue-reading-heading"
          title="Continue Reading"
          subtitle="Pick up where you left off"
          className="flex-1"
        />
        <div className="hidden sm:flex items-center gap-1.5 flex-shrink-0 mt-2">
          <motion.button
            onClick={() => scrollBy(-SCROLL_AMOUNT)}
            disabled={!canScrollLeft}
            className="h-8 w-8 rounded-full flex items-center justify-center flex-shrink-0 transition-all duration-180 disabled:opacity-20 disabled:pointer-events-none bg-ink-950/60 hover:bg-ink-800/80 text-foreground border border-ink-700/60 hover:border-primary/50 hover:text-primary shadow-sm backdrop-blur-md cursor-pointer"
            whileHover={!canScrollLeft ? undefined : { scale: 1.05 }}
            whileTap={!canScrollLeft ? undefined : { scale: 0.95 }}
          >
            <ChevronLeft className="h-4 w-4" />
          </motion.button>
          <motion.button
            onClick={() => scrollBy(SCROLL_AMOUNT)}
            disabled={!canScrollRight}
            className="h-8 w-8 rounded-full flex items-center justify-center flex-shrink-0 transition-all duration-180 disabled:opacity-20 disabled:pointer-events-none bg-ink-950/60 hover:bg-ink-800/80 text-foreground border border-ink-700/60 hover:border-primary/50 hover:text-primary shadow-sm backdrop-blur-md cursor-pointer"
            whileHover={!canScrollRight ? undefined : { scale: 1.05 }}
            whileTap={!canScrollRight ? undefined : { scale: 0.95 }}
          >
            <ChevronRight className="h-4 w-4" />
          </motion.button>
        </div>
      </div>

      <div className="relative">
        {/* Left Fade */}
        {canScrollLeft && (
          <div className="absolute left-0 top-0 bottom-0 w-16 z-10 pointer-events-none bg-gradient-to-r from-background to-transparent" />
        )}
        {/* Right Fade */}
        {canScrollRight && (
          <div className="absolute right-0 top-0 bottom-0 w-16 z-10 pointer-events-none bg-gradient-to-l from-background to-transparent" />
        )}

        <div
          ref={trackRef}
          className="flex gap-4 overflow-x-auto pb-3 -mb-3 scrollbar-hide scroll-snap-x-mandatory"
          style={{ scrollSnapType: "x mandatory" }}
          role="list"
        >
          <AnimatePresence mode="popLayout">
            {items.map((item, i) => (
              <motion.article
                key={item.id}
                role="listitem"
                className="w-36 sm:w-40 md:w-44 flex-shrink-0 flex flex-col scroll-snap-align-start group"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ ...transition.fade, delay: stagger(i, 0.03, 0.2) }}
              >
                <Link
                  href={`/manga/${item.id}/chapter/${item.currentChapter?.id || item.chapterId}`}
                  className="block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 rounded-2xl"
                  aria-label={`Continue reading ${item.title} - Chapter ${item.currentChapter?.number || "?"}`}
                >
                  <div className="relative aspect-[2/3] rounded-2xl overflow-hidden bg-ink-900 border border-ink-800 group-hover:border-primary/40 group-hover:shadow-lg transition-all duration-200">
                    {item.coverImage ? (
                      <img
                        src={getProxiedImageUrl(item.coverImage)}
                        alt=""
                        className="w-full h-full object-cover transition-transform duration-300 ease-out group-hover:scale-105"
                        loading="lazy"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-ink-900 to-ink-850">
                        <BookOpen className="h-6 w-6 text-ink-500" />
                      </div>
                    )}
                    {/* Dark gradient blur over image */}
                    <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-transparent to-transparent pointer-events-none" />

                    {/* Progress Bar overlay */}
                    <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-ink-950/80 pointer-events-none">
                      <div
                        className="bg-primary h-full rounded-r-md transition-all duration-300"
                        style={{ width: `${item.progress}%` }}
                      />
                    </div>
                  </div>

                  <div className="mt-2 px-0.5 space-y-1 text-left flex-1 flex flex-col justify-between">
                    <div>
                      <h3 className="text-xs font-semibold text-foreground line-clamp-1 group-hover:text-primary transition-colors duration-150">
                        {item.title}
                      </h3>
                      {item.currentChapter && (
                        <p className="text-[10px] text-ink-400 font-medium mt-0.5 truncate flex items-center gap-1">
                          <BookOpen className="h-3 w-3 text-ink-500" />
                          Ch. {item.currentChapter.number}
                          {item.currentChapter.title && <span className="text-ink-600 truncate">• {item.currentChapter.title}</span>}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center justify-between text-[9px] text-ink-500 mt-1.5 pt-1 border-t border-ink-800/40">
                      <span>{Math.round(item.progress)}% done</span>
                      <span className="flex items-center gap-1"><Clock className="h-2.5 w-2.5 text-ink-500" />{formatRelativeTime(item.readAt)}</span>
                    </div>
                  </div>
                </Link>
              </motion.article>
            ))}
          </AnimatePresence>
        </div>
      </div>
    </section>
  );
}