import assert from "node:assert";
import { generateSeoMetadata, generateMangaJsonLd } from "../src/lib/seo";
import { DEFAULT_PROVIDER_CAPABILITIES } from "../src/services/manga/domain";

console.log("▶ Running RFC-002 Domain & SEO Tests...");

// 1. Provider Capabilities Registry
assert.ok(DEFAULT_PROVIDER_CAPABILITIES.mangadex);
assert.strictEqual(DEFAULT_PROVIDER_CAPABILITIES.mangadex.confidenceScore, 99);
assert.strictEqual(DEFAULT_PROVIDER_CAPABILITIES.mangadex.supportsSearch, true);
console.log("  ✓ Provider capability registry verified");

// 2. SEO Metadata Generator
const seo = generateSeoMetadata({
  title: "Solo Leveling",
  description: "Read Solo Leveling on MangaHub",
  canonicalPath: "/manga/solo-leveling",
  image: "/covers/solo.jpg",
});

assert.strictEqual(seo.title, "Solo Leveling | MangaHub");
assert.strictEqual((seo.alternates as any).canonical, "https://mangahub.dpdns.org/manga/solo-leveling");
assert.strictEqual(seo.openGraph?.url, "https://mangahub.dpdns.org/manga/solo-leveling");
console.log("  ✓ SEO metadata generator verified");

// 3. JSON-LD Structured Data
const jsonLd = generateMangaJsonLd({
  id: "solo-123",
  slug: "solo-leveling",
  title: "Solo Leveling",
  description: "Shadow monarch reborn",
  authors: [{ name: "Chugong" }],
});

assert.strictEqual((jsonLd as any)["@context"], "https://schema.org");
assert.strictEqual((jsonLd as any)["@graph"][0]["@type"], "ComicSeries");
assert.strictEqual((jsonLd as any)["@graph"][0].name, "Solo Leveling");
console.log("  ✓ JSON-LD graph generator verified");

console.log("✅ All Domain & SEO tests passed successfully!");
