"use client";

import { useState, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Filter, X, ChevronDown, ChevronUp, SlidersHorizontal, Loader2, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuCheckboxItem, DropdownMenuTrigger, DropdownMenuSeparator, DropdownMenuLabel } from "@/components/ui/dropdown-menu";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MangaCard, MangaCardSkeleton } from "@/components/manga/manga-card";
import { cn, formatNumber } from "@/lib/utils";
import type { Manga, SearchFilters, SearchResult, MangaStatus, MangaType, Demographic } from "@/types";

const mangaStatuses: { value: MangaStatus; label: string }[] = [
  { value: "ongoing", label: "Ongoing" },
  { value: "completed", label: "Completed" },
  { value: "hiatus", label: "Hiatus" },
  { value: "cancelled", label: "Cancelled" },
  { value: "upcoming", label: "Upcoming" },
];

const mangaTypes: { value: MangaType; label: string }[] = [
  { value: "manga", label: "Manga" },
  { value: "manhwa", label: "Manhwa" },
  { value: "manhua", label: "Manhua" },
  { value: "novel", label: "Novel" },
  { value: "oneshot", label: "Oneshot" },
  { value: "doujinshi", label: "Doujinshi" },
];

const demographics: { value: Demographic; label: string }[] = [
  { value: "shounen", label: "Shounen 少年" },
  { value: "seinen", label: "Seinen 青年" },
  { value: "shoujo", label: "Shoujo 少女" },
  { value: "josei", label: "Josei 女性" },
  { value: "kodomomuke", label: "Kodomomuke 子供向け" },
];

const sortOptions = [
  { value: "relevance", label: "Relevance" },
  { value: "title", label: "Title (A-Z)" },
  { value: "rating", label: "Rating" },
  { value: "popularity", label: "Popularity" },
  { value: "updated", label: "Recently Updated" },
  { value: "created", label: "Recently Added" },
  { value: "follows", label: "Most Followed" },
  { value: "views", label: "Most Viewed" },
];

const initialFilters: SearchFilters = {
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

export default function SearchPage() {
  const [filters, setFilters] = useState<SearchFilters>(initialFilters);
  const [results, setResults] = useState<SearchResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [activeFilterCount, setActiveFilterCount] = useState(0);

  useEffect(() => {
    let count = 0;
    if (filters.query) count++;
    if (filters.genres?.length) count++;
    if (filters.tags?.length) count++;
    if (filters.status?.length) count++;
    if (filters.type?.length) count++;
    if (filters.demographic?.length) count++;
    if ((filters.rating ?? 0) > 0) count++;
    setActiveFilterCount(count);
  }, [filters]);

  const handleSearch = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (Array.isArray(value)) {
          value.forEach(v => params.append(key, v));
        } else if (value !== undefined && value !== null && value !== "") {
          params.set(key, String(value));
        }
      });
      const response = await fetch(`/api/search?${params.toString()}`);
      const data = await response.json();
      setResults(data);
    } catch (error) {
      console.error("Search failed:", error);
    } finally {
      setIsLoading(false);
    }
  }, [filters]);

  const handleFilterChange = (key: keyof SearchFilters, value: unknown) => {
    setFilters(prev => ({ ...prev, [key]: value, page: 1 }));
  };

  const clearFilters = () => {
    setFilters(initialFilters);
  };

  const toggleArrayFilter = (key: "genres" | "tags" | "status" | "type" | "demographic", value: string) => {
    setFilters(prev => {
      const current = prev[key] || [];
      const updated = current.includes(value)
        ? current.filter(v => v !== value)
        : [...current, value];
      return { ...prev, [key]: updated, page: 1 };
    });
  };

  const debouncedSearch = useCallback(
    debounce(() => handleSearch(), 300),
    [handleSearch]
  );

  useEffect(() => {
    debouncedSearch();
  }, [debouncedSearch]);

  return (
    <div className="min-h-screen flex flex-col">
      <div className="container-padded py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-display-md font-display font-bold text-foreground mb-2">
            Discover Manga
          </h1>
          <p className="text-body-lg text-muted-foreground">
            Search and filter through thousands of manga, manhwa, and manhua
          </p>
        </motion.div>

        <div className="flex flex-col lg:flex-row gap-6">
          <aside
            className={cn(
              "lg:w-72 flex-shrink-0",
              showFilters ? "block" : "hidden lg:block"
            )}
          >
            <div className="sticky top-24 space-y-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-3">
                  <CardTitle className="text-base">Filters</CardTitle>
                  {activeFilterCount > 0 && (
                    <Button variant="ghost" size="sm" onClick={clearFilters} className="text-xs">
                      Clear all
                    </Button>
                  )}
                </CardHeader>
                <CardContent className="space-y-6 p-4 pt-0">
                  <FilterSection
                    title="Genres"
                    items={[
                      "Action", "Adventure", "Comedy", "Drama", "Fantasy", "Horror",
                      "Mystery", "Romance", "Sci-Fi", "Slice of Life", "Sports", "Supernatural",
                      "Thriller", "Psychological", "Historical", "Mecha", "Music", "School",
                    ]}
                    selected={filters.genres ?? []}
                    onToggle={(v) => toggleArrayFilter("genres", v)}
                  />

                  <FilterSection
                    title="Type"
                    items={mangaTypes.map(t => t.label)}
                    selected={filters.type ?? []}
                    onToggle={(v) => toggleArrayFilter("type", v.toLowerCase() as MangaType)}
                    multi={false}
                  />

                  <FilterSection
                    title="Status"
                    items={mangaStatuses.map(s => s.label)}
                    selected={filters.status ?? []}
                    onToggle={(v) => toggleArrayFilter("status", v.toLowerCase() as MangaStatus)}
                    multi={false}
                  />

                  <FilterSection
                    title="Demographic"
                    items={demographics.map(d => d.label.split(" ")[0])}
                    selected={filters.demographic ?? []}
                    onToggle={(v) => toggleArrayFilter("demographic", v.toLowerCase() as Demographic)}
                    multi={false}
                  />

                  <div>
                    <label className="text-sm font-medium mb-2 block">Minimum Rating</label>
                    <Select
                      value={(filters.rating ?? 0).toString()}
                      onValueChange={(v) => handleFilterChange("rating", Number(v))}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Any" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="0">Any Rating</SelectItem>
                        <SelectItem value="7">7.0+</SelectItem>
                        <SelectItem value="8">8.0+</SelectItem>
                        <SelectItem value="8.5">8.5+</SelectItem>
                        <SelectItem value="9">9.0+</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>
            </div>
          </aside>

          <main className="flex-1">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search manga, authors, genres..."
                  value={filters.query ?? ""}
                  onChange={(e) => handleFilterChange("query", e.target.value)}
                  className="pl-10"
                />
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="hidden sm:flex"
                  onClick={() => setShowFilters(!showFilters)}
                >
                  <Filter className="h-4 w-4 mr-2" />
                  Filters
                  {activeFilterCount > 0 && (
                    <Badge variant="secondary" className="ml-1">{activeFilterCount}</Badge>
                  )}
                </Button>

                <Button variant="ghost" size="icon" className="sm:hidden" onClick={() => setShowFilters(!showFilters)}>
                  <Filter className="h-5 w-5" />
                </Button>

                <Select
                  value={filters.sortBy ?? "relevance"}
                  onValueChange={(v) => handleFilterChange("sortBy", v as SearchFilters["sortBy"])}
                >
                  <SelectTrigger className="hidden sm:block w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {sortOptions.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {showFilters && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="lg:hidden mb-6 p-4 bg-card rounded-lg border"
              >
                <div className="space-y-4">
                  <FilterSection
                    title="Genres"
                    items={["Action", "Adventure", "Comedy", "Drama", "Fantasy", "Horror", "Romance", "Sci-Fi"]}
                    selected={filters.genres ?? []}
                    onToggle={(v) => toggleArrayFilter("genres", v)}
                  />
                  <FilterSection
                    title="Type"
                    items={mangaTypes.map(t => t.label)}
                    selected={filters.type ?? []}
                    onToggle={(v) => toggleArrayFilter("type", v.toLowerCase() as MangaType)}
                    multi={false}
                  />
                  <FilterSection
                    title="Status"
                    items={mangaStatuses.map(s => s.label)}
                    selected={filters.status ?? []}
                    onToggle={(v) => toggleArrayFilter("status", v.toLowerCase() as MangaStatus)}
                    multi={false}
                  />
                </div>
              </motion.div>
            )}

            <AnimatePresence mode="wait">
              {isLoading ? (
                <div key="loading" className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {Array.from({ length: 8 }).map((_, i) => (
                    <MangaCardSkeleton key={i} />
                  ))}
                </div>
              ) : results ? (
                <motion.div
                  key="results"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
                >
                  {results.manga.length === 0 ? (
                    <div className="col-span-full text-center py-16">
                      <Search className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
                      <h3 className="text-heading-md font-semibold text-foreground mb-2">
                        No results found
                      </h3>
                      <p className="text-muted-foreground">
                        Try adjusting your search or filters
                      </p>
                    </div>
                  ) : (
                    results.manga.map((manga, index) => (
                      <MangaCard
                        key={manga.id}
                        manga={manga}
                        priority={index < 4}
                      />
                    ))
                  )}
                </motion.div>
              ) : null}
            </AnimatePresence>

            {results && results.totalPages > 1 && (
              <div className="mt-8 flex items-center justify-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={(filters.page ?? 1) <= 1}
                  onClick={() => handleFilterChange("page", (filters.page || 1) - 1)}
                >
                  <ChevronLeft className="h-4 w-4" />
                  Previous
                </Button>
                <span className="text-sm text-muted-foreground">
                  Page {filters.page ?? 1} of {results.totalPages} ({formatNumber(results.total)} results)
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={(filters.page ?? 1) >= results.totalPages}
                  onClick={() => handleFilterChange("page", (filters.page || 1) + 1)}
                >
                  Next
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}

function FilterSection({
  title,
  items,
  selected,
  onToggle,
  multi = true,
}: {
  title: string;
  items: string[];
  selected: string[];
  onToggle: (value: string) => void;
  multi?: boolean;
}) {
  const [isOpen, setIsOpen] = useState(true);

  return (
    <div>
      <Button
        variant="ghost"
        size="sm"
        className="w-full justify-between text-left p-0 font-medium"
        onClick={() => setIsOpen(!isOpen)}
      >
        <span>{title}</span>
        <ChevronDown className={cn("h-4 w-4 transition-transform", isOpen ? "rotate-180" : "")} />
      </Button>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-2 space-y-1.5"
          >
            {items.map((item) => (
              <label
                key={item}
                className="flex items-center gap-2 cursor-pointer text-sm"
              >
                <input
                  type={multi ? "checkbox" : "radio"}
                  checked={selected.includes(item)}
                  onChange={() => onToggle(item)}
                  className="h-4 w-4 rounded border-border text-primary focus:ring-primary"
                />
                <span>{item}</span>
              </label>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function debounce<T extends (...args: unknown[]) => void>(fn: T, delay: number): T {
  let timeoutId: ReturnType<typeof setTimeout>;
  return ((...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn(...args), delay);
  }) as T;
}