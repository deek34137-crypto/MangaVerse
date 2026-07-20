import { buildMangaDexCoverUrl, decorateCoverUrl } from "../src/lib/cover-url";

let passed = 0;
let failed = 0;

function assert(label: string, condition: boolean, details?: string) {
  if (condition) {
    console.log(`  ✅ [PASS] ${label}`);
    passed++;
  } else {
    console.error(`  ❌ [FAIL] ${label}${details ? ` — ${details}` : ""}`);
    failed++;
  }
}

console.log("\n=== Suite: Cover URL & Proxy Utility Tests ===");

// Test 1: MangaDex cover URL construction
{
  const url = buildMangaDexCoverUrl("manga-123", "cover-456.jpg");
  assert(
    "MangaDex cover URL constructed with .512.jpg suffix",
    url === "https://uploads.mangadex.org/covers/manga-123/cover-456.jpg.512.jpg",
    `Got ${url}`
  );
}

// Test 2: Idempotent MangaDex cover URL (avoids double .512.jpg)
{
  const preFormatted = "https://uploads.mangadex.org/covers/manga-123/cover-456.jpg.512.jpg";
  const url = buildMangaDexCoverUrl("manga-123", preFormatted);
  assert(
    "Pre-formatted MangaDex URL returns unchanged without duplicate suffix",
    url === preFormatted,
    `Got ${url}`
  );
}

// Test 3: Proxy decoration
{
  const rawUrl = "https://uploads.mangadex.org/covers/m1/c1.jpg";
  const proxied = decorateCoverUrl(rawUrl);
  assert(
    "decorateCoverUrl wraps external URL in /api/image?url=...",
    proxied === `/api/image?url=${encodeURIComponent(rawUrl)}`,
    `Got ${proxied}`
  );
}

// Test 4: Idempotent proxy decoration
{
  const rawUrl = "https://uploads.mangadex.org/covers/m1/c1.jpg";
  const proxiedOnce = decorateCoverUrl(rawUrl);
  const proxiedTwice = decorateCoverUrl(proxiedOnce);
  assert(
    "decorateCoverUrl avoids double-wrapping an already proxied URL",
    proxiedTwice === proxiedOnce,
    `Got ${proxiedTwice}`
  );
}

console.log(`\nCover URL Tests Complete: ${passed} Passed, ${failed} Failed\n`);
if (failed > 0) process.exit(1);
