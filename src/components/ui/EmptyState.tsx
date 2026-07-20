"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { scaleIn } from "@/animations/motion";

interface EmptyStateProps {
  /** Icon element (Lucide or SVG) */
  icon?: React.ReactNode;
  /** Large emoji / illustration as string */
  emoji?: string;
  title: string;
  description?: string;
  /** Primary CTA button */
  action?: React.ReactNode;
  /** Secondary CTA button */
  secondaryAction?: React.ReactNode;
  className?: string;
  /** Controls visual size. Default: "md" */
  size?: "sm" | "md" | "lg";
  /** If true, renders a subtle background */
  contained?: boolean;
}

/**
 * EmptyState — consistent empty content placeholder used across the app.
 * Used for: empty library tabs, no search results, no history, etc.
 */
export function EmptyState({
  icon,
  emoji,
  title,
  description,
  action,
  secondaryAction,
  className,
  size = "md",
  contained = true,
}: EmptyStateProps) {
  const sizeMap = {
    sm: { icon: "h-10 w-10", emoji: "text-4xl", title: "text-base", desc: "text-sm", py: "py-10 px-6" },
    md: { icon: "h-14 w-14", emoji: "text-5xl", title: "text-lg", desc: "text-sm", py: "py-16 px-8" },
    lg: { icon: "h-20 w-20", emoji: "text-6xl", title: "text-xl", desc: "text-base", py: "py-24 px-12" },
  };
  const s = sizeMap[size];

  return (
    <motion.div
      variants={scaleIn}
      initial="hidden"
      animate="visible"
      className={cn(
        "flex flex-col items-center justify-center text-center",
        s.py,
        contained && "rounded-2xl bg-muted/30 border border-border/50",
        className
      )}
    >
      {/* Icon or emoji */}
      {emoji ? (
        <span className={cn("mb-4 select-none", s.emoji)} role="img" aria-hidden="true">
          {emoji}
        </span>
      ) : icon ? (
        <div
          className={cn(
            "mb-4 flex items-center justify-center rounded-2xl bg-muted text-muted-foreground",
            s.icon
          )}
          aria-hidden="true"
        >
          {icon}
        </div>
      ) : null}

      <h3
        className={cn("font-display font-bold text-foreground mb-2", s.title)}
      >
        {title}
      </h3>

      {description && (
        <p
          className={cn(
            "text-muted-foreground max-w-sm leading-relaxed mb-6",
            s.desc
          )}
        >
          {description}
        </p>
      )}

      {(action || secondaryAction) && (
        <div className="flex flex-col sm:flex-row items-center gap-3">
          {action}
          {secondaryAction}
        </div>
      )}
    </motion.div>
  );
}
