import React from "react";
import { loadReaderPage } from "@/services/ui/loaders/reader.loader";
import { ReaderView } from "@/components/reader/reader-view";

export default async function ReaderPage({ params }: { params: { chapterId: string } }) {
  const viewModel = await loadReaderPage("manga_default", params.chapterId);

  if (viewModel.type === "ERROR") {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-950 text-white p-6">
        <div className="max-w-md text-center bg-slate-900 border border-slate-800 p-8 rounded-xl">
          <span className="text-4xl mb-4 block">⚠️</span>
          <h2 className="text-xl font-bold mb-2">Reader Unavailable</h2>
          <p className="text-slate-400 text-sm mb-6">{viewModel.errorMessage}</p>
          <a href="/" className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 rounded-lg font-semibold text-sm">
            Back to Home
          </a>
        </div>
      </div>
    );
  }

  return <ReaderView viewModel={viewModel} />;
}
