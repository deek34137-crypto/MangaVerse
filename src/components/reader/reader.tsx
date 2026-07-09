"use client";

import { useState, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import { ChevronLeft, ChevronRight, RotateCcw, Expand, Minimize2, Maximize2, Download, Settings, ChevronDown, ChevronUp, Menu, X, BookOpen, Zap, Sparkles, Key } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator, DropdownMenuLabel, DropdownMenuCheckboxItem } from "@/components/ui/dropdown-menu";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn, formatNumber, formatRelativeTime } from "@/lib/utils";
import type { Chapter, Manga } from "@/types";

interface ReaderProps {
  manga: Manga;
  chapter: Chapter;
  chapters: Chapter[];
  onChapterChange: (chapterId: string) => void;
  onClose: () => void;
  initialSettings?: ReaderSettings;
}

interface ReaderSettings {
  mode: "vertical" | "horizontal" | "webtoon";
  direction: "rtl" | "ltr";
  transition: "slide" | "fade" | "none";
  quality: "low" | "medium" | "high" | "original";
  autoAdvance: boolean;
  showPageNumbers: boolean;
  fit: "width" | "height" | "contain" | "cover";
}

const defaultSettings: ReaderSettings = {
  mode: "vertical",
  direction: "rtl",
  transition: "slide",
  quality: "high",
  autoAdvance: false,
  showPageNumbers: true,
  fit: "width",
};

export function Reader({
  manga,
  chapter,
  chapters,
  onChapterChange,
  onClose,
  initialSettings,
}: ReaderProps) {
  const [settings, setSettings] = useState<ReaderSettings>({ ...defaultSettings, ...initialSettings });
  const [showControls, setShowControls] = useState(true);
  const [showSettings, setShowSettings] = useState(false);
  const [showChapters, setShowChapters] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [zoom, setZoom] = useState(100);
  const [currentPage, setCurrentPage] = useState(1);
  const [loadingPages, setLoadingPages] = useState<Set<string>>(new Set());

  const sortedChapters = [...chapters].sort((a, b) => Number(a.number) - Number(b.number));
  const currentChapterIndex = sortedChapters.findIndex(c => c.id === chapter.id);
  const totalPages = chapter.pages.length;

  const goToPage = useCallback((page: number) => {
    const clamped = Math.max(1, Math.min(totalPages, page));
    setCurrentPage(clamped);
  }, [totalPages]);

  const goToChapter = useCallback((delta: number) => {
    const newIndex = currentChapterIndex + delta;
    if (newIndex >= 0 && newIndex < sortedChapters.length) {
      onChapterChange(sortedChapters[newIndex].id);
      setCurrentPage(1);
    }
  }, [currentChapterIndex, sortedChapters, onChapterChange]);

  const handleKeyDown = useCallback((e: KeyboardEvent | React.KeyboardEvent) => {
    if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

    switch (e.key) {
      case "ArrowLeft":
        e.preventDefault();
        if (settings.direction === "rtl") {
          if (currentPage < totalPages) goToPage(currentPage + 1);
          else goToChapter(-1);
        } else {
          if (currentPage > 1) goToPage(currentPage - 1);
          else goToChapter(1);
        }
        break;
      case "ArrowRight":
        e.preventDefault();
        if (settings.direction === "rtl") {
          if (currentPage > 1) goToPage(currentPage - 1);
          else goToChapter(1);
        } else {
          if (currentPage < totalPages) goToPage(currentPage + 1);
          else goToChapter(-1);
        }
        break;
      case "ArrowUp":
        e.preventDefault();
        goToPage(currentPage - 1);
        break;
      case "ArrowDown":
        e.preventDefault();
        goToPage(currentPage + 1);
        break;
      case " ":
        e.preventDefault();
        setShowControls(!showControls);
        break;
      case "Escape":
        if (showSettings) setShowSettings(false);
        else if (showChapters) setShowChapters(false);
        else onClose();
        break;
      case "f":
        setIsFullscreen(!isFullscreen);
        break;
      case "s":
        setShowSettings(!showSettings);
        break;
      case "c":
        setShowChapters(!showChapters);
        break;
      case "z":
        if (e.shiftKey) setZoom(Math.max(50, zoom - 10));
        else setZoom(Math.min(200, zoom + 10));
        break;
      case "r":
        if (e.shiftKey) setSettings(prev => ({ ...prev, direction: prev.direction === "rtl" ? "ltr" : "rtl" }));
        break;
      case "m":
        setSettings(prev => ({
          ...prev,
          mode: prev.mode === "vertical" ? "horizontal" : prev.mode === "horizontal" ? "webtoon" : "vertical"
        }));
        break;
    }
  }, [currentPage, totalPages, goToPage, goToChapter, settings.direction, zoom, showControls, showSettings, showChapters, isFullscreen, onClose]);

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  useEffect(() => {
    setCurrentPage(1);
  }, [chapter.id]);

  const visiblePages = settings.mode === "horizontal" ? [currentPage] : Array.from({ length: totalPages }, (_, i) => i + 1);

  return (
    <div
      className={cn(
        "fixed inset-0 z-50 bg-background flex flex-col",
        isFullscreen && "!fixed !inset-0"
      )}
      onClick={() => setShowControls(true)}
      onKeyDown={handleKeyDown}
      tabIndex={0}
    >
      <TooltipProvider>
        {showControls && (
          <motion.div
            initial={{ y: -100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -100, opacity: 0 }}
            className="flex items-center justify-between p-3 border-b border-border bg-background/95 backdrop-blur-support"
          >
            <div className="flex items-center gap-3">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" onClick={onClose} aria-label="Close reader">
                    <ChevronLeft className="h-5 w-5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="bottom">Close (Esc)</TooltipContent>
              </Tooltip>

              <div className="hidden sm:block">
                <p className="font-medium truncate max-w-xs">{manga.title}</p>
                <p className="text-xs text-muted-foreground">
                  Ch. {chapter.number} {chapter.title ? `· ${chapter.title}` : ""}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="outline" size="sm" onClick={() => goToChapter(1)} disabled={currentChapterIndex === sortedChapters.length - 1} aria-label="Previous chapter">
                    <ChevronRight className="h-4 w-4" />
                    <span className="hidden sm:inline">Prev</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="bottom">Previous Chapter (→)</TooltipContent>
              </Tooltip>

              <div className="flex items-center gap-2 px-3 py-1 rounded-lg bg-muted">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="ghost" size="icon" onClick={() => goToPage(currentPage - 1)} disabled={currentPage === 1} aria-label="Previous page">
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="bottom">Previous Page</TooltipContent>
                </Tooltip>

                <span className="text-sm font-mono w-24 text-center" aria-live="polite">
                  {settings.showPageNumbers ? `${currentPage} / ${totalPages}` : ""}
                </span>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="ghost" size="icon" onClick={() => goToPage(currentPage + 1)} disabled={currentPage === totalPages} aria-label="Next page">
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="bottom">Next Page</TooltipContent>
                </Tooltip>
              </div>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="outline" size="sm" onClick={() => goToChapter(-1)} disabled={currentChapterIndex === 0} aria-label="Next chapter">
                    <span className="hidden sm:inline">Next</span>
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="bottom">Next Chapter (←)</TooltipContent>
              </Tooltip>
            </div>

            <div className="flex items-center gap-4 ml-auto">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" onClick={() => setShowChapters(!showChapters)} aria-label="Chapter list">
                    <Menu className="h-5 w-5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="bottom">Chapters (C)</TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" aria-label="Reading mode">
                        {settings.mode === "vertical" && <BookOpen className="h-5 w-5" />}
                        {settings.mode === "horizontal" && <Zap className="h-5 w-5" />}
                        {settings.mode === "webtoon" && <Sparkles className="h-5 w-5" />}
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>Reading Mode</DropdownMenuLabel>
                      <DropdownMenuItem onClick={() => setSettings(p => ({ ...p, mode: "vertical" }))} className={settings.mode === "vertical" ? "bg-accent" : ""}>
                        Vertical (Webtoon)
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setSettings(p => ({ ...p, mode: "horizontal" }))} className={settings.mode === "horizontal" ? "bg-accent" : ""}>
                        Horizontal (Manga)
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setSettings(p => ({ ...p, mode: "webtoon" }))} className={settings.mode === "webtoon" ? "bg-accent" : ""}>
                        Webtoon Scroll
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TooltipTrigger>
                <TooltipContent side="bottom">Reading Mode (M)</TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" aria-label="Settings">
                        <Settings className="h-5 w-5" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-64 p-2">
                      <DropdownMenuLabel>Reader Settings</DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      <DropdownMenuCheckboxItem
                        checked={settings.autoAdvance}
                        onCheckedChange={checked => setSettings(p => ({ ...p, autoAdvance: checked }))}
                      >
                        Auto-advance chapters
                      </DropdownMenuCheckboxItem>
                      <DropdownMenuCheckboxItem
                        checked={settings.showPageNumbers}
                        onCheckedChange={checked => setSettings(p => ({ ...p, showPageNumbers: checked }))}
                      >
                        Show page numbers
                      </DropdownMenuCheckboxItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuLabel>Direction</DropdownMenuLabel>
                      <DropdownMenuItem onClick={() => setSettings(p => ({ ...p, direction: "rtl" }))} className={settings.direction === "rtl" ? "bg-accent" : ""}>
                        Right to Left
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setSettings(p => ({ ...p, direction: "ltr" }))} className={settings.direction === "ltr" ? "bg-accent" : ""}>
                        Left to Right
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuLabel>Image Quality</DropdownMenuLabel>
                      {(["low", "medium", "high", "original"] as const).map(q => (
                        <DropdownMenuItem
                          key={q}
                          onClick={() => setSettings(p => ({ ...p, quality: q }))}
                          className={settings.quality === q ? "bg-accent" : ""}
                        >
                          {q.charAt(0).toUpperCase() + q.slice(1)}
                        </DropdownMenuItem>
                      ))}
                      <DropdownMenuSeparator />
                      <DropdownMenuLabel>Fit Mode</DropdownMenuLabel>
                      {(["width", "height", "contain", "cover"] as const).map(f => (
                        <DropdownMenuItem
                          key={f}
                          onClick={() => setSettings(p => ({ ...p, fit: f }))}
                          className={settings.fit === f ? "bg-accent" : ""}
                        >
                          {f.charAt(0).toUpperCase() + f.slice(1)}
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TooltipTrigger>
                <TooltipContent side="bottom">Settings (S)</TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" onClick={() => setIsFullscreen(!isFullscreen)} aria-label="Fullscreen">
                    {isFullscreen ? <Minimize2 className="h-5 w-5" /> : <Maximize2 className="h-5 w-5" />}
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="bottom">Fullscreen (F)</TooltipContent>
              </Tooltip>
            </div>
          </motion.div>
        )}

        <AnimatePresence>
          {showSettings && (
            <motion.div
              initial={{ x: 300, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: 300, opacity: 0 }}
              className="fixed right-0 top-0 bottom-0 z-50 w-80 bg-card border-l border-border p-4 overflow-y-auto"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold">Reader Settings</h3>
                <Button variant="ghost" size="icon" onClick={() => setShowSettings(false)}>
                  <X className="h-5 w-5" />
                </Button>
              </div>
              <div className="space-y-6">
                <SettingGroup title="Reading Mode">
                  <div className="grid grid-cols-3 gap-2">
                    {["vertical", "horizontal", "webtoon"].map(mode => (
                      <Button
                        key={mode}
                        variant={settings.mode === mode ? "default" : "outline"}
                        className="flex flex-col gap-1 py-3"
                        onClick={() => setSettings(p => ({ ...p, mode: mode as ReaderSettings["mode"] }))}
                      >
                        {mode === "vertical" && <BookOpen className="h-5 w-5 mx-auto" />}
                        {mode === "horizontal" && <Zap className="h-5 w-5 mx-auto" />}
                        {mode === "webtoon" && <Sparkles className="h-5 w-5 mx-auto" />}
                        <span className="text-xs capitalize">{mode}</span>
                      </Button>
                    ))}
                  </div>
                </SettingGroup>

                <SettingGroup title="Direction">
                  <div className="flex gap-2">
                    {["rtl", "ltr"].map(dir => (
                      <Button
                        key={dir}
                        variant={settings.direction === dir ? "default" : "outline"}
                        className="flex-1"
                        onClick={() => setSettings(p => ({ ...p, direction: dir as ReaderSettings["direction"] }))}
                      >
                        {dir.toUpperCase()}
                      </Button>
                    ))}
                  </div>
                </SettingGroup>

                <SettingGroup title="Transition">
                  <div className="flex gap-2">
                    {["slide", "fade", "none"].map(t => (
                      <Button
                        key={t}
                        variant={settings.transition === t ? "default" : "outline"}
                        className="flex-1 capitalize"
                        onClick={() => setSettings(p => ({ ...p, transition: t as ReaderSettings["transition"] }))}
                      >
                        {t}
                      </Button>
                    ))}
                  </div>
                </SettingGroup>

                <SettingGroup title="Image Quality">
                  <div className="flex gap-2">
                    {(["low", "medium", "high", "original"] as const).map(q => (
                      <Button
                        key={q}
                        variant={settings.quality === q ? "default" : "outline"}
                        className="flex-1 capitalize"
                        onClick={() => setSettings(p => ({ ...p, quality: q }))}
                      >
                        {q}
                      </Button>
                    ))}
                  </div>
                </SettingGroup>

                <SettingGroup title="Fit Mode">
                  <div className="flex gap-2">
                    {(["width", "height", "contain", "cover"] as const).map(f => (
                      <Button
                        key={f}
                        variant={settings.fit === f ? "default" : "outline"}
                        className="flex-1 capitalize"
                        onClick={() => setSettings(p => ({ ...p, fit: f }))}
                      >
                        {f}
                      </Button>
                    ))}
                  </div>
                </SettingGroup>

                <SettingGroup title="Options">
                  <label className="flex items-center justify-between">
                    <span>Auto-advance chapters</span>
                    <Switch
                      checked={settings.autoAdvance}
                      onCheckedChange={checked => setSettings(p => ({ ...p, autoAdvance: checked }))}
                    />
                  </label>
                  <label className="flex items-center justify-between">
                    <span>Show page numbers</span>
                    <Switch
                      checked={settings.showPageNumbers}
                      onCheckedChange={checked => setSettings(p => ({ ...p, showPageNumbers: checked }))}
                    />
                  </label>
                </SettingGroup>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {showChapters && (
            <motion.div
              initial={{ x: -300, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -300, opacity: 0 }}
              className="fixed left-0 top-0 bottom-0 z-50 w-80 bg-card border-r border-border p-4 overflow-y-auto"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold">Chapters</h3>
                <Button variant="ghost" size="icon" onClick={() => setShowChapters(false)}>
                  <X className="h-5 w-5" />
                </Button>
              </div>
              <div className="space-y-1 max-h-[calc(100vh-120px)] overflow-y-auto">
                {sortedChapters.map((ch, idx) => (
                  <button
                    key={ch.id}
                    onClick={() => { onChapterChange(ch.id); setShowChapters(false); }}
                    className={cn(
                      "w-full text-left p-3 rounded-lg transition-colors",
                      idx === currentChapterIndex
                        ? "bg-accent text-accent-foreground"
                        : "hover:bg-accent text-foreground"
                    )}
                  >
                    <p className="font-medium">Ch. {ch.number}</p>
                    {ch.title && <p className="text-sm opacity-7text-sm truncate">{ch.title}</p>}
                    <p className="text-xs opacity-70">{ch.pageCount} pages · {formatRelativeTime(ch.publishedAt)}</p>
                  </button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div
          className="flex-1 overflow-auto relative"
          style={{
            scrollBehavior: settings.transition !== "none" ? "smooth" : "auto",
            direction: settings.direction,
          }}
        >
          {settings.mode === "vertical" || settings.mode === "webtoon" ? (
            <VerticalReaderView
              chapter={chapter}
              settings={settings}
              zoom={zoom}
              currentPage={currentPage}
              setCurrentPage={setCurrentPage}
              loadingPages={loadingPages}
              setLoadingPages={setLoadingPages}
            />
          ) : (
            <HorizontalReaderView
              chapter={chapter}
              settings={settings}
              zoom={zoom}
              currentPage={currentPage}
              setCurrentPage={setCurrentPage}
              loadingPages={loadingPages}
              setLoadingPages={setLoadingPages}
            />
          )}
        </div>

        {showControls && (
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            className="flex items-center justify-between p-3 border-t border-border bg-background/95 backdrop-blur-support"
          >
            <Button variant="outline" onClick={() => goToChapter(1)} disabled={currentChapterIndex === sortedChapters.length - 1}>
              Previous Chapter
            </Button>

            <div className="flex items-center gap-4">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" onClick={() => goToPage(currentPage - 1)} disabled={currentPage === 1}>
                    <ChevronRight className="h-5 w-5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Previous Page</TooltipContent>
              </Tooltip>

              <span className="text-sm font-mono min-w-[80px] text-center">
                {currentPage} / {totalPages}
              </span>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" onClick={() => goToPage(currentPage + 1)} disabled={currentPage === totalPages}>
                    <ChevronLeft className="h-5 w-5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Next Page</TooltipContent>
              </Tooltip>
            </div>

            <Button variant="outline" onClick={() => goToChapter(-1)} disabled={currentChapterIndex === 0}>
              Next Chapter
            </Button>
          </motion.div>
        )}
      </TooltipProvider>
    </div>
  );
}

function SettingGroup({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{title}</h4>
      {children}
    </div>
  );
}

function VerticalReaderView({
  chapter,
  settings,
  zoom,
  currentPage,
  setCurrentPage,
  loadingPages,
  setLoadingPages,
}: {
  chapter: Chapter;
  settings: ReaderSettings;
  zoom: number;
  currentPage: number;
  setCurrentPage: (page: number) => void;
  loadingPages: Set<string>;
  setLoadingPages: React.Dispatch<React.SetStateAction<Set<string>>>;
}) {
  const handlePageEnter = (pageNum: number) => {
    if (settings.showPageNumbers && Math.abs(pageNum - currentPage) < 2) {
      setCurrentPage(pageNum);
    }
  };

  return (
    <div className="reader-vertical reader-container max-w-4xl mx-auto px-4 py-8">
      <div className="space-y-6" role="list" aria-label="Manga pages">
        {chapter.pages.map((page, index) => (
          <ReaderPage
            key={page.id}
            page={page}
            index={index}
            zoom={zoom}
            settings={settings}
            isCurrent={index + 1 === currentPage}
            onEnter={() => handlePageEnter(index + 1)}
            loading={loadingPages.has(page.id)}
            onLoad={() => setLoadingPages(prev => { const n = new Set(prev); n.delete(page.id); return n; })}
          />
        ))}
      </div>
    </div>
  );
}

function HorizontalReaderView({
  chapter,
  settings,
  zoom,
  currentPage,
  setCurrentPage,
  loadingPages,
  setLoadingPages,
}: {
  chapter: Chapter;
  settings: ReaderSettings;
  zoom: number;
  currentPage: number;
  setCurrentPage: (page: number) => void;
  loadingPages: Set<string>;
  setLoadingPages: React.Dispatch<React.SetStateAction<Set<string>>>;
}) {
  return (
    <div className="reader-horizontal reader-container h-full">
      <ScrollArea className="h-full" type="hover" scrollHideDelay={1000}>
        <div className="flex h-full items-center justify-center gap-4 snap-x snap-mandatory overflow-x-auto pb-4">
          {chapter.pages.map((page, index) => (
            <ReaderPage
              key={page.id}
              page={page}
              index={index}
              zoom={zoom}
              settings={settings}
              isCurrent={index + 1 === currentPage}
              isHorizontal={true}
              loading={loadingPages.has(page.id)}
              onLoad={() => setLoadingPages(prev => { const n = new Set(prev); n.delete(page.id); return n; })}
            />
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}

function ReaderPage({
  page,
  index,
  zoom,
  settings,
  isCurrent,
  isHorizontal = false,
  onEnter,
  loading,
  onLoad,
}: {
  page: Chapter["pages"][0];
  index: number;
  zoom: number;
  settings: ReaderSettings;
  isCurrent: boolean;
  isHorizontal?: boolean;
  onEnter?: () => void;
  loading: boolean;
  onLoad: () => void;
}) {
  const getImageUrl = (url: string, quality: string) => {
    if (quality === "original") return url;
    // In production, this would use an image CDN with quality parameters
    return url;
  };

  const fitStyles = {
    width: { width: "100%", height: "auto" },
    height: { width: "auto", height: "100%" },
    contain: { width: "100%", height: "100%", objectFit: "contain" as const },
    cover: { width: "100%", height: "100%", objectFit: "cover" as const },
  };

  return (
    <div
      className={cn(
        "relative flex-shrink-0 snap-center",
        isHorizontal && "h-[90vh] max-h-[90vh]"
      )}
      onMouseEnter={onEnter}
      role="listitem"
      aria-label={`Page ${page.number}`}
    >
      <div
        className="relative overflow-hidden rounded-lg shadow-xl"
        style={{
          transform: `scale(${zoom / 100})`,
          transformOrigin: isHorizontal ? "center" : "top center",
          ...fitStyles[settings.fit],
        }}
      >
        {loading && (
          <div className="absolute inset-0 bg-muted/50 flex items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          </div>
        )}

        <Image
          src={getImageUrl(page.url, settings.quality)}
          alt={`Page ${page.number}`}
          width={page.width}
          height={page.height}
          className={cn(
            "transition-opacity duration-300",
            loading ? "opacity-0" : "opacity-100"
          )}
          onLoad={onLoad}
          loading={index < 2 ? "eager" : "lazy"}
          sizes={isHorizontal ? "80vw" : "(max-width: 768px) 100vw, 800px"}
        />
      </div>

      {settings.showPageNumbers && (
        <div className={cn(
          "absolute bottom-2 right-2 text-xs px-2 py-1 rounded bg-background/80 backdrop-blur",
          isCurrent ? "text-primary font-medium" : "text-muted-foreground"
        )}>
          Page {page.number} / {page.number}
        </div>
      )}

      <div className="absolute top-2 left-2 right-2 flex justify-between opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" className="bg-background/80 backdrop-blur rounded-full" onClick={() => {}}>
                <Download className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Download page</TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
    </div>
  );
}