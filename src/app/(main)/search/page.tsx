import React from "react";
import { loadSearchPage } from "@/services/ui/loaders/search.loader";
import { MangaCard } from "@/components/manga/manga-card";
import type { Manga } from "@/types";

export const dynamic = "force-dynamic";

export default async function SearchPage({ searchParams }: { searchParams: Promise<{ q?: string; sort?: string }> }) {
  const resolvedParams = await searchParams;
  const query = resolvedParams.q || "";
  const viewModel = await loadSearchPage(query);

  if (viewModel.type === "ERROR") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background text-foreground p-6">
        <div className="max-w-md text-center bg-card border border-border p-8 rounded-2xl shadow-xl">
          <h2 className="text-xl font-bold mb-2">Search Unavailable</h2>
          <p className="text-muted-foreground text-sm mb-4">{viewModel.errorMessage}</p>
          <a href="/search" className="px-5 py-2.5 bg-primary text-primary-foreground text-xs font-semibold rounded-xl">
            Retry Search
          </a>
        </div>
      </div>
    );
  }

  const mangaCards: Manga[] = (viewModel.results || []).map((card) => ({
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
    ratingCount: 500,
    followCount: 2000,
    viewCount: 15000,
    chapterCount: 0,
    volumeCount: 1,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    latestChapter: card.latestChapterLabel
      ? ({
          id: "latest",
          number: card.latestChapterLabel.replace(/^Chapter\s*/i, ""),
          title: card.latestChapterLabel,
        } as any)
      : undefined,
  }));

  return (
    <div className="min-h-screen bg-background text-foreground p-6 sm:p-8 max-w-7xl mx-auto pt-28">
      <div className="mb-8 max-w-2xl">
        <h1 className="text-3xl font-display font-bold text-foreground mb-4">
          {query ? `Search Results for "${query}"` : "Trending & Popular Manga"}
        </h1>
        <form action="/search" method="GET" className="flex gap-3">
          <input
            type="text"
            name="q"
            defaultValue={query}
            placeholder="Search by title, author, or genre..."
            className="flex-1 px-4 py-3 rounded-xl bg-card border border-border text-foreground text-sm focus:outline-none focus:border-primary"
          />
          <button type="submit" className="px-6 py-3 bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl font-bold text-sm transition-all cursor-pointer">
            Search
          </button>
        </form>
      </div>

      {viewModel.showZeroResults && (
        <div className="p-8 rounded-2xl bg-card border border-border text-center max-w-lg mx-auto my-12 shadow-sm">
          <span className="text-3xl mb-3 block">🔍</span>
          <h3 className="font-semibold text-base mb-1">No Results Found</h3>
          <p className="text-muted-foreground text-sm">{viewModel.zeroResultsSuggestionText}</p>
        </div>
      )}

      {mangaCards.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-6">
            <p className="text-xs text-muted-foreground font-medium">
              {query ? `Found ${viewModel.totalResults} titles` : `Showing ${mangaCards.length} top trending titles`}
            </p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-6">
            {mangaCards.map((manga) => (
              <div key={manga.id} className="flex justify-center">
                <MangaCard manga={manga} />
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}