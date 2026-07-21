"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import {
  ChevronLeft, ChevronRight, RotateCcw, Expand, Minimize2, Maximize2,
  Download, Settings, ChevronDown, ChevronUp, Menu, X, BookOpen,
  Zap, Sparkles, Key, Keyboard, Sun, Moon, Info, HelpCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuTrigger, DropdownMenuSeparator, DropdownMenuLabel,
  DropdownMenuCheckboxItem
} from "@/components/ui/dropdown-menu";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn, formatNumber, formatRelativeTime, getProxiedImageUrl } from "@/lib/utils";
import { useChapterDetail } from "@/hooks/use-chapter-detail";
import { FloatingPanel } from "@/components/ui/FloatingPanel";
import { Drawer } from "@/components/ui/Drawer";
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
  preserveZoom: boolean;
  fit: "width" | "height" | "contain" | "cover";
}
 
const defaultSettings: ReaderSettings = {
  mode: "vertical",
  direction: "rtl",
  transition: "slide",
  quality: "high",
  autoAdvance: false,
  showPageNumbers: true,
  preserveZoom: false,
  fit: "width",
};
 
function ShortcutRow({ keys, desc }: { keys: string[]; desc: string }) {
  return (
    <div className="flex items-center justify-between py-1.5 border-b border-border/40 last:border-0 text-sm">
      <span className="text-muted-foreground">{desc}</span>
      <div className="flex gap-1">
        {keys.map((k) => (
          <kbd key={k} className="px-2 py-0.5 bg-muted border border-border rounded text-xs font-mono font-bold text-foreground">
            {k}
          </kbd>
        ))}
      </div>
    </div>
  );
}
 
import { PerformanceOverlay } from "./engine/PerformanceOverlay";

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
  const [readerTheme, setReaderTheme] = useState<"dark" | "sepia" | "light">("dark");
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [isHoveringControls, setIsHoveringControls] = useState(false);
 
  const sortedChapters = [...chapters].sort((a, b) => Number(a.number) - Number(b.number));
  const currentChapterIndex = sortedChapters.findIndex(c => c.id === chapter.id);
  const totalPages = chapter.pages.length;

  const nextChapterId = sortedChapters[currentChapterIndex + 1]?.id;
  const { prefetchChapter } = useChapterDetail(manga.id, null, false);

  useEffect(() => {
    if (nextChapterId && (totalPages <= 3 || currentPage / totalPages >= 0.7)) {
      prefetchChapter(nextChapterId, 0);
    }
  }, [manga.id, nextChapterId, currentPage, totalPages, prefetchChapter]);
 
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
        else if (showShortcuts) setShowShortcuts(false);
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
      case "?":
        e.preventDefault();
        setShowShortcuts(!showShortcuts);
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
  }, [currentPage, totalPages, goToPage, goToChapter, settings.direction, zoom, showControls, showSettings, showChapters, showShortcuts, isFullscreen, onClose]);
 
  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);
 
  useEffect(() => {
    setCurrentPage(1);
    if (!settings.preserveZoom) {
      setZoom(100);
    }
  }, [chapter.id, settings.preserveZoom]);

  // Touch Edge Swipe-Back Gesture Handling (Edge swipe left-to-right when zoom is 100% returns to Manga Details)
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);

  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      const touch = e.touches[0];
      // Only register if touch begins near the left edge (< 30px)
      if (touch.clientX < 30) {
        touchStartRef.current = { x: touch.clientX, y: touch.clientY };
      } else {
        touchStartRef.current = null;
      }
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartRef.current && zoom === 100 && e.changedTouches.length === 1) {
      const touch = e.changedTouches[0];
      const deltaX = touch.clientX - touchStartRef.current.x;
      const deltaY = Math.abs(touch.clientY - touchStartRef.current.y);

      // If horizontal swipe right > 80px and vertical drift < 50px, navigate back
      if (deltaX > 80 && deltaY < 50) {
        onClose();
      }
    }
    touchStartRef.current = null;
  };
 
  // Browser fullscreen API sync
  useEffect(() => {
    const el = document.documentElement;
    if (isFullscreen) {
      el.requestFullscreen?.().catch(() => {});
    } else {
      if (document.fullscreenElement) {
        document.exitFullscreen?.().catch(() => {});
      }
    }
  }, [isFullscreen]);
 
  // Auto-hide controls after 3 seconds of inactivity, unless hovering controls
  useEffect(() => {
    if (!showControls || isHoveringControls || showSettings || showChapters || showShortcuts) return;
    
    let timer = setTimeout(() => {
      setShowControls(false);
    }, 3000);
 
    const handleMove = () => {
      clearTimeout(timer);
      timer = setTimeout(() => {
        if (!isHoveringControls && !showSettings && !showChapters && !showShortcuts) {
          setShowControls(false);
        }
      }, 3000);
    };
 
    window.addEventListener("mousemove", handleMove);
    window.addEventListener("touchstart", handleMove);
    return () => {
      clearTimeout(timer);
      window.removeEventListener("mousemove", handleMove);
      window.removeEventListener("touchstart", handleMove);
    };
  }, [showControls, isHoveringControls, showSettings, showChapters, showShortcuts]);
 
  const visiblePages = settings.mode === "horizontal" ? [currentPage] : Array.from({ length: totalPages }, (_, i) => i + 1);

  // ── Empty-page guard ────────────────────────────────────────────────────────
  // Prevents the '1 / 0' display when a chapter has no pages yet synced.
  if (totalPages === 0) {
    return (
      <div
        className={cn(
          "fixed inset-0 z-50 flex flex-col items-center justify-center gap-6 transition-colors duration-300",
          readerTheme === "dark" ? "bg-[#0A0A0F] text-[#F5F5F5]" : readerTheme === "sepia" ? "bg-[#F4ECD8] text-[#5C4033]" : "bg-white text-[#1A1A1A]"
        )}
      >
        <div className="text-center max-w-sm px-6 space-y-4">
          <div className="flex items-center justify-center w-16 h-16 rounded-2xl bg-destructive/10 border border-destructive/20 mx-auto">
            <Info className="h-8 w-8 text-destructive" />
          </div>
          <h2 className="text-lg font-bold font-display">This chapter couldn&apos;t be loaded.</h2>
          <div className="text-sm text-muted-foreground space-y-1 text-left bg-muted/30 rounded-xl p-4 border border-border/40">
            <p className="font-semibold text-foreground text-xs uppercase tracking-wide mb-2">Possible reasons</p>
            <ul className="space-y-1 text-xs">
              <li className="flex items-start gap-2"><span className="mt-0.5 text-muted-foreground">•</span>Provider unavailable or rate-limited</li>
              <li className="flex items-start gap-2"><span className="mt-0.5 text-muted-foreground">•</span>Chapter removed from source provider</li>
              <li className="flex items-start gap-2"><span className="mt-0.5 text-muted-foreground">•</span>Pages sync in progress — click retry</li>
            </ul>

            <details className="mt-3 pt-2 border-t border-border/40 text-[11px] font-mono text-muted-foreground">
              <summary className="cursor-pointer font-sans text-xs font-semibold text-foreground hover:text-primary transition-colors">
                Technical Diagnostics
              </summary>
              <div className="mt-2 space-y-1 bg-background/50 p-2.5 rounded-lg border border-border/30">
                <p><span className="text-muted-foreground">Chapter ID:</span> {chapter.id}</p>
                <p><span className="text-muted-foreground">Provider:</span> {chapter.provider || "Unknown"}</p>
                <p><span className="text-muted-foreground">Provider Chapter ID:</span> {chapter.providerChapterId || "N/A"}</p>
                <p><span className="text-muted-foreground">Expected Pages:</span> {chapter.pageCount ?? 0}</p>
                <p><span className="text-muted-foreground">Fetched Pages:</span> {chapter.pages.length}</p>
                <p><span className="text-muted-foreground">Sync Attempted:</span> Yes</p>
                <p><span className="text-muted-foreground">Timestamp:</span> {new Date().toISOString().slice(11, 19)} UTC</p>
              </div>
            </details>
          </div>
          <div className="flex gap-3 justify-center pt-2">
            <Button
              variant="default"
              onClick={() => window.location.reload()}
              className="h-10 px-4 font-semibold text-xs"
            >
              <RotateCcw className="h-4 w-4 mr-1.5" />
              Retry Current Provider
            </Button>
            <Button
              variant="outline"
              onClick={onClose}
              className="h-10 px-4 font-semibold text-xs"
            >
              <ChevronLeft className="h-4 w-4 mr-1.5" />
              Back to Manga
            </Button>
          </div>
        </div>
      </div>
    );
  }
  // ────────────────────────────────────────────────────────────────────────────
 
  return (
    <div
      className={cn(
        "fixed inset-0 z-50 flex flex-col transition-colors duration-300",
        readerTheme === "dark" ? "bg-[#0A0A0F] text-[#F5F5F5]" : readerTheme === "sepia" ? "bg-[#F4ECD8] text-[#5C4033]" : "bg-white text-[#1A1A1A]",
        isFullscreen && "!fixed !inset-0"
      )}
      onClick={() => setShowControls(true)}
      onKeyDown={handleKeyDown}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      tabIndex={0}
    >
      <TooltipProvider>
        {/* Top Control Panel */}
        <AnimatePresence>
          {showControls && (
            <div
              className="absolute top-4 left-4 right-4 z-40"
              onMouseEnter={() => setIsHoveringControls(true)}
              onMouseLeave={() => setIsHoveringControls(false)}
            >
              <FloatingPanel className="p-3 flex items-center justify-between gap-4" position="top" animate>
                <div className="flex items-center gap-3">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        onClick={onClose}
                        aria-label="Back to Manga Details"
                        className="h-9 px-2.5 flex items-center gap-1 text-xs font-semibold text-foreground hover:bg-muted/80 rounded-lg touch-target"
                      >
                        <ChevronLeft className="h-4 w-4 text-primary" />
                        <span className="hidden sm:inline">Back to Manga</span>
                        <span className="sm:hidden">Back</span>
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent side="bottom">Back to Manga Details (Esc)</TooltipContent>
                  </Tooltip>
 
                  {/* Interactive Chapter Selector Dropdown */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button className="text-left hover:bg-muted/50 px-2 py-1 rounded-lg transition-colors flex items-center gap-1.5 focus-visible:outline-none">
                        <div className="max-w-[120px] sm:max-w-[200px]">
                          <p className="font-semibold text-xs text-foreground truncate leading-none">{manga.title}</p>
                          <p className="text-[10px] text-muted-foreground flex items-center gap-0.5 mt-1 font-medium leading-none">
                            Ch. {chapter.number} {chapter.title ? `· ${chapter.title}` : ""}
                            <ChevronDown className="h-3 w-3 text-muted-foreground/75" />
                          </p>
                        </div>
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start" className="w-72 max-h-[350px] overflow-y-auto p-1 glass-dark border-border/60">
                      <DropdownMenuLabel className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-2.5 py-1.5">
                        Chapters List
                      </DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      {sortedChapters.map((ch, idx) => (
                        <DropdownMenuItem
                          key={ch.id}
                          onClick={() => onChapterChange(ch.id)}
                          className={cn(
                            "flex flex-col items-start gap-0.5 px-3 py-2 rounded-lg cursor-pointer transition-colors text-foreground",
                            idx === currentChapterIndex
                              ? "bg-primary/20 text-primary font-bold focus:bg-primary/30"
                              : "hover:bg-muted/50 focus:bg-muted/50"
                          )}
                        >
                          <span className="font-bold text-xs">Chapter {ch.number}</span>
                          {ch.title && <span className="text-[10px] opacity-70 truncate w-full">{ch.title}</span>}
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
 
                {/* Center Page Progress Indicator */}
                <div className="flex items-center gap-2 bg-muted/40 border border-border/50 rounded-xl p-1">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="ghost" size="icon" onClick={() => goToChapter(1)} disabled={currentChapterIndex === sortedChapters.length - 1} aria-label="Previous chapter" className="h-8 w-8 rounded-lg">
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent side="bottom">Previous Chapter (→)</TooltipContent>
                  </Tooltip>
 
                  <div className="flex items-center gap-1.5 px-2">
                    <span className="text-xs font-mono font-bold text-foreground" aria-live="polite">
                      {settings.showPageNumbers ? `${currentPage} / ${totalPages}` : "Reading"}
                    </span>
                  </div>
 
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="ghost" size="icon" onClick={() => goToChapter(-1)} disabled={currentChapterIndex === 0} aria-label="Next chapter" className="h-8 w-8 rounded-lg">
                        <ChevronLeft className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent side="bottom">Next Chapter (←)</TooltipContent>
                  </Tooltip>
                </div>
 
                {/* Right Side Quick settings / Actions */}
                <div className="flex items-center gap-1">
                  {/* Shortcut Hint */}
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="ghost" size="icon" onClick={() => setShowShortcuts(true)} aria-label="Keyboard Shortcuts" className="h-9 w-9">
                        <Keyboard className="h-4.5 w-4.5 text-muted-foreground hover:text-foreground" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent side="bottom">Shortcuts (?)</TooltipContent>
                  </Tooltip>
 
                  {/* Chapters sidebar trigger */}
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="ghost" size="icon" onClick={() => { setShowChapters(!showChapters); setShowSettings(false); }} aria-label="Chapter menu" className="h-9 w-9">
                        <Menu className="h-4.5 w-4.5 text-muted-foreground hover:text-foreground" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent side="bottom">Chapters Panel (C)</TooltipContent>
                  </Tooltip>
 
                  {/* Quality Settings trigger */}
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="ghost" size="icon" onClick={() => { setShowSettings(!showSettings); setShowChapters(false); }} aria-label="Settings" className="h-9 w-9">
                        <Settings className="h-4.5 w-4.5 text-muted-foreground hover:text-foreground" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent side="bottom">Settings (S)</TooltipContent>
                  </Tooltip>
 
                  {/* Fullscreen trigger */}
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="ghost" size="icon" onClick={() => setIsFullscreen(!isFullscreen)} aria-label="Fullscreen" className="h-9 w-9">
                        {isFullscreen ? <Minimize2 className="h-4.5 w-4.5 text-muted-foreground hover:text-foreground" /> : <Maximize2 className="h-4.5 w-4.5 text-muted-foreground hover:text-foreground" />}
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent side="bottom">Fullscreen (F)</TooltipContent>
                  </Tooltip>
                </div>
              </FloatingPanel>
            </div>
          )}
        </AnimatePresence>
 
        {/* Large Side Paging Overlays (For horizontal reading layout on Desktop) */}
        {settings.mode === "horizontal" && (
          <>
            <div className="absolute left-4 top-1/2 -translate-y-1/2 z-40 hidden sm:block">
              <Button
                variant="outline"
                size="icon"
                className="h-14 w-14 rounded-full bg-background/40 backdrop-blur border-border/40 hover:bg-background/80 hover:scale-105 transition-all text-foreground"
                onClick={(e) => {
                  e.stopPropagation();
                  if (settings.direction === "rtl") {
                    if (currentPage < totalPages) goToPage(currentPage + 1);
                    else goToChapter(-1);
                  } else {
                    if (currentPage > 1) goToPage(currentPage - 1);
                    else goToChapter(1);
                  }
                }}
                disabled={settings.direction === "rtl" ? (currentPage === totalPages && currentChapterIndex === 0) : (currentPage === 1 && currentChapterIndex === sortedChapters.length - 1)}
                aria-label="Previous Page"
              >
                <ChevronLeft className="h-6 w-6" />
              </Button>
            </div>
 
            <div className="absolute right-4 top-1/2 -translate-y-1/2 z-40 hidden sm:block">
              <Button
                variant="outline"
                size="icon"
                className="h-14 w-14 rounded-full bg-background/40 backdrop-blur border-border/40 hover:bg-background/80 hover:scale-105 transition-all text-foreground"
                onClick={(e) => {
                  e.stopPropagation();
                  if (settings.direction === "rtl") {
                    if (currentPage > 1) goToPage(currentPage - 1);
                    else goToChapter(1);
                  } else {
                    if (currentPage < totalPages) goToPage(currentPage + 1);
                    else goToChapter(-1);
                  }
                }}
                disabled={settings.direction === "rtl" ? (currentPage === 1 && currentChapterIndex === sortedChapters.length - 1) : (currentPage === totalPages && currentChapterIndex === 0)}
                aria-label="Next Page"
              >
                <ChevronRight className="h-6 w-6" />
              </Button>
            </div>
          </>
        )}
 
        {/* Settings Panel Drawer */}
        <Drawer
          open={showSettings}
          onClose={() => setShowSettings(false)}
          title="Reader Settings"
          side="right"
          width="w-[340px]"
        >
          <div className="p-5 space-y-6">
            {/* Theme selection visual cards */}
            <SettingGroup title="Reader Theme">
              <div className="grid grid-cols-3 gap-2">
                {[
                  { value: "dark", label: "Dark", bg: "bg-[#0A0A0F]", text: "text-[#F5F5F5]", border: "border-border/60" },
                  { value: "sepia", label: "Sepia", bg: "bg-[#F4ECD8]", text: "text-[#5C4033]", border: "border-[#E8DCC4]" },
                  { value: "light", label: "Light", bg: "bg-[#FFFFFF]", text: "text-[#1A1A1A]", border: "border-[#E5E5E5]" },
                ].map((item) => (
                  <button
                    key={item.value}
                    onClick={() => setReaderTheme(item.value as any)}
                    className={cn(
                      "flex flex-col items-center justify-center p-3 h-14 rounded-xl border transition-all hover:scale-102 active:scale-98",
                      item.bg, item.text, item.border,
                      readerTheme === item.value
                        ? "border-primary ring-2 ring-primary/30 font-bold"
                        : "opacity-80 hover:opacity-100"
                    )}
                  >
                    <span className="text-xs">{item.label}</span>
                  </button>
                ))}
              </div>
            </SettingGroup>
 
            {/* Reading Mode Selector cards */}
            <SettingGroup title="Reading Mode">
              <div className="grid grid-cols-3 gap-2">
                {[
                  { value: "vertical", label: "Webtoon", icon: BookOpen },
                  { value: "horizontal", label: "Manga", icon: Zap },
                  { value: "webtoon", label: "Scroll", icon: Sparkles },
                ].map((item) => {
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.value}
                      onClick={() => setSettings(p => ({ ...p, mode: item.value as any }))}
                      className={cn(
                        "flex flex-col items-center justify-center gap-1.5 p-2 h-16 rounded-xl border bg-muted/40 transition-all hover:bg-muted/80",
                        settings.mode === item.value
                          ? "border-primary ring-2 ring-primary/20 text-primary font-bold bg-primary/5"
                          : "border-border/60 text-muted-foreground hover:text-foreground"
                      )}
                    >
                      <Icon className="h-4.5 w-4.5" />
                      <span className="text-[10px] font-semibold">{item.label}</span>
                    </button>
                  );
                })}
              </div>
            </SettingGroup>
 
            {/* Reading Direction */}
            <SettingGroup title="Reading Direction">
              <div className="grid grid-cols-2 gap-2">
                {[
                  { value: "rtl", label: "Right-to-Left (RTL)" },
                  { value: "ltr", label: "Left-to-Right (LTR)" },
                ].map((item) => (
                  <button
                    key={item.value}
                    onClick={() => setSettings(p => ({ ...p, direction: item.value as any }))}
                    className={cn(
                      "p-2.5 rounded-xl border text-xs font-semibold transition-all text-center",
                      settings.direction === item.value
                        ? "border-primary bg-primary/5 text-primary"
                        : "border-border/60 bg-muted/40 text-muted-foreground hover:text-foreground hover:bg-muted/80"
                    )}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </SettingGroup>
 
            {/* Fit mode selector */}
            <SettingGroup title="Fit Mode">
              <div className="grid grid-cols-2 gap-2">
                {[
                  { value: "width", label: "Fit Width" },
                  { value: "height", label: "Fit Height" },
                  { value: "contain", label: "Contain" },
                  { value: "cover", label: "Cover" },
                ].map((item) => (
                  <button
                    key={item.value}
                    onClick={() => setSettings(p => ({ ...p, fit: item.value as any }))}
                    className={cn(
                      "p-2 rounded-xl border text-[11px] font-semibold transition-all text-center",
                      settings.fit === item.value
                        ? "border-primary bg-primary/5 text-primary"
                        : "border-border/60 bg-muted/40 text-muted-foreground hover:text-foreground hover:bg-muted/80"
                    )}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </SettingGroup>
 
            {/* Zoom selector */}
            <SettingGroup title="Zoom">
              <div className="flex items-center gap-1.5 bg-muted/40 border border-border/60 rounded-xl p-1">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-muted-foreground hover:text-foreground"
                  onClick={() => setZoom(z => Math.max(50, z - 10))}
                  aria-label="Zoom out"
                >
                  −
                </Button>
                <span className="flex-1 text-xs font-mono font-bold text-center text-foreground">
                  {zoom}%
                </span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-muted-foreground hover:text-foreground"
                  onClick={() => setZoom(z => Math.min(200, z + 10))}
                  aria-label="Zoom in"
                >
                  +
                </Button>
              </div>
            </SettingGroup>
 
            {/* Switches */}
            <SettingGroup title="Options">
              <div className="space-y-4 pt-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-foreground">Auto-advance Chapters</span>
                  <Switch
                    checked={settings.autoAdvance}
                    onCheckedChange={checked => setSettings(p => ({ ...p, autoAdvance: checked }))}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-foreground">Show Page Numbers</span>
                  <Switch
                    checked={settings.showPageNumbers}
                    onCheckedChange={checked => setSettings(p => ({ ...p, showPageNumbers: checked }))}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-foreground">Preserve Zoom Level</span>
                  <Switch
                    checked={settings.preserveZoom}
                    onCheckedChange={checked => setSettings(p => ({ ...p, preserveZoom: checked }))}
                  />
                </div>
              </div>
            </SettingGroup>
          </div>
        </Drawer>
 
        {/* Chapters panel Drawer */}
        <Drawer
          open={showChapters}
          onClose={() => setShowChapters(false)}
          title="Chapters"
          side="left"
          width="w-[320px]"
        >
          <div className="p-4 space-y-1.5">
            {sortedChapters.map((ch, idx) => (
              <button
                key={ch.id}
                onClick={() => { onChapterChange(ch.id); setShowChapters(false); }}
                className={cn(
                  "w-full text-left p-3 rounded-xl transition-all duration-200 border flex flex-col gap-0.5",
                  idx === currentChapterIndex
                    ? "bg-primary/10 border-primary text-primary font-bold"
                    : "border-transparent bg-muted/20 hover:bg-muted hover:border-border/40 text-foreground"
                )}
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs">Chapter {ch.number}</span>
                  <span className="text-[10px] text-muted-foreground font-mono">{ch.pageCount} pgs</span>
                </div>
                {ch.title && <p className="text-[11px] opacity-80 truncate w-full">{ch.title}</p>}
                <p className="text-[9px] opacity-60 mt-0.5">{formatRelativeTime(ch.publishedAt)}</p>
              </button>
            ))}
          </div>
        </Drawer>
 
        {/* Keyboard Shortcuts Overlay Modal */}
        {showShortcuts && (
          <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-[99] flex items-center justify-center p-4">
            <FloatingPanel className="w-full max-w-md p-6 relative border border-border/80 shadow-2xl" position="center">
              <Button
                variant="ghost"
                size="icon"
                className="absolute top-4 right-4 h-8 w-8 text-muted-foreground hover:text-foreground hover:bg-muted"
                onClick={() => setShowShortcuts(false)}
                aria-label="Close shortcuts overlay"
              >
                <X className="h-4 w-4" />
              </Button>
              <h3 className="text-base font-bold font-display mb-4 text-foreground flex items-center gap-2">
                <Keyboard className="h-5 w-5 text-primary" /> Keyboard Shortcuts
              </h3>
              <div className="space-y-1.5 max-h-[300px] overflow-y-auto pr-1">
                <ShortcutRow keys={["Esc"]} desc="Close Panels / Exit Reader" />
                <ShortcutRow keys={["Space"]} desc="Toggle Controls Toolbar" />
                <ShortcutRow keys={["←"]} desc="Next page / Prev chapter (RTL)" />
                <ShortcutRow keys={["→"]} desc="Prev page / Next chapter (RTL)" />
                <ShortcutRow keys={["↑"]} desc="Scroll Up (Vertical / Webtoon)" />
                <ShortcutRow keys={["↓"]} desc="Scroll Down (Vertical / Webtoon)" />
                <ShortcutRow keys={["f"]} desc="Toggle Fullscreen" />
                <ShortcutRow keys={["s"]} desc="Toggle Settings panel" />
                <ShortcutRow keys={["c"]} desc="Toggle Chapters panel" />
                <ShortcutRow keys={["z"]} desc="Zoom In" />
                <ShortcutRow keys={["Shift", "Z"]} desc="Zoom Out" />
                <ShortcutRow keys={["m"]} desc="Toggle Reading Mode" />
                <ShortcutRow keys={["?"]} desc="Toggle Shortcuts Menu" />
              </div>
            </FloatingPanel>
          </div>
        )}
 
        {/* Bottom Progress Controls Toolbar */}
        <AnimatePresence>
          {showControls && (
            <div
              className="absolute bottom-4 left-4 right-4 z-40"
              onMouseEnter={() => setIsHoveringControls(true)}
              onMouseLeave={() => setIsHoveringControls(false)}
            >
              <FloatingPanel className="p-4 flex flex-col sm:flex-row items-center justify-between gap-4" position="bottom" animate>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full sm:w-auto h-9 font-medium"
                  onClick={() => goToChapter(1)}
                  disabled={currentChapterIndex === sortedChapters.length - 1}
                >
                  <ChevronRight className="mr-1.5 h-4 w-4" />
                  Previous Chapter
                </Button>
 
                {/* Thin interactive slider for page scrubbing */}
                <div className="flex-1 max-w-md w-full px-2 flex flex-col gap-1.5">
                  <div className="flex items-center justify-between text-[11px] font-semibold text-muted-foreground">
                    <span>Page scrubbing</span>
                    <span>{currentPage} / {totalPages} ({Math.round((currentPage / totalPages) * 100)}%)</span>
                  </div>
                  <div
                    className="h-2 w-full bg-muted/60 rounded-full overflow-hidden cursor-pointer relative"
                    onClick={(e) => {
                      const rect = e.currentTarget.getBoundingClientRect();
                      const pct = (e.clientX - rect.left) / rect.width;
                      goToPage(Math.round(pct * totalPages));
                    }}
                    role="slider"
                    aria-valuenow={currentPage}
                    aria-valuemin={1}
                    aria-valuemax={totalPages}
                    aria-label="Reader page slider"
                  >
                    <div
                      className="h-full bg-primary rounded-full transition-all duration-300"
                      style={{ width: `${(currentPage / totalPages) * 100}%` }}
                    />
                  </div>
                </div>
 
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full sm:w-auto h-9 font-medium"
                  onClick={() => goToChapter(-1)}
                  disabled={currentChapterIndex === 0}
                >
                  Next Chapter
                  <ChevronLeft className="ml-1.5 h-4 w-4" />
                </Button>
              </FloatingPanel>
            </div>
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
            />
          ) : (
            <HorizontalReaderView
              chapter={chapter}
              settings={settings}
              zoom={zoom}
              currentPage={currentPage}
              setCurrentPage={setCurrentPage}
            />
          )}
        </div>

        <PerformanceOverlay />
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

import { useCapabilityTier } from "@/hooks/useCapabilityTier";
import { readerStorage } from "@/lib/reader-storage";

function VerticalReaderView({
  chapter,
  settings,
  zoom,
  currentPage,
  setCurrentPage,
}: {
  chapter: Chapter;
  settings: ReaderSettings;
  zoom: number;
  currentPage: number;
  setCurrentPage: (page: number) => void;
}) {
  const { evictionWindowSize } = useCapabilityTier();

  const handlePageEnter = (pageNum: number) => {
    if (settings.showPageNumbers && Math.abs(pageNum - currentPage) < 2) {
      setCurrentPage(pageNum);
      // Auto-save session
      readerStorage.saveSession({
        mangaId: chapter.mangaId || "",
        chapterId: chapter.id,
        pageNumber: pageNum,
        zoomScale: zoom / 100,
        scrollOffset: window.scrollY || 0,
        readingMode: settings.mode,
        updatedAt: Date.now(),
      });
    }
  };

  return (
    <div className="reader-vertical reader-container max-w-4xl mx-auto px-4 py-8">
      <div className="space-y-6" role="list" aria-label="Manga pages">
        {chapter.pages.map((page, index) => {
          const pageNum = index + 1;
          const isVisible = Math.abs(pageNum - currentPage) <= evictionWindowSize;

          if (!isVisible) {
            // Placeholder element for offscreen pages to keep DOM node count < 50
            return (
              <div
                key={page.id}
                className="w-full h-[600px] bg-ink-900/30 rounded-lg flex items-center justify-center text-xs text-muted-foreground"
              >
                Page {pageNum} (offscreen)
              </div>
            );
          }

          return (
            <ReaderPage
              key={page.id}
              page={page}
              index={index}
              zoom={zoom}
              settings={settings}
              isCurrent={pageNum === currentPage}
              onEnter={() => handlePageEnter(pageNum)}
              currentPage={currentPage}
            />
          );
        })}
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
}: {
  chapter: Chapter;
  settings: ReaderSettings;
  zoom: number;
  currentPage: number;
  setCurrentPage: (page: number) => void;
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
              currentPage={currentPage}
            />
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}

import { getCachedImage, cacheImage } from "@/utils/readerCache";

function ReaderPage({
  page,
  index,
  zoom,
  settings,
  isCurrent,
  isHorizontal = false,
  onEnter,
  currentPage,
}: {
  page: Chapter["pages"][0];
  index: number;
  zoom: number;
  settings: ReaderSettings;
  isCurrent: boolean;
  isHorizontal?: boolean;
  onEnter?: () => void;
  currentPage: number;
}) {
  const [srcUrl, setSrcUrl] = useState<string>("");
  const [imageState, setImageState] = useState<"loading" | "loaded" | "error">("loading");
  const [retryCount, setRetryCount] = useState(0);

  const rawUrl = getProxiedImageUrl(page.url);
  const shouldRenderImage = Math.abs(index + 1 - currentPage) <= 1; // page +/- 1

  const loadImage = useCallback(async () => {
    if (!shouldRenderImage) return;

    setImageState("loading");
    try {
      const cached = await getCachedImage(rawUrl);
      if (cached) {
        setSrcUrl(cached);
        setImageState("loaded");
        return;
      }

      const res = await fetch(rawUrl);
      if (!res.ok) throw new Error("Failed to load page");
      const blob = await res.blob();
      
      await cacheImage(rawUrl, blob);

      const objectUrl = URL.createObjectURL(blob);
      setSrcUrl(objectUrl);
      setImageState("loaded");
    } catch (err) {
      console.error(`[ReaderPage] Error loading page ${page.number}:`, err);
      setImageState("error");
    }
  }, [rawUrl, shouldRenderImage, page.number]);

  useEffect(() => {
    loadImage();
    return () => {
      if (srcUrl && srcUrl.startsWith("blob:")) {
        URL.revokeObjectURL(srcUrl);
      }
    };
  }, [loadImage, retryCount]);

  const handleRetry = () => {
    setRetryCount(prev => prev + 1);
  };

  const aspectRatio = page.width && page.height ? page.width / page.height : 0.7;

  if (!shouldRenderImage) {
    return (
      <div
        className={cn(
          "relative flex-shrink-0 snap-center bg-muted/20 border border-border/20 rounded-lg flex items-center justify-center transition-colors duration-300",
          isHorizontal ? "h-[90vh] max-h-[90vh]" : "w-full"
        )}
        style={!isHorizontal ? { aspectRatio: `${aspectRatio}` } : { width: `calc(90vh * ${aspectRatio})` }}
        onMouseEnter={onEnter}
      >
        <div className="text-xs text-muted-foreground">Page {page.number} (not loaded)</div>
      </div>
    );
  }

  const fitStyles = {
    width: { width: "100%", height: "auto" },
    height: { width: "auto", height: "100%" },
    contain: { width: "100%", height: "100%", objectFit: "contain" as const },
    cover: { width: "100%", height: "100%", objectFit: "cover" as const },
  };

  return (
    <div
      className={cn(
        "relative flex-shrink-0 snap-center select-none",
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
          aspectRatio: !isHorizontal ? `${aspectRatio}` : undefined,
        }}
      >
        {imageState === "loading" && (
          <div className="absolute inset-0 bg-muted/50 flex flex-col items-center justify-center gap-2">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            <span className="text-[10px] text-muted-foreground font-semibold">Loading page {page.number}...</span>
          </div>
        )}

        {imageState === "error" && (
          <div className="absolute inset-0 bg-destructive/10 border border-destructive/20 rounded-lg flex flex-col items-center justify-center p-6 gap-3 text-center">
            <Info className="h-8 w-8 text-destructive animate-pulse" />
            <div className="space-y-1">
              <p className="text-sm font-bold text-foreground">Failed to Load Page {page.number}</p>
              <p className="text-xs text-muted-foreground">The image upstream request timed out or failed to load.</p>
            </div>
            <div className="flex gap-2">
              <Button size="sm" variant="default" onClick={handleRetry} className="h-8 font-semibold">
                <RotateCcw className="h-3 w-3 mr-1.5" /> Retry
              </Button>
            </div>
          </div>
        )}

        {imageState === "loaded" && srcUrl && (
          <img
            src={srcUrl}
            alt={`Page ${page.number}`}
            className="w-full h-full object-contain"
          />
        )}
      </div>

      {settings.showPageNumbers && (
        <div className={cn(
          "absolute bottom-2 right-2 text-xs px-2 py-1 rounded bg-background/80 backdrop-blur",
          isCurrent ? "text-primary font-medium" : "text-muted-foreground"
        )}>
          Page {page.number} / {page.number}
        </div>
      )}
    </div>
  );
}