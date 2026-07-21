"use client";

import {
  useState, useCallback, useRef,
} from "react";
import { motion, AnimatePresence, useMotionValue, useTransform, useSpring } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { Star, BookOpen, ArrowRight, Play, Pause, Eye } from "lucide-react";
import { cn, formatNumber, getProxiedImageUrl } from "@/lib/utils";
import type { Manga } from "@/types";

interface HeroCarouselProps {
  featured: Manga[];
  className?: string;
}

/* ── Animated word-by-word title ─────────────────────────────────────────── */
function AnimatedTitle({ title, animationKey }: { title: string; animationKey: string }) {
  const words = title.split(" ");
  return (
    <h1
      key={animationKey}
      className="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-display font-bold text-foreground mb-4 leading-[1.1]"
      aria-label={title}
    >
      {words.map((word, i) => (
        <span key={i} className="inline-block overflow-hidden mr-[0.25em]">
          <motion.span
            className="inline-block"
            initial={{ y: "110%", opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{
              duration: 0.55,
              delay: i * 0.08,
              ease: [0.22, 1, 0.36, 1],
            }}
          >
            {word}
          </motion.span>
        </span>
      ))}
    </h1>
  );
}

/* ── 3-D tilt cover card ─────────────────────────────────────────────────── */
function TiltCover({ manga }: { manga: Manga }) {
  const cardRef = useRef<HTMLDivElement>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const rotateX = useSpring(useTransform(y, [-1, 1], [8, -8]), { stiffness: 300, damping: 30 });
  const rotateY = useSpring(useTransform(x, [-1, 1], [-8, 8]), { stiffness: 300, damping: 30 });
  const glare   = useSpring(useTransform(x, [-1, 1], [0, 0.4]), { stiffness: 300, damping: 30 });

  const handleMouse = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = cardRef.current?.getBoundingClientRect();
    if (!rect) return;
    x.set(((e.clientX - rect.left) / rect.width - 0.5) * 2);
    y.set(((e.clientY - rect.top)  / rect.height - 0.5) * 2);
  };

  const reset = () => { x.set(0); y.set(0); };

  return (
    <motion.div
      ref={cardRef}
      onMouseMove={handleMouse}
      onMouseLeave={reset}
      style={{ rotateX, rotateY, transformStyle: "preserve-3d", perspective: 800 }}
      className="relative w-56 md:w-64 aspect-[2/3] rounded-2xl overflow-hidden shadow-2xl cursor-pointer flex-shrink-0"
    >
      {manga.coverImage && (
        <Image
          src={getProxiedImageUrl(manga.coverImage)}
          alt={manga.title}
          fill
          className="object-cover"
          priority
          sizes="(max-width: 768px) 224px, 256px"
          quality={90}
        />
      )}
      {/* Glare */}
      <motion.div
        className="absolute inset-0 rounded-2xl pointer-events-none"
        style={{
          background: useTransform(
            glare,
            (v) =>
              `linear-gradient(135deg, rgba(255,255,255,${v}) 0%, transparent 60%)`
          ),
        }}
      />
    </motion.div>
  );
}

/* ── Progress bar ────────────────────────────────────────────────────────── */
function ProgressBar({ duration, isPlaying, onComplete }: { duration: number; isPlaying: boolean; onComplete: () => void }) {
  return (
    <div className="h-0.5 w-full bg-border/50 rounded-full overflow-hidden">
      <motion.div
        className="h-full bg-primary rounded-full origin-left"
        initial={{ scaleX: 0 }}
        animate={isPlaying ? { scaleX: 1 } : {}}
        transition={isPlaying ? { duration, ease: "linear" } : { duration: 0 }}
        onAnimationComplete={isPlaying ? onComplete : undefined}
        key={isPlaying ? "playing" : "paused"}
      />
    </div>
  );
}

/* ── Main component ──────────────────────────────────────────────────────── */
export function HeroCarousel({ featured, className }: HeroCarouselProps) {
  const [current, setCurrent] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [hovered, setHovered] = useState(false);

  const count = featured.length;

  const goNext = useCallback(() => setCurrent((p) => (p + 1) % count), [count]);
  const goPrev = useCallback(() => setCurrent((p) => (p - 1 + count) % count), [count]);

  // Pause on hover
  const autoPlay = isPlaying && !hovered;

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowLeft")   goPrev();
    if (e.key === "ArrowRight")  goNext();
    if (e.key === " ")           { e.preventDefault(); setIsPlaying((p) => !p); }
  };

  /* ── Empty state ── */
  if (!count) {
    return null;
  }

  const manga = featured[current];

  return (
    <section
      className={cn("relative min-h-[420px] sm:min-h-[500px] lg:h-[80vh] lg:min-h-[600px] max-h-[850px] overflow-hidden bg-background select-none py-6 lg:py-0", className)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onKeyDown={handleKey}
      tabIndex={0}
      role="region"
      aria-label="Featured manga carousel"
      aria-live="polite"
    >
      {/* ── Cinematic background ambient glow ── */}
      <AnimatePresence mode="wait">
        {featured.map((m, i) =>
          i === current ? (
            <motion.div
              key={m.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.18 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.8, ease: "easeInOut" }}
              className="absolute inset-0 z-0 pointer-events-none"
            >
              {m.coverImage && (
                <Image
                  src={getProxiedImageUrl(m.coverImage)}
                  alt=""
                  fill
                  className="object-cover blur-3xl scale-120 saturate-150"
                  priority={i === 0}
                  sizes="100vw"
                  quality={60}
                  aria-hidden="true"
                />
              )}
            </motion.div>
          ) : null
        )}
      </AnimatePresence>
 
      {/* ── Layered Gradient Overlay System ── */}
      <div className="absolute inset-0 bg-gradient-to-r from-background via-background/70 to-background/20 z-10 pointer-events-none" />
      <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-background/40 z-10 pointer-events-none" />
 
      {/* ── Noise grain texture ── */}
      <div className="absolute inset-0 z-10 opacity-[0.015] mix-blend-overlay pointer-events-none"
        style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")" }}
      />
 
      {/* ── Main content layout ── */}
      <div className="relative z-20 h-full container-padded flex items-center pt-20 pb-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center w-full">

          {/* Left — text metadata & CTAs (7 cols) */}
          <div className="lg:col-span-7 flex flex-col justify-center text-left max-w-2xl">
            {/* Tag Badges */}
            <AnimatePresence mode="wait">
              <motion.div
                key={`badge-${current}`}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3 }}
                className="mb-4 flex flex-wrap items-center gap-2"
              >
                <span className="magazine-label">
                  <Star className="h-3 w-3 mr-1 fill-primary-foreground" />
                  Editor Recommendation
                </span>
                {manga.type && (
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-ink-800 text-ink-100 border border-ink-700/60">
                    {manga.type}
                  </span>
                )}
                {manga.status && (
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-green-500/10 text-green-400 border border-green-500/20">
                    {manga.status}
                  </span>
                )}
              </motion.div>
            </AnimatePresence>

            {/* Animated Title */}
            <AnimatePresence mode="wait">
              <AnimatedTitle key={`title-${current}`} animationKey={`title-${current}`} title={manga.title} />
            </AnimatePresence>

            {/* Description */}
            <AnimatePresence mode="wait">
              {manga.description && (
                <motion.p
                  key={`desc-${current}`}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -12 }}
                  transition={{ duration: 0.45, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
                  className="text-ink-200 text-sm mb-5 line-clamp-3 max-w-xl leading-relaxed"
                >
                  {manga.description}
                </motion.p>
              )}
            </AnimatePresence>

            {/* Meta stats chips */}
            <AnimatePresence mode="wait">
              <motion.div
                key={`meta-${current}`}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.4, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
                className="flex flex-wrap items-center gap-3 mb-6"
              >
                {manga.rating && (
                  <span className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-ink-900/60 border border-ink-800/40 text-xs font-semibold text-foreground">
                    <Star className="h-3.5 w-3.5 text-yellow-400 fill-yellow-400" />
                    <span>{parseFloat(String(manga.rating)).toFixed(1)}</span>
                  </span>
                )}
                {manga.viewCount && (
                  <span className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-ink-900/60 border border-ink-800/40 text-xs text-ink-300">
                    <Eye className="h-3.5 w-3.5" />
                    <span>{formatNumber(manga.viewCount)} views</span>
                  </span>
                )}
                {manga.genres?.length > 0 && (
                  <div className="flex gap-1.5 flex-wrap">
                    {manga.genres.slice(0, 2).map((g: { id?: string; name?: string } | string) => {
                      const name = typeof g === "string" ? g : g.name;
                      const key = typeof g === "string" ? g : (g.id ?? g.name ?? String(g));
                      return (
                        <span key={key} className="px-2.5 py-1 rounded-lg bg-primary/10 border border-primary/20 text-primary text-xs font-medium">
                          {name}
                        </span>
                      );
                    })}
                  </div>
                )}
              </motion.div>
            </AnimatePresence>

            {/* CTA Buttons */}
            <AnimatePresence mode="wait">
              <motion.div
                key={`cta-${current}`}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.45, delay: 0.22, ease: [0.22, 1, 0.36, 1] }}
                className="flex flex-wrap items-center gap-3"
              >
                <Link href={`/manga/${manga.id}`}>
                  <motion.button
                    className="group inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-primary text-primary-foreground font-semibold text-sm shadow-md hover:bg-primary/90 transition-all cursor-pointer"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <BookOpen className="h-4 w-4" />
                    Start Reading
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                  </motion.button>
                </Link>
                <Link href={`/manga/${manga.id}`}>
                  <motion.button
                    className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-ink-900/60 border border-ink-700/60 text-foreground font-medium text-sm hover:bg-ink-800/80 transition-all cursor-pointer"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    View Details
                  </motion.button>
                </Link>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Right — Floating Artwork composition (5 cols) */}
          <div className="hidden lg:flex lg:col-span-5 justify-center items-center">
            <AnimatePresence mode="wait">
              <motion.div
                key={`cover-${current}`}
                initial={{ opacity: 0, x: 40, scale: 0.95 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                exit={{ opacity: 0, x: -40, scale: 0.95 }}
                transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                className="relative"
              >
                {/* Glow ring shadow behind card */}
                <div className="absolute inset-0 bg-primary/20 blur-2xl rounded-2xl -z-10 scale-95" />
                <TiltCover manga={manga} />
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>
 
      {/* ── Bottom Controls bar ── */}
      <div className="absolute bottom-4 left-0 right-0 z-30 container-padded">
        <div className="flex items-center gap-4">
          {/* Slide dots */}
          <div className="flex items-center gap-1.5" role="tablist" aria-label="Carousel slides">
            {featured.map((m, i) => (
              <motion.button
                key={m.id}
                onClick={() => setCurrent(i)}
                role="tab"
                aria-selected={i === current}
                aria-label={`Go to ${m.title}`}
                className={cn(
                  "h-1 rounded-full transition-all duration-300 cursor-pointer",
                  i === current ? "bg-primary w-6" : "bg-border w-2 hover:bg-primary/50"
                )}
                whileTap={{ scale: 0.85 }}
              />
            ))}
          </div>

          {/* Progress bar */}
          <div className="flex-1 max-w-32 hidden md:block">
            <ProgressBar
              duration={6}
              isPlaying={autoPlay}
              onComplete={goNext}
              key={`prog-${current}-${autoPlay}`}
            />
          </div>

          {/* Play/Pause */}
          <motion.button
            onClick={() => setIsPlaying((p) => !p)}
            className="p-1.5 rounded-full bg-ink-900/60 border border-ink-800/60 text-ink-300 hover:text-foreground hover:border-primary/50 transition-all cursor-pointer"
            aria-label={isPlaying ? "Pause" : "Play"}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            {isPlaying ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
          </motion.button>

          {/* Scroll Down Indicator */}
          <div className="hidden lg:flex items-center gap-1 ml-auto text-ink-400 text-xs animate-pulse">
            <span>Scroll Down</span>
            <ArrowRight className="h-3.5 w-3.5 rotate-90" />
          </div>

          {/* Desktop Arrow Nav */}
          <div className="flex items-center gap-1.5 ml-auto lg:ml-2">
            <motion.button
              onClick={goPrev}
              className="h-8 w-8 rounded-full bg-ink-900/60 border border-ink-800/60 flex items-center justify-center text-ink-300 hover:text-foreground hover:border-primary/50 transition-all cursor-pointer"
              aria-label="Previous slide"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24"><path d="M15 18l-6-6 6-6"/></svg>
            </motion.button>
            <motion.button
              onClick={goNext}
              className="h-8 w-8 rounded-full bg-ink-900/60 border border-ink-800/60 flex items-center justify-center text-ink-300 hover:text-foreground hover:border-primary/50 transition-all cursor-pointer"
              aria-label="Next slide"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24"><path d="M9 18l6-6-6-6"/></svg>
            </motion.button>
          </div>
        </div>
      </div>
    </section>
  );
}