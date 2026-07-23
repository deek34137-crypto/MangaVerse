import assert from "node:assert";
import { scoreArtwork, selectBestArtwork } from "../src/services/manga/cover-pipeline";
import { buildMangaSnapshot } from "../src/services/manga/snapshot";
import { rankProviders, getProviderHealth } from "../src/services/manga/failover";

console.log("▶ Running Cover Pipeline & Failover Tests...");

// 1. Cover Scoring
const scoreMangaDex = scoreArtwork({ url: "https://uploads.mangadex.org/covers/123.jpg", source: "mangadex" });
const scorePlaceholder = scoreArtwork({ url: "https://mangadex.org/mangadex.png", source: "mangadex" });
assert.ok(scoreMangaDex > 80);
assert.strictEqual(scorePlaceholder, 0);
console.log("  ✓ scoreArtwork discards placeholders and scores quality covers");

const best = selectBestArtwork([
  { url: "https://mangadex.org/mangadex.png", source: "mangadex" },
  { url: "https://uploads.mangadex.org/covers/real.jpg", source: "mangadex" },
]);
assert.strictEqual(best, "https://uploads.mangadex.org/covers/real.jpg");
console.log("  ✓ selectBestArtwork chooses top-scoring non-placeholder cover");

// 2. Snapshot Builder
const snapshot = buildMangaSnapshot(
  {
    canonicalId: "m1",
    slug: "solo-leveling",
    title: "Solo Leveling",
    altTitles: [],
    description: "Desc",
    coverImage: "/cover.jpg",
    status: "ONGOING",
    type: "MANHWA",
    authors: ["Chugong"],
    artists: [],
    genres: ["Action"],
    tags: [],
    rating: 9.5,
    ratingCount: 100,
    followCount: 500,
    viewCount: 1000,
    chapterCount: 1,
    volumeCount: 1,
    primaryProvider: "mangadex",
    providerMappings: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  [
    {
      canonicalChapterId: "ch1",
      mangaId: "m1",
      chapterNumber: 1,
      title: "Chapter 1",
      language: "en",
      pageCount: 10,
      pages: [],
      publishedAt: new Date().toISOString(),
      primaryProvider: "mangadex",
      providerChapterId: "p1",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ]
);

assert.strictEqual(snapshot.healthStatus, "HEALTHY");
assert.strictEqual(snapshot.chapterCount, 1);
console.log("  ✓ buildMangaSnapshot creates valid healthy snapshot");

// 3. Provider Failover Ranking
const ranked = rankProviders(["mangasee", "mangadex", "manganato"]);
assert.strictEqual(ranked[0], "mangadex");
console.log("  ✓ rankProviders orders by confidence score");

console.log("✅ All Cover Pipeline & Failover tests passed successfully!");
