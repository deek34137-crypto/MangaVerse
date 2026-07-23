"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

type BadgeVariant = 
  | "default" 
  | "secondary" 
  | "destructive" 
  | "accent" 
  | "muted" 
  | "outline"
  | "editorial"
  | "featured"
  | "genre"
  | "metadata";

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
}

const Badge = React.forwardRef<HTMLSpanElement, BadgeProps>(
  ({ className, variant = "default", ...props }, ref) => {
    return (
      <span
        ref={ref}
        className={cn(
          "inline-flex items-center text-xs transition-colors",
          {
            "rounded-full px-2.5 py-0.5 font-medium bg-primary/10 text-primary": variant === "default",
            "rounded-full px-2.5 py-0.5 font-medium bg-secondary text-secondary-foreground": variant === "secondary",
            "rounded-full px-2.5 py-0.5 font-medium bg-destructive/10 text-destructive border border-destructive/20": variant === "destructive",
            "rounded-full px-2.5 py-0.5 font-medium bg-accent/10 text-accent border border-accent/20": variant === "accent",
            "rounded-full px-2.5 py-0.5 font-medium bg-muted text-muted-foreground": variant === "muted",
            "rounded-full px-2.5 py-0.5 font-medium border border-border bg-transparent": variant === "outline",
            
            /* ─── Inkline 2.2.1 4-Tier Badge System ────────────────────────────────── */
            "rounded-sm px-2 py-0.5 font-display text-[10px] font-bold uppercase tracking-widest bg-vermilion-500 text-white shadow-sm": variant === "editorial",
            "rounded-full px-2.5 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-wider bg-gold-500/15 text-gold-500 border border-gold-500/40": variant === "featured",
            "rounded-full px-2.5 py-0.5 font-mono text-[10px] font-medium uppercase tracking-wider bg-ink-800 text-ink-50 border border-ink-700": variant === "genre",
            "rounded-md px-2 py-0.5 font-mono text-[11px] font-medium uppercase tracking-wider bg-ink-900/90 text-ink-400 border border-ink-700/60": variant === "metadata",
          },
          className
        )}
        {...props}
      />
    );
  }
);
Badge.displayName = "Badge";

export { Badge };