"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Search, X, Mic, MicOff, History, Trash2, TrendingUp, SlidersHorizontal, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useHaptic } from "@/hooks/useHaptic";
import { cn } from "@/lib/utils";

const TRENDING_SEARCHES = ["Solo Leveling", "One Piece", "Jujutsu Kaisen", "Tower of God", "Demon Slayer"];
const RECENT_SEARCHES_KEY = "mangahub_recent_searches_v1";

interface MobileSearchOverlayProps {
  isOpen: boolean;
  onClose: () => void;
}

export function MobileSearchOverlay({ isOpen, onClose }: MobileSearchOverlayProps) {
  const [query, setQuery] = useState("");
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [isListening, setIsListening] = useState(false);
  const [hasSpeechSupport, setHasSpeechSupport] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const { triggerHaptic } = useHaptic();

  // Load recent searches on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(RECENT_SEARCHES_KEY);
      if (stored) {
        setRecentSearches(JSON.parse(stored));
      }
    } catch {
      // Ignore storage errors
    }

    // Check Web Speech API support
    if (typeof window !== "undefined") {
      const SpeechRecognition =
        (window as unknown as { SpeechRecognition?: unknown; webkitSpeechRecognition?: unknown }).SpeechRecognition ||
        (window as unknown as { SpeechRecognition?: unknown; webkitSpeechRecognition?: unknown }).webkitSpeechRecognition;
      setHasSpeechSupport(Boolean(SpeechRecognition));
    }
  }, []);

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 150);
    }
  }, [isOpen]);

  const saveRecentSearch = (term: string) => {
    const trimmed = term.trim();
    if (!trimmed) return;
    const updated = [trimmed, ...recentSearches.filter((s) => s.toLowerCase() !== trimmed.toLowerCase())].slice(0, 8);
    setRecentSearches(updated);
    try {
      localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updated));
    } catch {
      // Ignore
    }
  };

  const removeRecentSearch = (term: string) => {
    triggerHaptic("light");
    const updated = recentSearches.filter((s) => s !== term);
    setRecentSearches(updated);
    try {
      localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updated));
    } catch {
      // Ignore
    }
  };

  const clearAllRecent = () => {
    triggerHaptic("medium");
    setRecentSearches([]);
    try {
      localStorage.removeItem(RECENT_SEARCHES_KEY);
    } catch {
      // Ignore
    }
  };

  const handleSearchSubmit = (searchTerm: string) => {
    const target = searchTerm || query;
    if (!target.trim()) return;

    triggerHaptic("light");
    saveRecentSearch(target);
    onClose();
    router.push(`/search?q=${encodeURIComponent(target.trim())}`);
  };

  const toggleVoiceSearch = () => {
    triggerHaptic("medium");
    if (isListening) {
      setIsListening(false);
      return;
    }

    if (typeof window === "undefined") return;

    const win = window as unknown as {
      SpeechRecognition?: any;
      webkitSpeechRecognition?: any;
    };
    const SpeechRecognitionClass = win.SpeechRecognition || win.webkitSpeechRecognition;

    if (!SpeechRecognitionClass) return;

    try {
      const recognition = new SpeechRecognitionClass();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = "en-US";

      recognition.onstart = () => setIsListening(true);
      recognition.onend = () => setIsListening(false);
      recognition.onerror = () => setIsListening(false);

      recognition.onresult = (event: any) => {
        const transcript = event.results?.[0]?.[0]?.transcript;
        if (transcript) {
          setQuery(transcript);
          handleSearchSubmit(transcript);
        }
      };

      recognition.start();
    } catch (err) {
      console.error("Voice search error:", err);
      setIsListening(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 15 }}
          transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
          className="fixed inset-0 z-50 flex flex-col bg-background/95 backdrop-blur-2xl pt-safe pb-safe"
        >
          {/* Header search bar */}
          <div className="flex items-center gap-2 p-4 border-b border-border/60">
            <div className="relative flex-1 flex items-center">
              <Search className="absolute left-3 w-5 h-5 text-muted-foreground" />
              <Input
                ref={inputRef}
                type="search"
                inputMode="search"
                enterKeyHint="search"
                placeholder="Search manga, authors, genres..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearchSubmit(query)}
                className="pl-10 pr-10 h-12 bg-ink-900/90 border-ink-700 text-foreground text-base rounded-full focus-visible:ring-primary"
              />
              {query ? (
                <button
                  type="button"
                  onClick={() => setQuery("")}
                  className="absolute right-3 touch-target text-muted-foreground hover:text-foreground"
                >
                  <X className="w-4 h-4" />
                </button>
              ) : (
                hasSpeechSupport && (
                  <button
                    type="button"
                    onClick={toggleVoiceSearch}
                    className={cn(
                      "absolute right-3 touch-target text-muted-foreground transition-colors",
                      isListening && "text-primary animate-pulse"
                    )}
                    title="Voice Search"
                  >
                    {isListening ? <MicOff className="w-5 h-5 text-primary" /> : <Mic className="w-5 h-5" />}
                  </button>
                )
              )}
            </div>

            <Button
              variant="ghost"
              onClick={onClose}
              className="touch-target px-3 text-sm font-medium text-muted-foreground hover:text-foreground"
            >
              Cancel
            </Button>
          </div>

          {/* Body content */}
          <div className="flex-1 overflow-y-auto p-4 space-y-6 momentum-scroll">
            {/* Quick search button if query present */}
            {query.trim() && (
              <button
                type="button"
                onClick={() => handleSearchSubmit(query)}
                className="w-full flex items-center justify-between p-3.5 bg-primary/10 border border-primary/30 rounded-xl text-primary font-medium text-sm active-press"
              >
                <span className="truncate">Search for &quot;{query}&quot;</span>
                <ArrowRight className="w-4 h-4 shrink-0" />
              </button>
            )}

            {/* Trending searches */}
            <div>
              <div className="flex items-center gap-2 mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                <TrendingUp className="w-4 h-4 text-primary" />
                <span>Trending Searches</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {TRENDING_SEARCHES.map((item) => (
                  <Badge
                    key={item}
                    variant="outline"
                    onClick={() => handleSearchSubmit(item)}
                    className="px-3 py-2 text-sm font-normal bg-ink-900 hover:bg-ink-800 border-ink-700 cursor-pointer active-press"
                  >
                    {item}
                  </Badge>
                ))}
              </div>
            </div>

            {/* Recent searches */}
            {recentSearches.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    <History className="w-4 h-4 text-muted-foreground" />
                    <span>Recent Searches</span>
                  </div>
                  <button
                    type="button"
                    onClick={clearAllRecent}
                    className="text-xs text-muted-foreground hover:text-destructive transition-colors flex items-center gap-1"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Clear</span>
                  </button>
                </div>
                <div className="space-y-1">
                  {recentSearches.map((term) => (
                    <div
                      key={term}
                      className="flex items-center justify-between p-3 rounded-lg hover:bg-ink-900 text-sm transition-colors"
                    >
                      <button
                        type="button"
                        onClick={() => handleSearchSubmit(term)}
                        className="flex-1 text-left truncate text-foreground hover:text-primary"
                      >
                        {term}
                      </button>
                      <button
                        type="button"
                        onClick={() => removeRecentSearch(term)}
                        className="touch-target p-1 text-muted-foreground hover:text-destructive"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
