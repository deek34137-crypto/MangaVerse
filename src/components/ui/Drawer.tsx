"use client";

import { useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

interface DrawerProps {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
  /** Direction the drawer slides from */
  side?: "bottom" | "left" | "right";
  /** Drawer title for accessibility */
  title?: string;
  /** Whether to show the drag handle (bottom drawer only) */
  showHandle?: boolean;
  /** Custom width (for side drawers) */
  width?: string;
  /** Custom max height (for bottom drawer) */
  maxHeight?: string;
  className?: string;
}

const variants = {
  bottom: {
    initial: { y: "100%", opacity: 0 },
    animate: { y: 0, opacity: 1 },
    exit: { y: "100%", opacity: 0 },
  },
  left: {
    initial: { x: "-100%", opacity: 0 },
    animate: { x: 0, opacity: 1 },
    exit: { x: "-100%", opacity: 0 },
  },
  right: {
    initial: { x: "100%", opacity: 0 },
    animate: { x: 0, opacity: 1 },
    exit: { x: "100%", opacity: 0 },
  },
};

/**
 * Drawer — animated slide-in panel for mobile filters, reader settings, etc.
 * Supports bottom, left, and right positions.
 * Traps focus and closes on Escape or backdrop click.
 */
export function Drawer({
  open,
  onClose,
  children,
  side = "bottom",
  title,
  showHandle = true,
  width = "w-80",
  maxHeight = "max-h-[85vh]",
  className,
}: DrawerProps) {
  const drawerRef = useRef<HTMLDivElement>(null);

  // Close on Escape
  useEffect(() => {
    const handle = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (open) document.addEventListener("keydown", handle);
    return () => document.removeEventListener("keydown", handle);
  }, [open, onClose]);

  // Lock body scroll
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  // Focus trap — move focus into drawer when it opens
  useEffect(() => {
    if (open) {
      const timer = setTimeout(() => drawerRef.current?.focus(), 50);
      return () => clearTimeout(timer);
    }
  }, [open]);

  const positionClass = {
    bottom: `fixed bottom-0 left-0 right-0 ${maxHeight} rounded-t-3xl`,
    left: `fixed top-0 left-0 bottom-0 ${width}`,
    right: `fixed top-0 right-0 bottom-0 ${width}`,
  }[side];

  const v = variants[side];

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[48] bg-background/60 backdrop-blur-sm"
            onClick={onClose}
            aria-hidden="true"
          />

          {/* Panel */}
          <motion.div
            key="drawer"
            ref={drawerRef}
            role="dialog"
            aria-modal="true"
            aria-label={title ?? "Drawer"}
            tabIndex={-1}
            initial={v.initial}
            animate={v.animate}
            exit={v.exit}
            transition={{ duration: 0.28, ease: [0, 0, 0.2, 1] }}
            className={cn(
              "fixed z-[49] bg-popover border border-ink-700 shadow-lg overflow-hidden flex flex-col outline-none",
              positionClass,
              className
            )}
          >
            {/* Drag handle (bottom only) */}
            {side === "bottom" && showHandle && (
              <div className="flex justify-center pt-3 pb-1 flex-shrink-0">
                <div className="h-1 w-10 rounded-full bg-ink-700" aria-hidden="true" />
              </div>
            )}

            {/* Header row */}
            {title && (
              <div className="flex items-center justify-between px-5 py-4 border-b border-border/50 flex-shrink-0">
                <h2 className="font-display font-bold text-foreground text-base">
                  {title}
                </h2>
                <button
                  onClick={onClose}
                  className="h-8 w-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-all focus-visible:outline-2 focus-visible:outline-ring focus-visible:outline-offset-2"
                  aria-label="Close drawer"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            )}

            {/* Content */}
            <div className="overflow-y-auto flex-1 overscroll-contain">
              {children}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
