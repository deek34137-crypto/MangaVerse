"use client";

import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { BookOpen, Heart, Bookmark, Clock, Eye, Star, TrendingUp } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn, formatNumber, formatRelativeTime } from "@/lib/utils";
import type { Manga, LibraryStatus } from "@/types";

const statusLabels: Record<LibraryStatus, string> = {
  reading: "Reading",
  completed: "Completed",
  on_hold: "On Hold",
  dropped: "Dropped",
  plan_to_read: "Plan to Read",
  rereading: "Rereading",
};

const statusIcons: Record<LibraryStatus, React.ReactNode> = {
  reading: <BookOpen className="h-3.5 w-3.5" />,
  completed: <Bookmark className="h-3.5 w-3.5" />,
  on_hold: <Clock className="h-3.5 w-3.5" />,
  dropped: <Eye className="h-3.5 w-3.5" />,
  plan_to_read: <BookOpen className="h-3.5 w-3.5" />,
  rereading: <TrendingUp className="h-3.5 w-3.5" />,
};

const statusColors: Record<LibraryStatus, string> = {
  reading: "border-primary/50 text-primary",
  completed: "border-green-500/50 text-green-500",
  on_hold: "border-yellow-500/50 text-yellow-500",
  dropped: "border-red-500/50 text-red-500",
  plan_to_read: "border-muted-foreground/50 text-muted-foreground",
  rereading: "border-purple-500/50 text-purple-500",
};

interface MangaCardProps {
  manga: Manga;
  variant?: "default" | "compact" | "featured";
  showActions?: boolean;
  priority?: boolean;
}

export function MangaCard({ manga, variant = "default", showActions = true, priority = false }: MangaCardProps) {
  const isCompact = variant === "compact";
  const isFeatured = variant === "featured";

  return (
    <TooltipProvider>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        layout
      >
        <Card className={cn(
          "group relative overflow-hidden h-full transition-all duration-300",
          "hover:shadow-xl hover:shadow-primary/10 hover:border-primary/20",
          isCompact && "flex flex-row items-start gap-4 p-3",
          isFeatured && "relative"
        )}>
          <AnimatePresence mode="wait">
            <motion.div
              key={manga.coverImage}
              initial={{ opacity: 0, scale: 1.05 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.3 }}
              className={cn(
                "relative overflow-hidden bg-muted",
                isCompact ? "w-24 h-34 flex-shrink-0 rounded-lg" : "aspect-[2/3] rounded-t-lg",
                isFeatured ? "rounded-lg" : ""
              )}
            >
              <Link href={`/manga/${manga.id}`} aria-label={`Read ${manga.title}`}>
                {manga.coverImage ? (
                  <Image
                    src={manga.coverImage}
                    alt={manga.title}
                    fill
                    sizes={isCompact ? "96px" : isFeatured ? "50vw" : "(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"}
                    className="object-cover transition-all duration-500 group-hover:scale-105"
                    placeholder="blur"
                    blurDataURL="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=="
                    priority={priority}
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-primary/20 to-accent/20">
                    <BookOpen className="h-12 w-12 text-primary/50" />
                  </div>
                )}
              </Link>

              <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-background/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

              <div className="absolute top-2 left-2 right-2 flex flex-wrap gap-1.5">
                {manga.type !== "manga" && (
                  <Badge variant="outline" className="text-xs px-2 py-0.5 capitalize">
                    {manga.type}
                  </Badge>
                )}
                {manga.status !== "ongoing" && (
                  <Badge variant="outline" className="text-xs px-2 py-0.5 capitalize">
                    {manga.status.replace("_", " ")}
                  </Badge>
                )}
                {manga.demographic && (
                  <Badge variant="outline" className="text-xs px-2 py-0.5 capitalize">
                    {manga.demographic}
                  </Badge>
                )}
              </div>

              <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <div className="flex gap-1.5">
                  {manga.rating > 0 && (
                    <Badge variant="secondary" className="gap-1 px-2 py-1">
                      <Star className="h-3 w-3 fill-current text-yellow-400" />
                      <span>{manga.rating.toFixed(1)}</span>
                    </Badge>
                  )}
                  <Badge variant="outline" className="px-2 py-1">
                    <Eye className="h-3 w-3 mr-1" />
                    {formatNumber(manga.viewCount)}
                  </Badge>
                </div>

                {showActions && manga.userData && (
                  <div className="flex gap-1">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 rounded-full bg-background/80 backdrop-blur-sm"
                        >
                          <Heart className={cn(
                            "h-4 w-4 transition-colors",
                            manga.userData.isFavorite ? "fill-current text-red-500" : "text-muted-foreground"
                          )} />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent side="top">Add to favorites</TooltipContent>
                    </Tooltip>

                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className={cn(
                                "h-8 w-8 rounded-full bg-background/80 backdrop-blur-sm",
                                statusColors[manga.userData.status]
                              )}
                            >
                              {statusIcons[manga.userData.status]}
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent side="top">{statusLabels[manga.userData.status]}</TooltipContent>
                        </Tooltip>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-40">
                        {(Object.keys(statusLabels) as LibraryStatus[]).map((status) => (
                          <DropdownMenuItem
                            key={status}
                            className={cn(
                              manga.userData?.status === status && "bg-accent text-accent-foreground"
                            )}
                            onClick={() => {}}
                          >
                            {statusIcons[status]}
                            <span className="ml-2 capitalize">{statusLabels[status].replace("_", " ")}</span>
                          </DropdownMenuItem>
                        ))}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                )}
              </div>

              {isFeatured && manga.bannerImage && (
                <div className="absolute inset-0 -z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                  <Image
                    src={manga.bannerImage}
                    alt=""
                    fill
                    className="object-cover blur-2xl brightness-50"
                    priority={priority}
                  />
                </div>
              )}
            </motion.div>
          </AnimatePresence>

          <CardContent className={cn(
            "p-4 flex flex-col flex-1",
            isCompact ? "pt-0 justify-between" : "",
            isFeatured ? "absolute bottom-0 left-0 right-0 bg-gradient-to-t from-background/95 to-transparent" : ""
          )}>
            <div className={cn("min-h-0", isCompact && "flex-1")}>
              <Link href={`/manga/${manga.id}`} className="block">
                <h3 className={cn(
                  "font-semibold leading-tight group-hover:text-primary transition-colors",
                  isCompact ? "text-sm line-clamp-1" : "text-base line-clamp-2",
                  isFeatured ? "text-lg" : ""
                )}>
                  {manga.title}
                </h3>
              </Link>

              {manga.altTitles.length > 0 && !isCompact && (
                <p className="text-xs text-muted-foreground line-clamp-1 mt-1">
                  {manga.altTitles[0]}
                </p>
              )}

              {!isCompact && manga.description && (
                <p className="text-sm text-muted-foreground line-clamp-3 mt-2">
                  {manga.description}
                </p>
              )}

              {!isCompact && manga.genres.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-3">
                  {manga.genres.slice(0, 4).map((genre) => (
                    <Badge key={genre.id} variant="outline" className="text-xs px-2 py-0.5">
                      {genre.name}
                    </Badge>
                  ))}
                  {manga.genres.length > 4 && (
                    <Badge variant="outline" className="text-xs px-2 py-0.5 text-muted-foreground">
                      +{manga.genres.length - 4}
                    </Badge>
                  )}
                </div>
              )}

              {!isCompact && (
                <div className="flex flex-wrap items-center gap-3 mt-3 pt-3 border-t border-border/50 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <BookOpen className="h-3 w-3" />
                    {manga.chapterCount} chapters
                  </span>
                  <span className="flex items-center gap-1">
                    <Heart className="h-3 w-3" />
                    {formatNumber(manga.followCount)}
                  </span>
                  {manga.latestChapter && (
                    <span className="flex items-center gap-1 ml-auto">
                      <Clock className="h-3 w-3" />
                      Ch. {manga.latestChapter.number}
                      <span className="text-muted-foreground/50">•</span>
                      {formatRelativeTime(manga.latestChapter.publishedAt)}
                    </span>
                  )}
                </div>
              )}
            </div>

            {showActions && !isCompact && manga.userData && (
              <div className="mt-4 flex gap-2 pt-3 border-t border-border/50">
                <Button
                  variant={manga.userData.status === "reading" ? "default" : "outline"}
                  size="sm"
                  className="flex-1 justify-center gap-1.5"
                  onClick={() => {}}
                >
                  <BookOpen className="h-3.5 w-3.5" />
                  {statusLabels[manga.userData.status].replace("_", " ")}
                </Button>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-9 w-9">
                      <Heart className={cn(
                        "h-4 w-4 transition-colors",
                        manga.userData.isFavorite ? "fill-current text-red-500" : "text-muted-foreground"
                      )} />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="top">Add to favorites</TooltipContent>
                </Tooltip>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </TooltipProvider>
  );
}

export function MangaCardSkeleton({ variant = "default" }: { variant?: "default" | "compact" }) {
  const isCompact = variant === "compact";

  return (
    <Card className={cn(
      "animate-pulse",
      isCompact && "flex flex-row items-start gap-4 p-3"
    )}>
      <div className={cn(
        "rounded-lg bg-muted",
        isCompact ? "w-24 h-34 flex-shrink-0" : "aspect-[2/3] rounded-t-lg"
      )} />
      <CardContent className={cn("p-4 flex flex-col flex-1", isCompact && "pt-0")}>
        <div className="h-4 w-3/4 bg-muted rounded mb-2" />
        <div className="h-3 w-1/2 bg-muted rounded mb-3" />
        <div className="h-4 w-full bg-muted rounded mb-2" />
        <div className="h-4 w-5/6 bg-muted rounded mb-2" />
        <div className="flex gap-2 mt-auto">
          <div className="h-5 w-16 bg-muted rounded" />
          <div className="h-5 w-16 bg-muted rounded" />
        </div>
      </CardContent>
    </Card>
  );
}