import React from "react";
import { loadSearchPage } from "@/services/ui/loaders/search.loader";

export default async function SearchPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const resolvedParams = await searchParams;
  const query = resolvedParams.q || "";
  const viewModel = await loadSearchPage(query);

  if (viewModel.type === "ERROR") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 text-white p-6">
        <div className="max-w-md text-center bg-slate-900 border border-slate-800 p-8 rounded-xl">
          <h2 className="text-xl font-bold mb-2">Search Error</h2>
          <p className="text-slate-400 text-sm">{viewModel.errorMessage}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-8 max-w-7xl mx-auto">
      <div className="mb-8 max-w-2xl">
        <h1 className="text-3xl font-black text-white mb-4">Search Manga Catalog</h1>
        <form action="/search" method="GET" className="flex gap-3">
          <input
            type="text"
            name="q"
            defaultValue={query}
            placeholder="Search by title, Japanese name, author, or alias (e.g. snk, kimetsu)..."
            className="flex-1 px-4 py-3 rounded-xl bg-slate-900 border border-slate-800 text-white text-sm focus:outline-none focus:border-indigo-500"
          />
          <button type="submit" className="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 rounded-xl font-bold text-sm">
            Search
          </button>
        </form>
      </div>

      {viewModel.showZeroResults && (
        <div className="p-6 rounded-xl bg-slate-900 border border-slate-800 text-center max-w-lg mx-auto my-12">
          <span className="text-3xl mb-2 block">🔎</span>
          <p className="text-slate-300 text-sm">{viewModel.zeroResultsSuggestionText}</p>
        </div>
      )}

      {viewModel.showResults && (
        <section>
          <p className="text-xs text-slate-400 mb-6">Found {viewModel.totalResults} canonical results for "{query}"</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-6">
            {viewModel.results.map((card) => (
              <a
                key={card.canonicalId}
                href={`/manga/${card.canonicalId}`}
                className="group flex flex-col rounded-xl overflow-hidden bg-slate-900 border border-slate-800 hover:border-indigo-500/50 transition"
              >
                <img src={card.coverImage} alt={card.title} className="aspect-[3/4] w-full object-cover group-hover:scale-105 transition" />
                <div className="p-3">
                  <h3 className="text-sm font-bold text-white truncate group-hover:text-indigo-400 transition">{card.title}</h3>
                  <p className="text-xs text-slate-400">{card.ratingLabel}</p>
                </div>
              </a>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}