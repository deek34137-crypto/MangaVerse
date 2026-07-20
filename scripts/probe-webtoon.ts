/**
 * Live probe for the WEBTOON provider.
 * Run with: npx tsx scripts/probe-webtoon.ts
 */
import { WebtoonProvider } from "@/services/providers/webtoon/provider";

const CANONICAL_ID = "fantasy:tower-of-god:95";

async function main() {
  const provider = new WebtoonProvider();
  let passed = 0;
  let failed = 0;

  function ok(label: string, value: unknown) {
    console.log(`  ✅ ${label}:`, value);
    passed++;
  }
  function fail(label: string, reason: string) {
    console.error(`  ❌ ${label}: ${reason}`);
    failed++;
  }

  // ─── 1. Search ────────────────────────────────────────────────────────────
  console.log("\n[1] search(\"tower of god\")");
  try {
    const results = await provider.searchManga("tower of god", { limit: 5 });
    results.length > 0
      ? ok("result count", results.length)
      : fail("result count", "0 results");
    const towerOfGod = results.find(r => r.id === CANONICAL_ID);
    towerOfGod
      ? ok("Tower of God found", `id=${towerOfGod.id}, title="${towerOfGod.title}"`)
      : fail("Tower of God in results", `not found in first 5 (got ids: ${results.map(r => r.id).join(", ")})`);
    results[0]?.coverImage
      ? ok("cover image url", results[0].coverImage!.slice(0, 70) + "…")
      : fail("cover image", "missing");
  } catch (e: unknown) {
    fail("search", String(e));
  }

  // ─── 2. Detail ────────────────────────────────────────────────────────────
  console.log(`\n[2] getMangaDetail("${CANONICAL_ID}")`);
  try {
    const detail = await provider.getMangaDetail(CANONICAL_ID);
    detail.title     ? ok("title", detail.title)                                         : fail("title", "empty");
    detail.description ? ok("description", detail.description!.slice(0, 80) + "…")      : fail("description", "empty");
    detail.genres?.length ? ok("genres", detail.genres)                                  : fail("genres", "empty");
    detail.authors?.length ? ok("authors", detail.authors)                               : fail("authors", "empty");
    detail.coverImage ? ok("cover", detail.coverImage.slice(0, 70) + "…")               : fail("cover", "missing");
  } catch (e: unknown) {
    fail("getMangaDetail", String(e));
  }

  // ─── 3. Chapters (paginated) ──────────────────────────────────────────────
  console.log(`\n[3] getChapters("${CANONICAL_ID}") — paginated, may take ~60s for 600+ episodes`);
  let chapters: Awaited<ReturnType<typeof provider.getChapters>> = [];
  try {
    chapters = await provider.getChapters(CANONICAL_ID);
    chapters.length >= 100
      ? ok("chapter count", chapters.length)
      : fail("chapter count", `only ${chapters.length} (expected 600+)`);

    const first = chapters[0];
    first ? ok("first chapter id", first.id) : fail("first chapter", "missing");
    first?.publishedAt ? ok("first chapter date", first.publishedAt) : fail("first chapter date", "missing");

    // Ascending order check
    const isAscending = chapters.every(
      (ch, i) => i === 0 || Number(ch.number ?? 0) >= Number(chapters[i - 1].number ?? 0) - 0.01
    );
    isAscending ? ok("ascending order", "✓") : fail("ascending order", "chapters out of order");

    // ID format: "genre:slug:titleNo:episodeNo"
    const idOk = /^[^:]+:[^:]+:\d+:\d+$/.test(first?.id ?? "");
    idOk
      ? ok("chapter ID format", first?.id)
      : fail("chapter ID format", `"${first?.id}" doesn't match {genre}:{slug}:{titleNo}:{episodeNo}`);
  } catch (e: unknown) {
    fail("getChapters", String(e));
  }

  // ─── 4. Pages ─────────────────────────────────────────────────────────────
  console.log(`\n[4] getChapterPages("${CANONICAL_ID}:1") — first episode`);
  try {
    const pages = await provider.getChapterPages(`${CANONICAL_ID}:1`);
    pages.length > 0 ? ok("page count", pages.length) : fail("page count", "0 pages");
    const firstUrl = pages[0]?.url ?? "";
    firstUrl.includes("pstatic.net")
      ? ok("CDN domain", firstUrl.slice(0, 70) + "…")
      : fail("CDN domain", `unexpected URL: ${firstUrl.slice(0, 100)}`);
    !firstUrl.includes("bg_transparency")
      ? ok("not placeholder", "✓")
      : fail("not placeholder", "got bg_transparency.png");
  } catch (e: unknown) {
    fail("getChapterPages", String(e));
  }

  // ─── 5. healthCheck ───────────────────────────────────────────────────────
  console.log("\n[5] healthCheck()");
  try {
    const health = await provider.healthCheck();
    health.status === "ONLINE"
      ? ok("status", health.status)
      : fail("status", health.status);
    ok("latency", `${health.latencyMs}ms`);
  } catch (e: unknown) {
    fail("healthCheck", String(e));
  }

  // ─── Summary ──────────────────────────────────────────────────────────────
  console.log(`\n${"─".repeat(50)}`);
  console.log(`Results: ${passed} passed, ${failed} failed`);
  if (failed > 0) process.exit(1);
}

main().catch(err => { console.error(err); process.exit(1); });
