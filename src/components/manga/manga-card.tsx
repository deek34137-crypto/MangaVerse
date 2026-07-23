"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { BookOpen, Heart, Bookmark, Clock, Eye, Star, Plus, Check, TrendingUp } from "lucide-react";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn, formatNumber, formatRelativeTime, getProxiedImageUrl, formatChapterLabel } from "@/lib/utils";
import type { Manga, LibraryStatus } from "@/types";

/* ─── Status config ──────────────────────────────────────────────────────── */
const STATUS_CONFIG: Record<LibraryStatus, { label: string; color: string; dot: string }> = {
  reading:       { label: "Reading",       color: "text-primary border-primary/40 bg-primary/10",         dot: "bg-primary" },
  completed:     { label: "Completed",     color: "text-green-400 border-green-500/40 bg-green-500/10",   dot: "bg-green-400" },
  on_hold:       { label: "On Hold",       color: "text-yellow-400 border-yellow-500/40 bg-yellow-500/10", dot: "bg-yellow-400" },
  dropped:       { label: "Dropped",       color: "text-red-400 border-red-500/40 bg-red-500/10",          dot: "bg-red-400" },
  plan_to_read:  { label: "Plan to Read",  color: "text-muted-foreground border-border bg-muted/50",       dot: "bg-muted-foreground" },
  rereading:     { label: "Rereading",     color: "text-purple-400 border-purple-500/40 bg-purple-500/10", dot: "bg-purple-400" },
};

const TYPE_COLORS: Record<string, string> = {
  manga:    "bg-primary/20 text-primary",
  manhwa:   "bg-cyan-500/20 text-cyan-400",
  manhua:   "bg-orange-500/20 text-orange-400",
  novel:    "bg-purple-500/20 text-purple-400",
  oneshot:  "bg-yellow-500/20 text-yellow-400",
  doujinshi:"bg-red-500/20 text-red-400",
};

/* ─── Props ──────────────────────────────────────────────────────────────── */
interface MangaCardProps {
  manga: Manga;
  variant?: "default" | "compact" | "featured";
  showLibraryStatus?: boolean;
  libraryStatus?: LibraryStatus;
  onLibraryStatusChange?: (mangaId: string, status: LibraryStatus | null) => void;
  priority?: boolean;
}

/* ─── Main Card ──────────────────────────────────────────────────────────── */
export function MangaCard({
  manga,
  variant = "default",
  showLibraryStatus = true,
  libraryStatus,
  onLibraryStatusChange,
  priority = false,
}: MangaCardProps) {
  const [hovered, setHovered] = useState(false);
  const [addedFeedback, setAddedFeedback] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);

  const isCompact  = variant === "compact";
  const isFeatured = variant === "featured";

  const handleQuickAdd = (e: React.MouseEvent, status: LibraryStatus) => {
    e.preventDefault();
    e.stopPropagation();
    onLibraryStatusChange?.(manga.id, status);
    setAddedFeedback(true);
    setTimeout(() => setAddedFeedback(false), 1500);
  };

  const rawRating = manga.rating != null ? parseFloat(String(manga.rating)) : 0;
  const validRating = rawRating > 0 ? rawRating : null;

  /* ── Widths by variant ── */
  const wClass = isCompact ? "w-28 sm:w-32" : isFeatured ? "w-48 sm:w-56" : "w-36 sm:w-40 md:w-44";

  return (
    <motion.div
      className={cn("group relative flex-shrink-0 flex flex-col", wClass)}
      onHoverStart={() => setHovered(true)}
      onHoverEnd={() => setHovered(false)}
      whileHover={{ y: -4 }}
      transition={{ duration: 0.2, ease: "easeOut" }}
    >
      {/* ── Cover image ── */}
      <Link
        href={`/manga/${manga.id}`}
        className="block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 rounded-2xl"
        aria-label={`View ${manga.title}`}
      >
        <div className="relative aspect-[2/3] rounded-2xl overflow-hidden bg-ink-900 border border-ink-800 group-hover:border-primary/40 group-hover:shadow-lg transition-all duration-200">

          {/* Shimmer loading overlay */}
          {!imageLoaded && !imageError && (
            <div className="absolute inset-0 z-10 loading-shimmer" />
          )}

          {/* Cover */}
          {manga.coverImage && !imageError ? (
            <Image
              src={getProxiedImageUrl(manga.coverImage)}
              alt={manga.title}
              fill
              className={cn(
                "object-cover transition-all duration-300 ease-out group-hover:scale-105",
                !imageLoaded && "opacity-0 scale-95"
              )}
              loading={priority ? "eager" : "lazy"}
              sizes={isFeatured ? "224px" : isCompact ? "128px" : "176px"}
              quality={80}
              onLoad={() => setImageLoaded(true)}
              onError={() => setImageError(true)}
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center p-3 text-center bg-gradient-to-br from-ink-900 via-ink-850 to-ink-950">
              <BookOpen className="h-7 w-7 text-primary/60 mb-2" aria-hidden="true" />
              <span className="text-[10px] font-semibold text-ink-300 line-clamp-2 leading-tight px-1">
                {manga.title}
              </span>
            </div>
          )}

          {/* Type badge */}
          {manga.type && !isCompact && (
            <div className="absolute top-2 left-2 z-10">
              <span className={cn(
                "text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-md backdrop-blur-md shadow-sm border border-white/[0.04]",
                TYPE_COLORS[manga.type] ?? "bg-ink-950/80 text-foreground"
              )}>
                {manga.type}
              </span>
            </div>
          )}

          {/* Library status chip */}
          {libraryStatus && (
            <div className="absolute top-2 right-2 z-10">
              <span className={cn(
                "flex items-center gap-1 text-[9px] font-semibold px-1.5 py-0.5 rounded-full border backdrop-blur-md shadow-sm",
                STATUS_CONFIG[libraryStatus].color
              )}>
                <span className={cn("w-1.5 h-1.5 rounded-full flex-shrink-0", STATUS_CONFIG[libraryStatus].dot)} />
                {isCompact ? "" : STATUS_CONFIG[libraryStatus].label}
              </span>
            </div>
          )}

          {/* Hover overlay */}
          <AnimatePresence>
            {hovered && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15 }}
                className="absolute inset-0 bg-gradient-to-t from-background/95 via-background/45 to-transparent z-10"
              >
                {/* Quick action buttons */}
                <div className="absolute bottom-3 left-0 right-0 flex items-center justify-center gap-1.5 px-2">
                  <motion.button
                    initial={{ y: 6, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.03, duration: 0.15 }}
                    onClick={(e) => handleQuickAdd(e, "reading")}
                    className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg bg-primary text-primary-foreground text-[11px] font-semibold hover:bg-primary/95 transition-colors cursor-pointer"
                    aria-label="Start reading"
                  >
                    {addedFeedback ? (
                      <><Check className="h-3 w-3" /> Added</>
                    ) : (
                      <><BookOpen className="h-3 w-3" /> Read</>
                    )}
                  </motion.button>

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <motion.button
                        initial={{ y: 6, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.06, duration: 0.15 }}
                        onClick={(e) => e.preventDefault()}
                        className="h-7 w-7 flex items-center justify-center rounded-lg glass border border-border/60 text-foreground hover:border-primary/50 hover:text-primary transition-colors cursor-pointer"
                        aria-label="Add to library"
                      >
                        <Plus className="h-3.5 w-3.5" />
                      </motion.button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-44 bg-popover border border-ink-700 shadow-dropdown mt-1 rounded-xl p-1" sideOffset={4}>
                      {(Object.entries(STATUS_CONFIG) as [LibraryStatus, typeof STATUS_CONFIG[LibraryStatus]][]).map(([status, { label, dot }]) => (
                        <DropdownMenuItem
                          key={status}
                          onClick={(e) => { e.preventDefault(); onLibraryStatusChange?.(manga.id, status); }}
                          className={cn(
                            "flex items-center gap-2 cursor-pointer text-xs rounded-lg p-2",
                            libraryStatus === status && "bg-primary/10 text-primary"
                          )}
                        >
                          <span className={cn("w-1.5 h-1.5 rounded-full flex-shrink-0", dot)} />
                          {label}
                          {libraryStatus === status && <Check className="h-3 w-3 ml-auto" />}
                        </DropdownMenuItem>
                      ))}
                      {libraryStatus && (
                        <>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={(e) => { e.preventDefault(); onLibraryStatusChange?.(manga.id, null); }}
                            className="text-destructive focus:text-destructive focus:bg-destructive/10 cursor-pointer text-xs rounded-lg p-2"
                          >
                            Remove from Library
                          </DropdownMenuItem>
                        </>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </Link>

      {/* ── Meta info ── */}
      {!isCompact && (
        <div className="mt-2 px-0.5 space-y-1 text-left flex-1 flex flex-col justify-between">
          <div className="space-y-1">
            <Link href={`/manga/${manga.id}`} tabIndex={-1} className="block">
              <h3 className="text-xs font-semibold text-foreground line-clamp-2 leading-snug group-hover:text-primary transition-colors duration-150">
                {manga.title}
              </h3>
            </Link>

            <div className="flex items-center gap-1.5 text-[10px] text-ink-400">
              {validRating != null && (
                <span className="flex items-center gap-0.5">
                  <Star className="h-3 w-3 text-yellow-400 fill-yellow-400" />
                  <span className="font-semibold text-foreground/90">{validRating.toFixed(1)}</span>
                </span>
              )}
              {validRating != null && manga.chapterCount != null && manga.chapterCount > 0 && (
                <span className="text-ink-600/60">•</span>
              )}
              {manga.chapterCount != null && manga.chapterCount > 0 && (
                <span className="ch-label">
                  {formatChapterLabel(manga.chapterCount)}
                </span>
              )}
            </div>
          </div>

          {manga.latestChapter && (
            <p className="text-[10px] text-ink-400 flex items-center gap-1 mt-1 pt-1 border-t border-ink-800/40 truncate w-full">
              <Clock className="h-3 w-3 flex-shrink-0 text-ink-500" />
              <span className="ch-label text-ink-300 truncate">{formatChapterLabel(manga.latestChapter.number)}</span>
              {manga.latestChapter.publishedAt && (
                <span className="ml-auto flex-shrink-0 text-[10px] text-ink-500 font-mono">{formatRelativeTime(new Date(manga.latestChapter.publishedAt))}</span>
              )}
            </p>
          )}
        </div>
      )}

      {/* ── Compact label ── */}
      {isCompact && (
        <p className="mt-1.5 text-[11px] font-semibold text-foreground/80 line-clamp-2 leading-tight px-0.5 text-left">
          {manga.title}
        </p>
      )}
    </motion.div>
  );
}

/* ─── Skeleton ───────────────────────────────────────────────────────────── */
export function MangaCardSkeleton({ variant = "default" }: { variant?: "default" | "compact" | "featured" }) {
  const isCompact  = variant === "compact";
  const isFeatured = variant === "featured";
  const wClass = isCompact ? "w-28 sm:w-32" : isFeatured ? "w-48 sm:w-56" : "w-36 sm:w-40 md:w-44";

  return (
    <div className={cn("flex-shrink-0 flex flex-col space-y-2", wClass)} aria-hidden="true">
      <div className="w-full aspect-[2/3] rounded-2xl loading-shimmer border border-ink-800" />
      {!isCompact && (
        <div className="px-0.5 space-y-2 flex-1 flex flex-col justify-between">
          <div className="space-y-1.5">
            <div className="h-3.5 w-full rounded-md loading-shimmer" />
            <div className="h-3 w-2/3 rounded-md loading-shimmer" />
          </div>
          <div className="h-3 w-1/2 rounded-md loading-shimmer mt-2 pt-1 border-t border-ink-800/40" />
        </div>
      )}
      {isCompact && (
        <div className="h-3 w-3/4 rounded-md loading-shimmer" />
      )}
    </div>
  );
}