import { ContractValidator } from "../src/services/providers/contract-validator";

async function runPhase2Verification() {
  console.log("==========================================");
  console.log("VERIFYING PHASE 2: CONTRACT VALIDATION v1");
  console.log("==========================================");

  // 1. Verify Manga payload validation
  console.log("\n[1/3] Testing Manga Payload Validation...");
  const validManga = ContractValidator.validateManga(
    {
      id: "comick-one-piece",
      title: "One Piece",
      coverImage: "https://meow.comick.ink/covers/one-piece.jpg",
      genres: ["Action", "Adventure"],
      year: 1997,
    },
    "comick"
  );

  console.log("Valid Manga Result:", validManga);
  if (!validManga.isValid || !validManga.sanitized) throw new Error("Valid manga payload rejected");

  const invalidManga = ContractValidator.validateManga(
    {
      id: "",
      title: "",
      coverImage: "javascript:alert(1)",
    },
    "bad-provider"
  );
  console.log("Invalid Manga Result (Expected Failure):", invalidManga);
  if (invalidManga.isValid) throw new Error("Invalid manga payload passed validation");

  // 2. Verify Chapter payload validation
  console.log("\n[2/3] Testing Chapter Payload Validation...");
  const validChapter = ContractValidator.validateChapter(
    {
      id: "ch-1000",
      number: 1000,
      title: "Overcoming Adversity",
      language: "en",
    },
    "mangadex"
  );

  console.log("Valid Chapter Result:", validChapter);
  if (!validChapter.isValid || !validChapter.sanitized) throw new Error("Valid chapter payload rejected");

  // 3. Verify Chapter Pages payload validation (SSRF Protection)
  console.log("\n[3/3] Testing Chapter Pages Validation & SSRF Sanitization...");
  const pagesResult = ContractValidator.validatePages(
    [
      { number: 1, url: "https://uploads.mangadex.org/data/page1.png" },
      { number: 2, url: "file:///etc/passwd" }, // Invalid/Unsafe URL
      { number: 3, url: "https://uploads.mangadex.org/data/page3.png" },
    ],
    "mangadex"
  );

  console.log("Pages Validation Result:", pagesResult);
  if (pagesResult.sanitized?.length !== 2) {
    throw new Error("ContractValidator failed to filter out unsafe URL file:///etc/passwd");
  }

  console.log("\n✅ PHASE 2 CONTRACT VALIDATION VERIFICATION PASSED!");
}

runPhase2Verification().catch((err) => {
  console.error("\n❌ PHASE 2 VERIFICATION FAILED:", err);
  process.exit(1);
});
