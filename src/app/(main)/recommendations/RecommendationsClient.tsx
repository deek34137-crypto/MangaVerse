"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Sparkles, BookOpen, TrendingUp, Brain, Filter, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { MangaCard } from "@/components/manga/manga-card";
import type { Manga } from "@/types";

const mockRecommendations: Record<string, Manga[]> = {
  forYou: [
    { id: "4", title: "Chainsaw Man", altTitles: ["チェンソーマン"], description: "Denji merges with his pet devil Pochita.", coverImage: "https://cdn.myanimelist.net/images/manga/1/236184.jpg", status: "ongoing", type: "manga", genres: [{ id: "1", name: "Action", slug: "action", mangaCount: 1000 }, { id: "2", name: "Supernatural", slug: "supernatural", mangaCount: 600 }], tags: [], authors: [{ id: "4", name: "Tatsuki Fujimoto", slug: "tatsuki-fujimoto", mangaCount: 4 }], artists: [], demographic: "shounen", rating: 9.1, ratingCount: 320000, followCount: 900000, viewCount: 30000000, chapterCount: 150, volumeCount: 15, createdAt: "", updatedAt: "", userData: { status: "plan_to_read", progress: 0, isFavorite: false, tags: [], createdAt: "", updatedAt: "" } },
    { id: "5", title: "Spy × Family", altTitles: ["スパイファミリー"], description: "A spy, an assassin, and a telepath form a fake family.", coverImage: "https://cdn.myanimelist.net/images/manga/1/240247.jpg", status: "ongoing", type: "manga", genres: [{ id: "3", name: "Action", slug: "action", mangaCount: 1000 }, { id: "4", name: "Comedy", slug: "comedy", mangaCount: 700 }, { id: "5", name: "Slice of Life", slug: "slice-of-life", mangaCount: 500 }], tags: [], authors: [{ id: "5", name: "Tatsuya Endo", slug: "tatsuya-endo", mangaCount: 3 }], artists: [], demographic: "shounen", rating: 8.9, ratingCount: 280000, followCount: 850000, viewCount: 28000000, chapterCount: 100, volumeCount: 12, createdAt: "", updatedAt: "", userData: { status: "plan_to_read", progress: 0, isFavorite: false, tags: [], createdAt: "", updatedAt: "" } },
  ],
  similar: [
    { id: "6", title: "Demon Slayer", altTitles: ["Kimetsu no Yaiba", "鬼滅の刃"], description: "Tanjiro fights demons to save his sister.", coverImage: "https://cdn.myanimelist.net/images/manga/1/209238.jpg", status: "completed", type: "manga", genres: [{ id: "6", name: "Action", slug: "action", mangaCount: 1000 }, { id: "7", name: "Historical", slug: "historical", mangaCount: 300 }, { id: "8", name: "Supernatural", slug: "supernatural", mangaCount: 600 }], tags: [], authors: [{ id: "6", name: "Koyoharu Gotouge", slug: "koyoharu-gotouge", mangaCount: 2 }], artists: [], demographic: "shounen", rating: 8.7, ratingCount: 350000, followCount: 1100000, viewCount: 35000000, chapterCount: 205, volumeCount: 23, createdAt: "", updatedAt: "", userData: { status: "plan_to_read", progress: 0, isFavorite: false, tags: [], createdAt: "", updatedAt: "" } },
    { id: "7", title: "My Hero Academia", altTitles: ["Boku no Hero Academia", "僕のヒーローアカデミア"], description: "A world where 80% of people have superpowers.", coverImage: "https://cdn.myanimelist.net/images/manga/1/209239.jpg", status: "ongoing", type: "manga", genres: [{ id: "9", name: "Action", slug: "action", mangaCount: 1000 }, { id: "10", name: "School", slug: "school", mangaCount: 400 }, { id: "11", name: "Super Power", slug: "super-power", mangaCount: 200 }], tags: [], authors: [{ id: "7", name: "Kohei Horikoshi", slug: "kohei-horikoshi", mangaCount: 5 }], artists: [], demographic: "shounen", rating: 8.5, ratingCount: 300000, followCount: 1000000, viewCount: 32000000, chapterCount: 400, volumeCount: 38, createdAt: "", updatedAt: "", userData: { status: "plan_to_read", progress: 0, isFavorite: false, tags: [], createdAt: "", updatedAt: "" } },
  ],
  trending: [
    { id: "8", title: "Frieren: Beyond Journey's End", altTitles: ["Sousou no Frieren", "葬送のフリーレン"], description: "An elven mage reflects on her past journey.", coverImage: "https://cdn.myanimelist.net/images/manga/1/245678.jpg", status: "ongoing", type: "manga", genres: [{ id: "12", name: "Adventure", slug: "adventure", mangaCount: 800 }, { id: "13", name: "Drama", slug: "drama", mangaCount: 900 }, { id: "14", name: "Fantasy", slug: "fantasy", mangaCount: 1200 }], tags: [], authors: [{ id: "8", name: "Kanehito Yamada", slug: "kanehito-yamada", mangaCount: 2 }, { id: "9", name: "Tsukasa Abe", slug: "tsukasa-abe", mangaCount: 1 }], artists: [], demographic: "seinen", rating: 9.3, ratingCount: 250000, followCount: 750000, viewCount: 20000000, chapterCount: 120, volumeCount: 11, createdAt: "", updatedAt: "", userData: { status: "plan_to_read", progress: 0, isFavorite: false, tags: [], createdAt: "", updatedAt: "" } },
    { id: "9", title: "Oshi no Ko", altTitles: ["【推しの子】"], description: "The dark side of the entertainment industry.", coverImage: "https://cdn.myanimelist.net/images/manga/1/250123.jpg", status: "ongoing", type: "manga", genres: [{ id: "15", name: "Drama", slug: "drama", mangaCount: 900 }, { id: "16", name: "Mystery", slug: "mystery", mangaCount: 400 }, { id: "17", name: "Supernatural", slug: "supernatural", mangaCount: 600 }], tags: [], authors: [{ id: "10", name: "Aka Akasaka", slug: "aka-akasaka", mangaCount: 4 }, { id: "11", name: "Mengo Yokoyari", slug: "mengo-yokoyari", mangaCount: 2 }], artists: [], demographic: "seinen", rating: 8.9, ratingCount: 200000, followCount: 700000, viewCount: 18000000, chapterCount: 150, volumeCount: 14, createdAt: "", updatedAt: "", userData: { status: "plan_to_read", progress: 0, isFavorite: false, tags: [], createdAt: "", updatedAt: "" } },
  ],
  completed: [
    { id: "10", title: "Fullmetal Alchemist", altTitles: ["鋼の錬金術師"], description: "Two brothers search for the Philosopher's Stone.", coverImage: "https://cdn.myanimelist.net/images/manga/1/210234.jpg", status: "completed", type: "manga", genres: [{ id: "18", name: "Action", slug: "action", mangaCount: 1000 }, { id: "19", name: "Adventure", slug: "adventure", mangaCount: 800 }, { id: "20", name: "Fantasy", slug: "fantasy", mangaCount: 1200 }], tags: [], authors: [{ id: "12", name: "Hiromu Arakawa", slug: "hiromu-arawa", mangaCount: 6 }], artists: [], demographic: "shounen", rating: 9.4, ratingCount: 450000, followCount: 1300000, viewCount: 45000000, chapterCount: 108, volumeCount: 27, createdAt: "", updatedAt: "", userData: { status: "plan_to_read", progress: 0, isFavorite: false, tags: [], createdAt: "", updatedAt: "" } },
    { id: "11", title: "Death Note", altTitles: ["デスノート"], description: "A notebook that kills anyone whose name is written in it.", coverImage: "https://cdn.myanimelist.net/images/manga/1/210235.jpg", status: "completed", type: "manga", genres: [{ id: "21", name: "Mystery", slug: "mystery", mangaCount: 400 }, { id: "22", name: "Psychological", slug: "psychological", mangaCount: 300 }, { id: "23", name: "Supernatural", slug: "supernatural", mangaCount: 600 }], tags: [], authors: [{ id: "13", name: "Tsugumi Ohba", slug: "tsugumi-ohba", mangaCount: 3 }, { id: "14", name: "Takeshi Obata", slug: "takeshi-obata", mangaCount: 5 }], artists: [], demographic: "shounen", rating: 9.0, ratingCount: 380000, followCount: 1150000, viewCount: 38000000, chapterCount: 108, volumeCount: 12, createdAt: "", updatedAt: "", userData: { status: "plan_to_read", progress: 0, isFavorite: false, tags: [], createdAt: "", updatedAt: "" } },
  ],
};

const tabs = [
  { id: "forYou", label: "For You", icon: Sparkles, description: "Personalized based on your reading history" },
  { id: "similar", label: "Similar", icon: Brain, description: "Based on manga in your library" },
  { id: "trending", label: "Trending", icon: TrendingUp, description: "Popular right now in the community" },
  { id: "completed", label: "Completed", icon: BookOpen, description: "Finished series you might enjoy" },
];

export function RecommendationsClient() {
  const [activeTab, setActiveTab] = useState("forYou");

  const currentRecommendations = mockRecommendations[activeTab as keyof typeof mockRecommendations] || [];

  return (
    <div className="min-h-screen flex flex-col">
      <div className="container-padded py-8 pt-24">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-display-md font-display font-bold text-foreground">Recommendations</h1>
              <p className="text-body-md text-muted-foreground mt-1">
                Discover your next favorite series
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" className="gap-2">
                <RefreshCw className="h-4 w-4" />
                Refresh
              </Button>
              <Button variant="outline" size="sm" className="gap-2">
                <Filter className="h-4 w-4" />
                Filters
              </Button>
            </div>
          </div>
        </motion.div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4 mb-6">
            {tabs.map((tab) => (
              <TabsTrigger key={tab.id} value={tab.id} className="flex flex-col items-center gap-1.5 py-4">
                <tab.icon className="h-5 w-5" />
                <span className="text-sm font-medium">{tab.label}</span>
              </TabsTrigger>
            ))}
          </TabsList>

          <TabsContent value="forYou" className="space-y-6">
            <div>
              <h3 className="text-heading-sm font-semibold text-foreground mb-4">
                {tabs.find(t => t.id === activeTab)?.description}
              </h3>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {currentRecommendations.map((manga, index) => (
                  <MangaCard key={manga.id} manga={manga} priority={index < 4} />
                ))}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="similar" className="space-y-6">
            <div>
              <h3 className="text-heading-sm font-semibold text-foreground mb-4">
                {tabs.find(t => t.id === activeTab)?.description}
              </h3>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {currentRecommendations.map((manga, index) => (
                  <MangaCard key={manga.id} manga={manga} priority={index < 4} />
                ))}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="trending" className="space-y-6">
            <div>
              <h3 className="text-heading-sm font-semibold text-foreground mb-4">
                {tabs.find(t => t.id === activeTab)?.description}
              </h3>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {currentRecommendations.map((manga, index) => (
                  <MangaCard key={manga.id} manga={manga} priority={index < 4} />
                ))}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="completed" className="space-y-6">
            <div>
              <h3 className="text-heading-sm font-semibold text-foreground mb-4">
                {tabs.find(t => t.id === activeTab)?.description}
              </h3>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {currentRecommendations.map((manga, index) => (
                  <MangaCard key={manga.id} manga={manga} priority={index < 4} />
                ))}
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
