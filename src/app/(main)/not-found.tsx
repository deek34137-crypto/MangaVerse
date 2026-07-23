"use client";

import React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Search, ArrowLeft, Home, Compass, Bookmark, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function MainNotFound() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = React.useState("");

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
    } else {
      router.push("/search");
    }
  };

  return (
    <div className="min-h-[85vh] flex flex-col items-center justify-center container-padded py-12">
      <div className="w-full max-w-xl text-center space-y-8 bg-card/60 border border-border/80 p-8 sm:p-12 rounded-3xl backdrop-blur-xl shadow-2xl relative overflow-hidden">
        {/* Ambient background glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-primary/10 rounded-full blur-3xl -z-10 pointer-events-none" />

        {/* Header Icon */}
        <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-primary/10 text-primary border border-primary/20 mx-auto shadow-inner">
          <span className="text-4xl">📖</span>
        </div>

        {/* Title & Headline */}
        <div>
          <h1 className="text-5xl sm:text-6xl font-display font-black text-foreground tracking-tight">404</h1>
          <h2 className="text-lg font-semibold text-foreground mt-2">Chapter or Series Not Found</h2>
          <p className="text-xs sm:text-sm text-muted-foreground mt-2 leading-relaxed max-w-md mx-auto">
            The page you requested doesn&apos;t exist or may have moved to a canonical title slug.
          </p>
        </div>

        {/* Interactive Search Field */}
        <form onSubmit={handleSearchSubmit} className="relative max-w-md mx-auto">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search 10,000+ manga titles..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-12 pl-11 pr-24 rounded-2xl bg-muted/60 border border-border focus:border-primary focus:ring-1 focus:ring-primary text-sm text-foreground placeholder:text-muted-foreground transition-all outline-none"
            />
            <button
              type="submit"
              className="absolute right-1.5 top-1/2 -translate-y-1/2 px-4 h-9 bg-primary text-primary-foreground text-xs font-semibold rounded-xl hover:bg-primary/90 transition-colors"
            >
              Search
            </button>
          </div>
        </form>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
          <Button
            variant="outline"
            onClick={() => router.back()}
            className="h-10 px-5 rounded-xl border-border hover:bg-muted text-xs font-semibold cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Go Back
          </Button>

          <Link href="/">
            <Button
              className="h-10 px-5 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 text-xs font-semibold cursor-pointer"
            >
              <Home className="w-4 h-4 mr-2" />
              Homepage
            </Button>
          </Link>

          <Link href="/genres">
            <Button
              variant="outline"
              className="h-10 px-5 rounded-xl border-border hover:bg-muted text-xs font-semibold cursor-pointer"
            >
              <Compass className="w-4 h-4 mr-2" />
              Browse Genres
            </Button>
          </Link>
        </div>

        {/* Recommended Shortcuts */}
        <div className="pt-6 border-t border-border/50 text-left">
          <div className="flex items-center gap-2 mb-3 text-xs font-semibold text-muted-foreground">
            <Sparkles className="h-3.5 w-3.5 text-primary" />
            <span>Popular Destinations</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {[
              { label: "Trending Manga", href: "/search?sort=popularity" },
              { label: "Latest Updates", href: "/search?sort=updated" },
              { label: "My Reading History", href: "/history" },
            ].map((shortcut) => (
              <Link key={shortcut.label} href={shortcut.href}>
                <div className="p-2.5 rounded-xl bg-muted/30 hover:bg-muted/70 border border-border/50 text-xs text-foreground font-medium transition-colors text-center cursor-pointer truncate">
                  {shortcut.label}
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}