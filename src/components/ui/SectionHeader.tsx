"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { reveal, transition, stagger } from "@/animations/motion";
import { useScrollReveal } from "@/hooks/useScrollReveal";

interface SectionHeaderProps {
  /** Section title */
  title: string;
  /** Optional subtitle beneath the title */
  subtitle?: string;
  /** Optional badge label shown before the title (e.g. "NEW", "🔥") */
  badge?: string;
  /** If provided, renders a "View All" link on the right */
  viewAllHref?: string;
  /** Custom label for the view-all link (default: "View All") */
  viewAllLabel?: string;
  /** Optional result count shown next to subtitle */
  count?: number;
  className?: string;
  /** Element ID for the heading (for aria-labelledby) */
  id?: string;
  /** Whether to animate on scroll (default: true) */
  animate?: boolean;
}

/**
 * SectionHeader — reusable section heading used across all pages.
 * Provides consistent typography, badge, and optional "View All" link.
 */
export function SectionHeader({
  title,
  subtitle,
  badge,
  viewAllHref,
  viewAllLabel = "View All",
  count,
  className,
  id,
  animate = true,
}: SectionHeaderProps) {
  const { ref, isVisible } = useScrollReveal(0.1);

  const content = (
    <div
      className={cn("flex items-end justify-between gap-4", className)}
      ref={animate ? (ref as React.RefObject<HTMLDivElement>) : undefined}
    >
      <div className="min-w-0">
        {badge && (
          <span className="magazine-label mb-2 inline-block">{badge}</span>
        )}
        <h2
          id={id}
          className="text-heading-md font-display font-bold text-foreground leading-tight"
        >
          {title}
        </h2>
        {(subtitle || count !== undefined) && (
          <p className="text-sm text-muted-foreground mt-1">
            {count !== undefined && (
              <span className="font-medium text-foreground mr-1.5">
                {count.toLocaleString()}
              </span>
            )}
            {subtitle}
          </p>
        )}
      </div>

      {viewAllHref && (
        <Link
          href={viewAllHref}
          className="group flex items-center gap-1.5 text-sm font-semibold text-primary hover:text-primary-hover transition-colors flex-shrink-0 pb-0.5"
          aria-label={`${viewAllLabel} for ${title}`}
        >
          {viewAllLabel}
          <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
        </Link>
      )}
    </div>
  );

  if (!animate) return content;

  return (
    <motion.div
      variants={reveal}
      initial="hidden"
      animate={isVisible ? "visible" : "hidden"}
      transition={transition.fade}
    >
      {content}
    </motion.div>
  );
}
