"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { reveal, transition, stagger } from "@/animations/motion";
import { useScrollReveal } from "@/hooks/useScrollReveal";

interface SectionHeaderProps {
  /** Section title (Fraunces Title Case) */
  title: string;
  /** Optional overtitle category label (Inter UPPERCASE tracking-wide) */
  overtitle?: string;
  /** Optional subtitle beneath the title */
  subtitle?: string;
  /** Optional badge label shown before the title */
  badge?: string;
  /** Optional divider style (default: "none") */
  divider?: "none" | "clean" | "bullet";
  /** If provided, renders a "View All" link on the right */
  viewAllHref?: string;
  /** Custom label for the view-all link (default: "View All") */
  viewAllLabel?: string;
  /** Optional action object containing label and href */
  action?: { label: string; href: string };
  /** Optional result count shown next to subtitle */
  count?: number;
  className?: string;
  /** Element ID for the heading (for aria-labelledby) */
  id?: string;
  /** Whether to animate on scroll (default: true) */
  animate?: boolean;
}

/**
 * SectionHeader — Inkline 2.2.1 reusable section heading.
 * Features Inter uppercase overtitle, Fraunces Title Case headline, and clean print dividers.
 */
export function SectionHeader({
  title,
  overtitle,
  subtitle,
  badge,
  divider = "none",
  viewAllHref,
  viewAllLabel = "View All",
  action,
  count,
  className,
  id,
  animate = true,
}: SectionHeaderProps) {
  const effectiveHref = action?.href || viewAllHref;
  const effectiveLabel = action?.label || viewAllLabel;
  const { ref, isVisible } = useScrollReveal(0.1);

  const content = (
    <div className={cn("mb-6", className)} ref={animate ? (ref as React.RefObject<HTMLDivElement>) : undefined}>
      <div className="flex items-end justify-between gap-4">
        <div className="min-w-0">
          {overtitle && (
            <p className="section-overtitle mb-1">{overtitle}</p>
          )}
          {badge && (
            <span className="magazine-label mb-2 inline-block">{badge}</span>
          )}
          <h2
            id={id}
            className={cn(
              "text-heading-md font-display font-bold text-foreground leading-tight",
              divider === "bullet" && "divider-bullet inline-flex items-center"
            )}
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

        {effectiveHref && (
          <Link
            href={effectiveHref}
            className="group flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-primary hover:text-primary-hover transition-colors flex-shrink-0 pb-0.5"
            aria-label={`${effectiveLabel} for ${title}`}
          >
            {effectiveLabel}
            <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
          </Link>
        )}
      </div>

      {divider === "clean" && <div className="divider-clean mt-3 mb-0" />}
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
