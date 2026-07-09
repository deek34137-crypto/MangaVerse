"use client";

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Filter, Grid, List, Heart, BookOpen, Clock, RotateCcw, Trash2, Download, Settings, ChevronDown, MoreHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator, DropdownMenuLabel, DropdownMenuCheckboxItem } from "@/components/ui/dropdown-menu";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { MangaCard, MangaCardSkeleton } from "@/components/manga/manga-card";
import { cn, formatNumber, formatRelativeTime } from "@/lib/utils";
import type { Manga, LibraryStatus } from "@/types";

const statusOptions: { value: LibraryStatus; label: string; icon: React.ReactNode }[] = [
  { value: "reading", label: "Reading", icon: <BookOpen className="h-3.5 w-3.5" /> },
  { value: "completed", label: "Completed", icon: <RotateCcw className="h-3.5 w-3.5" /> },
  { value: "on_hold", label: "On Hold", icon: <Clock className="h-3.5 w-3.5" /> },
  { value: "dropped", label: "Dropped", icon: <Trash2 className="h-3.5 w-3.5" /> },
  { value: "plan_to_read", label: "Plan to Read", icon: <BookOpen className="h-3.5 w-3.5" /> },
  { value: "rereading", label: "Rereading", icon: <RotateCcw className="h-3.5 w-3.5" /> },
];

const sortOptions = [
  { value: "updated", label: "Recently Updated" },
  { value: "added", label: "Recently Added" },
  { value: "title", label: "Title (A-Z)" },
  { value: "progress", label: "Progress" },
  { value: "rating", label: "Your Rating" },
  { value: "chapters", label: "Chapter Count" },
];

export default function LibraryPage() {
  const [activeTab, setActiveTab] = useState<LibraryStatus>("reading");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [sortBy, setSortBy] = useState("updated");
  const [searchQuery, setSearchQuery] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const mockLibrary: Manga[] = [
    {
      id: "1",
      title: "One Piece",
      altTitles: ["ワンピース"],
      description: "Monkey D. Luffy sets out to become the King of the Pirates.",
      coverImage: "https://cdn.myanimelist.net/images/manga/2/253146.jpg",
      status: "ongoing",
      type: "manga",
      genres: [{ id: "1", name: "Action", slug: "action", mangaCount: 1000 }, { id: "2", name: "Adventure", slug: "adventure", mangaCount: 800 }, { id: "3", name: "Fantasy", slug: "fantasy", mangaCount: 1200 }],
      tags: [],
      authors: [{ id: "1", name: "Eiichiro Oda", slug: "eiichiro-oda", mangaCount: 5 }],
      artists: [],
      demographic: "shounen",
      rating: 9.5,
      ratingCount: 450000,
      followCount: 1500000,
      viewCount: 50000000,
      chapterCount: 1100,
      volumeCount: 105,
      createdAt: "2020-01-01T00:00:00Z",
      updatedAt: "2024-01-15T00:00:00Z",
      userData: { status: "reading", progress: 1080, lastReadChapterId: "ch-1080", lastReadAt: "2024-01-14T00:00:00Z", isFavorite: true, tags: [], createdAt: "2020-01-01T00:00:00Z", updatedAt: "2024-01-14T00:00:00Z" },
    },
    {
      id: "2",
      title: "Attack on Titan",
      altTitles: ["Shingeki no Kyojin", "進撃の巨人"],
      description: "Humanity fights for survival against man-eating Titans.",
      coverImage: "https://cdn.myanimelist.net/images/manga/1/196369.jpg",
      status: "completed",
      type: "manga",
      genres: [{ id: "4", name: "Action", slug: "action", mangaCount: 1000 }, { id: "5", name: "Drama", slug: "drama", mangaCount: 900 }, { id: "6", name: "Fantasy", slug: "fantasy", mangaCount: 1200 }],
      tags: [],
      authors: [{ id: "2", name: "Hajime Isayama", slug: "hajime-isayama", mangaCount: 3 }],
      artists: [],
      demographic: "shounen",
      rating: 9.2,
      ratingCount: 380000,
      followCount: 1200000,
      viewCount: 40000000,
      chapterCount: 139,
      volumeCount: 34,
      createdAt: "2020-01-01T00:00:00Z",
      updatedAt: "2021-04-09T00:00:00Z",
      userData: { status: "completed", progress: 139, lastReadChapterId: "ch-139", lastReadAt: "2021-04-10T00:00:00Z", isFavorite: true, tags: [], createdAt: "2020-01-01T00:00:00Z", updatedAt: "2021-04-10T00:00:00Z" },
    },
    {
      id: "3",
      title: "Jujutsu Kaisen",
      altTitles: ["呪術廻戦"],
      description: "A boy swallows a cursed finger and becomes a Jujutsu Sorcerer.",
      coverImage: "https://cdn.myanimelist.net/images/manga/1/225277.jpg",
      status: "ongoing",
      type: "manga",
      genres: [{ id: "7", name: "Action", slug: "action", mangaCount: 1000 }, { id: "8", name: "Supernatural", slug: "supernatural", mangaCount: 600 }],
      tags: [],
      authors: [{ id: "3", name: "Gege Akutami", slug: "gege-akutami", mangaCount: 2 }],
      artists: [],
      demographic: "shounen",
      rating: 8.8,
      ratingCount: 250000,
      followCount: 800000,
      viewCount: 25000000,
      chapterCount: 250,
      volumeCount: 25,
      createdAt: "2020-01-01T00:00:00Z",
      updatedAt: "2024-01-15T00:00:00Z",
      userData: { status: "reading", progress: 240, lastReadChapterId: "ch-240", lastReadAt: "2024-01-10T00:00:00Z", isFavorite: false, tags: [], createdAt: "2020-01-01T00:00:00Z", updatedAt: "2024-01-10T00:00:00Z" },
    },
  ];

  const filteredLibrary = mockLibrary.filter(m => m.userData?.status === activeTab);

  return (
    <div className="min-h-screen flex flex-col">
      <div className="container-padded py-8 pt-24">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div>
              <h1 className="text-display-md font-display font-bold text-foreground">My Library</h1>
              <p className="text-body-md text-muted-foreground mt-1">
                Manage and track your manga collection
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" className="gap-2">
                <Download className="h-4 w-4" />
                Export
              </Button>
              <Button variant="outline" size="sm" className="gap-2">
                <Settings className="h-4 w-4" />
                Settings
              </Button>
            </div>
          </div>

          <div className="flex flex-wrap gap-2" role="tablist" aria-label="Library status">
            {statusOptions.map((status) => (
              <button
                key={status.value}
                role="tab"
                aria-selected={activeTab === status.value}
                onClick={() => setActiveTab(status.value)}
                className={cn(
                  "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all",
                  activeTab === status.value
                    ? "bg-primary text-primary-foreground shadow-lg shadow-primary/25"
                    : "text-muted-foreground hover:text-foreground hover:bg-accent"
                )}
              >
                {status.icon}
                <span>{status.label}</span>
                <span className={cn(
                  "px-2 py-0.5 rounded-full text-xs font-medium",
                  activeTab === status.value ? "bg-primary-foreground/20 text-primary-foreground" : "bg-muted text-muted-foreground"
                )}>
                  {mockLibrary.filter(m => m.userData?.status === status.value).length}
                </span>
              </button>
            ))}
          </div>
        </motion.div>

        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search your library..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          <div className="flex items-center gap-2">
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-40 hidden sm:block">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {sortOptions.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Button
              variant={viewMode === "grid" ? "default" : "outline"}
              size="icon"
              onClick={() => setViewMode("grid")}
              aria-label="Grid view"
            >
              <Grid className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === "list" ? "default" : "outline"}
              size="icon"
              onClick={() => setViewMode("list")}
              aria-label="List view"
            >
              <List className="h-4 w-4" />
            </Button>

            <Button variant="outline" size="sm" className="gap-2 hidden sm:flex" onClick={() => setShowFilters(!showFilters)}>
              <Filter className="h-4 w-4" />
              Filters
            </Button>
          </div>
        </div>

        {showFilters && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            className="mb-6 p-4 bg-card rounded-lg border"
          >
            <div className="flex flex-wrap gap-4">
              <div className="flex-1 min-w-[200px]">
                <label className="text-sm font-medium text-muted-foreground block mb-1">Genres</label>
                <div className="flex flex-wrap gap-2">
                  {["Action", "Adventure", "Comedy", "Drama", "Fantasy", "Romance", "Sci-Fi", "Slice of Life"].map((genre) => (
                    <Badge key={genre} variant="outline" className="cursor-pointer hover:bg-accent">
                      {genre}
                    </Badge>
                  ))}
                </div>
              </div>
              <div className="flex-1 min-w-[200px]">
                <label className="text-sm font-medium text-muted-foreground block mb-1">Rating</label>
                <Select value="0" onValueChange={() => {}}>
                  <SelectTrigger className="w-full"><SelectValue placeholder="Any Rating" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0">Any</SelectItem>
                    <SelectItem value="7">7.0+</SelectItem>
                    <SelectItem value="8">8.0+</SelectItem>
                    <SelectItem value="9">9.0+</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </motion.div>
        )}

        <AnimatePresence mode="wait">
          {isLoading ? (
            <div key="loading" className={cn("grid gap-4", viewMode === "grid" ? "sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4" : "")}>
              {Array.from({ length: 8 }).map((_, i) => (
                <MangaCardSkeleton key={i} variant={viewMode === "list" ? "compact" : "default"} />
              ))}
            </div>
          ) : (
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className={cn(
                viewMode === "grid"
                  ? "grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
                  : "space-y-3"
              )}
            >
              {filteredLibrary.length === 0 ? (
                <div className={cn("col-span-full text-center py-16", viewMode === "list" && "col-span-1")}>
                  <BookOpen className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
                  <h3 className="text-heading-md font-semibold text-foreground mb-2">
                    No manga in {statusOptions.find(s => s.value === activeTab)?.label.toLowerCase()}
                  </h3>
                  <p className="text-muted-foreground mb-4">
                    Start adding manga to your library to track your reading progress.
                  </p>
                  <Button asChild>
                    <a href="/search">Browse Manga</a>
                  </Button>
                </div>
              ) : (
                filteredLibrary.map((manga, index) => (
                  <MangaCard
                    key={manga.id}
                    manga={manga}
                    variant={viewMode === "list" ? "compact" : "default"}
                    showActions={true}
                    priority={index < 4}
                  />
                ))
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}