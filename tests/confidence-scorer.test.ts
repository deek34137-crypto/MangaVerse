import { ConfidenceScorer } from "../src/services/manga/deduplication";

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

console.log("\n=== Suite: ConfidenceScorer Unit Tests ===");

// Test 1: Exact title match
{
  const canonical = { id: "m1", title: "Chainsaw Man", altTitles: ["CSM"] } as any;
  const rawProvider = { id: "cmd-1", title: "Chainsaw Man", altTitles: [] } as any;
  const score = ConfidenceScorer.calculateConfidence(canonical, rawProvider, "mangadex", []);
  assert("Exact title match scores >= 0.85 (Auto-link threshold)", score >= 0.85, `Got score ${score}`);
}

// Test 2: Alt title match
{
  const canonical = { id: "m2", title: "Chainsaw Man", altTitles: ["CSM", "Chainsaw-Man"] } as any;
  const rawProvider = { id: "cmd-2", title: "CSM", altTitles: [] } as any;
  const score = ConfidenceScorer.calculateConfidence(canonical, rawProvider, "mangadex", []);
  assert("Alt title match scores >= 0.85", score >= 0.85, `Got score ${score}`);
}

// Test 3: Completely different title
{
  const canonical = { id: "m3", title: "One Piece", altTitles: [] } as any;
  const rawProvider = { id: "cmd-3", title: "Naruto", altTitles: [] } as any;
  const score = ConfidenceScorer.calculateConfidence(canonical, rawProvider, "mangadex", []);
  assert("Unrelated titles score < 0.50", score < 0.50, `Got score ${score}`);
}

// Test 4: Normalized punctuation & case insensitive match
{
  const canonical = { id: "m4", title: "Kaguya-sama: Love Is War!", altTitles: [] } as any;
  const rawProvider = { id: "cmd-4", title: "kaguya sama love is war", altTitles: [] } as any;
  const score = ConfidenceScorer.calculateConfidence(canonical, rawProvider, "mangadex", []);
  assert("Case & punctuation insensitive match scores >= 0.85", score >= 0.85, `Got score ${score}`);
}

console.log(`\nConfidenceScorer Tests Complete: ${passed} Passed, ${failed} Failed\n`);
if (failed > 0) process.exit(1);
