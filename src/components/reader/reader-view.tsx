"use client";

import React, { useState, useEffect } from "react";
import { ReaderViewModel } from "@/services/ui/reader.viewmodel";

export type ReadingMode = "webtoon" | "vertical" | "horizontal" | "double" | "rtl";

export interface ReaderSettingsV1 {
  mode: ReadingMode;
  theme: "dark" | "black" | "sepia";
  zoom: number; // e.g. 100
  brightness: number; // 0 to 100
  pageGap: number; // px
  chapterVersion: number;
}

const DEFAULT_SETTINGS: ReaderSettingsV1 = {
  mode: "webtoon",
  theme: "black",
  zoom: 100,
  brightness: 100,
  pageGap: 16,
  chapterVersion: 1,
};

export function ReaderView({ viewModel }: { viewModel: ReaderViewModel }) {
  const [settings, setSettings] = useState<ReaderSettingsV1>(DEFAULT_SETTINGS);
  const [currentPage, setCurrentPage] = useState(1);
  const [showSettingsDrawer, setShowSettingsDrawer] = useState(false);

  // Restore versioned settings & session
  useEffect(() => {
    try {
      const savedSettings = localStorage.getItem("reader-settings-v1");
      if (savedSettings) {
        setSettings({ ...DEFAULT_SETTINGS, ...JSON.parse(savedSettings) });
      }

      const savedSession = localStorage.getItem(`reader-session-v1-${viewModel.chapterId}`);
      if (savedSession) {
        const parsed = JSON.parse(savedSession);
        if (parsed.chapterVersion === DEFAULT_SETTINGS.chapterVersion) {
          setCurrentPage(parsed.lastReadPage || 1);
        }
      }
    } catch {}
  }, [viewModel.chapterId]);

  // Persist session changes
  const saveSession = (pageNum: number) => {
    setCurrentPage(pageNum);
    try {
      const sessionData = {
        currentChapterId: viewModel.chapterId,
        lastReadPage: pageNum,
        readingProgress: Math.round((pageNum / viewModel.totalPages) * 100),
        chapterVersion: settings.chapterVersion,
        lastReadAt: new Date().toISOString(),
      };
      localStorage.setItem(`reader-session-v1-${viewModel.chapterId}`, JSON.stringify(sessionData));
    } catch {}
  };

  const updateSettings = (update: Partial<ReaderSettingsV1>) => {
    const next = { ...settings, ...update };
    setSettings(next);
    try {
      localStorage.setItem("reader-settings-v1", JSON.stringify(next));
    } catch {}
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight" || e.key === " ") {
        if (currentPage < viewModel.totalPages) saveSession(currentPage + 1);
      } else if (e.key === "ArrowLeft") {
        if (currentPage > 1) saveSession(currentPage - 1);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [currentPage, viewModel.totalPages]);

  const bgClass =
    settings.theme === "black"
      ? "bg-black text-white"
      : settings.theme === "sepia"
      ? "bg-[#f4ecd8] text-[#5b4636]"
      : "bg-slate-950 text-slate-100";

  return (
    <div className={`min-h-screen flex flex-col ${bgClass}`} style={{ filter: `brightness(${settings.brightness}%)` }}>
      {/* Top Header Controls Bar */}
      <header className="sticky top-0 z-40 flex items-center justify-between px-6 py-4 bg-black/80 backdrop-blur border-b border-white/10">
        <div>
          <h1 className="text-lg font-bold truncate">{viewModel.mangaTitle}</h1>
          <p className="text-xs text-slate-400">{viewModel.chapterTitle}</p>
        </div>

        <div className="flex items-center gap-3">
          <span className={`px-2.5 py-1 text-xs font-semibold rounded-full border ${viewModel.winningProviderBadge.colorClass}`}>
            {viewModel.winningProviderBadge.name}
          </span>

          <button
            onClick={() => setShowSettingsDrawer(!showSettingsDrawer)}
            className="px-3 py-1.5 text-xs font-medium rounded-lg bg-white/10 hover:bg-white/20 transition"
          >
            ⚙️ Settings
          </button>
        </div>
      </header>

      {/* Backup Stream Alert Banner */}
      {viewModel.showBackupBanner && (
        <div className="px-6 py-2.5 bg-amber-500/20 border-b border-amber-500/30 text-amber-200 text-xs flex items-center justify-between">
          <span>⚠️ {viewModel.backupBannerText}</span>
          <span className="font-mono text-[10px] bg-amber-500/30 px-2 py-0.5 rounded">HEDGED FAILOVER</span>
        </div>
      )}

      {/* Main Reader View */}
      <main className="flex-1 flex flex-col items-center justify-center p-4">
        {settings.mode === "webtoon" ? (
          <div className="w-full max-w-3xl flex flex-col items-center" style={{ gap: `${settings.pageGap}px` }}>
            {viewModel.pages.map((p) => (
              <img
                key={p.pageNumber}
                src={p.url}
                alt={`Page ${p.pageNumber}`}
                className="w-full h-auto rounded-md shadow-2xl object-contain"
                style={{ width: `${settings.zoom}%` }}
                loading={p.pageNumber <= viewModel.preloadPagesCount ? "eager" : "lazy"}
                onError={(e) => {
                  if (p.fallbackUrl) {
                    (e.target as HTMLImageElement).src = p.fallbackUrl;
                  }
                }}
              />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center space-y-4">
            {viewModel.pages[currentPage - 1] && (
              <img
                src={viewModel.pages[currentPage - 1].url}
                alt={`Page ${currentPage}`}
                className="max-h-[85vh] w-auto rounded-md shadow-2xl object-contain"
                style={{ width: `${settings.zoom}%` }}
              />
            )}
            <div className="flex items-center gap-4 mt-4">
              <button
                disabled={currentPage <= 1}
                onClick={() => saveSession(currentPage - 1)}
                className="px-4 py-2 text-sm rounded bg-white/10 disabled:opacity-30"
              >
                ◀ Prev
              </button>
              <span className="text-sm font-mono">
                {currentPage} / {viewModel.totalPages}
              </span>
              <button
                disabled={currentPage >= viewModel.totalPages}
                onClick={() => saveSession(currentPage + 1)}
                className="px-4 py-2 text-sm rounded bg-white/10 disabled:opacity-30"
              >
                Next ▶
              </button>
            </div>
          </div>
        )}
      </main>

      {/* Settings Drawer */}
      {showSettingsDrawer && (
        <div className="fixed inset-y-0 right-0 z-50 w-80 bg-slate-900 border-l border-white/10 p-6 flex flex-col gap-6 shadow-2xl">
          <div className="flex items-center justify-between border-b border-white/10 pb-4">
            <h3 className="font-bold text-base">Reader Options</h3>
            <button onClick={() => setShowSettingsDrawer(false)} className="text-slate-400 hover:text-white">
              ✕
            </button>
          </div>

          <div className="space-y-4 text-xs">
            <div>
              <label className="block mb-2 font-semibold text-slate-300">Reading Mode</label>
              <select
                value={settings.mode}
                onChange={(e) => updateSettings({ mode: e.target.value as ReadingMode })}
                className="w-full p-2.5 rounded bg-slate-800 border border-slate-700 text-white"
              >
                <option value="webtoon">Webtoon (Long Strip)</option>
                <option value="vertical">Single Page (Vertical)</option>
                <option value="horizontal">Single Page (Horizontal)</option>
                <option value="double">Double Page</option>
                <option value="rtl">Right to Left (RTL Manga)</option>
              </select>
            </div>

            <div>
              <label className="block mb-2 font-semibold text-slate-300">Theme</label>
              <div className="grid grid-cols-3 gap-2">
                {(["dark", "black", "sepia"] as const).map((t) => (
                  <button
                    key={t}
                    onClick={() => updateSettings({ theme: t })}
                    className={`py-2 rounded capitalize border ${
                      settings.theme === t ? "border-amber-500 font-bold" : "border-slate-700 bg-slate-800"
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block mb-2 font-semibold text-slate-300">Brightness ({settings.brightness}%)</label>
              <input
                type="range"
                min="30"
                max="100"
                value={settings.brightness}
                onChange={(e) => updateSettings({ brightness: parseInt(e.target.value) })}
                className="w-full"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
