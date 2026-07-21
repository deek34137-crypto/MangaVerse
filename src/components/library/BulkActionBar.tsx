"use client";

import { motion, AnimatePresence } from "framer-motion";
import {
  CheckSquare, X, Trash2, BookOpen, BookMarked,
  RotateCcw, Clock, Archive, PauseCircle, ChevronDown,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { STATUS_CONFIG } from "./LibraryCard";
import type { LibraryStatus } from "@/types";

interface BulkActionBarProps {
  selectedCount: number;
  totalCount: number;
  onSelectAll: () => void;
  onDeselectAll: () => void;
  onBulkStatusChange: (status: LibraryStatus) => void;
  onBulkRemove: () => void;
  isVisible: boolean;
}

const STATUS_ICONS: Record<LibraryStatus, React.ElementType> = {
  reading:      BookOpen,
  completed:    BookMarked,
  on_hold:      PauseCircle,
  dropped:      Archive,
  plan_to_read: Clock,
  rereading:    RotateCcw,
};

/**
 * BulkActionBar — slides up from bottom when items are selected in library.
 * Provides: select all, deselect all, change status, bulk remove.
 */
export function BulkActionBar({
  selectedCount,
  totalCount,
  onSelectAll,
  onDeselectAll,
  onBulkStatusChange,
  onBulkRemove,
  isVisible,
}: BulkActionBarProps) {
  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ y: 80, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 80, opacity: 0 }}
          transition={{ duration: 0.28, ease: [0, 0, 0.2, 1] }}
          className="fixed bottom-20 md:bottom-6 left-1/2 -translate-x-1/2 z-[var(--z-toast)] w-full max-w-xl px-4"
          role="toolbar"
          aria-label="Bulk selection actions"
        >
          <div className="bg-popover rounded-md border border-ink-700 shadow-lg p-3 flex items-center gap-3">
            {/* Count + select controls */}
            <div className="flex items-center gap-2 flex-shrink-0">
              <div className="flex h-8 w-8 items-center justify-center rounded-xs bg-ink-900 border border-ink-700 text-ink-200">
                <CheckSquare className="h-4 w-4" aria-hidden="true" />
              </div>
              <span className="text-sm font-bold text-foreground whitespace-nowrap">
                {selectedCount} selected
              </span>
            </div>

            <div className="h-6 w-px bg-ink-700 flex-shrink-0" aria-hidden="true" />

            {/* Select all / deselect */}
            <div className="flex items-center gap-1">
              {selectedCount < totalCount ? (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onSelectAll}
                  className="text-xs h-7 px-2 text-muted-foreground hover:text-foreground"
                  aria-label="Select all items"
                >
                  Select all ({totalCount})
                </Button>
              ) : (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onDeselectAll}
                  className="text-xs h-7 px-2 text-muted-foreground hover:text-foreground"
                  aria-label="Deselect all items"
                >
                  Deselect all
                </Button>
              )}
            </div>

            {/* Spacer */}
            <div className="flex-1" />

            {/* Status change dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-1.5 h-8 text-xs flex-shrink-0"
                  aria-label="Change status for selected items"
                  aria-haspopup="menu"
                >
                  Move to
                  <ChevronDown className="h-3.5 w-3.5" aria-hidden="true" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-44">
                {(Object.entries(STATUS_CONFIG) as [LibraryStatus, typeof STATUS_CONFIG[LibraryStatus]][]).map(
                  ([status, config]) => {
                    const Icon = STATUS_ICONS[status];
                    return (
                      <DropdownMenuItem
                        key={status}
                        onClick={() => onBulkStatusChange(status)}
                        className="gap-2"
                      >
                        <Icon className={cn("h-3.5 w-3.5", config.color)} aria-hidden="true" />
                        {config.label}
                      </DropdownMenuItem>
                    );
                  }
                )}
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Remove */}
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5 h-8 text-xs border-destructive/40 text-destructive hover:bg-destructive hover:text-destructive-foreground hover:border-destructive flex-shrink-0"
              onClick={onBulkRemove}
              aria-label={`Remove ${selectedCount} selected items from library`}
            >
              <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
              Remove
            </Button>

            {/* Close / exit selection */}
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 flex-shrink-0 text-muted-foreground hover:text-foreground"
              onClick={onDeselectAll}
              aria-label="Exit selection mode"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
