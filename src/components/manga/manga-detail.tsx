"use client";

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { BookOpen, Heart, Bookmark, Clock, Eye, Star, TrendingUp, ChevronLeft, ChevronRight, Share2, Download, Flag } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator, DropdownMenuLabel } from "@/components/ui/dropdown-menu";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { cn, formatNumber, formatRelativeTime, formatDate } from "@/lib/utils";
import type { Manga, Chapter, LibraryStatus } from "@/types";

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

interface MangaDetailProps {
  manga: Manga;
  chapters: Chapter[];
}

export function MangaDetail({ manga, chapters }: MangaDetailProps) {
  const [activeTab, setActiveTab] = useState("info");
  const [readingStatus, setReadingStatus] = useState<LibraryStatus>(manga.userData?.status || "plan_to_read");
  const [showReader, setShowReader] = useState(false);
  const [startChapter, setStartChapter] = useState(chapters[0]?.id);

  const sortedChapters = [...chapters].sort((a, b) => Number(b.number) - Number(a.number));
  const volumes = sortedChapters.reduce((acc, chapter) => {
    const vol = chapter.volume || 0;
    if (!acc[vol]) acc[vol] = [];
    acc[vol].push(chapter);
    return acc;
  }, {} as Record<number, Chapter[]>);

  return (
    <div className="min-h-screen">
      <div className="relative">
        {manga.bannerImage && (
          <div className="absolute inset-0 -z-10">
            <Image
              src={manga.bannerImage}
              alt=""
              fill
              className="object-cover"
              priority
            />
            <div className="absolute inset-0 bg-gradient-to-t from-background/95 via-background/50 to-transparent" />
          </div>
        )}

        <div className="container-padded pt-32 pb-8">
          <div className="grid gap-8 lg:grid-cols-4">
            <div className="lg:col-span-1">
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="relative"
              >
                <div className="aspect-[2/3] rounded-xl overflow-hidden shadow-2xl bg-muted">
                  {manga.coverImage ? (
                    <Image
                      src={manga.coverImage}
                      alt={manga.title}
                      fill
                      className="object-cover"
                      priority
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-primary/20 to-accent/20">
                      <BookOpen className="h-24 w-24 text-primary/50" />
                    </div>
                  )}
                </div>

                <div className="mt-4 flex items-center justify-center gap-2">
                  <Button variant="outline" size="sm" className="gap-1">
                    <Share2 className="h-4 w-4" />
                    Share
                  </Button>
                  <Button variant="outline" size="sm" className="gap-1">
                    <Download className="h-4 w-4" />
                    Download
                  </Button>
                  <Button variant="ghost" size="sm" className="gap-1">
                    <Flag className="h-4 w-4" />
                    Report
                  </Button>
                </div>
              </motion.div>
            </div>

            <div className="lg:col-span-3 space-y-6">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 }}
              >
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                      {manga.type !== "manga" && (
                        <Badge variant="secondary" className="capitalize">{manga.type}</Badge>
                      )}
                      {manga.status && (
                        <Badge variant={manga.status === "completed" ? "default" : "outline"} className="capitalize">
                          {manga.status.replace("_", " ")}
                        </Badge>
                      )}
                      {manga.demographic && (
                        <Badge variant="outline" className="capitalize">{manga.demographic}</Badge>
                      )}
                    </div>
                    <h1 className="text-display-md font-display font-bold text-foreground mb-2">
                      {manga.title}
                    </h1>
                    {manga.altTitles.length > 0 && (
                      <p className="text-body-lg text-muted-foreground">
                        Also known as: {manga.altTitles.join(", ")}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-center">
                      <div className="text-3xl font-bold text-foreground">
                        {manga.rating > 0 ? manga.rating.toFixed(1) : "N/A"}
                      </div>
                      <div className="flex items-center justify-center gap-1 text-sm text-muted-foreground">
                        <Star className="h-4 w-4 fill-current text-yellow-500" />
                        <span>{formatNumber(manga.ratingCount)} ratings</span>
                      </div>
                    </div>
                    <div className="w-px h-16 bg-border mx-4 hidden sm:block" />
                    <div className="text-center">
                      <div className="text-3xl font-bold text-foreground">{formatNumber(manga.followCount)}</div>
                      <div className="text-sm text-muted-foreground">Follows</div>
                    </div>
                    <div className="w-px h-16 bg-border mx-4 hidden sm:block" />
                    <div className="text-center">
                      <div className="text-3xl font-bold text-foreground">{formatNumber(manga.viewCount)}</div>
                      <div className="text-sm text-muted-foreground">Views</div>
                    </div>
                  </div>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="flex flex-wrap items-center gap-4"
              >
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant={readingStatus === "reading" ? "default" : "outline"}
                        size="lg"
                        className="gap-2"
                        onClick={() => setReadingStatus("reading")}
                      >
                        <BookOpen className="h-5 w-5" />
                        Read Now
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Start reading from latest chapter</TooltipContent>
                  </Tooltip>

                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="outline" size="lg" className="gap-2" onClick={() => setShowReader(true)}>
                        <Bookmark className="h-5 w-5" />
                        Chapter List
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Browse all chapters</TooltipContent>
                  </Tooltip>

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="outline"
                            size="lg"
                            className={cn("gap-2", statusColors[readingStatus])}
                          >
                            {statusIcons[readingStatus]}
                            <span>{statusLabels[readingStatus]}</span>
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Reading status</TooltipContent>
                      </Tooltip>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-44">
                      <DropdownMenuLabel>Reading Status</DropdownMenuLabel>
                      {(Object.keys(statusLabels) as LibraryStatus[]).map((status) => (
                        <DropdownMenuItem
                          key={status}
                          className={cn(
                            readingStatus === status && "bg-accent text-accent-foreground"
                          )}
                          onClick={() => setReadingStatus(status)}
                        >
                          {statusIcons[status]}
                          <span className="ml-2">{statusLabels[status]}</span>
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>

                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="ghost" size="lg" className="gap-2">
                        <Heart className={cn(
                          "h-5 w-5 transition-colors",
                          manga.userData?.isFavorite ? "fill-current text-red-500" : ""
                        )} />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Add to favorites</TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </motion.div>
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="w-full">
                <TabsTrigger value="info">Information</TabsTrigger>
                <TabsTrigger value="chapters">Chapters ({chapters.length})</TabsTrigger>
                <TabsTrigger value="characters">Characters</TabsTrigger>
                <TabsTrigger value="reviews">Reviews</TabsTrigger>
                <TabsTrigger value="related">Related</TabsTrigger>
              </TabsList>

              <TabsContent value="info" className="mt-6 space-y-6">
                <div className="prose prose-invert max-w-none">
                  <p className="text-body-lg text-muted-foreground leading-relaxed">
                    {manga.description || "No description available."}
                  </p>
                </div>

                <div className="grid gap-6 md:grid-cols-2">
                  <Card>
                    <CardHeader>
                      <CardTitle>Publication Info</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <InfoRow label="Status" value={manga.status?.replace("_", " ") || "Unknown"} />
                      <InfoRow label="Type" value={manga.type?.charAt(0).toUpperCase() + manga.type?.slice(1) || "Unknown"} />
                      <InfoRow label="Demographic" value={manga.demographic?.charAt(0).toUpperCase() + manga.demographic?.slice(1) || "Unknown"} />
                      <InfoRow label="Chapters" value={manga.chapterCount.toString()} />
                      <InfoRow label="Volumes" value={manga.volumeCount.toString()} />
                      <InfoRow label="Start Date" value={manga.startDate ? formatDate(manga.startDate) : "Unknown"} />
                      <InfoRow label="End Date" value={manga.endDate ? formatDate(manga.endDate) : manga.status === "completed" ? formatDate(manga.updatedAt) : "Ongoing"} />
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Statistics</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <StatRow label="Rating" value={manga.rating > 0 ? manga.rating.toFixed(2) : "N/A"} icon={<Star className="h-4 w-4 fill-current text-yellow-500" />} />
                      <StatRow label="Follows" value={formatNumber(manga.followCount)} icon={<Heart className="h-4 w-4" />} />
                      <StatRow label="Views" value={formatNumber(manga.viewCount)} icon={<Eye className="h-4 w-4" />} />
                      <StatRow label="Chapters" value={manga.chapterCount.toString()} icon={<BookOpen className="h-4 w-4" />} />
                    </CardContent>
                  </Card>
                </div>

                {manga.genres.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Genres</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex flex-wrap gap-2">
                        {manga.genres.map((genre) => (
                          <Badge key={genre.id} variant="outline" className="text-sm px-3 py-1">
                            {genre.name}
                          </Badge>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {(manga.authors.length > 0 || manga.artists.length > 0) && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Staff</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {manga.authors.length > 0 && (
                        <div>
                          <h4 className="font-medium text-sm text-muted-foreground mb-2">Authors</h4>
                          <div className="flex flex-wrap gap-2">
                            {manga.authors.map((author) => (
                              <Link key={author.id} href={`/author/${author.slug}`} className="text-primary hover:underline text-sm">
                                {author.name}
                              </Link>
                            ))}
                          </div>
                        </div>
                      )}
                      {manga.artists.length > 0 && (
                        <div>
                          <h4 className="font-medium text-sm text-muted-foreground mb-2">Artists</h4>
                          <div className="flex flex-wrap gap-2">
                            {manga.artists.map((artist) => (
                              <Link key={artist.id} href={`/artist/${artist.slug}`} className="text-primary hover:underline text-sm">
                                {artist.name}
                              </Link>
                            ))}
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              <TabsContent value="chapters" className="mt-6">
                <div className="space-y-4">
                  {Object.entries(volumes).map(([volumeNum, volumeChapters]) => (
                    <Card key={volumeNum}>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-lg">
                          Volume {volumeNum || "Unknown"}
                          <span className="text-sm font-normal text-muted-foreground ml-2">
                            ({volumeChapters.length} chapters)
                          </span>
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <ScrollArea className="max-h-96">
                          <div className="space-y-2">
                            {volumeChapters.map((chapter) => (
                              <ChapterRow
                                key={chapter.id}
                                chapter={chapter}
                                onClick={() => { setStartChapter(chapter.id); setShowReader(true); }}
                              />
                            ))}
                          </div>
                        </ScrollArea>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="characters" className="mt-6">
                <p className="text-muted-foreground">Characters coming soon...</p>
              </TabsContent>

              <TabsContent value="reviews" className="mt-6">
                <p className="text-muted-foreground">Reviews coming soon...</p>
              </TabsContent>

              <TabsContent value="related" className="mt-6">
                <p className="text-muted-foreground">Related manga coming soon...</p>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>

      <ReaderDialog
        open={showReader}
        onOpenChange={setShowReader}
        manga={manga}
        chapters={chapters}
        initialChapterId={startChapter}
      />
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between py-2 border-b border-border/50 last:border-0">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}

function StatRow({ label, value, icon }: { label: string; value: string; icon: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-border/50 last:border-0">
      <div className="flex items-center gap-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
          {icon}
        </div>
        <span className="text-muted-foreground">{label}</span>
      </div>
      <span className="font-bold text-foreground">{value}</span>
    </div>
  );
}

function ChapterRow({ chapter, onClick }: { chapter: Chapter; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-accent transition-colors text-left"
    >
      <div className="flex items-center gap-3 min-w-0">
        <div className="text-muted-foreground font-mono text-sm w-16">Ch. {chapter.number}</div>
        <div className="min-w-0">
          <p className="font-medium text-foreground truncate">
            {chapter.title || `Chapter ${chapter.number}`}
          </p>
          <p className="text-xs text-muted-foreground">
            {formatRelativeTime(chapter.publishedAt)} • {chapter.pageCount} pages
          </p>
        </div>
      </div>
      <ChevronRight className="h-5 w-5 text-muted-foreground flex-shrink-0" />
    </button>
  );
}

function ReaderDialog({
  open,
  onOpenChange,
  manga,
  chapters,
  initialChapterId,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  manga: Manga;
  chapters: Chapter[];
  initialChapterId?: string;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[90vw] max-h-[90vh] p-0">
        <div className="flex h-full w-full">
          <Reader
            manga={manga}
            chapters={chapters}
            initialChapterId={initialChapterId}
            onClose={onOpenChange}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}

function Reader({
  manga,
  chapters,
  initialChapterId,
  onClose,
}: {
  manga: Manga;
  chapters: Chapter[];
  initialChapterId?: string;
  onClose: (open: boolean) => void;
}) {
  const [currentChapterIndex, setCurrentChapterIndex] = useState(
    chapters.findIndex(c => c.id === initialChapterId)
  );
  const [readingMode, setReadingMode] = useState<"vertical" | "horizontal">("vertical");
  const [showControls, setShowControls] = useState(true);
  const [zoom, setZoom] = useState(100);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const currentChapter = chapters[currentChapterIndex];
  const sortedChapters = [...chapters].sort((a, b) => Number(a.number) - Number(b.number));

  const goToChapter = (index: number) => {
    if (index >= 0 && index < sortedChapters.length) {
      setCurrentChapterIndex(index);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowLeft") goToChapter(currentChapterIndex + 1);
    if (e.key === "ArrowRight") goToChapter(currentChapterIndex - 1);
    if (e.key === "Escape") onClose(false);
    if (e.key === "f") setIsFullscreen(!isFullscreen);
    if (e.key === " ") { e.preventDefault(); setShowControls(!showControls); }
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-background flex flex-col"
      onKeyDown={handleKeyDown}
      onClick={() => setShowControls(!showControls)}
      tabIndex={0}
    >
      {showControls && (
        <div className="flex items-center justify-between p-4 border-b border-border bg-background/95 backdrop-blur">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => onClose(false)}>
              <ChevronLeft className="h-5 w-5" />
            </Button>
            <div>
              <p className="font-medium truncate max-w-xs">{manga.title}</p>
              <p className="text-sm text-muted-foreground">
                Chapter {currentChapter?.number} {currentChapter?.title ? `: ${currentChapter.title}` : ""}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="outline" size="sm" onClick={() => setReadingMode("vertical")}>
                    <div className="w-5 h-5 flex flex-col justify-between">
                      <div className="h-1 bg-current rounded w-full" />
                      <div className="h-1 bg-current rounded w-full" />
                      <div className="h-1 bg-current rounded w-3/4" />
                    </div>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Vertical (Webtoon)</TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="outline" size="sm" onClick={() => setReadingMode("horizontal")}>
                    <div className="w-5 h-5 flex items-center justify-between">
                      <div className="h-3 w-1 bg-current rounded" />
                      <div className="h-3 w-1 bg-current rounded" />
                      <div className="h-3 w-1 bg-current rounded" />
                    </div>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Horizontal (Manga)</TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <div className="flex items-center gap-2 px-2 py-1 rounded-lg bg-muted">
              <Button variant="ghost" size="icon" onClick={() => goToChapter(currentChapterIndex + 1)} disabled={currentChapterIndex === 0}>
                <ChevronRight className="h-4 w-4" />
              </Button>
              <span className="text-sm font-mono w-20 text-center">
                {currentChapterIndex + 1} / {sortedChapters.length}
              </span>
              <Button variant="ghost" size="icon" onClick={() => goToChapter(currentChapterIndex - 1)} disabled={currentChapterIndex === sortedChapters.length - 1}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground w-16">Zoom</span>
              <Slider
                value={[zoom]}
                onValueChange={([v]) => setZoom(v)}
                min={50}
                max={200}
                step={10}
                className="w-32"
              />
              <span className="text-sm text-muted-foreground w-12">{zoom}%</span>
            </div>

            <Button variant="ghost" size="icon" onClick={() => setIsFullscreen(!isFullscreen)}>
              {isFullscreen ? <Minimize2 className="h-5 w-5" /> : <Maximize2 className="h-5 w-5" />}
            </Button>
          </div>
        </div>
      )}

      <div className="flex-1 overflow-auto relative" style={{ scrollBehavior: "smooth" }}>
        {readingMode === "vertical" ? (
          <VerticalReader chapter={currentChapter} zoom={zoom} />
        ) : (
          <HorizontalReader chapter={currentChapter} zoom={zoom} />
        )}
      </div>

      {showControls && (
        <div className="flex items-center justify-between p-4 border-t border-border bg-background/95 backdrop-blur">
          <Button variant="outline" onClick={() => goToChapter(currentChapterIndex + 1)} disabled={currentChapterIndex === 0}>
            Previous Chapter
          </Button>
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => goToChapter(currentChapterIndex + 1)} disabled={currentChapterIndex === 0}>
              <ChevronRight className="h-5 w-5" />
            </Button>
            <Button variant="ghost" size="icon" onClick={() => goToChapter(currentChapterIndex - 1)} disabled={currentChapterIndex === sortedChapters.length - 1}>
              <ChevronLeft className="h-5 w-5" />
            </Button>
          </div>
          <Button variant="outline" onClick={() => goToChapter(currentChapterIndex - 1)} disabled={currentChapterIndex === sortedChapters.length - 1}>
            Next Chapter
          </Button>
        </div>
      )}
    </div>
  );
}

function VerticalReader({ chapter, zoom }: { chapter: Chapter | undefined; zoom: number }) {
  if (!chapter) return null;

  return (
    <div className="reader-vertical reader-container max-w-4xl mx-auto px-4 py-8">
      <div className="space-y-4">
        {chapter.pages.map((page, index) => (
          <div key={page.id} className="relative">
            <Image
              src={page.url}
              alt={`Page ${page.number}`}
              width={page.width}
              height={page.height}
              className="w-full h-auto rounded-lg shadow-xl"
              loading="lazy"
              style={{ transform: `scale(${zoom / 100})`, transformOrigin: "top center" }}
            />
            <div className="absolute bottom-2 right-2 text-xs text-muted-foreground bg-background/80 backdrop-blur px-2 py-1 rounded">
              Page {page.number} / {chapter.pages.length}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function HorizontalReader({ chapter, zoom }: { chapter: Chapter | undefined; zoom: number }) {
  if (!chapter) return null;

  return (
    <div className="reader-horizontal reader-container h-full">
      <div className="flex h-full items-center justify-center px-4">
        <div className="flex h-full gap-4 snap-x snap-mandatory overflow-x-auto pb-4" style={{ scrollBehavior: "smooth" }}>
          {chapter.pages.map((page, index) => (
            <div
              key={page.id}
              className="flex-shrink-0 snap-center"
              style={{ transform: `scale(${zoom / 100})` }}
            >
              <Image
                src={page.url}
                alt={`Page ${page.number}`}
                width={page.width}
                height={page.height}
                className="h-[80vh] max-h-[80vh] w-auto object-contain rounded-lg shadow-xl"
                loading={index === 0 ? "eager" : "lazy"}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

import { Minimize2, Maximize2 } from "lucide-react";