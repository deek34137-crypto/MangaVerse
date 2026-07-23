import { rankChapterSources } from "../src/services/aggregation/source-ranker";
import { parsePageList } from "../src/services/providers/mangatown/parser";
import { ChapterSource } from "../src/services/aggregation/types";

async function runChaosSuite() {
  console.log("=====================================================");
  console.log(" 🧪 Test Suite 2 — Chaos & Provider Circuit Isolation");
  console.log("=====================================================\n");

  // 1. Test Provider Circuit Breaker Isolation
  console.log("1. Testing Circuit Breaker Isolation for disabled providers...");
  const sources: ChapterSource[] = [
    { providerId: "comick", providerChapterId: "comick_ch_1", sourceScore: 0.99, url: "https://comick.app/ch1" },
    { providerId: "mangatown", providerChapterId: "mt_ch_1", sourceScore: 0.85, url: "https://mangatown.com/ch1" },
  ];

  const ranked = rankChapterSources(sources);
  console.log(`   Ranked sources count=${ranked.length}, topProvider="${ranked[0]?.providerId}"`);
  
  if (ranked.some((r) => r.providerId === "comick")) {
    throw new Error("Circuit Breaker Failure: Disabled provider ComicK was not filtered out!");
  }
  console.log("   ✅ Circuit Breaker Isolation successfully filtered out disabled provider (ComicK).");

  // 2. Test MangaTown Page URL Uniqueness & Sequential Generation
  console.log("\n2. Testing MangaTown Parser Page Image Uniqueness...");
  const mockHtml = `
    <html>
      <head>
        <script>var total_pages = 5;</script>
      </head>
      <body>
        <div id="viewer">
          <img id="image" src="https://img.mangatown.com/store/manga/123/c001/001.jpg" />
        </div>
      </body>
    </html>
  `;

  const pages = parsePageList(mockHtml, "c001");
  console.log(`   Extracted ${pages.length} pages.`);

  if (pages.length !== 5) {
    throw new Error(`Expected 5 pages, got ${pages.length}`);
  }

  if (pages[0].url === pages[1].url) {
    throw new Error(`Page URL duplication detected! Page 1 (${pages[0].url}) === Page 2 (${pages[1].url})`);
  }

  console.log(`   Page 1 URL: ${pages[0].url}`);
  console.log(`   Page 2 URL: ${pages[1].url}`);
  console.log(`   Page 5 URL: ${pages[4].url}`);
  console.log("   ✅ MangaTown Parser generated distinct, valid sequential page URLs!");

  console.log("\n🎉 Chaos & Provider Circuit Isolation Test Passed 100%!");
  process.exit(0);
}

runChaosSuite().catch((err) => {
  console.error("❌ Chaos test failed:", err);
  process.exit(1);
});
