import { execSync } from "child_process";

console.log("=================================================");
console.log("   MangaHub CI/CD Production Quality Gate        ");
console.log("=================================================\n");

const steps = [
  { name: "TypeScript Check", cmd: "npx tsc --noEmit" },
  { name: "Automated Test Suite", cmd: "npm test" },
  { name: "Production Build", cmd: "npm run build" },
];

let failedStep: string | null = null;

for (const step of steps) {
  console.log(`[CI Gate] Executing: ${step.name} ("${step.cmd}")...`);
  const t0 = performance.now();
  try {
    const output = execSync(step.cmd, { encoding: "utf-8" });
    const elapsedSecs = ((performance.now() - t0) / 1000).toFixed(1);
    console.log(`  ✅ [PASS] ${step.name} completed in ${elapsedSecs}s`);
  } catch (err: any) {
    const elapsedSecs = ((performance.now() - t0) / 1000).toFixed(1);
    console.error(`  ❌ [FAIL] ${step.name} failed after ${elapsedSecs}s`);
    console.error(err.stdout || err.message);
    failedStep = step.name;
    break;
  }
}

console.log("\n=================================================");
if (failedStep) {
  console.error(`❌ CI Quality Gate FAILED on step: ${failedStep}`);
  console.log("=================================================");
  process.exit(1);
} else {
  console.log("✅ All CI Quality Gates PASSED! Project is ready for deployment.");
  console.log("=================================================");
  process.exit(0);
}
