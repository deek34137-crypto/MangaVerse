"use client";

import React from "react";

export default function ErrorBoundary({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center p-6 text-center">
      <div className="max-w-md bg-slate-900 border border-slate-800 p-8 rounded-2xl shadow-2xl space-y-4">
        <span className="text-6xl mb-4 block">⚠️</span>
        <h1 className="text-2xl font-black text-white">Application Exception</h1>
        <p className="text-sm text-slate-400">{error.message || "An unexpected rendering exception occurred."}</p>
        <div className="flex justify-center gap-4 pt-2">
          <button onClick={reset} className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 rounded-xl font-bold text-sm">
            Try Again
          </button>
          <a href="/" className="px-6 py-2.5 bg-slate-800 hover:bg-slate-700 rounded-xl font-bold text-sm text-slate-300">
            Home
          </a>
        </div>
      </div>
    </div>
  );
}
