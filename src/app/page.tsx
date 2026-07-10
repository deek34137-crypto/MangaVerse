import { Metadata } from "next";
import { Suspense } from "react";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { HeroCarousel } from "@/components/home/HeroCarousel";
import { MangaCarousel } from "@/components/home/MangaCarousel";
import { ContinueReadingSection } from "@/components/home/ContinueReadingSection";
import { GenresSection } from "@/components/home/GenresSection";
import { getHomeData } from "@/services/home";
import { auth } from "@/auth";

export const metadata: Metadata = {
  title: "MangaHub - Discover Your Next Favorite Manga",
  description: "Read manga online with a premium, cinematic experience. Discover trending, popular, and latest manga. Continue reading where you left off.",
  openGraph: {
    title: "MangaHub - Discover Your Next Favorite Manga",
    description: "Read manga online with a premium, cinematic experience. Discover trending, popular, and latest manga.",
    type: "website",
    siteName: "MangaHub",
  },
};

function FeaturedSkeleton() {
  return (
    <section className="relative h-[60vh] min-h-[400px] animate-pulse">
      <div className="absolute inset-0 bg-gradient-to-r from-muted/50 to-transparent" />
      <div className="relative z-10 h-full flex items-center justify-center">
        <div className="w-full max-w-4xl mx-auto px-4">
          <div className="h-8 w-48 bg-muted rounded animate-pulse mb-4" />
          <div className="h-12 w-96 bg-muted rounded animate-pulse mb-4" />
          <div className="h-8 w-72 bg-muted rounded animate-pulse mb-6" />
          <div className="flex gap-4">
            <div className="h-12 w-48 bg-muted rounded animate-pulse" />
            <div className="h-12 w-48 bg-muted rounded animate-pulse" />
          </div>
        </div>
      </div>
    </section>
  );
}

function SectionSkeleton({ title }: { title: string }) {
  return (
    <section className="space-y-4 animate-pulse" aria-labelledby={`${title.toLowerCase().replace(/\s+/g, "-")}-heading`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="h-5 w-5 bg-muted rounded animate-pulse" />
          <div className="h-6 w-48 bg-muted rounded animate-pulse" />
        </div>
      </div>
      <div className="flex gap-4 overflow-x-auto pb-4 -mx-4 px-4">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="flex-shrink-0 w-40">
            <div className="aspect-[2/3] rounded-lg bg-muted animate-pulse" />
            <div className="mt-2 space-y-1">
              <div className="h-4 w-full bg-muted rounded animate-pulse" />
              <div className="h-3 w-3/4 bg-muted rounded animate-pulse" />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function ContinueReadingSkeleton() {
  return (
    <section className="space-y-4 animate-pulse" aria-labelledby="continue-reading-heading">
      <h2 id="continue-reading-heading" className="text-heading-lg font-display font-bold text-foreground flex items-center gap-2">
        <div className="h-5 w-5 bg-muted rounded animate-pulse" />
        <div className="h-6 w-48 bg-muted rounded animate-pulse" />
      </h2>
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="group">
            <div className="relative aspect-[2/3] rounded-lg overflow-hidden bg-muted animate-pulse" />
            <div className="mt-3 space-y-2">
              <div className="h-4 w-3/4 bg-muted rounded animate-pulse" />
              <div className="h-2 bg-muted rounded animate-pulse" />
              <div className="h-2 bg-muted rounded animate-pulse w-1/2" />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function GenresSkeleton() {
  return (
    <section className="space-y-4 animate-pulse" aria-labelledby="genres-heading">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="h-5 w-5 bg-muted rounded animate-pulse" />
          <div className="h-6 w-48 bg-muted rounded animate-pulse" />
        </div>
      </div>
      <div className="grid gap-4 grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
        {[...Array(12)].map((_, i) => (
          <div key={i} className="group">
            <div className="rounded-xl overflow-hidden bg-gradient-to-br from-muted/50 to-transparent border border-border p-5 flex flex-col items-center text-center animate-pulse">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted mb-3" />
              <div className="h-4 w-24 bg-muted rounded animate-pulse mb-2" />
              <div className="h-3 w-20 bg-muted rounded animate-pulse" />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

export default async function HomePage() {
  const session = await auth();
  const userId = session?.user?.id;

  const homeData = await getHomeData(userId);

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1">
        <Suspense fallback={<FeaturedSkeleton />}>
          <HeroCarousel featured={homeData.featured.manga} />
        </Suspense>

        {homeData.continueReading.manga.length > 0 && (
          <Suspense fallback={<ContinueReadingSkeleton />}>
            <div className="container-padded py-8">
              <ContinueReadingSection items={homeData.continueReading.manga as any} />
            </div>
          </Suspense>
        )}

        <div className="container-padded py-8 space-y-12">
          <Suspense fallback={<SectionSkeleton title="Trending" />}>
            <MangaCarousel
              title="Trending"
              icon={<svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18" /><polyline points="17 6 23 6 23 12" /></svg>}
              manga={homeData.trending.manga}
              href="/search?sort=trending"
            />
          </Suspense>

          <Suspense fallback={<SectionSkeleton title="Latest Updates" />}>
            <MangaCarousel
              title="Latest Updates"
              icon={<svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>}
              manga={homeData.latest.manga}
              href="/search?sort=updated"
            />
          </Suspense>

          <Suspense fallback={<SectionSkeleton title="Popular" />}>
            <MangaCarousel
              title="Popular"
              icon={<svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.477 2 2 6.477 2 12c0 4.411 3.174 8.116 7.362 9.852.156.08.318.126.483.126h4.302c.165 0 .327-.046.483-.126C18.826 20.116 22 16.411 22 12c0-5.523-4.477-10-10-10zM12 4c4.418 0 8 3.582 8 8s-3.582 8-8 8-8-3.582-8-8 3.582-8 8-8zm0 2c-3.314 0-6 2.686-6 6s2.686 6 6 6 6-2.686 6-6-2.686-6-6-6z" /></svg>}
              manga={homeData.popular.manga}
              href="/search?sort=popularity"
            />
          </Suspense>

          <Suspense fallback={<GenresSkeleton />}>
            <GenresSection genres={[]} />
          </Suspense>
        </div>
      </main>

      <Footer />
    </div>
  );
}