"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, X, SlidersHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";
import { spring, stagger } from "@/animations/motion";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { SearchFilters, MangaStatus, MangaType, Demographic } from "@/types";

/* ─── Filter data ────────────────────────────────────────────────────────── */
const GENRES = [
  "Action", "Adventure", "Comedy", "Drama", "Fantasy", "Horror",
  "Mystery", "Romance", "Sci-Fi", "Slice of Life", "Sports", "Supernatural",
  "Thriller", "Psychological", "Historical", "Mecha", "Music", "Isekai",
];

const STATUSES: { value: MangaStatus; label: string }[] = [
  { value: "ongoing",   label: "Ongoing" },
  { value: "completed", label: "Completed" },
  { value: "hiatus",    label: "Hiatus" },
  { value: "cancelled", label: "Cancelled" },
];

const TYPES: { value: MangaType; label: string }[] = [
  { value: "manga",     label: "Manga" },
  { value: "manhwa",    label: "Manhwa" },
  { value: "manhua",    label: "Manhua" },
  { value: "novel",     label: "Novel" },
  { value: "oneshot",   label: "Oneshot" },
];

const DEMOGRAPHICS: { value: Demographic; label: string }[] = [
  { value: "shounen",    label: "Shounen" },
  { value: "seinen",     label: "Seinen" },
  { value: "shoujo",     label: "Shoujo" },
  { value: "josei",      label: "Josei" },
];

const RATING_OPTIONS = [
  { value: "0",   label: "Any Rating" },
  { value: "7",   label: "7.0+" },
  { value: "8",   label: "8.0+" },
  { value: "8.5", label: "8.5+" },
  { value: "9",   label: "9.0+" },
];

/* ─── Collapsible filter group ───────────────────────────────────────────── */
function FilterGroup({
  title,
  children,
  defaultOpen = true,
  activeCount = 0,
}: {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
  activeCount?: number;
}) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="border-b border-ink-800/80 last:border-0 py-3 pb-4 last:pb-0">
      <button
        type="button"
        onClick={() => setOpen((p) => !p)}
        className="flex items-center justify-between w-full py-2 text-left focus-visible:outline-2 focus-visible:outline-ring focus-visible:outline-offset-2 rounded-lg cursor-pointer"
        aria-expanded={open}
      >
        <span className="flex items-center gap-2 text-xs font-bold text-foreground uppercase tracking-wider">
          {title}
          {activeCount > 0 && (
            <span className="flex h-4.5 w-4.5 items-center justify-center rounded-full bg-primary text-primary-foreground text-[10px] font-bold">
              {activeCount}
            </span>
          )}
        </span>
        <motion.div
          animate={{ rotate: open ? 180 : 0 }}
          transition={{ duration: 0.15 }}
        >
          <ChevronDown className="h-4 w-4 text-ink-400" aria-hidden="true" />
        </motion.div>
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="overflow-hidden"
          >
            <div className="pt-2">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ─── Pill toggle ────────────────────────────────────────────────────────── */
function Pill({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "px-3 py-1.5 rounded-full text-[11px] font-semibold border transition-all duration-200 cursor-pointer",
        active
          ? "bg-primary/10 text-primary border-primary/50 shadow-sm"
          : "bg-ink-950/40 text-ink-300 border-ink-800 hover:border-ink-700 hover:text-foreground hover:bg-ink-900/50"
      )}
    >
      {label}
    </button>
  );
}

/* ─── Active filter chip ─────────────────────────────────────────────────── */
export function FilterChip({
  label,
  onRemove,
}: {
  label: string;
  onRemove: () => void;
}) {
  return (
    <motion.span
      layout
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ scale: 0.9, opacity: 0 }}
      transition={{ duration: 0.12 }}
      className="inline-flex items-center gap-1.5 pl-3 pr-1.5 py-1 rounded-full bg-primary/15 text-primary text-xs font-semibold border border-primary/30"
    >
      {label}
      <button
        onClick={onRemove}
        className="h-4 w-4 rounded-full flex items-center justify-center hover:bg-primary/25 transition-colors cursor-pointer"
        aria-label={`Remove ${label} filter`}
      >
        <X className="h-3 w-3" />
      </button>
    </motion.span>
  );
}

/* ─── Main FilterPanel ───────────────────────────────────────────────────── */
interface FilterPanelProps {
  filters: SearchFilters;
  onFilterChange: (key: keyof SearchFilters, value: unknown) => void;
  onToggleArray: (key: "genres" | "tags" | "status" | "type" | "demographic", value: string) => void;
  onClearAll: () => void;
  activeCount: number;
  className?: string;
}

export function FilterPanel({
  filters,
  onFilterChange,
  onToggleArray,
  onClearAll,
  activeCount,
  className,
}: FilterPanelProps) {
  return (
    <div className={cn("space-y-4 bg-ink-900/20 border border-ink-800/60 p-4 rounded-2xl", className)}>
      {/* Panel header */}
      <div className="flex items-center justify-between">
        <span className="flex items-center gap-2 text-xs font-bold text-foreground uppercase tracking-wider">
          <SlidersHorizontal className="h-4 w-4 text-ink-400" aria-hidden="true" />
          Filter Settings
          {activeCount > 0 && (
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-primary-foreground text-[10px] font-bold">
              {activeCount}
            </span>
          )}
        </span>
        {activeCount > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onClearAll}
            className="text-[11px] h-7 px-2 text-ink-400 hover:text-destructive hover:bg-destructive/10 rounded-lg cursor-pointer"
          >
            Clear all
          </Button>
        )}
      </div>

      {/* Genre */}
      <FilterGroup
        title="Genres"
        activeCount={(filters.genres ?? []).length}
      >
        <div className="flex flex-wrap gap-1.5 pt-1">
          {GENRES.map((g) => (
            <Pill
              key={g}
              label={g}
              active={(filters.genres ?? []).includes(g)}
              onClick={() => onToggleArray("genres", g)}
            />
          ))}
        </div>
      </FilterGroup>

      {/* Type */}
      <FilterGroup
        title="Type"
        activeCount={(filters.type ?? []).length}
      >
        <div className="flex flex-wrap gap-1.5 pt-1">
          {TYPES.map(({ value, label }) => (
            <Pill
              key={value}
              label={label}
              active={(filters.type ?? []).includes(value)}
              onClick={() => onToggleArray("type", value)}
            />
          ))}
        </div>
      </FilterGroup>

      {/* Status */}
      <FilterGroup
        title="Status"
        activeCount={(filters.status ?? []).length}
      >
        <div className="flex flex-wrap gap-1.5 pt-1">
          {STATUSES.map(({ value, label }) => (
            <Pill
              key={value}
              label={label}
              active={(filters.status ?? []).includes(value)}
              onClick={() => onToggleArray("status", value)}
            />
          ))}
        </div>
      </FilterGroup>

      {/* Demographic */}
      <FilterGroup
        title="Demographic"
        defaultOpen={false}
        activeCount={(filters.demographic ?? []).length}
      >
        <div className="flex flex-wrap gap-1.5 pt-1">
          {DEMOGRAPHICS.map(({ value, label }) => (
            <Pill
              key={value}
              label={label}
              active={(filters.demographic ?? []).includes(value)}
              onClick={() => onToggleArray("demographic", value)}
            />
          ))}
        </div>
      </FilterGroup>

      {/* Rating */}
      <FilterGroup
        title="Min Rating"
        defaultOpen={false}
        activeCount={(filters.rating ?? 0) > 0 ? 1 : 0}
      >
        <Select
          value={(filters.rating ?? 0).toString()}
          onValueChange={(v) => onFilterChange("rating", Number(v))}
        >
          <SelectTrigger className="w-full h-9 text-xs border-ink-800 bg-ink-950/40 rounded-xl" aria-label="Minimum rating">
            <SelectValue placeholder="Any Rating" />
          </SelectTrigger>
          <SelectContent className="border-ink-850 bg-popover rounded-xl">
            {RATING_OPTIONS.map(({ value, label }) => (
              <SelectItem key={value} value={value} className="text-xs focus:bg-ink-800/80 cursor-pointer">{label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </FilterGroup>
    </div>
  );
}

/* ─── Active filter chips row ────────────────────────────────────────────── */
interface ActiveFiltersProps {
  filters: SearchFilters;
  onToggleArray: (key: "genres" | "tags" | "status" | "type" | "demographic", value: string) => void;
  onFilterChange: (key: keyof SearchFilters, value: unknown) => void;
  onClearAll: () => void;
}

export function ActiveFilters({
  filters,
  onToggleArray,
  onFilterChange,
  onClearAll,
}: ActiveFiltersProps) {
  const chips: { label: string; onRemove: () => void }[] = [
    ...(filters.genres ?? []).map((g) => ({
      label: g,
      onRemove: () => onToggleArray("genres", g),
    })),
    ...(filters.type ?? []).map((t) => ({
      label: t,
      onRemove: () => onToggleArray("type", t),
    })),
    ...(filters.status ?? []).map((s) => ({
      label: s,
      onRemove: () => onToggleArray("status", s),
    })),
    ...(filters.demographic ?? []).map((d) => ({
      label: d,
      onRemove: () => onToggleArray("demographic", d),
    })),
    ...((filters.rating ?? 0) > 0
      ? [{ label: `${filters.rating}+ ★`, onRemove: () => onFilterChange("rating", 0) }]
      : []),
  ];

  if (!chips.length) return null;

  return (
    <motion.div
      layout
      className="flex flex-wrap items-center gap-2"
      role="group"
      aria-label="Active filters"
    >
      <span className="text-xs text-ink-400 font-semibold uppercase tracking-wider mr-1">Active:</span>
      <AnimatePresence mode="popLayout">
        {chips.map((chip) => (
          <FilterChip key={chip.label} label={chip.label} onRemove={chip.onRemove} />
        ))}
      </AnimatePresence>
      {chips.length > 1 && (
        <button
          onClick={onClearAll}
          className="text-xs font-semibold text-ink-400 hover:text-destructive transition-colors ml-1 cursor-pointer"
        >
          Clear all
        </button>
      )}
    </motion.div>
  );
}
