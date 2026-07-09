"use client";

import { cn } from "@/lib/utils";

export function SectionTitle({
  title,
  subtitle,
  action,
  className,
}: {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8", className)}>
      <div>
        <h2 className="text-display-sm font-display font-bold text-foreground">{title}</h2>
        {subtitle && (
          <p className="text-body-md text-muted-foreground mt-1">{subtitle}</p>
        )}
      </div>
      {action && <div className="flex-shrink-0">{action}</div>}
    </div>
  );
}