import React from "react";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center p-6 text-center">
      <div className="max-w-md bg-slate-900 border border-slate-800 p-8 rounded-2xl shadow-2xl">
        <span className="text-6xl mb-4 block">📖</span>
        <h1 className="text-4xl font-black text-white mb-2">404</h1>
        <h2 className="text-lg font-bold text-slate-300 mb-2">Page Not Found</h2>
        <p className="text-sm text-slate-400 mb-6">
          The manga chapter or series you are looking for does not exist or has been removed from canonical index.
        </p>
        <a href="/" className="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 rounded-xl font-bold text-sm transition">
          Back to Homepage
        </a>
      </div>
    </div>
  );
}
