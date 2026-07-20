"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import {
  BookOpen, MoreHorizontal, Check, Trash2, ArrowRight,
  Clock, Star, ChevronRight,
} from "lucide-react";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn, formatNumber, getProxiedImageUrl } from "@/lib/utils";
import { hover, tap, transition, stagger } from "@/animations/motion";
import type { LibraryEntry, LibraryStatus } from "@/types";

/* ─── Status config ──────────────────────────────────────────────────────── */
export const STATUS_CONFIG: Record<
  LibraryStatus,
  { label: string; color: string; bg: string; dot: string; progress: string }
> = {
  reading:      { label: "Reading",       color: "text-primary",         bg: "bg-primary/10 border-primary/30",         dot: "bg-primary",         progress: "bg-primary" },
  completed:    { label: "Completed",     color: "text-green-400",       bg: "bg-green-500/10 border-green-500/30",     dot: "bg-green-400",       progress: "bg-green-400" },
  on_hold:      { label: "On Hold",       color: "text-yellow-400",      bg: "bg-yellow-500/10 border-yellow-500/30",   dot: "bg-yellow-400",      progress: "bg-yellow-400" },
  dropped:      { label: "Dropped",       color: "text-red-400",         bg: "bg-red-500/10 border-red-500/30",         dot: "bg-red-400",         progress: "bg-red-400" },
  plan_to_read: { label: "Plan to Read",  color: "text-muted-foreground",bg: "bg-muted/50 border-border",               dot: "bg-muted-foreground",progress: "bg-muted-foreground" },
  rereading:    { label: "Rereading",     color: "text-purple-400",      bg: "bg-purple-500/10 border-purple-500/30",   dot: "bg-purple-400",      progress: "bg-purple-400" },
};

/* ─── Props ──────────────────────────────────────────────────────────────── */
interface LibraryCardProps {
  entry: LibraryEntry;
  variant?: "grid" | "list";
  selected?: boolean;
  selectionMode?: boolean;
  onSelect?: (id: string) => void;
  onStatusChange?: (id: string, status: LibraryStatus | null) => void;
  onRemove?: (id: string) => void;
  index?: number;
}

/* ─── Progress bar ───────────────────────────────────────────────────────── */
function ProgressBar({
  current,
  total,
  statusKey,
}: {
  current?: number;
  total?: number;
  statusKey: LibraryStatus;
}) {
  if (current == null || total == null || total === 0) return null;
  const pct = Math.min(100, Math.round((current / total) * 100));
  const config = STATUS_CONFIG[statusKey];
  return (
    <div className="space-y-0.5">
      <div
        className="h-1 rounded-full bg-muted/50 overflow-hidden"
        role="progressbar"
        aria-valuenow={pct}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`Reading progress: ${pct}%`}
      >
        <div
          className={cn("h-full rounded-full transition-all duration-700", config.progress)}
          style={{ width: `${pct}%` }}
        />
      </div>
      <p className="text-[10px] text-muted-foreground">
        Ch. {current} / {total === -1 ? "?" : total} · {pct}%
      </p>
    </div>
  );
}

/* ─── Grid card ──────────────────────────────────────────────────────────── */
function GridCard({
  entry,
  selected,
  selectionMode,
  onSelect,
  onStatusChange,
  onRemove,
}: LibraryCardProps) {
  const { manga, status, currentChapter } = entry;
  const cfg = STATUS_CONFIG[status];
  const rating = manga.rating != null ? parseFloat(String(manga.rating)) : null;
  const [hovered, setHovered] = useState(false);

  return (
    <motion.article
      whileHover={hover.lift}
      whileTap={tap.base}
      onHoverStart={() => setHovered(true)}
      onHoverEnd={() => setHovered(false)}
      className="group relative flex flex-col"
      aria-label={`${manga.title} — ${cfg.label}`}
    >
      {/* Selection checkbox overlay */}
      {selectionMode && (
        <button
          onClick={() => onSelect?.(entry.id)}
          className={cn(
            "absolute top-2 left-2 z-20 h-6 w-6 rounded-md border-2 flex items-center justify-center transition-all duration-200",
            selected
              ? "bg-primary border-primary"
              : "bg-background/80 border-border backdrop-blur-sm hover:border-primary"
          )}
          aria-label={`${selected ? "Deselect" : "Select"} ${manga.title}`}
          aria-pressed={selected}
        >
          {selected && <Check className="h-3.5 w-3.5 text-primary-foreground" />}
        </button>
      )}

      {/* Cover */}
      <div className="relative rounded-xl overflow-hidden aspect-[2/3] bg-muted mb-3">
        <Link href={`/manga/${manga.id}`} tabIndex={selectionMode ? -1 : 0}>
          {manga.coverImage ? (
            <Image
              src={getProxiedImageUrl(manga.coverImage)}
              alt={manga.title}
              fill
              className={cn(
                "object-cover transition-transform duration-500",
                hovered && !selectionMode && "scale-105"
              )}
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 200px"
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center bg-muted text-muted-foreground">
              <BookOpen className="h-10 w-10 opacity-30" />
            </div>
          )}
        </Link>

        {/* Status badge */}
        <div className="absolute top-2 right-2">
          <span
            className={cn(
              "flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border backdrop-blur-sm",
              cfg.color, cfg.bg
            )}
          >
            <span className={cn("h-1.5 w-1.5 rounded-full flex-shrink-0", cfg.dot)} aria-hidden="true" />
            {cfg.label}
          </span>
        </div>

        {/* Hover overlay — actions */}
        {!selectionMode && (
          <motion.div
            initial={false}
            animate={{ opacity: hovered ? 1 : 0 }}
            transition={{ duration: 0.2 }}
            className="absolute inset-0 bg-gradient-to-t from-background/90 via-background/40 to-transparent flex flex-col items-center justify-end pb-3 gap-2"
            aria-hidden={!hovered}
          >
            <Link
              href={`/manga/${manga.id}/chapter/${currentChapter ?? 1}`}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-xs font-bold hover:bg-primary-hover transition-colors"
              tabIndex={hovered ? 0 : -1}
              aria-label={`Continue reading ${manga.title}`}
            >
              <BookOpen className="h-3.5 w-3.5" />
              Continue
            </Link>
          </motion.div>
        )}
      </div>

      {/* Info */}
      <div className="space-y-1.5 px-0.5">
        <Link href={`/manga/${manga.id}`}>
          <h3 className="text-sm font-semibold text-foreground leading-tight line-clamp-2 hover:text-primary transition-colors">
            {manga.title}
          </h3>
        </Link>

        {rating && (
          <div className="flex items-center gap-1 text-yellow-400">
            <Star className="h-3 w-3 fill-current" aria-hidden="true" />
            <span className="text-xs font-medium">{rating.toFixed(1)}</span>
          </div>
        )}

        <ProgressBar
          current={currentChapter}
          total={manga.chapterCount}
          statusKey={status}
        />
      </div>

      {/* Action menu */}
      {!selectionMode && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              className="absolute top-2 left-2 h-7 w-7 rounded-lg bg-background/80 backdrop-blur-sm border border-border text-muted-foreground hover:text-foreground hover:border-primary/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-200 z-10"
              aria-label={`More options for ${manga.title}`}
              aria-haspopup="menu"
            >
              <MoreHorizontal className="h-3.5 w-3.5" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-44">
            {(Object.keys(STATUS_CONFIG) as LibraryStatus[]).map((s) => (
              <DropdownMenuItem
                key={s}
                onClick={() => onStatusChange?.(entry.id, s)}
                className={cn(s === status && "text-primary")}
              >
                {s === status && <Check className="h-3.5 w-3.5 mr-2 text-primary" aria-hidden="true" />}
                {STATUS_CONFIG[s].label}
              </DropdownMenuItem>
            ))}
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-destructive focus:text-destructive"
              onClick={() => onRemove?.(entry.id)}
            >
              <Trash2 className="h-3.5 w-3.5 mr-2" aria-hidden="true" />
              Remove
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </motion.article>
  );
}

/* ─── List card ──────────────────────────────────────────────────────────── */
function ListCard({
  entry,
  selected,
  selectionMode,
  onSelect,
  onStatusChange,
  onRemove,
}: LibraryCardProps) {
  const { manga, status, currentChapter, updatedAt } = entry;
  const cfg = STATUS_CONFIG[status];
  const rating = manga.rating != null ? parseFloat(String(manga.rating)) : null;

  return (
    <motion.article
      whileHover={{ x: 2 }}
      transition={transition.fade}
      className="group flex items-center gap-4 p-3 rounded-xl border border-border hover:border-primary/30 hover:bg-card/50 bg-card transition-all duration-200"
      aria-label={`${manga.title} — ${cfg.label}`}
    >
      {/* Selection checkbox */}
      {selectionMode && (
        <button
          onClick={() => onSelect?.(entry.id)}
          className={cn(
            "h-5 w-5 rounded border-2 flex-shrink-0 flex items-center justify-center transition-all",
            selected ? "bg-primary border-primary" : "border-border hover:border-primary"
          )}
          aria-label={`${selected ? "Deselect" : "Select"} ${manga.title}`}
          aria-pressed={selected}
        >
          {selected && <Check className="h-3 w-3 text-primary-foreground" />}
        </button>
      )}

      {/* Cover thumb */}
      <Link href={`/manga/${manga.id}`} className="flex-shrink-0" tabIndex={selectionMode ? -1 : 0}>
        <div className="relative h-16 w-12 rounded-lg overflow-hidden bg-muted">
          {manga.coverImage ? (
            <Image src={getProxiedImageUrl(manga.coverImage)} alt={manga.title} fill className="object-cover" sizes="48px" />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center">
              <BookOpen className="h-5 w-5 text-muted-foreground opacity-40" />
            </div>
          )}
        </div>
      </Link>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <Link href={`/manga/${manga.id}`}>
              <h3 className="text-sm font-semibold text-foreground leading-snug line-clamp-1 hover:text-primary transition-colors">
                {manga.title}
              </h3>
            </Link>
            <div className="flex items-center gap-3 mt-0.5">
              <span className={cn("text-xs font-medium flex items-center gap-1", cfg.color)}>
                <span className={cn("h-1.5 w-1.5 rounded-full", cfg.dot)} aria-hidden="true" />
                {cfg.label}
              </span>
              {rating && (
                <span className="flex items-center gap-0.5 text-yellow-400 text-xs">
                  <Star className="h-3 w-3 fill-current" aria-hidden="true" />
                  {rating.toFixed(1)}
                </span>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 flex-shrink-0">
            {!selectionMode && (
              <>
                <Link
                  href={`/manga/${manga.id}/chapter/${currentChapter ?? 1}`}
                  className="hidden sm:flex items-center gap-1 px-3 py-1.5 rounded-lg bg-primary/10 text-primary text-xs font-semibold hover:bg-primary hover:text-primary-foreground transition-all opacity-0 group-hover:opacity-100"
                  aria-label={`Continue reading ${manga.title}`}
                >
                  Continue <ChevronRight className="h-3 w-3" aria-hidden="true" />
                </Link>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button
                      className="h-8 w-8 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted flex items-center justify-center transition-colors opacity-0 group-hover:opacity-100"
                      aria-label={`More options for ${manga.title}`}
                      aria-haspopup="menu"
                    >
                      <MoreHorizontal className="h-4 w-4" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-44">
                    {(Object.keys(STATUS_CONFIG) as LibraryStatus[]).map((s) => (
                      <DropdownMenuItem key={s} onClick={() => onStatusChange?.(entry.id, s)} className={cn(s === status && "text-primary")}>
                        {s === status && <Check className="h-3.5 w-3.5 mr-2 text-primary" aria-hidden="true" />}
                        {STATUS_CONFIG[s].label}
                      </DropdownMenuItem>
                    ))}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={() => onRemove?.(entry.id)}>
                      <Trash2 className="h-3.5 w-3.5 mr-2" aria-hidden="true" />
                      Remove
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            )}
          </div>
        </div>

        {/* Progress */}
        <div className="mt-2">
          <ProgressBar current={currentChapter} total={manga.chapterCount} statusKey={status} />
        </div>
      </div>
    </motion.article>
  );
}

/* ─── Exported LibraryCard ───────────────────────────────────────────────── */
export function LibraryCard({
  entry,
  variant = "grid",
  selected = false,
  selectionMode = false,
  onSelect,
  onStatusChange,
  onRemove,
  index = 0,
}: LibraryCardProps) {
  const props = { entry, selected, selectionMode, onSelect, onStatusChange, onRemove };
  return variant === "list" ? <ListCard {...props} /> : <GridCard {...props} />;
}
