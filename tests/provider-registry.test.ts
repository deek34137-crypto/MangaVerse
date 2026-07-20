import "dotenv/config";
import { providerRegistry } from "../src/services/providers";

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

async function main() {
  console.log("\n=== Suite: Provider Registry & Adapter Contract Verification ===");

  const expectedProviders = ["mangadex", "comick", "weebcentral", "mangakatana", "webtoon"];

  for (const name of expectedProviders) {
    const hasProvider = providerRegistry.has(name);
    assert(`ProviderRegistry has registered provider "${name}"`, hasProvider);

    if (hasProvider) {
      const instance = providerRegistry.get(name);
      assert(`Provider "${name}" satisfies IMangaProvider interface`, typeof instance.getMangaDetail === "function" && typeof instance.getChapterPages === "function");
      assert(`Provider "${name}" has correct name property`, instance.name.toLowerCase() === name);
    }
  }

  console.log(`\nProvider Registry Tests Complete: ${passed} Passed, ${failed} Failed\n`);
  if (failed > 0) process.exit(1);
  process.exit(0);
}

main().catch((err) => {
  console.error("Provider registry test error:", err);
  process.exit(1);
});
