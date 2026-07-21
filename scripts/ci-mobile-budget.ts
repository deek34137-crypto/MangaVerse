import fs from "fs";
import path from "path";

console.log("=========================================");
console.log(" MangaHub Mobile Performance Budget Check");
console.log("=========================================\n");

const ROOT_DIR = process.cwd();
const GLOBALS_CSS = path.join(ROOT_DIR, "src/app/globals.css");
const MANIFEST_PATH = path.join(ROOT_DIR, "public/site.webmanifest");
const SW_PATH = path.join(ROOT_DIR, "public/sw.js");

let passes = 0;
let fails = 0;

function assert(condition: boolean, label: string) {
  if (condition) {
    console.log(` ✅ PASS: ${label}`);
    passes++;
  } else {
    console.error(` ❌ FAIL: ${label}`);
    fails++;
  }
}

// Check 1: Safe area inset CSS declarations
const cssContent = fs.readFileSync(GLOBALS_CSS, "utf-8");
assert(
  cssContent.includes("safe-area-inset-bottom") && cssContent.includes("safe-area-inset-top"),
  "CSS defines safe-area-inset-top and safe-area-inset-bottom custom variables"
);

// Check 2: Minimum touch target class
assert(
  cssContent.includes("touch-target") && cssContent.includes("min-width: 44px"),
  "CSS contains .touch-target utility enforcing min 44px touch boundaries"
);

// Check 3: Web manifest metadata
const manifestContent = JSON.parse(fs.readFileSync(MANIFEST_PATH, "utf-8"));
assert(manifestContent.display === "standalone", "site.webmanifest sets display to standalone");
assert(Array.isArray(manifestContent.icons) && manifestContent.icons.length >= 2, "site.webmanifest contains PWA icons");

// Check 4: Service worker offline shell
const swContent = fs.readFileSync(SW_PATH, "utf-8");
assert(swContent.includes("/offline"), "sw.js contains offline route fallback handling");

console.log("\n-----------------------------------------");
console.log(`Results: ${passes} passed, ${fails} failed.`);
console.log("-----------------------------------------");

if (fails > 0) {
  process.exit(1);
} else {
  console.log("🎉 Mobile Performance Budget Audit Passed Successfully!\n");
}
