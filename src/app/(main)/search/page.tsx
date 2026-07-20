"use client";

import { useState, useCallback, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutGrid, LayoutList, SlidersHorizontal, ChevronLeft, ChevronRight,
  ArrowUpDown,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MangaCard, MangaCardSkeleton } from "@/components/manga/manga-card";
import { ErrorState } from "@/components/ui/ErrorState";
import { Drawer } from "@/components/ui/Drawer";
import { SearchBar } from "@/components/search/SearchBar";
import { FilterPanel, ActiveFilters } from "@/components/search/FilterPanel";
import { SearchEmptyState } from "@/components/search/SearchEmptyState";
import { cn, formatNumber } from "@/lib/utils";
import { staggerContainer, staggerChild, transition } from "@/animations/motion";
import type { SearchFilters, SearchResult } from "@/types";

/* ─── Constants ──────────────────────────────────────────────────────────── */
const SORT_OPTIONS = [
  { value: "relevance",  label: "Relevance" },
  { value: "title",      label: "Title (A-Z)" },
  { value: "rating",     label: "Rating" },
  { value: "popularity", label: "Popularity" },
  { value: "updated",    label: "Recently Updated" },
  { value: "created",    label: "Recently Added" },
  { value: "follows",    label: "Most Followed" },
  { value: "views",      label: "Most Viewed" },
];

const TRENDING_TAGS = [
  "One Piece", "Jujutsu Kaisen", "Chainsaw Man", "Solo Leveling",
  "Blue Lock", "Spy × Family", "Oshi no Ko", "Vinland Saga",
];

const INITIAL_FILTERS: SearchFilters = {
  query: "",
  genres: [],
  tags: [],
  status: [],
  type: [],
  demographic: [],
  rating: 0,
  sortBy: "relevance",
  sortOrder: "desc",
  page: 1,
  limit: 24,
};

/* ─── debounce helper ────────────────────────────────────────────────────── */
function debounce<A extends unknown[], R>(fn: (...args: A) => R, delay: number): (...args: A) => void {
  let id: ReturnType<typeof setTimeout>;
  return (...args: A) => {
    clearTimeout(id);
    id = setTimeout(() => fn(...args), delay);
  };
}

/* ─── Page ───────────────────────────────────────────────────────────────── */
export default function SearchPage() {
  const [filters, setFilters] = useState<SearchFilters>(INITIAL_FILTERS);
  const [results, setResults] = useState<SearchResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [drawerOpen, setDrawerOpen] = useState(false);

  // Recent searches — stored in session state (no localStorage API change)
  const [recentSearches, setRecentSearches] = useState<string[]>([]);

  /* ── Active filter count ── */
  const activeFilterCount = [
    ...(filters.genres ?? []),
    ...(filters.type ?? []),
    ...(filters.status ?? []),
    ...(filters.demographic ?? []),
    (filters.rating ?? 0) > 0 ? ["rating"] : [],
  ].flat().length;

  /* ── Search handler ── */
  const handleSearch = useCallback(async (f: SearchFilters) => {
    setIsLoading(true);
    setError(null);
    setHasSearched(true);
    try {
      const params = new URLSearchParams();
      Object.entries(f).forEach(([key, value]) => {
        if (Array.isArray(value)) {
          value.forEach((v) => params.append(key, v));
        } else if (value !== undefined && value !== null && value !== "" && value !== 0) {
          params.set(key, String(value));
        }
      });
      const res = await fetch(`/api/search?${params.toString()}`);
      if (!res.ok) throw new Error(`Search failed: ${res.status}`);
      const data = await res.json();
      setResults(data);

      // Track recent search
      if (f.query?.trim()) {
        setRecentSearches((prev) =>
          [f.query!, ...prev.filter((s) => s !== f.query)].slice(0, 8)
        );
      }
    } catch (err) {
      setError(err as Error);
      setResults(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  /* ── Debounced auto-search on filter change ── */
  const debouncedSearch = useMemo(() => {
    return debounce((f: SearchFilters) => handleSearch(f), 350);
  }, [handleSearch]);

  useEffect(() => {
    if (filters.query || activeFilterCount > 0) {
      debouncedSearch(filters);
    }
  }, [filters, debouncedSearch, activeFilterCount]);

  /* ── Filter helpers ── */
  const setFilter = (key: keyof SearchFilters, value: unknown) =>
    setFilters((prev) => ({ ...prev, [key]: value, page: 1 }));

  const toggleArray = (key: "genres" | "tags" | "status" | "type" | "demographic", val: string) =>
    setFilters((prev) => {
      const arr = prev[key] ?? [];
      return {
        ...prev,
        [key]: arr.includes(val) ? arr.filter((v) => v !== val) : [...arr, val],
        page: 1,
      };
    });

  const clearAll = () => setFilters(INITIAL_FILTERS);

  /* ── Pre-search state ── */
  const isPreSearch = !hasSearched && !filters.query && activeFilterCount === 0;

  return (
    <div className="min-h-screen bg-background">
      <a href="#main-content" className="skip-to-content">
        Skip to content
      </a>
      {/* ── Sticky search header ── */}
      <div className="sticky top-16 z-30 bg-background/80 backdrop-blur-lg border-b border-ink-800/80">
        <div className="container-padded py-4">
          <div className="flex items-center gap-3">
            <div className="flex-1">
              <SearchBar
                value={filters.query ?? ""}
                onChange={(q) => setFilter("query", q)}
                onSubmit={() => handleSearch(filters)}
                isLoading={isLoading && !!filters.query}
                recentSearches={recentSearches}
                onClearRecent={(q) =>
                  setRecentSearches((prev) => prev.filter((s) => s !== q))
                }
                trending={TRENDING_TAGS}
                id="search-input"
                autoFocus
              />
            </div>

            {/* Mobile filter toggle */}
            <Button
              variant="outline"
              size="icon"
              className={cn(
                "lg:hidden h-12 w-12 flex-shrink-0 relative rounded-2xl border-ink-800 hover:bg-ink-800 cursor-pointer",
                activeFilterCount > 0 && "border-primary/50 text-primary bg-primary/5"
              )}
              onClick={() => setDrawerOpen(true)}
              aria-label={`Filters${activeFilterCount > 0 ? ` (${activeFilterCount} active)` : ""}`}
              aria-haspopup="dialog"
            >
              <SlidersHorizontal className="h-4.5 w-4.5" />
              {activeFilterCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-primary-foreground text-[10px] font-bold">
                  {activeFilterCount}
                </span>
              )}
            </Button>
          </div>

          {/* Active filter chips row */}
          <AnimatePresence>
            {activeFilterCount > 0 && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden mt-3"
              >
                <ActiveFilters
                  filters={filters}
                  onToggleArray={toggleArray}
                  onFilterChange={setFilter}
                  onClearAll={clearAll}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* ── Body ── */}
      <main id="main-content" className="container-padded py-6">
        <div className="flex gap-6 items-start">

          {/* ── Desktop sidebar ── */}
          <aside
            className="hidden lg:block w-64 xl:w-72 flex-shrink-0"
            aria-label="Search filters"
          >
            <div className="sticky top-[9.5rem]">
              <FilterPanel
                filters={filters}
                onFilterChange={setFilter}
                onToggleArray={toggleArray}
                onClearAll={clearAll}
                activeCount={activeFilterCount}
              />
            </div>
          </aside>

          {/* ── Results ── */}
          <div className="flex-1 min-w-0">

            {/* Sort + view toggle row */}
            {(hasSearched || isLoading) && (
              <div className="flex items-center justify-between gap-4 mb-5 pb-3 border-b border-ink-800/40">
                <div className="text-xs font-semibold uppercase tracking-wider text-ink-400">
                  {isLoading ? (
                    <span className="animate-pulse">Searching…</span>
                  ) : results ? (
                    <span>
                      Found <span className="text-foreground">{formatNumber(results.total)}</span> results
                      {filters.query && (
                        <span> for &ldquo;<span className="text-primary normal-case">{filters.query}</span>&rdquo;</span>
                      )}
                    </span>
                  ) : null}
                </div>

                <div className="flex items-center gap-2 flex-shrink-0">
                  {/* Sort */}
                  <Select
                    value={filters.sortBy ?? "relevance"}
                    onValueChange={(v) => setFilter("sortBy", v as SearchFilters["sortBy"])}
                  >
                    <SelectTrigger className="hidden sm:flex w-40 h-8.5 text-xs border-ink-800 bg-ink-950/40 rounded-xl" aria-label="Sort by">
                      <ArrowUpDown className="h-3.5 w-3.5 mr-1.5 text-ink-400" aria-hidden="true" />
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="border-ink-850 bg-popover rounded-xl">
                      {SORT_OPTIONS.map((o) => (
                        <SelectItem key={o.value} value={o.value} className="text-xs focus:bg-ink-800/80 cursor-pointer">{o.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  {/* Grid / List toggle */}
                  <div className="flex rounded-xl border border-ink-800 bg-ink-950/40 overflow-hidden" role="group" aria-label="View mode">
                    <button
                      onClick={() => setViewMode("grid")}
                      className={cn(
                        "h-8 w-8 flex items-center justify-center transition-colors cursor-pointer",
                        viewMode === "grid" ? "bg-primary text-primary-foreground" : "text-ink-400 hover:text-foreground hover:bg-ink-800/40"
                      )}
                      aria-label="Grid view"
                      aria-pressed={viewMode === "grid"}
                    >
                      <LayoutGrid className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => setViewMode("list")}
                      className={cn(
                        "h-8 w-8 flex items-center justify-center transition-colors border-l border-ink-800 cursor-pointer",
                        viewMode === "list" ? "bg-primary text-primary-foreground" : "text-ink-400 hover:text-foreground hover:bg-ink-800/40"
                      )}
                      aria-label="List view"
                      aria-pressed={viewMode === "list"}
                    >
                      <LayoutList className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Results content */}
            <AnimatePresence mode="wait">
              {/* Pre-search landing */}
              {isPreSearch && !isLoading && (
                <motion.div key="pre-search" {...{ initial: { opacity: 0 }, animate: { opacity: 1 }, exit: { opacity: 0 }, transition: transition.fade }}>
                  <SearchEmptyState isPreSearch />
                </motion.div>
              )}

              {/* Loading skeletons */}
              {isLoading && (
                <motion.div
                  key="loading"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className={cn(
                    "grid gap-4",
                    viewMode === "grid"
                      ? "grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6"
                      : "grid-cols-1"
                  )}
                  aria-busy="true"
                  aria-label="Loading results"
                >
                  {Array.from({ length: 12 }, (_, i) => (
                    <MangaCardSkeleton key={i} variant={viewMode === "list" ? "compact" : "default"} />
                  ))}
                </motion.div>
              )}

              {/* Error state */}
              {error && !isLoading && (
                <motion.div key="error" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                  <ErrorState
                    type="network"
                    onRetry={() => handleSearch(filters)}
                  />
                </motion.div>
              )}

              {/* No results */}
              {!isLoading && !error && hasSearched && results && results.manga.length === 0 && (
                <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                  <SearchEmptyState
                    hasQuery={!!filters.query}
                    query={filters.query}
                    onClearFilters={activeFilterCount > 0 ? clearAll : undefined}
                  />
                </motion.div>
              )}

              {/* Results grid */}
              {!isLoading && !error && results && results.manga.length > 0 && (
                <motion.div
                  key={`results-${filters.page}`}
                  variants={staggerContainer(0.03)}
                  initial="hidden"
                  animate="visible"
                  className={cn(
                    "grid gap-4",
                    viewMode === "grid"
                      ? "grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6"
                      : "grid-cols-1"
                  )}
                  role="list"
                  aria-label={`Search results: ${results.total} manga`}
                >
                  {results.manga.map((manga, i) => (
                    <motion.div key={manga.id} variants={staggerChild} role="listitem">
                      <MangaCard
                        manga={manga}
                        variant={viewMode === "list" ? "compact" : "default"}
                        priority={i < 6}
                      />
                    </motion.div>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Pagination */}
            {!isLoading && results && results.totalPages > 1 && (
              <nav
                className="mt-12 flex items-center justify-center gap-2"
                aria-label="Search results pagination"
              >
                <Button
                  variant="outline"
                  size="sm"
                  disabled={(filters.page ?? 1) <= 1}
                  onClick={() => setFilter("page", (filters.page || 1) - 1)}
                  className="gap-2 border-ink-800 hover:bg-ink-800 rounded-xl cursor-pointer text-xs"
                  aria-label="Previous page"
                >
                  <ChevronLeft className="h-4 w-4" />
                  Previous
                </Button>

                <div className="flex items-center gap-1">
                  {Array.from({ length: Math.min(5, results.totalPages) }, (_, i) => {
                    const p = i + 1;
                    const cur = filters.page ?? 1;
                    const page = results.totalPages <= 5
                      ? p
                      : cur <= 3 ? p
                      : cur >= results.totalPages - 2 ? results.totalPages - 4 + i
                      : cur - 2 + i;
                    return (
                      <button
                        key={page}
                        onClick={() => setFilter("page", page)}
                        aria-label={`Page ${page}`}
                        aria-current={page === cur ? "page" : undefined}
                        className={cn(
                          "h-9 w-9 rounded-full text-xs font-bold transition-all cursor-pointer border",
                          page === cur
                            ? "bg-primary text-primary-foreground border-primary"
                            : "text-ink-300 hover:text-foreground bg-ink-950/40 border-ink-850 hover:border-ink-700"
                        )}
                      >
                        {page}
                      </button>
                    );
                  })}
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  disabled={(filters.page ?? 1) >= results.totalPages}
                  onClick={() => setFilter("page", (filters.page || 1) + 1)}
                  className="gap-2 border-ink-800 hover:bg-ink-800 rounded-xl cursor-pointer text-xs"
                  aria-label="Next page"
                >
                  Next
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </nav>
            )}
          </div>
        </div>
      </main>

      {/* ── Mobile filter drawer ── */}
      <Drawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        title="Filters"
        side="bottom"
      >
        <div className="px-5 py-4 bg-ink-950 rounded-t-2xl">
          <FilterPanel
            filters={filters}
            onFilterChange={setFilter}
            onToggleArray={toggleArray}
            onClearAll={clearAll}
            activeCount={activeFilterCount}
          />
          <div className="pt-4 mt-4 border-t border-ink-800">
            <Button
              className="w-full rounded-xl cursor-pointer"
              onClick={() => {
                setDrawerOpen(false);
                handleSearch(filters);
              }}
            >
              {activeFilterCount > 0
                ? `Show results (${activeFilterCount} filter${activeFilterCount > 1 ? "s" : ""} active)`
                : "Show results"}
            </Button>
          </div>
        </div>
      </Drawer>
    </div>
  );
}