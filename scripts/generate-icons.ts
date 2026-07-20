import sharp from "sharp";
import * as fs from "fs";
import * as path from "path";

const svgPath = path.resolve(process.cwd(), "public", "favicon.svg");
const publicDir = path.resolve(process.cwd(), "public");

const targets = [
  { name: "apple-touch-icon.png", size: 180 },
  { name: "android-chrome-192x192.png", size: 192 },
  { name: "android-chrome-512x512.png", size: 512 },
  { name: "favicon-32x32.png", size: 32 },
  { name: "favicon-16x16.png", size: 16 }
];

async function generate() {
  if (!fs.existsSync(svgPath)) {
    console.error(`SVG source not found at: ${svgPath}`);
    process.exit(1);
  }

  console.log("Reading favicon.svg...");
  const svgBuffer = fs.readFileSync(svgPath);

  for (const target of targets) {
    const outputPath = path.join(publicDir, target.name);
    console.log(`Generating ${target.name} (${target.size}x${target.size})...`);
    
    await sharp(svgBuffer)
      .resize(target.size, target.size)
      .png()
      .toFile(outputPath);
  }

  console.log("All PWA icons generated successfully!");
}

generate().catch(err => {
  console.error("Failed to generate icons:", err);
  process.exit(1);
});
