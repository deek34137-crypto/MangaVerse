#!/usr/bin/env tsx
/**
 * Dedicated MangaToon Provider Test Script
 *
 * Usage:
 *   npx tsx scripts/test-mangatoon.ts
 */

import "@/services/providers"; // Register all providers
import { providerRegistry } from "@/services/providers/registry";
import { MangaToonProvider } from "@/services/providers/mangatoon/provider";

async function runMangaToonTest() {
  console.log("\n🧪  Running Dedicated MangaToon Provider Test...\n");

  const provider = providerRegistry.get("mangatoon") as MangaToonProvider;
  if (!provider) {
    console.error("❌ MangaToon provider not registered in providerRegistry.");
    process.exit(1);
  }

  console.log(`📋 Provider Info: Name="${provider.name}" Version="${provider.version}" Priority=${provider.config.priority}`);

  // Test 1: Health Check
  console.log("\n1️⃣  Testing healthCheck()...");
  const health = await provider.healthCheck();
  console.log(`   Status: ${health.status} (${health.latencyMs}ms)`);

  // Test 2: Search
  console.log("\n2️⃣  Testing searchManga('love')...");
  let searchResults: Awaited<ReturnType<typeof provider.searchManga>> = [];
  try {
    searchResults = await provider.searchManga("love", { limit: 5 });
    console.log(`   Found ${searchResults.length} manga:`);
    searchResults.forEach((m, i) => {
      console.log(`   [${i + 1}] ID: ${m.id} | Title: "${m.title}" | Cover: ${m.coverImage?.slice(0, 50)}...`);
    });
  } catch (err: unknown) {
    console.error(`   ❌ Search failed:`, err instanceof Error ? err.message : err);
  }

  // Test 3: Manga Detail
  const mangaId = searchResults[0]?.id || "78"; // Fallback ID if search returned 0 items
  console.log(`\n3️⃣  Testing getMangaDetail('${mangaId}')...`);
  try {
    const detail = await provider.getMangaDetail(mangaId);
    console.log(`   Title: "${detail.title}"`);
    console.log(`   Status: ${detail.status}`);
    console.log(`   Genres: ${detail.genres?.join(", ")}`);
    console.log(`   Author: ${detail.authors?.join(", ")}`);
  } catch (err: unknown) {
    console.error(`   ❌ Detail failed:`, err instanceof Error ? err.message : err);
  }

  // Test 4: Chapters
  console.log(`\n4️⃣  Testing getChapters('${mangaId}')...`);
  let chapters: Awaited<ReturnType<typeof provider.getChapters>> = [];
  try {
    chapters = await provider.getChapters(mangaId);
    console.log(`   Found ${chapters.length} chapters.`);
    if (chapters.length > 0) {
      console.log(`   First Chapter: Ep ${chapters[0].number} - "${chapters[0].title}" (ID: ${chapters[0].id})`);
    }
  } catch (err: unknown) {
    console.error(`   ❌ Chapters failed:`, err instanceof Error ? err.message : err);
  }

  // Test 5: Chapter Pages
  const chapterId = chapters[0]?.id || `${mangaId}-ep-1`;
  console.log(`\n5️⃣  Testing getChapterPages('${chapterId}')...`);
  try {
    const pages = await provider.getChapterPages(chapterId);
    console.log(`   Found ${pages.length} page images.`);
    if (pages.length > 0) {
      console.log(`   First Page URL: ${pages[0].url}`);
    }
  } catch (err: unknown) {
    console.error(`   ❌ Chapter pages failed:`, err instanceof Error ? err.message : err);
  }

  console.log("\n✅ MangaToon Test Execution Completed.\n");
}

runMangaToonTest().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
