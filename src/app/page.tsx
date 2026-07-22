import React from "react";
import { loadHomePage } from "@/services/ui/loaders/home.loader";

export default async function HomePage() {
  const viewModel = await loadHomePage();

  if (viewModel.type === "ERROR") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 text-white p-6">
        <div className="max-w-md text-center bg-slate-900 border border-slate-800 p-8 rounded-xl">
          <span className="text-4xl mb-4 block">📡</span>
          <h2 className="text-xl font-bold mb-2">Service Unavailable</h2>
          <p className="text-slate-400 text-sm mb-6">{viewModel.errorMessage}</p>
          <a href="/" className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 rounded-lg font-semibold text-sm">
            {viewModel.retryActionText}
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 pb-20">
      {/* Hero Spotlight */}
      {viewModel.showHero && viewModel.heroSpotlight[0] && (
        <section className="relative h-[480px] w-full overflow-hidden mb-12">
          <img
            src={viewModel.heroSpotlight[0].coverImage}
            alt={viewModel.heroSpotlight[0].title}
            className="w-full h-full object-cover blur-md opacity-30 scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/60 to-transparent" />

          <div className="max-w-7xl mx-auto px-6 h-full flex items-end pb-12 relative z-10">
            <div className="max-w-2xl space-y-4">
              <span className="px-3 py-1 text-xs font-bold uppercase tracking-wider rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                Featured Spotlight
              </span>
              <h1 className="text-4xl font-black text-white leading-tight">{viewModel.heroSpotlight[0].title}</h1>
              <p className="text-sm text-slate-300 font-medium">{viewModel.heroSpotlight[0].ratingLabel}</p>
              <div className="flex gap-4 pt-2">
                <a
                  href={`/manga/${viewModel.heroSpotlight[0].canonicalId}`}
                  className="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm rounded-xl transition shadow-lg"
                >
                  Start Reading
                </a>
              </div>
            </div>
          </div>
        </section>
      )}

      <div className="max-w-7xl mx-auto px-6 space-y-16">
        {/* Trending Section */}
        {viewModel.showTrending && (
          <section>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-white tracking-tight">Trending Manga</h2>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-6">
              {viewModel.trendingRows.map((card) => (
                <a
                  key={card.canonicalId}
                  href={`/manga/${card.canonicalId}`}
                  className="group flex flex-col rounded-xl overflow-hidden bg-slate-900 border border-slate-800 hover:border-indigo-500/50 transition duration-300"
                >
                  <div className="aspect-[3/4] w-full overflow-hidden relative">
                    <img
                      src={card.coverImage}
                      alt={card.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                    />
                  </div>
                  <div className="p-3 space-y-1">
                    <h3 className="text-sm font-bold text-white truncate group-hover:text-indigo-400 transition">
                      {card.title}
                    </h3>
                    <p className="text-xs text-slate-400">{card.ratingLabel}</p>
                  </div>
                </a>
              ))}
            </div>
          </section>
        )}

        {/* Latest Updates Section */}
        {viewModel.showLatest && (
          <section>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-white tracking-tight">Latest Updates</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {viewModel.latestUpdates.map((card) => (
                <a
                  key={card.canonicalId}
                  href={`/manga/${card.canonicalId}`}
                  className="flex gap-4 p-3 rounded-xl bg-slate-900 border border-slate-800 hover:border-indigo-500/40 transition"
                >
                  <img src={card.coverImage} alt={card.title} className="w-16 h-24 object-cover rounded-lg flex-shrink-0" />
                  <div className="flex flex-col justify-center space-y-1">
                    <h4 className="text-sm font-bold text-white truncate">{card.title}</h4>
                    <p className="text-xs text-indigo-400 font-semibold">{card.latestChapterLabel}</p>
                    <p className="text-xs text-slate-500">{card.ratingLabel}</p>
                  </div>
                </a>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}