import "@/services/providers";
import { providerRegistry } from "@/services/providers/shared/normalization/registry";
import fs from "fs";

const logs: string[] = [];
function print(msg: string) {
  console.log(msg);
  logs.push(msg);
}

async function runMangaTownTest() {
  print("🧪  Direct Certification Suite — MANGATOWN\n");
  const provider = providerRegistry.get("mangatown");

  // 1. Health
  const startH = Date.now();
  const health = await provider.healthCheck();
  print(`1. Health check: status=${health.status} (${Date.now() - startH}ms)`);

  // 2. Search
  const startS = Date.now();
  const search = await provider.searchManga("naruto", { limit: 3 });
  print(`2. Search: count=${search.length} first="${search[0]?.title ?? "none"}" (${Date.now() - startS}ms)`);

  const firstId = search[0]?.id || "naruto";

  // 3. Detail
  const startD = Date.now();
  const detail = await provider.getMangaDetail(firstId);
  print(`3. Manga detail: title="${detail.title}" genres=${detail.genres?.length ?? 0} (${Date.now() - startD}ms)`);

  // 4. Chapters
  const startC = Date.now();
  const chapters = await provider.getChapters(firstId);
  print(`4. Chapters: count=${chapters.length} first=${chapters[0]?.number ?? "?"} (${Date.now() - startC}ms)`);

  const firstChId = chapters[0]?.id || "v01/c001";

  // 5. Pages
  const startP = Date.now();
  const pages = await provider.getChapterPages(firstChId);
  print(`5. Pages: count=${pages.length} first="${pages[0]?.url?.slice(0, 60)}" (${Date.now() - startP}ms)`);

  print("\n✅  MangaTown Direct Suite Completed Successfully!");
  fs.writeFileSync("mangatown_suite.log", logs.join("\n"), "utf-8");
  process.exit(0);
}

runMangaTownTest().catch((err) => {
  print(`❌ Test failed: ${String(err)}`);
  fs.writeFileSync("mangatown_suite.log", logs.join("\n"), "utf-8");
  process.exit(1);
});
