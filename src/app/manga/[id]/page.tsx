import React from "react";
import { loadMangaDetailPage } from "@/services/ui/loaders/manga.loader";

export default async function MangaDetailPage({ params }: { params: { id: string } }) {
  const viewModel = await loadMangaDetailPage(params.id);

  if (viewModel.type === "ERROR") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 text-white p-6">
        <div className="max-w-md text-center bg-slate-900 border border-slate-800 p-8 rounded-xl">
          <span className="text-4xl mb-4 block">🔍</span>
          <h2 className="text-xl font-bold mb-2">Manga Not Found</h2>
          <p className="text-slate-400 text-sm mb-6">{viewModel.errorMessage}</p>
          <a href="/" className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 rounded-lg font-semibold text-sm">
            {viewModel.retryActionText}
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 pb-16">
      {/* Hero Backdrop Banner */}
      <div className="relative h-80 w-full overflow-hidden">
        <img src={viewModel.bannerImage} alt="Banner" className="w-full h-full object-cover blur-sm opacity-30" />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/60 to-transparent" />
      </div>

      <div className="max-w-6xl mx-auto px-6 -mt-40 relative z-10">
        <div className="flex flex-col md:flex-row gap-8 items-start">
          {/* Cover Image */}
          <div className="w-56 h-80 rounded-xl overflow-hidden shadow-2xl border border-white/10 flex-shrink-0">
            <img src={viewModel.coverImage} alt={viewModel.title} className="w-full h-full object-cover" />
          </div>

          {/* Details */}
          <div className="flex-1 space-y-4">
            <div className="flex items-center gap-3">
              <span className="px-3 py-1 text-xs font-bold uppercase tracking-wider rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                {viewModel.statusLabel}
              </span>
              {viewModel.showRating && (
                <span className="px-3 py-1 text-xs font-bold rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  {viewModel.ratingLabel}
                </span>
              )}
            </div>

            <h1 className="text-3xl font-extrabold text-white">{viewModel.title}</h1>
            {viewModel.showAuthors && <p className="text-sm text-slate-400">By {viewModel.authorsLabel}</p>}

            <div className="flex flex-wrap gap-2 pt-2">
              {viewModel.genres.map((g) => (
                <span key={g} className="px-2.5 py-1 text-xs rounded-md bg-slate-800 text-slate-300">
                  {g}
                </span>
              ))}
            </div>

            <p className="text-sm text-slate-300 leading-relaxed pt-2 line-clamp-4">{viewModel.description}</p>
          </div>
        </div>

        {/* Provider Availability Matrix */}
        {viewModel.showProviderMatrix && (
          <section className="mt-12 bg-slate-900/60 border border-slate-800 rounded-xl p-6">
            <h3 className="text-lg font-bold text-white mb-4">Provider Source Matrix</h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {viewModel.providerMatrix.map((item) => (
                <div key={item.providerId} className="flex items-center justify-between p-3 rounded-lg bg-slate-800/80 border border-slate-700">
                  <span className="text-xs font-bold">{item.name}</span>
                  <span className={`px-2 py-0.5 text-[10px] font-semibold rounded border ${item.badge.colorClass}`}>
                    ✓ Available
                  </span>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Chapter List */}
        {viewModel.showChapters && (
          <section className="mt-12">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-white">Chapters ({viewModel.totalChapters})</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {viewModel.chapters.map((ch) => (
                <a
                  key={ch.chapterId}
                  href={`/read/${ch.chapterId}`}
                  className="flex items-center justify-between p-4 rounded-xl bg-slate-900 border border-slate-800 hover:border-indigo-500/50 transition group"
                >
                  <div>
                    <h4 className="text-sm font-bold group-hover:text-indigo-400 transition">{ch.chapterLabel}</h4>
                    <p className="text-xs text-slate-500">{ch.releasedAtLabel}</p>
                  </div>
                  <span className="text-xs font-semibold px-2.5 py-1 rounded bg-slate-800 text-slate-400">
                    Read ▶
                  </span>
                </a>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
