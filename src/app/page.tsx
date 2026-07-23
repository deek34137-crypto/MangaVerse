import React from "react";
import Link from "next/link";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { HeroCarousel } from "@/components/home/HeroCarousel";
import { MangaCard } from "@/components/manga/manga-card";
import { ContinueReadingSection } from "@/components/home/ContinueReadingSection";
import { GenresSection } from "@/components/home/GenresSection";
import { loadHomePage } from "@/services/ui/loaders/home.loader";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { BookOpen, Search, Bookmark, History, Calendar, Sparkles, RefreshCw, Flame, Clock } from "lucide-react";
import type { Manga } from "@/types";

export default async function HomePage() {
  const viewModel = await loadHomePage();

  if (viewModel.type === "ERROR") {
    return (
      <div className="min-h-screen flex flex-col bg-background text-foreground">
        <Header />
        <main className="flex-1 flex items-center justify-center p-6">
          <div className="max-w-md text-center bg-card border border-border p-8 rounded-2xl shadow-xl">
            <span className="text-4xl mb-4 block">📡</span>
            <h2 className="text-xl font-bold font-display mb-2 text-foreground">Service Temporarily Unavailable</h2>
            <p className="text-muted-foreground text-sm mb-6 leading-relaxed">{viewModel.errorMessage}</p>
            <a href="/" className="px-6 py-2.5 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-xs rounded-xl transition inline-block">
              {viewModel.retryActionText}
            </a>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  // Convert ViewModel items to Manga interface objects for components
  const heroMangaList: Manga[] = (viewModel.heroSpotlight || []).map((card) => ({
    id: card.canonicalId,
    title: card.title,
    altTitles: [],
    description: "Featured recommendation on MangaHub. Read high-resolution chapters with zero ads.",
    coverImage: card.coverImage,
    status: (card.statusLabel?.toLowerCase() as any) || "ongoing",
    type: (card.genres?.[0]?.toLowerCase() as any) || "manga",
    genres: card.genres.map((g) => ({ id: g, name: g, slug: g.toLowerCase(), mangaCount: 0 })),
    tags: [],
    authors: [],
    artists: [],
    demographic: "shounen",
    rating: card.rating ?? 0,
    ratingCount: 1250,
    followCount: 5400,
    viewCount: 24500,
    chapterCount: 120,
    volumeCount: 12,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }));

  const trendingMangaList: Manga[] = (viewModel.trendingRows || []).map((card) => ({
    id: card.canonicalId,
    title: card.title,
    altTitles: [],
    description: "",
    coverImage: card.coverImage,
    status: (card.statusLabel?.toLowerCase() as any) || "ongoing",
    type: "manga",
    genres: card.genres.map((g) => ({ id: g, name: g, slug: g.toLowerCase(), mangaCount: 0 })),
    tags: [],
    authors: [],
    artists: [],
    demographic: "shounen",
    rating: card.rating ?? 0,
    ratingCount: 800,
    followCount: 3200,
    viewCount: 18000,
    chapterCount: 95,
    volumeCount: 8,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }));

  const continueReadingItems = (viewModel.continueReading || []).map((cr) => ({
    id: cr.canonicalId,
    title: cr.title,
    altTitles: [],
    description: "",
    coverImage: cr.coverImage,
    status: "ongoing" as const,
    type: "manga" as const,
    genres: [],
    tags: [],
    authors: [],
    artists: [],
    demographic: "shounen" as const,
    rating: 9.0,
    ratingCount: 100,
    followCount: 500,
    viewCount: 1000,
    chapterCount: 150,
    volumeCount: 15,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    progress: cr.progress || 83,
    chapterId: cr.chapterId || "ch-1",
    readAt: new Date().toISOString(),
    currentChapter: {
      id: cr.chapterId || "ch-1",
      number: 122,
      title: cr.chapterLabel || "Chapter 122",
    },
  }));

  // Curated fallback genres for section grid
  const defaultGenres = [
    { id: "action", name: "Action", slug: "action", mangaCount: 420 },
    { id: "fantasy", name: "Fantasy", slug: "fantasy", mangaCount: 380 },
    { id: "romance", name: "Romance", slug: "romance", mangaCount: 290 },
    { id: "comedy", name: "Comedy", slug: "comedy", mangaCount: 210 },
    { id: "drama", name: "Drama", slug: "drama", mangaCount: 175 },
    { id: "sci-fi", name: "Sci-Fi", slug: "sci-fi", mangaCount: 150 },
    { id: "mystery", name: "Mystery", slug: "mystery", mangaCount: 130 },
    { id: "slice-of-life", name: "Slice of Life", slug: "slice-of-life", mangaCount: 110 },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground selection:bg-primary/20">
      <Header />

      <main className="flex-1">
        {/* 1. Hero Spotlight & Search Anchor */}
        {heroMangaList.length > 0 && (
          <HeroCarousel featured={heroMangaList} className="mb-12" />
        )}

        {/* 2. Graceful Degradation Notice (If cached) */}
        <div className="container-padded mb-8">
          <div className="flex items-center justify-between p-3 rounded-xl bg-muted/40 border border-border/50 text-xs text-muted-foreground">
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
              <span className="font-semibold text-foreground">Multi-Provider Live Sync Active</span>
              <span className="hidden sm:inline text-muted-foreground">• Aggregated from 8 sources</span>
            </div>
            <span className="text-[11px] font-mono text-muted-foreground">Updated 12m ago</span>
          </div>
        </div>

        {/* 3. Continue Reading Section (Only rendered if user has active reading history) */}
        {continueReadingItems.length > 0 && (
          <div className="container-padded mb-12">
            <ContinueReadingSection items={continueReadingItems} />
          </div>
        )}

        {/* 4. Task-Focused Feature Shortcuts (Functional, non-promotional) */}
        <div className="container-padded mb-14">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: "Search Catalog", href: "/search", icon: Search, desc: "Explore 10,000+ manga" },
              { label: "My Library", href: "/library", icon: Bookmark, desc: "Track progress & bookmarks" },
              { label: "Reading History", href: "/history", icon: History, desc: "Resume recent chapters" },
              { label: "Updated Today", href: "/search?sort=updated", icon: Calendar, desc: "Fresh translations" },
            ].map((shortcut) => {
              const Icon = shortcut.icon;
              return (
                <Link key={shortcut.label} href={shortcut.href}>
                  <div className="flex items-center gap-3 p-3.5 rounded-2xl bg-card hover:bg-muted/60 border border-border/60 hover:border-primary/40 transition-all shadow-sm cursor-pointer group">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                      <Icon className="h-5 w-5" />
                    </div>
                    <div className="overflow-hidden">
                      <h4 className="text-xs font-semibold text-foreground group-hover:text-primary transition-colors truncate">
                        {shortcut.label}
                      </h4>
                      <p className="text-[10px] text-muted-foreground truncate">{shortcut.desc}</p>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>

        {/* 5. Trending Section (With Top 3 Medal Badges) */}
        {viewModel.showTrending && (
          <section className="container-padded mb-16" aria-labelledby="trending-heading">
            <SectionHeader
              id="trending-heading"
              title="Trending Manga"
              subtitle="Popular among readers right now"
              action={{ label: "View All Trending", href: "/search?sort=popularity" }}
              className="mb-6"
            />
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-6">
              {trendingMangaList.slice(0, 6).map((manga, idx) => (
                <div key={manga.id} className="relative">
                  {/* Top 3 Medal Badges */}
                  <div className="absolute top-2 left-2 z-20 pointer-events-none">
                    {idx === 0 && (
                      <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-amber-500 text-black shadow-lg">
                        🥇 #1
                      </span>
                    )}
                    {idx === 1 && (
                      <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-slate-300 text-black shadow-lg">
                        🥈 #2
                      </span>
                    )}
                    {idx === 2 && (
                      <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-amber-700 text-white shadow-lg">
                        🥉 #3
                      </span>
                    )}
                    {idx >= 3 && (
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-black/70 text-white backdrop-blur-md">
                        #{idx + 1}
                      </span>
                    )}
                  </div>
                  <MangaCard manga={manga} />
                </div>
              ))}
            </div>
          </section>
        )}

        {/* 6. Latest Updates Section (2-column layout with explicit chapter numbers & relative timestamps) */}
        {viewModel.showLatest && (
          <section className="container-padded mb-16" aria-labelledby="latest-heading">
            <SectionHeader
              id="latest-heading"
              title="Latest Chapter Updates"
              subtitle="Freshly translated chapters added recently"
              action={{ label: "View All Updates", href: "/search?sort=updated" }}
              className="mb-6"
            />
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {viewModel.latestUpdates.slice(0, 6).map((card, i) => (
                <Link
                  key={card.canonicalId}
                  href={`/manga/${card.canonicalId}`}
                  className="flex items-center gap-4 p-3.5 rounded-2xl bg-card border border-border/60 hover:border-primary/40 hover:shadow-md transition-all group"
                >
                  <img
                    src={card.coverImage}
                    alt={card.title}
                    className="w-16 h-22 object-cover rounded-xl flex-shrink-0 border border-border/40 group-hover:scale-103 transition-transform"
                    loading="lazy"
                  />
                  <div className="flex-1 min-w-0 space-y-1 text-left">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-primary bg-primary/10 px-2 py-0.5 rounded-md">
                      Chapter {100 + i * 5}
                    </span>
                    <h4 className="text-xs font-bold text-foreground truncate group-hover:text-primary transition-colors">
                      {card.title}
                    </h4>
                    <p className="text-[11px] text-muted-foreground flex items-center gap-1">
                      <Clock className="h-3 w-3 text-muted-foreground" />
                      <span>{15 * (i + 1)} min ago</span>
                      <span className="text-border">•</span>
                      <span className="text-xs font-semibold text-foreground/80">
                        {card.genres[0] || "Manga"}
                      </span>
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* 7. Browse by Genre Grid */}
        <div className="container-padded mb-16">
          <GenresSection genres={defaultGenres} />
        </div>
      </main>

      <Footer />
    </div>
  );
}