import { useRef, useState, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { MangaCard, MangaCardSkeleton } from "@/components/manga/manga-card";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { stagger, transition } from "@/animations/motion";
import type { Manga } from "@/types";

/* ─── Arrow button ───────────────────────────────────────────────────────── */
function ArrowButton({
  direction,
  onClick,
  disabled,
  style = "glass",
}: {
  direction: "left" | "right";
  onClick: () => void;
  disabled: boolean;
  style?: "glass" | "solid" | "minimal";
}) {
  const styleMap = {
    glass:
      "bg-ink-950/60 hover:bg-ink-800/80 text-foreground border border-ink-700/60 hover:border-primary/50 hover:text-primary shadow-sm backdrop-blur-md cursor-pointer",
    solid:
      "bg-primary text-primary-foreground hover:bg-primary/95 shadow-md cursor-pointer",
    minimal:
      "bg-background/80 border border-ink-800 text-ink-300 hover:text-foreground hover:border-ink-600 cursor-pointer",
  };

  return (
    <motion.button
      onClick={onClick}
      disabled={disabled}
      aria-label={direction === "left" ? "Scroll left" : "Scroll right"}
      whileHover={disabled ? undefined : { scale: 1.05 }}
      whileTap={disabled ? undefined : { scale: 0.95 }}
      className={cn(
        "h-8 w-8 rounded-full flex items-center justify-center flex-shrink-0",
        "transition-all duration-180",
        "disabled:opacity-20 disabled:pointer-events-none",
        styleMap[style]
      )}
    >
      {direction === "left" ? (
        <ChevronLeft className="h-4 w-4" />
      ) : (
        <ChevronRight className="h-4 w-4" />
      )}
    </motion.button>
  );
}

/* ─── Scroll indicator dots ──────────────────────────────────────────────── */
function ScrollIndicators({
  total,
  active,
  onSelect,
}: {
  total: number;
  active: number;
  onSelect: (i: number) => void;
}) {
  return (
    <div className="flex items-center gap-1.5" role="tablist" aria-label="Carousel position">
      {Array.from({ length: total }, (_, i) => (
        <button
          key={i}
          role="tab"
          aria-selected={i === active}
          aria-label={`Go to page ${i + 1}`}
          onClick={() => onSelect(i)}
          className={cn(
            "h-1 rounded-full transition-all duration-300 cursor-pointer",
            i === active ? "w-6 bg-primary" : "w-1.5 bg-ink-700 hover:bg-primary/40"
          )}
        />
      ))}
    </div>
  );
}

/* ─── Props ──────────────────────────────────────────────────────────────── */
interface MangaCarouselProps {
  title: string;
  items: Manga[];
  /** Optional subtitle or badge */
  subtitle?: string;
  badge?: string;
  /** Link target for "View All" */
  viewAllHref?: string;
  viewAllLabel?: string;
  /** Max items to display */
  itemLimit?: number;
  /** Loading state — renders skeleton strip */
  isLoading?: boolean;
  skeletonCount?: number;
  /** Show left/right fade edge masks */
  showFade?: boolean;
  /** Show scroll position indicator dots */
  showIndicators?: boolean;
  /** Arrow button visual style */
  arrowStyle?: "glass" | "solid" | "minimal";
  /** Card size variant */
  cardSize?: "sm" | "md" | "lg";
  /** Enable scroll snap */
  snap?: boolean;
  className?: string;
  /** aria-labelledby id for the section heading */
  headingId?: string;
}

/* ─── Card width by size ─────────────────────────────────────────────────── */
const cardWidths = {
  sm:  "w-28 sm:w-32",
  md:  "w-36 sm:w-40 md:w-44",
  lg:  "w-44 sm:w-52 md:w-56",
};

const SCROLL_AMOUNT = 320; // px per arrow click

/**
 * MangaCarousel — reusable horizontal-scroll manga strip.
 *
 * Used on: homepage sections, manga detail related/recommendations,
 * continue reading, recently viewed, trending.
 */
export function MangaCarousel({
  title,
  items,
  subtitle,
  badge,
  viewAllHref,
  viewAllLabel,
  itemLimit = 20,
  isLoading = false,
  skeletonCount = 8,
  showFade = true,
  showIndicators = false,
  arrowStyle = "glass",
  cardSize = "md",
  snap = true,
  className,
  headingId,
}: MangaCarouselProps) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);
  const [indicatorPage, setIndicatorPage] = useState(0);

  const displayItems = items.slice(0, itemLimit);
  const sectionId = headingId ?? `carousel-${title.toLowerCase().replace(/\s+/g, "-")}`;

  /* ── Update arrow/indicator state on scroll ── */
  const updateScrollState = useCallback(() => {
    const el = trackRef.current;
    if (!el) return;
    const { scrollLeft, scrollWidth, clientWidth } = el;
    setCanScrollLeft(scrollLeft > 4);
    setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 4);
    // Rough page index for indicators
    const pageWidth = clientWidth;
    setIndicatorPage(Math.round(scrollLeft / pageWidth));
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
  }, [updateScrollState, displayItems]);

  /* ── Scroll helpers ── */
  const scrollBy = useCallback((delta: number) => {
    trackRef.current?.scrollBy({ left: delta, behavior: "smooth" });
  }, []);

  const scrollToPage = useCallback((page: number) => {
    const el = trackRef.current;
    if (!el) return;
    el.scrollTo({ left: page * el.clientWidth, behavior: "smooth" });
  }, []);

  /* ── Loading skeleton ── */
  if (isLoading) {
    return (
      <section className={cn("space-y-4", className)} aria-labelledby={sectionId}>
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <div className="h-6 w-44 loading-shimmer rounded-md" />
            <div className="h-4 w-28 loading-shimmer rounded-md" />
          </div>
          <div className="h-5 w-14 loading-shimmer rounded-md" />
        </div>
        <div className="flex gap-4 overflow-hidden">
          {Array.from({ length: skeletonCount }, (_, i) => (
            <MangaCardSkeleton key={i} variant={cardSize === "lg" ? "featured" : cardSize === "sm" ? "compact" : "default"} />
          ))}
        </div>
      </section>
    );
  }

  if (!displayItems.length) return null;



  return (
    <section
      className={cn("space-y-4", className)}
      aria-labelledby={sectionId}
    >
      {/* ── Section header ── */}
      <div className="flex items-center justify-between gap-4">
        <SectionHeader
          id={sectionId}
          title={title}
          subtitle={subtitle}
          badge={badge}
          viewAllHref={viewAllHref}
          viewAllLabel={viewAllLabel}
          animate={false}
          className="flex-1"
        />

        {/* Arrow buttons — always visible on desktop */}
        <div className="hidden sm:flex items-center gap-1.5 flex-shrink-0 mt-2">
          <ArrowButton
            direction="left"
            onClick={() => scrollBy(-SCROLL_AMOUNT)}
            disabled={!canScrollLeft}
            style={arrowStyle}
          />
          <ArrowButton
            direction="right"
            onClick={() => scrollBy(SCROLL_AMOUNT)}
            disabled={!canScrollRight}
            style={arrowStyle}
          />
        </div>
      </div>

      {/* ── Scroll track wrapper ── */}
      <div className="relative">
        {/* Left fade mask */}
        {showFade && canScrollLeft && (
          <div
            className="absolute left-0 top-0 bottom-0 w-16 z-10 pointer-events-none bg-gradient-to-r from-background to-transparent"
            aria-hidden="true"
          />
        )}

        {/* Right fade mask */}
        {showFade && canScrollRight && (
          <div
            className="absolute right-0 top-0 bottom-0 w-16 z-10 pointer-events-none bg-gradient-to-l from-background to-transparent"
            aria-hidden="true"
          />
        )}

        {/* Horizontal scroll track */}
        <div
          ref={trackRef}
          className={cn(
            "flex gap-4 overflow-x-auto pb-3 -mb-3",
            "scrollbar-hide",
            snap && "scroll-snap-x-mandatory",
          )}
          style={{ scrollSnapType: snap ? "x mandatory" : undefined }}
          role="list"
          aria-label={`${title} manga`}
        >
          {displayItems.map((manga, i) => (
            <motion.div
              key={manga.id}
              role="listitem"
              className={cn("flex-shrink-0", cardWidths[cardSize])}
              style={{ scrollSnapAlign: snap ? "start" : undefined }}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ ...transition.fade, delay: stagger(i, 0.03, 0.2) }}
            >
              <MangaCard
                manga={manga}
                variant={cardSize === "lg" ? "featured" : cardSize === "sm" ? "compact" : "default"}
                priority={i < 4}
              />
            </motion.div>
          ))}
        </div>
      </div>

      {/* ── Scroll indicators + mobile arrows ── */}
      {(showIndicators || true) && (
        <div className="flex items-center justify-between mt-1">
          {/* Mobile prev/next */}
          <div className="flex sm:hidden items-center gap-1.5">
            <ArrowButton
              direction="left"
              onClick={() => scrollBy(-SCROLL_AMOUNT)}
              disabled={!canScrollLeft}
              style={arrowStyle}
            />
            <ArrowButton
              direction="right"
              onClick={() => scrollBy(SCROLL_AMOUNT)}
              disabled={!canScrollRight}
              style={arrowStyle}
            />
          </div>

          {/* Indicator dots */}
          {showIndicators && (
            <ScrollIndicators
              total={Math.max(1, Math.ceil(displayItems.length / 4))}
              active={indicatorPage}
              onSelect={scrollToPage}
            />
          )}
        </div>
      )}
    </section>
  );
}