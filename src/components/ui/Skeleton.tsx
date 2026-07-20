import { cn } from "@/lib/utils";

/* ─── Base shimmer ────────────────────────────────────────────────────────── */
function Shimmer({ className }: { className?: string }) {
  return (
    <div
      className={cn("loading-shimmer rounded", className)}
      aria-hidden="true"
    />
  );
}

/* ─── Line skeleton ──────────────────────────────────────────────────────── */
interface SkeletonLineProps {
  className?: string;
  /** Width as Tailwind class or arbitrary value */
  width?: string;
}

export function SkeletonLine({ className, width = "w-full" }: SkeletonLineProps) {
  return <Shimmer className={cn("h-4 rounded-md", width, className)} />;
}

/* ─── Circle skeleton ────────────────────────────────────────────────────── */
export function SkeletonCircle({ size = 10, className }: { size?: number; className?: string }) {
  return (
    <Shimmer
      className={cn(`h-${size} w-${size} rounded-full`, className)}
    />
  );
}

/* ─── Card skeleton ──────────────────────────────────────────────────────── */
export function SkeletonCard({ className }: { className?: string }) {
  return (
    <div className={cn("space-y-3", className)} aria-hidden="true">
      {/* Cover */}
      <Shimmer className="w-full aspect-[2/3] rounded-xl" />
      {/* Title */}
      <Shimmer className="h-4 w-4/5" />
      {/* Subtitle */}
      <Shimmer className="h-3 w-3/5" />
    </div>
  );
}

/* ─── Compact card skeleton (list view) ──────────────────────────────────── */
export function SkeletonCompactCard({ className }: { className?: string }) {
  return (
    <div
      className={cn("flex items-center gap-3 p-3 rounded-xl border border-border", className)}
      aria-hidden="true"
    >
      <Shimmer className="h-16 w-12 flex-shrink-0 rounded-lg" />
      <div className="flex-1 min-w-0 space-y-2">
        <Shimmer className="h-4 w-3/4" />
        <Shimmer className="h-3 w-1/2" />
        <Shimmer className="h-2 w-full rounded-full" />
      </div>
    </div>
  );
}

/* ─── Strip skeleton (carousel item) ────────────────────────────────────── */
export function SkeletonStrip({ className }: { className?: string }) {
  return (
    <div className={cn("flex-shrink-0 w-36 sm:w-40 space-y-2", className)} aria-hidden="true">
      <Shimmer className="w-full aspect-[2/3] rounded-xl" />
      <Shimmer className="h-3.5 w-4/5" />
      <Shimmer className="h-3 w-3/5" />
    </div>
  );
}

/* ─── Hero skeleton ──────────────────────────────────────────────────────── */
export function SkeletonHero({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "relative h-[75vh] min-h-[560px] overflow-hidden rounded-2xl bg-muted",
        className
      )}
      aria-hidden="true"
    >
      <Shimmer className="absolute inset-0 rounded-2xl" />
      <div className="absolute bottom-12 left-8 space-y-4 max-w-xl">
        <Shimmer className="h-5 w-24" />
        <Shimmer className="h-12 w-80" />
        <Shimmer className="h-4 w-64" />
        <Shimmer className="h-4 w-48" />
        <div className="flex gap-3 pt-2">
          <Shimmer className="h-11 w-36 rounded-xl" />
          <Shimmer className="h-11 w-28 rounded-xl" />
        </div>
      </div>
    </div>
  );
}

/* ─── Section skeleton (carousel strip) ─────────────────────────────────── */
export function SkeletonCarouselSection({
  count = 6,
  title,
  className,
}: {
  count?: number;
  title?: string;
  className?: string;
}) {
  return (
    <div className={cn("space-y-5", className)} aria-hidden="true">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Shimmer className="h-7 w-48" />
        <Shimmer className="h-4 w-16" />
      </div>
      {/* Horizontal strip */}
      <div className="flex gap-4 overflow-hidden">
        {Array.from({ length: count }, (_, i) => (
          <SkeletonStrip key={i} />
        ))}
      </div>
    </div>
  );
}

/* ─── Grid skeleton ──────────────────────────────────────────────────────── */
export function SkeletonGrid({
  count = 12,
  className,
}: {
  count?: number;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4",
        className
      )}
      aria-hidden="true"
    >
      {Array.from({ length: count }, (_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  );
}

/* ─── Filter panel skeleton ──────────────────────────────────────────────── */
export function SkeletonFilterPanel({ className }: { className?: string }) {
  return (
    <div className={cn("space-y-6", className)} aria-hidden="true">
      {Array.from({ length: 4 }, (_, i) => (
        <div key={i} className="space-y-2">
          <Shimmer className="h-4 w-20" />
          <div className="flex flex-wrap gap-2">
            {Array.from({ length: 5 }, (_, j) => (
              <Shimmer key={j} className="h-8 w-20 rounded-full" />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
