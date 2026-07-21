"use client";
 
import { useState, useCallback, useEffect, useRef } from "react";
import { motion, AnimatePresence, useMotionValue, useTransform, useSpring } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { BookOpen, Heart, Bookmark, Clock, Eye, Star, TrendingUp, ChevronLeft, ChevronRight, Share2, Download, Flag } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator, DropdownMenuLabel } from "@/components/ui/dropdown-menu";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { cn, formatNumber, formatRelativeTime, formatDate, getProxiedImageUrl } from "@/lib/utils";
import { Reader } from "@/components/reader/reader";
import { MangaCarousel } from "@/components/home/MangaCarousel";
import { useChapterDetail } from "@/hooks/use-chapter-detail";
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
 
function TiltCover({ manga }: { manga: Manga }) {
  const cardRef = useRef<HTMLDivElement>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
 
  const rotateX = useSpring(useTransform(y, [-1, 1], [8, -8]), { stiffness: 300, damping: 30 });
  const rotateY = useSpring(useTransform(x, [-1, 1], [-8, 8]), { stiffness: 300, damping: 30 });
  const glare   = useSpring(useTransform(x, [-1, 1], [0, 0.4]), { stiffness: 300, damping: 30 });
 
  const handleMouse = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = cardRef.current?.getBoundingClientRect();
    if (!rect) return;
    x.set(((e.clientX - rect.left) / rect.width - 0.5) * 2);
    y.set(((e.clientY - rect.top)  / rect.height - 0.5) * 2);
  };
 
  const reset = () => { x.set(0); y.set(0); };
 
  return (
    <motion.div
      ref={cardRef}
      onMouseMove={handleMouse}
      onMouseLeave={reset}
      style={{ rotateX, rotateY, transformStyle: "preserve-3d", perspective: 800 }}
      className="relative w-full aspect-[2/3] rounded-2xl overflow-hidden shadow-2xl bg-muted cursor-pointer"
    >
      {manga.coverImage ? (
        <Image
          src={getProxiedImageUrl(manga.coverImage)}
          alt={manga.title}
          fill
          className="object-cover"
          priority
          sizes="(max-width: 768px) 100vw, 384px"
        />
      ) : (
        <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-primary/20 to-accent/20">
          <BookOpen className="h-24 w-24 text-primary/50" />
        </div>
      )}
      <motion.div
        className="absolute inset-0 rounded-2xl pointer-events-none"
        style={{
          background: useTransform(
            glare,
            (v) =>
              `linear-gradient(135deg, rgba(255,255,255,${v}) 0%, transparent 60%)`
          ),
        }}
      />
    </motion.div>
  );
}
 
import { useRouter } from "next/navigation";

export function MangaDetail({ manga, chapters }: MangaDetailProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("info");
  const [readingStatus, setReadingStatus] = useState<LibraryStatus>(manga.userData?.status || "plan_to_read");
  const [showReader, setShowReader] = useState(false);
  const [startChapter, setStartChapter] = useState(chapters[0]?.id);
  const [scrollY, setScrollY] = useState(0);

  const {
    chapter: loadedChapter,
    loading: isChapterLoading,
    error: chapterError,
    retry: retryChapter,
    prefetchChapter,
  } = useChapterDetail(manga.id, startChapter || null, showReader);

  // Restore scroll position on return from Reader
  useEffect(() => {
    if (typeof window === "undefined") return;
    const savedScroll = sessionStorage.getItem(`mangahub_manga_scroll_${manga.id}`);
    if (savedScroll) {
      const pos = parseInt(savedScroll, 10);
      if (!isNaN(pos) && pos > 0) {
        setTimeout(() => window.scrollTo({ top: pos, behavior: "instant" as any }), 50);
      }
    }
  }, [manga.id]);

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const openChapter = (chapterId: string) => {
    if (typeof window !== "undefined") {
      sessionStorage.setItem(`mangahub_manga_scroll_${manga.id}`, window.scrollY.toString());
    }
    router.push(`/manga/${manga.id}/chapter/${chapterId}`);
  };

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
          <div 
            className="absolute inset-0 -z-10 overflow-hidden"
            style={{ transform: `translateY(${scrollY * 0.45}px)` }}
          >
            <Image
              src={getProxiedImageUrl(manga.bannerImage)}
              alt=""
              fill
              className="object-cover"
              priority
              sizes="100vw"
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
                <TiltCover manga={manga} />

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
                        onClick={() => {
                          setReadingStatus("reading");
                          const firstChapter = chapters[0]?.id;
                          if (firstChapter) {
                            openChapter(firstChapter);
                          }
                        }}
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

              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="w-full justify-start border-b border-border bg-transparent h-auto p-0 gap-6 rounded-none">
                {[
                  { value: "info", label: "Information" },
                  { value: "chapters", label: `Chapters (${chapters.length})` },
                  { value: "reviews", label: "Reviews" },
                  { value: "related", label: "Related" }
                ].map((tab) => (
                  <TabsTrigger
                    key={tab.value}
                    value={tab.value}
                    className={cn(
                      "relative bg-transparent hover:text-foreground text-muted-foreground border-b-2 border-transparent px-1 py-3 rounded-none font-bold text-sm transition-all shadow-none",
                      "data-[state=active]:bg-transparent data-[state=active]:text-primary data-[state=active]:border-primary"
                    )}
                  >
                    {tab.label}
                    {activeTab === tab.value && (
                      <motion.div
                        layoutId="active-tab-glow"
                        className="absolute bottom-0 left-0 right-0 h-[2px] bg-primary"
                        transition={{ type: "tween", ease: "easeOut", duration: 0.15 }}
                      />
                    )}
                  </TabsTrigger>
                ))}
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
                        <div className="max-h-96 overflow-y-auto pr-2 space-y-2 custom-scrollbar">
                          {volumeChapters.map((chapter) => (
                            <ChapterRow
                              key={chapter.id}
                              chapter={chapter}
                              onMouseEnter={() => prefetchChapter(chapter.id)}
                              onClick={() => openChapter(chapter.id)}
                            />
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </TabsContent>
 
              <TabsContent value="reviews" className="mt-6">
                <p className="text-muted-foreground">Reviews coming soon...</p>
              </TabsContent>
 
              <TabsContent value="related" className="mt-6">
                <MangaCarousel
                  title="Related Recommendations"
                  items={[
                    { id: "jjk", title: "Jujutsu Kaisen", coverImage: "https://cdn.myanimelist.net/images/manga/3/210341.jpg", rating: 8.7, status: "ongoing", type: "manga" } as any,
                    { id: "bl", title: "Blue Lock", coverImage: "https://cdn.myanimelist.net/images/manga/5/290006.jpg", rating: 8.2, status: "ongoing", type: "manga" } as any,
                    { id: "berserk", title: "Berserk", coverImage: "https://cdn.myanimelist.net/images/manga/1/157897.jpg", rating: 9.5, status: "ongoing", type: "manga" } as any,
                    { id: "csm", title: "Chainsaw Man", coverImage: "https://cdn.myanimelist.net/images/manga/3/216464.jpg", rating: 9.0, status: "ongoing", type: "manga" } as any,
                  ]}
                  showFade
                />
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
      </div>

      {/* Sticky Bottom CTA for Mobile */}
      <div className="fixed bottom-0 left-0 right-0 z-30 p-4 bg-background/95 backdrop-blur border-t border-border flex items-center gap-3 sm:hidden">
        <Button
          className="flex-1 gap-2"
          onClick={() => {
            if (chapters[0]?.id) {
              openChapter(chapters[0].id);
            }
          }}
        >
          <BookOpen className="h-5 w-5" />
          Read Now
        </Button>
        <Button
          variant="outline"
          size="icon"
          onClick={() => setReadingStatus(readingStatus === "reading" ? "plan_to_read" : "reading")}
          className={cn(readingStatus === "reading" ? "text-primary border-primary" : "")}
          aria-label="Bookmark manga"
        >
          <Bookmark className="h-5 w-5 fill-current" />
        </Button>
      </div>
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

function ChapterRow({
  chapter,
  onClick,
  onMouseEnter,
}: {
  chapter: Chapter;
  onClick: () => void;
  onMouseEnter?: () => void;
}) {
  return (
    <button
      onClick={onClick}
      onMouseEnter={onMouseEnter}
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