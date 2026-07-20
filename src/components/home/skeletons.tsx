"use client";

import { cn } from "@/lib/utils";
import { SkeletonStrip, SkeletonHero as SkeletonHeroBase, SkeletonCard } from "@/components/ui/Skeleton";

/* ── Re-export shared hero skeleton ─────────────────────────────────────── */
export { SkeletonHero } from "@/components/ui/Skeleton";

/* ── Continue reading ────────────────────────────────────────────────────── */
export function ContinueReadingSkeleton({ count = 5 }: { count?: number }) {
  return (
    <section className="space-y-5" aria-hidden="true">
      <div className="flex items-center justify-between">
        <div className="h-7 w-44 loading-shimmer rounded-lg" />
        <div className="h-4 w-16 loading-shimmer rounded" />
      </div>
      <div className="flex gap-4 overflow-hidden">
        {Array.from({ length: count }, (_, i) => (
          <SkeletonStrip key={i} />
        ))}
      </div>
    </section>
  );
}

/* ── Recently viewed ─────────────────────────────────────────────────────── */
export function RecentlyViewedSkeleton({ count = 6 }: { count?: number }) {
  return (
    <section className="space-y-5" aria-hidden="true">
      <div className="flex items-center justify-between">
        <div className="h-7 w-44 loading-shimmer rounded-lg" />
        <div className="h-4 w-16 loading-shimmer rounded" />
      </div>
      <div className="flex gap-4 overflow-hidden">
        {Array.from({ length: count }, (_, i) => (
          <SkeletonStrip key={i} />
        ))}
      </div>
    </section>
  );
}

/* ── Manga carousel (horizontal strip) ───────────────────────────────────── */
export function MangaCarouselSkeleton({
  title,
  count = 6,
}: {
  title: string;
  count?: number;
}) {
  return (
    <section className="space-y-5" aria-hidden="true">
      <div className="flex items-center justify-between">
        <div className="h-7 w-48 loading-shimmer rounded-lg" />
        <div className="h-4 w-16 loading-shimmer rounded" />
      </div>
      <div className="flex gap-4 overflow-hidden">
        {Array.from({ length: count }, (_, i) => (
          <SkeletonStrip key={i} />
        ))}
      </div>
    </section>
  );
}

/* ── Genres section ──────────────────────────────────────────────────────── */
export function GenresSkeleton({ count = 16 }: { count?: number }) {
  return (
    <section className="space-y-5" aria-hidden="true">
      <div className="flex items-center justify-between">
        <div className="h-7 w-40 loading-shimmer rounded-lg" />
        <div className="h-4 w-16 loading-shimmer rounded" />
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 auto-rows-[100px]">
        {Array.from({ length: count }, (_, i) => (
          <div key={i} className="loading-shimmer rounded-2xl" />
        ))}
      </div>
    </section>
  );
}

/* ── Announcements ───────────────────────────────────────────────────────── */
export function AnnouncementsSkeleton() {
  return (
    <section className="space-y-5" aria-hidden="true">
      <div className="h-7 w-44 loading-shimmer rounded-lg" />
      <div className="rounded-2xl border border-border bg-card p-6 space-y-3">
        <div className="h-4 w-1/4 loading-shimmer rounded" />
        <div className="h-4 w-2/3 loading-shimmer rounded" />
        <div className="h-4 w-1/2 loading-shimmer rounded" />
      </div>
    </section>
  );
}

/* ── Full page skeleton (used in page.tsx Suspense) ─────────────────────── */
export function PageSkeleton() {
  return (
    <div className="min-h-screen">
      <SkeletonHeroBase />
      <div className="container-padded space-y-12 py-12">
        <ContinueReadingSkeleton />
        <RecentlyViewedSkeleton />
        <MangaCarouselSkeleton title="Trending Now" />
        <MangaCarouselSkeleton title="Latest Updates" />
        <MangaCarouselSkeleton title="Popular This Week" />
        <GenresSkeleton />
        <AnnouncementsSkeleton />
      </div>
    </div>
  );
}