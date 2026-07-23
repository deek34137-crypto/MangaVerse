import assert from "node:assert";
import { getMangaUrl, getChapterUrl, getGenreUrl, getSearchUrl, isUuid, slugifyTitle } from "../src/lib/url";

console.log("▶ Running Canonical URL Service Tests (RFC-001)...");

// 1. UUID Detection
assert.strictEqual(isUuid("bedb80ed-cc11-5cb9-a31c-175dd999699e"), true);
assert.strictEqual(isUuid("rebirth-two-lives-i-still-love-you"), false);
console.log("  ✓ isUuid validation passed");

// 2. Slugification
assert.strictEqual(slugifyTitle("Rebirth Two Lives - I Still Love You"), "rebirth-two-lives---i-still-love-you".replace(/-+/g, "-"));
assert.strictEqual(slugifyTitle("My Co-worker Is an Eldritch X!"), "my-co-worker-is-an-eldritch-x");
console.log("  ✓ slugifyTitle passed");

// 3. Manga URLs
assert.strictEqual(getMangaUrl({ slug: "rebirth-two-lives", id: "bedb80ed-cc11-5cb9-a31c-175dd999699e" }), "/manga/rebirth-two-lives");
assert.strictEqual(getMangaUrl({ id: "bedb80ed-cc11-5cb9-a31c-175dd999699e", title: "Solo Leveling" }), "/manga/solo-leveling");
assert.strictEqual(getMangaUrl("rebirth-two-lives"), "/manga/rebirth-two-lives");
console.log("  ✓ getMangaUrl passed");

// 4. Chapter URLs
assert.strictEqual(getChapterUrl({ slug: "rebirth-two-lives" }, 1), "/manga/rebirth-two-lives/chapter/1");
assert.strictEqual(getChapterUrl({ slug: "solo-leveling" }, { number: 54 }), "/manga/solo-leveling/chapter/54");
console.log("  ✓ getChapterUrl passed");

// 5. Genre and Search URLs
assert.strictEqual(getGenreUrl("Slice of Life"), "/genres/slice-of-life");
assert.strictEqual(getSearchUrl({ q: "naruto", sort: "rating" }), "/search?q=naruto&sort=rating");
console.log("  ✓ getGenreUrl & getSearchUrl passed");

console.log("✅ All Canonical URL Service tests passed successfully!");
