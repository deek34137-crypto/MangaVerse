import React from "react";
import { redirect } from "next/navigation";
import { getMangaDetail, getChaptersDetail } from "@/services/manga";
import { MangaDetail } from "@/components/manga/manga-detail";
import { isUuid } from "@/lib/url";
import type { Manga, Chapter } from "@/types";

export default async function MangaDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  const mangaIdOrSlug = resolvedParams.id;

  const [mangaData, chaptersData] = await Promise.all([
    getMangaDetail(mangaIdOrSlug),
    getChaptersDetail(mangaIdOrSlug),
  ]);

  if (!mangaData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background text-foreground p-6">
        <div className="max-w-md text-center bg-card border border-border p-8 rounded-2xl shadow-xl">
          <span className="text-4xl mb-4 block">🔍</span>
          <h2 className="text-xl font-bold font-display mb-2 text-foreground">Manga Not Found</h2>
          <p className="text-muted-foreground text-sm mb-6 leading-relaxed">
            The requested manga series could not be found or has been removed from the canonical index.
          </p>
          <a href="/search" className="px-6 py-2.5 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-xs rounded-xl transition inline-block">
            Browse Manga Catalog
          </a>
        </div>
      </div>
    );
  }

  // Canonical 301 Redirect: If URL accesses via UUID or historic slug when canonical slug exists, redirect to canonical slug
  if (mangaData.slug && (isUuid(mangaIdOrSlug) || mangaIdOrSlug !== mangaData.slug)) {
    redirect(`/manga/${mangaData.slug}`);
  }

  // Transform DB data to UI Manga model
  const manga: Manga = {
    id: mangaData.id,
    slug: mangaData.slug || mangaData.id,
    title: mangaData.title,
    altTitles: mangaData.altTitles || [],
    description: mangaData.description || "No synopsis available for this title.",
    coverImage: mangaData.coverImage || "/placeholders/cover.jpg",
    bannerImage: mangaData.bannerImage || mangaData.coverImage || "/placeholders/banner.jpg",
    status: (mangaData.status?.toLowerCase() as any) || "ongoing",
    type: (mangaData.type?.toLowerCase() as any) || "manga",
    genres: (mangaData.genres || []).map((g: any) => ({
      id: g.id || g.slug,
      name: g.name,
      slug: g.slug,
      mangaCount: 0,
    })),
    tags: (mangaData.tags || []).map((t: any) => ({
      id: t.id || t.slug,
      name: t.name,
      slug: t.slug,
      group: t.group || "general",
    })),
    authors: (mangaData.authors || []).map((a: any) => ({
      id: a.id || a.slug,
      name: a.name,
      slug: a.slug,
      image: a.image,
    })),
    artists: (mangaData.artists || []).map((a: any) => ({
      id: a.id || a.slug,
      name: a.name,
      slug: a.slug,
      image: a.image,
    })),
    demographic: mangaData.demographic || "shounen",
    rating: mangaData.rating ? parseFloat(String(mangaData.rating)) : 0,
    ratingCount: mangaData.ratingCount || 0,
    followCount: mangaData.followCount || 0,
    viewCount: mangaData.viewCount || 0,
    chapterCount: chaptersData.length || mangaData.chapterCount || 0,
    volumeCount: mangaData.volumeCount || 0,
    createdAt: mangaData.createdAt ? new Date(mangaData.createdAt).toISOString() : new Date().toISOString(),
    updatedAt: mangaData.updatedAt ? new Date(mangaData.updatedAt).toISOString() : new Date().toISOString(),
  };

  const chapters: Chapter[] = (chaptersData || []).map((ch: any) => ({
    id: ch.id,
    mangaId: ch.mangaId,
    number: ch.number != null ? parseFloat(String(ch.number)) : 1,
    volume: ch.volume,
    type: ch.type || "chapter",
    title: ch.title || (ch.number ? `Chapter ${ch.number}` : "Special"),
    language: ch.language || "en",
    pages: ch.pages || [],
    pageCount: ch.pageCount || (ch.pages?.length ?? 0),
    publishedAt: ch.publishedAt ? new Date(ch.publishedAt).toISOString() : new Date().toISOString(),
    createdAt: ch.createdAt ? new Date(ch.createdAt).toISOString() : new Date().toISOString(),
    updatedAt: ch.updatedAt ? new Date(ch.updatedAt).toISOString() : new Date().toISOString(),
    scanlatorGroups: ch.scanlatorGroups || [],
    provider: ch.provider || "mangadex",
    providerChapterId: ch.providerChapterId || ch.id,
  }));

  return <MangaDetail manga={manga} chapters={chapters} />;
}