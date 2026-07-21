"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Calendar, Clock, Trash2, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn, formatRelativeTime, formatDate } from "@/lib/utils";

const mockHistory = [
  { id: "1", mangaId: "1", chapterId: "ch-1080", progress: 100, readAt: "2024-01-15T10:30:00Z", manga: { id: "1", title: "One Piece", coverImage: "https://cdn.myanimelist.net/images/manga/2/253146.jpg", chapterCount: 1100, type: "manga", status: "ongoing", altTitles: [], description: "", genres: [], tags: [], authors: [], artists: [], demographic: "shounen", rating: 9.5, followCount: 1500000, viewCount: 50000000, volumeCount: 105, createdAt: "", updatedAt: "" }, chapter: { id: "ch-1080", number: 1080, title: "The Final War Begins", pageCount: 17, publishedAt: "2024-01-15T00:00:00Z", language: "en", pages: [], scanlatorGroups: [], createdAt: "", updatedAt: "" } },
  { id: "2", mangaId: "3", chapterId: "ch-240", progress: 100, readAt: "2024-01-14T15:45:00Z", manga: { id: "3", title: "Jujutsu Kaisen", coverImage: "https://cdn.myanimelist.net/images/manga/1/225277.jpg", chapterCount: 250, type: "manga", status: "ongoing", altTitles: [], description: "", genres: [], tags: [], authors: [], artists: [], demographic: "shounen", rating: 8.8, followCount: 800000, viewCount: 25000000, volumeCount: 25, createdAt: "", updatedAt: "" }, chapter: { id: "ch-240", number: 240, title: "Shinjuku Showdown", pageCount: 19, publishedAt: "2024-01-14T00:00:00Z", language: "en", pages: [], scanlatorGroups: [], createdAt: "", updatedAt: "" } },
  { id: "3", mangaId: "2", chapterId: "ch-139", progress: 100, readAt: "2024-01-10T20:00:00Z", manga: { id: "2", title: "Attack on Titan", coverImage: "https://cdn.myanimelist.net/images/manga/1/196369.jpg", chapterCount: 139, type: "manga", status: "completed", altTitles: [], description: "", genres: [], tags: [], authors: [], artists: [], demographic: "shounen", rating: 9.2, followCount: 1200000, viewCount: 40000000, volumeCount: 34, createdAt: "", updatedAt: "" }, chapter: { id: "ch-139", number: 139, title: "Toward the Tree on That Hill", pageCount: 45, publishedAt: "2021-04-09T00:00:00Z", language: "en", pages: [], scanlatorGroups: [], createdAt: "", updatedAt: "" } },
];

export function HistoryClient() {
  const [filter, setFilter] = useState<"all" | "today" | "week" | "month">("all");

  const grouped = mockHistory.reduce<Record<string, typeof mockHistory>>(() => {
    const groups: Record<string, typeof mockHistory> = {};
    mockHistory.forEach(entry => {
      const date = new Date(entry.readAt).toDateString();
      if (!groups[date]) groups[date] = [];
      groups[date].push(entry);
    });
    return groups;
  }, {});

  return (
    <div className="min-h-screen flex flex-col">
      <div className="container-padded py-8 pt-24">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-display-md font-display font-bold text-foreground">Reading History</h1>
              <p className="text-body-md text-muted-foreground mt-1">
                Track your reading progress and revisit previous chapters
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" className="gap-2">
                <Filter className="h-4 w-4" />
                Filter
              </Button>
              <Button variant="outline" size="sm" className="gap-2">
                <Trash2 className="h-4 w-4" />
                Clear History
              </Button>
            </div>
          </div>
        </motion.div>

        <div className="flex gap-4 mb-6" role="tablist">
          {(["all", "today", "week", "month"] as const).map((f) => (
            <button
              key={f}
              role="tab"
              aria-selected={filter === f}
              onClick={() => setFilter(f)}
              className={cn(
                "px-4 py-2 rounded-lg text-sm font-medium transition-colors",
                filter === f
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground hover:bg-accent"
              )}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>

        <div className="space-y-6">
          {Object.entries(grouped).map(([date, entries]) => (
            <motion.div
              key={date}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <div className="flex items-center gap-4 mb-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <Calendar className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="text-heading-md font-semibold text-foreground">
                    {date === new Date().toDateString() ? "Today" : date === new Date(Date.now() - 86400000).toDateString() ? "Yesterday" : formatDate(date)}
                  </h3>
                  <p className="text-sm text-muted-foreground">{entries.length} chapter{entries.length !== 1 ? "s" : ""} read</p>
                </div>
              </div>

              <ScrollArea className="max-h-64" type="hover">
                <div className="flex gap-4 pb-4">
                  {entries.map((entry) => (
                    <div key={entry.id} className="flex-shrink-0 w-48">
                      <Card className="group cursor-pointer hover:shadow-lg transition-shadow">
                        <div className="aspect-[2/3] relative overflow-hidden rounded-t-lg bg-muted">
                          {entry.manga.coverImage && (
                            <img
                              src={entry.manga.coverImage}
                              alt={entry.manga.title}
                              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                              loading="lazy"
                            />
                          )}
                          <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                          <div className="absolute bottom-2 left-2 right-2 flex justify-between opacity-0 group-hover:opacity-100 transition-opacity">
                            <Badge variant="secondary" className="text-xs">
                              Ch. {entry.chapter.number}
                            </Badge>
                            <Badge variant="outline" className="text-xs">
                              {entry.progress}%
                            </Badge>
                          </div>
                        </div>
                        <CardContent className="p-3">
                          <p className="font-medium text-sm line-clamp-1 mb-1">{entry.manga.title}</p>
                          <p className="text-xs text-muted-foreground line-clamp-1 mb-2">{entry.chapter.title}</p>
                          <div className="flex items-center justify-between text-xs text-muted-foreground">
                            <span>{formatRelativeTime(entry.readAt)}</span>
                            <span>{entry.chapter.pageCount} pages</span>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </motion.div>
          ))}
        </div>

        {Object.keys(grouped).length === 0 && (
          <div className="text-center py-16">
            <Clock className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
            <h3 className="text-heading-md font-semibold text-foreground mb-2">No reading history</h3>
            <p className="text-muted-foreground mb-4">Start reading manga to build your history</p>
            <Button asChild>
              <a href="/search">Browse Manga</a>
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
