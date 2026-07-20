"use client";

import { useRef, useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, X, Loader2, Clock, TrendingUp, Command } from "lucide-react";
import { cn } from "@/lib/utils";
import { transition, spring } from "@/animations/motion";

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit?: () => void;
  isLoading?: boolean;
  placeholder?: string;
  /** Recent search strings (from localStorage) */
  recentSearches?: string[];
  onClearRecent?: (query: string) => void;
  /** Trending suggestions */
  trending?: string[];
  className?: string;
  autoFocus?: boolean;
  id?: string;
}

/**
 * SearchBar — animated search input with:
 * - Focus glow ring
 * - Loading spinner inside input
 * - Clear (×) button
 * - Recent searches dropdown
 * - Trending tags row
 * - ⌘K hint
 * - Accessible combobox role
 */
export function SearchBar({
  value,
  onChange,
  onSubmit,
  isLoading = false,
  placeholder = "Search manga, authors, genres…",
  recentSearches = [],
  onClearRecent,
  trending = [],
  className,
  autoFocus = false,
  id = "manga-search",
}: SearchBarProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [focused, setFocused] = useState(false);
  const dropdownOpen = focused && (recentSearches.length > 0 || trending.length > 0) && !value;

  // Auto-focus
  useEffect(() => {
    if (autoFocus) {
      const t = setTimeout(() => inputRef.current?.focus(), 80);
      return () => clearTimeout(t);
    }
  }, [autoFocus]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") onSubmit?.();
    if (e.key === "Escape") {
      if (value) {
        onChange("");
      } else {
        inputRef.current?.blur();
      }
    }
  };

  const handleSuggestionClick = useCallback(
    (suggestion: string) => {
      onChange(suggestion);
      onSubmit?.();
      inputRef.current?.blur();
    },
    [onChange, onSubmit]
  );

  const listboxId = `${id}-listbox`;

  return (
    <div className={cn("relative w-full", className)}>
      {/* Input wrapper */}
      <div
        className={cn(
          "relative flex items-center h-13 rounded-2xl border bg-ink-900/60",
          "transition-all duration-200",
          focused
            ? "border-primary/60 shadow-[0_0_0_3px_rgba(255,138,0,0.15)] bg-ink-950"
            : "border-ink-800 hover:border-ink-700"
        )}
      >
        {/* Left icon */}
        <div className="pl-4 pr-2 flex-shrink-0 text-ink-400">
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin text-primary" aria-hidden="true" />
          ) : (
            <Search className="h-4.5 w-4.5" aria-hidden="true" />
          )}
        </div>

        {/* Input */}
        <input
          ref={inputRef}
          id={id}
          type="search"
          role="combobox"
          aria-expanded={dropdownOpen}
          aria-autocomplete="list"
          aria-controls={dropdownOpen ? listboxId : undefined}
          aria-label="Search manga"
          autoComplete="off"
          spellCheck={false}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setTimeout(() => setFocused(false), 180)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className={cn(
            "flex-1 bg-transparent text-sm text-foreground placeholder:text-ink-400",
            "outline-none border-none ring-0 min-w-0 py-3"
          )}
        />

        {/* Right side */}
        <div className="pr-4 flex items-center gap-1.5 flex-shrink-0">
          {/* Clear button */}
          <AnimatePresence>
            {value && (
              <motion.button
                key="clear"
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0, opacity: 0 }}
                transition={{ duration: 0.12 }}
                onClick={() => { onChange(""); inputRef.current?.focus(); }}
                className="h-6 w-6 rounded-full bg-ink-800 flex items-center justify-center text-ink-300 hover:text-foreground hover:bg-ink-700 transition-colors cursor-pointer"
                aria-label="Clear search"
                type="button"
              >
                <X className="h-3.5 w-3.5" />
              </motion.button>
            )}
          </AnimatePresence>

          {/* ⌘K hint — desktop only */}
          {!value && !focused && (
            <kbd className="hidden sm:flex items-center gap-0.5 text-[10px] text-ink-400 border border-ink-800 rounded px-1.5 py-0.5 font-mono">
              <Command className="h-2.5 w-2.5" />K
            </kbd>
          )}
        </div>
      </div>

      {/* Dropdown */}
      <AnimatePresence>
        {dropdownOpen && (
          <motion.div
            key="dropdown"
            id={listboxId}
            role="listbox"
            aria-label="Search suggestions"
            initial={{ opacity: 0, y: -6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.98 }}
            transition={{ duration: 0.18, ease: "easeOut" }}
            className="absolute top-full left-0 right-0 mt-2 z-[50] bg-popover rounded-2xl border border-ink-700 shadow-dropdown overflow-hidden p-1"
          >
            {/* Recent searches */}
            {recentSearches.length > 0 && (
              <div className="p-2">
                <p className="text-[10px] font-bold text-ink-400 uppercase tracking-wider mb-2 px-2">
                  Recent Searches
                </p>
                <ul className="space-y-0.5">
                  {recentSearches.slice(0, 5).map((q) => (
                     <li key={q}>
                      <div
                        role="option"
                        aria-selected={false}
                        tabIndex={0}
                        onClick={() => handleSuggestionClick(q)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === " ") {
                            e.preventDefault();
                            handleSuggestionClick(q);
                          }
                        }}
                        className="w-full flex items-center gap-3 px-2 py-2 rounded-lg text-xs text-ink-300 hover:text-foreground hover:bg-ink-800/60 transition-colors text-left group cursor-pointer focus:outline-none focus:bg-ink-800/60"
                      >
                        <Clock className="h-3.5 w-3.5 flex-shrink-0 text-ink-500" aria-hidden="true" />
                        <span className="flex-1 truncate font-medium">{q}</span>
                        {onClearRecent && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onClearRecent(q);
                            }}
                            className="opacity-0 group-hover:opacity-100 h-5 w-5 rounded flex items-center justify-center hover:bg-ink-700 transition-all cursor-pointer"
                            aria-label={`Remove "${q}" from recent searches`}
                          >
                            <X className="h-3 w-3" />
                          </button>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Divider */}
            {recentSearches.length > 0 && trending.length > 0 && (
              <div className="h-px bg-ink-800/60 mx-3" />
            )}

            {/* Trending */}
            {trending.length > 0 && (
              <div className="p-2">
                <p className="text-[10px] font-bold text-ink-400 uppercase tracking-wider mb-2 px-2">
                  Trending Now
                </p>
                <div className="flex flex-wrap gap-1.5 p-1">
                  {trending.slice(0, 8).map((tag) => (
                    <button
                      key={tag}
                      role="option"
                      aria-selected={false}
                      onClick={() => handleSuggestionClick(tag)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-ink-900 border border-ink-800 text-xs font-semibold text-ink-300 hover:bg-primary/10 hover:text-primary hover:border-primary/30 transition-all cursor-pointer"
                    >
                      <TrendingUp className="h-3 w-3 text-ink-400 group-hover:text-primary" aria-hidden="true" />
                      {tag}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
