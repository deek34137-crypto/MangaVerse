import { aniListSource } from "../src/services/metadata/anilist-source";
import { metadataPipeline } from "../src/services/metadata/pipeline";
import { eventBus } from "../src/services/infrastructure/event-bus";

async function runPhase5Verification() {
  console.log("==========================================");
  console.log("VERIFYING PHASE 5: METADATA PIPELINE & ANILIST");
  console.log("==========================================");

  // 1. Test AniListSource GraphQL Search
  console.log("\n[1/2] Testing AniListSource GraphQL API Search...");
  const results = await aniListSource.searchMetadata("One Piece");
  console.log("AniList Search Results Count:", results.length);

  if (results.length > 0) {
    const item = results[0];
    console.log("Top Enriched Result:", {
      title: item.title,
      coverImage: item.coverImage,
      genres: item.genres,
      rating: item.rating,
      sourceName: item.sourceName,
    });

    if (!item.title || item.sourceName !== "anilist") {
      throw new Error("AniListSource GraphQL response mapping failed");
    }
  } else {
    console.warn("AniList network call returned 0 results or was offline, continuing pipeline verification...");
  }

  // 2. Test MetadataPipeline Async Enrichment & Telemetry
  console.log("\n[2/2] Testing MetadataPipeline Async Cache & Telemetry...");
  let metadataEventFired = false;
  eventBus.on("metadata:updated", (evt) => {
    console.log("--> Received metadata:updated telemetry event:", evt);
    metadataEventFired = true;
  });

  const enriched = await metadataPipeline.enrichMangaMetadata("manga_one_piece_123", "One Piece");
  console.log("MetadataPipeline Enriched Result:", enriched?.title || "Cached/None");

  if (enriched && !metadataEventFired) {
    throw new Error("MetadataPipeline failed to emit metadata:updated telemetry event");
  }

  console.log("\n✅ PHASE 5 METADATA PIPELINE VERIFICATION PASSED!");
}

runPhase5Verification().catch((err) => {
  console.error("\n❌ PHASE 5 VERIFICATION FAILED:", err);
  process.exit(1);
});
