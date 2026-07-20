"use client";

import { useState, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search, LayoutGrid, LayoutList, ArrowUpDown,
  BookOpen, BookMarked, RotateCcw, Clock, Archive,
  PauseCircle, CheckSquare, Download, Settings2, X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { EmptyState } from "@/components/ui/EmptyState";
import { SkeletonCard, SkeletonCompactCard } from "@/components/ui/Skeleton";
import { LibraryCard } from "@/components/library/LibraryCard";
import { BulkActionBar } from "@/components/library/BulkActionBar";
import { cn, formatNumber } from "@/lib/utils";
import { staggerContainer, staggerChild } from "@/animations/motion";
import type { LibraryEntry, LibraryStatus } from "@/types";

/* ─── Status tab config ──────────────────────────────────────────────────── */
const STATUS_TABS: {
  value: LibraryStatus | "all";
  label: string;
  icon: React.ElementType;
  color: string;
}[] = [
  { value: "all",          label: "All",          icon: BookMarked,   color: "text-foreground" },
  { value: "reading",      label: "Reading",      icon: BookOpen,     color: "text-primary" },
  { value: "completed",    label: "Completed",    icon: BookMarked,   color: "text-green-400" },
  { value: "plan_to_read", label: "Plan to Read", icon: Clock,        color: "text-muted-foreground" },
  { value: "on_hold",      label: "On Hold",      icon: PauseCircle,  color: "text-yellow-400" },
  { value: "rereading",    label: "Rereading",    icon: RotateCcw,    color: "text-purple-400" },
  { value: "dropped",      label: "Dropped",      icon: Archive,      color: "text-red-400" },
];

const SORT_OPTIONS = [
  { value: "updated",  label: "Recently Updated" },
  { value: "added",    label: "Recently Added" },
  { value: "title",    label: "Title (A-Z)" },
  { value: "progress", label: "Progress" },
  { value: "rating",   label: "Rating" },
];

/* ─── Mock data for UI demonstration ────────────────────────────────────── */
const MOCK_ENTRIES: LibraryEntry[] = [
  { id: "1", status: "reading",      currentChapter: 1080, updatedAt: new Date().toISOString(), manga: { id: "1", title: "One Piece", coverImage: "https://cdn.myanimelist.net/images/manga/2/253146.jpg", rating: 9.5, chapterCount: 1100, status: "ongoing" } as any },
  { id: "2", status: "reading",      currentChapter: 265,  updatedAt: new Date().toISOString(), manga: { id: "2", title: "Jujutsu Kaisen", coverImage: "https://cdn.myanimelist.net/images/manga/3/210341.jpg", rating: 8.7, chapterCount: 270, status: "ongoing" } as any },
  { id: "3", status: "completed",    currentChapter: 200,  updatedAt: new Date().toISOString(), manga: { id: "3", title: "Fullmetal Alchemist", coverImage: "https://cdn.myanimelist.net/images/manga/3/243675.jpg", rating: 9.4, chapterCount: 200, status: "completed" } as any },
  { id: "4", status: "plan_to_read", currentChapter: 0,    updatedAt: new Date().toISOString(), manga: { id: "4", title: "Vagabond", coverImage: "https://cdn.myanimelist.net/images/manga/1/259070.jpg", rating: 9.3, chapterCount: 327, status: "hiatus" } as any },
  { id: "5", status: "reading",      currentChapter: 14,   updatedAt: new Date().toISOString(), manga: { id: "5", title: "Blue Lock", coverImage: "https://cdn.myanimelist.net/images/manga/5/290006.jpg", rating: 8.2, chapterCount: 280, status: "ongoing" } as any },
  { id: "6", status: "on_hold",      currentChapter: 45,   updatedAt: new Date().toISOString(), manga: { id: "6", title: "Berserk", coverImage: "https://cdn.myanimelist.net/images/manga/1/157897.jpg", rating: 9.5, chapterCount: 380, status: "ongoing" } as any },
  { id: "7", status: "completed",    currentChapter: 98,   updatedAt: new Date().toISOString(), manga: { id: "7", title: "Spy × Family", coverImage: "https://cdn.myanimelist.net/images/manga/3/219741.jpg", rating: 8.8, chapterCount: 98, status: "completed" } as any },
  { id: "8", status: "dropped",      currentChapter: 30,   updatedAt: new Date().toISOString(), manga: { id: "8", title: "Chainsaw Man", coverImage: "https://cdn.myanimelist.net/images/manga/3/216464.jpg", rating: 9.0, chapterCount: 97, status: "ongoing" } as any },
  { id: "9", status: "rereading",    currentChapter: 85,   updatedAt: new Date().toISOString(), manga: { id: "9", title: "Demon Slayer", coverImage: "https://cdn.myanimelist.net/images/manga/3/179023.jpg", rating: 8.5, chapterCount: 205, status: "completed" } as any },
  { id: "10",status: "reading",      currentChapter: 20,   updatedAt: new Date().toISOString(), manga: { id: "10",title: "Solo Leveling", coverImage: "https://cdn.myanimelist.net/images/manga/3/222295.jpg", rating: 8.4, chapterCount: 179, status: "completed" } as any },
] as any[];

/* ─── Empty state config per status ──────────────────────────────────────── */
const EMPTY_STATE_CONFIG: Record<
  LibraryStatus | "all",
  { emoji: string; title: string; description: string; actionLabel: string }
> = {
  all:          { emoji: "📚", title: "Your library is empty",      description: "Start adding manga to build your collection.",              actionLabel: "Browse manga" },
  reading:      { emoji: "📖", title: "Nothing to read yet",        description: "Add manga to your Reading list and pick up where you left off.", actionLabel: "Find manga to read" },
  completed:    { emoji: "✅", title: "No completed manga",         description: "Finish your first manga and it will appear here.",          actionLabel: "See what you're reading" },
  plan_to_read: { emoji: "🗓️", title: "Watchlist is empty",         description: "Plan your next reads and never forget a series.",           actionLabel: "Browse upcoming manga" },
  on_hold:      { emoji: "⏸️", title: "No manga on hold",           description: "Series you've paused will show up here.",                  actionLabel: "Continue reading" },
  rereading:    { emoji: "🔄", title: "Nothing being reread",       description: "When you reread a manga, it will appear here.",             actionLabel: "Find a classic to reread" },
  dropped:      { emoji: "🗑️", title: "No dropped manga",           description: "Manga you've stopped reading will show up here.",           actionLabel: "Browse manga" },
};

/* ─── Page ───────────────────────────────────────────────────────────────── */
export default function LibraryPage() {
  const [activeTab, setActiveTab] = useState<LibraryStatus | "all">("all");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [sortBy, setSortBy] = useState("updated");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [library, setLibrary] = useState<LibraryEntry[]>(MOCK_ENTRIES);

  const selectionMode = selectedIds.size > 0;

  /* ── Filtered + sorted entries ── */
  const filtered = useMemo(() => {
    let entries = activeTab === "all"
      ? library
      : library.filter((e) => e.status === activeTab);

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      entries = entries.filter((e) => e.manga.title.toLowerCase().includes(q));
    }

    return [...entries].sort((a, b) => {
      if (sortBy === "title") return a.manga.title.localeCompare(b.manga.title);
      if (sortBy === "rating") return (b.manga.rating ?? 0) - (a.manga.rating ?? 0);
      if (sortBy === "progress") {
        const pctA = ((a.currentChapter ?? 0) / (a.manga.chapterCount ?? 1)) * 100;
        const pctB = ((b.currentChapter ?? 0) / (b.manga.chapterCount ?? 1)) * 100;
        return pctB - pctA;
      }
      return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
    });
  }, [library, activeTab, searchQuery, sortBy]);

  /* ── Tab counts ── */
  const counts = useMemo(() => {
    const c: Record<string, number> = { all: library.length };
    library.forEach((e) => { c[e.status] = (c[e.status] ?? 0) + 1; });
    return c;
  }, [library]);

  /* ── Selection handlers ── */
  const toggleSelect = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }, []);

  const selectAll = useCallback(() => {
    setSelectedIds(new Set(filtered.map((e) => e.id)));
  }, [filtered]);

  const deselectAll = useCallback(() => setSelectedIds(new Set()), []);

  /* ── Bulk actions ── */
  const bulkStatusChange = useCallback((status: LibraryStatus) => {
    setLibrary((prev) =>
      prev.map((e) => selectedIds.has(e.id) ? { ...e, status } : e)
    );
    setSelectedIds(new Set());
  }, [selectedIds]);

  const bulkRemove = useCallback(() => {
    setLibrary((prev) => prev.filter((e) => !selectedIds.has(e.id)));
    setSelectedIds(new Set());
  }, [selectedIds]);

  /* ── Single item actions ── */
  const handleStatusChange = useCallback((id: string, status: LibraryStatus | null) => {
    if (!status) return;
    setLibrary((prev) => prev.map((e) => e.id === id ? { ...e, status } : e));
  }, []);

  const handleRemove = useCallback((id: string) => {
    setLibrary((prev) => prev.filter((e) => e.id !== id));
  }, []);

  const emptyState = EMPTY_STATE_CONFIG[activeTab];

  return (
    <div className="min-h-screen bg-background pb-24">
      <a href="#main-content" className="skip-to-content">
        Skip to content
      </a>
      {/* ── Page header ── */}
      <div className="border-b border-border/50 bg-background/95 backdrop-blur-md sticky top-16 z-[var(--z-sticky)]">
        <div className="container-padded py-4">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-display font-bold text-foreground">My Library</h1>
              <p className="text-sm text-muted-foreground mt-0.5">
                {formatNumber(library.length)} series
              </p>
            </div>
            <Button variant="outline" size="sm" className="gap-2 hidden sm:flex">
              <Download className="h-4 w-4" aria-hidden="true" />
              Export
            </Button>
          </div>

          {/* ── Status tabs ── */}
          <div className="relative mt-4 -mb-px">
            <div
              className="flex gap-1 overflow-x-auto scrollbar-hide"
              role="tablist"
              aria-label="Library status filter"
            >
              {STATUS_TABS.map(({ value, label, icon: Icon, color }) => {
                const count = counts[value] ?? 0;
                const isActive = activeTab === value;
                return (
                  <button
                    key={value}
                    role="tab"
                    id={`tab-${value}`}
                    aria-selected={isActive}
                    aria-controls={`panel-${value}`}
                    onClick={() => {
                      setActiveTab(value);
                      setSelectedIds(new Set());
                    }}
                    className={cn(
                      "relative flex items-center gap-2 px-4 py-2.5 rounded-t-lg text-sm font-semibold whitespace-nowrap transition-all duration-200 flex-shrink-0",
                      isActive
                        ? "bg-background text-foreground border border-b-0 border-border"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                    )}
                  >
                    <Icon className={cn("h-3.5 w-3.5", isActive ? color : "text-muted-foreground")} aria-hidden="true" />
                    {label}
                    {count > 0 && (
                      <span
                        className={cn(
                          "flex h-5 min-w-[20px] items-center justify-center rounded-full px-1.5 text-[10px] font-bold",
                          isActive
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted text-muted-foreground"
                        )}
                        aria-label={`${count} items`}
                      >
                        {count}
                      </span>
                    )}

                    {/* Active underline indicator */}
                    {isActive && (
                      <motion.div
                        layoutId="tab-indicator"
                        className="absolute bottom-0 left-0 right-0 h-px bg-background"
                      />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* ── Toolbar ── */}
      <div className="container-padded py-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
          {/* Search within library */}
          <div className="relative flex-1 max-w-sm w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" aria-hidden="true" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Filter by title…"
              className="pl-9 h-9 text-sm bg-muted/50"
              aria-label="Filter library by title"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                aria-label="Clear filter"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            {/* Sort */}
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="h-9 w-44 text-sm" aria-label="Sort library">
                <ArrowUpDown className="h-3.5 w-3.5 mr-1.5 text-muted-foreground" aria-hidden="true" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {SORT_OPTIONS.map((o) => (
                  <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Grid/List toggle */}
            <div className="flex rounded-lg border border-border overflow-hidden" role="group" aria-label="View mode">
              <button
                onClick={() => setViewMode("grid")}
                className={cn("h-9 w-9 flex items-center justify-center transition-colors", viewMode === "grid" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground hover:bg-muted")}
                aria-label="Grid view"
                aria-pressed={viewMode === "grid"}
              >
                <LayoutGrid className="h-4 w-4" />
              </button>
              <button
                onClick={() => setViewMode("list")}
                className={cn("h-9 w-9 flex items-center justify-center border-l border-border transition-colors", viewMode === "list" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground hover:bg-muted")}
                aria-label="List view"
                aria-pressed={viewMode === "list"}
              >
                <LayoutList className="h-4 w-4" />
              </button>
            </div>

            {/* Select mode toggle */}
            <Button
              variant={selectionMode ? "default" : "outline"}
              size="sm"
              className="h-9 gap-2"
              onClick={selectionMode ? deselectAll : () => {}}
              aria-label={selectionMode ? "Exit selection mode" : "Enter selection mode"}
              aria-pressed={selectionMode}
            >
              <CheckSquare className="h-4 w-4" />
              <span className="hidden sm:inline">
                {selectionMode ? `${selectedIds.size} selected` : "Select"}
              </span>
            </Button>
          </div>
        </div>
      </div>

      {/* ── Content ── */}
      <main
        id="main-content"
        className="container-padded outline-none"
        role="tabpanel"
        aria-labelledby={`tab-${activeTab}`}
        tabIndex={-1}
      >
        <AnimatePresence mode="wait">
          {filtered.length === 0 ? (
            <motion.div
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <EmptyState
                emoji={emptyState.emoji}
                title={searchQuery ? `No results for "${searchQuery}"` : emptyState.title}
                description={searchQuery ? "Try a different search term." : emptyState.description}
                action={
                  !searchQuery && (
                    <Button asChild>
                      <a href="/search">{emptyState.actionLabel}</a>
                    </Button>
                  )
                }
                secondaryAction={
                  searchQuery ? (
                    <Button variant="outline" onClick={() => setSearchQuery("")}>Clear search</Button>
                  ) : undefined
                }
              />
            </motion.div>
          ) : (
            <motion.div
              key={`${activeTab}-${viewMode}`}
              variants={staggerContainer(0.03)}
              initial="hidden"
              animate="visible"
              className={cn(
                viewMode === "grid"
                  ? "grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4"
                  : "flex flex-col gap-2"
              )}
              role="list"
              aria-label={`${activeTab === "all" ? "All library" : activeTab} items — ${filtered.length} manga`}
            >
              {filtered.map((entry, i) => (
                <motion.div key={entry.id} variants={staggerChild} role="listitem">
                  <LibraryCard
                    entry={entry}
                    variant={viewMode}
                    selected={selectedIds.has(entry.id)}
                    selectionMode={selectionMode}
                    onSelect={toggleSelect}
                    onStatusChange={handleStatusChange}
                    onRemove={handleRemove}
                    index={i}
                  />
                </motion.div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* ── Bulk action bar ── */}
      <BulkActionBar
        selectedCount={selectedIds.size}
        totalCount={filtered.length}
        onSelectAll={selectAll}
        onDeselectAll={deselectAll}
        onBulkStatusChange={bulkStatusChange}
        onBulkRemove={bulkRemove}
        isVisible={selectionMode}
      />
    </div>
  );
}