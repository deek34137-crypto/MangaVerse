import "dotenv/config";
import { execSync } from "child_process";

const testFiles = [
  "tests/homepage-content-engine.test.ts",
  "tests/confidence-scorer.test.ts",
  "tests/cover-url.test.ts",
  "tests/two-tier-cache.test.ts",
  "tests/provider-registry.test.ts",
  "tests/integration-sync-reader.test.ts",
  "tests/resilience-chaos.test.ts",
];

console.log("=================================================");
console.log("   MangaHub Master Test Suite Execution          ");
console.log("=================================================\n");

let passedSuites = 0;
let failedSuites = 0;

for (const file of testFiles) {
  console.log(`Running suite: ${file}...`);
  try {
    const output = execSync(`npx tsx ${file}`, { encoding: "utf-8" });
    console.log(output);
    passedSuites++;
  } catch (err: any) {
    console.error(`❌ Suite Failed: ${file}`);
    console.error(err.stdout || err.message);
    failedSuites++;
  }
}

console.log("=================================================");
console.log(`Test Execution Complete: ${passedSuites} Suites Passed, ${failedSuites} Suites Failed`);
console.log("=================================================");

if (failedSuites > 0) {
  process.exit(1);
}
process.exit(0);
