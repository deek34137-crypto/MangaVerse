"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

type BadgeVariant = "default" | "secondary" | "destructive" | "accent" | "muted" | "outline";

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
}

const Badge = React.forwardRef<HTMLSpanElement, BadgeProps>(
  ({ className, variant = "default", ...props }, ref) => {
    return (
      <span
        ref={ref}
        className={cn(
          "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors",
          {
            "bg-primary/10 text-primary": variant === "default",
            "bg-secondary text-secondary-foreground": variant === "secondary",
            "bg-destructive/10 text-destructive border border-destructive/20": variant === "destructive",
            "bg-accent/10 text-accent border border-accent/20": variant === "accent",
            "bg-muted text-muted-foreground": variant === "muted",
            "border border-border bg-transparent": variant === "outline",
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