import * as cheerio from "cheerio";
import fs from "fs";

const out: string[] = [];
function print(str: string) {
  console.log(str);
  out.push(str);
}

async function probeEndpoint(url: string) {
  const start = Date.now();
  try {
    const res = await fetch(url, {
      signal: AbortSignal.timeout(6000),
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
        "Referer": "https://www.mangatown.com/",
      },
    });
    const text = await res.text();
    return { status: res.status, latency: Date.now() - start, ok: res.ok, text };
  } catch (err: any) {
    return { status: 0, latency: Date.now() - start, ok: false, text: "", error: err.message };
  }
}

async function main() {
  print("=== MANGATOWN EMPIRICAL PROBE ===");

  // 1. Detail Page Chapters & Info
  const detail = await probeEndpoint("https://www.mangatown.com/manga/one_piece/");
  print(`Detail Status: ${detail.status} (${detail.latency}ms)`);
  if (detail.ok) {
    const $ = cheerio.load(detail.text);
    const chapters = $(".chapter_content ul.chapter_list li a, .chapter_list li a");
    print(`Chapters Found: ${chapters.length}`);
    if (chapters.length > 0) {
      const first = chapters.first();
      print(`Sample Chapter 1: "${first.text().trim()}" -> "${first.attr("href")}"`);
    }
  }

  // 2. Reader Page Image
  const reader = await probeEndpoint("https://www.mangatown.com/manga/one_piece/v01/c001/1.html");
  print(`Reader Status: ${reader.status} (${reader.latency}ms)`);
  if (reader.ok) {
    const $ = cheerio.load(reader.text);
    const img = $("#image, .read_img img").first();
    print(`Reader Image Tag Found: ${img.length > 0}`);
    print(`Image Src: "${img.attr("src")}"`);

    // Extract pages script
    const scripts = $("script").text();
    const matchPages = scripts.match(/total_pages\s*=\s*(\d+)/i);
    print(`Total Pages: ${matchPages ? matchPages[1] : "N/A"}`);
  }

  print("=== END PROBE ===");
  fs.writeFileSync("research_report.txt", out.join("\n"), "utf-8");
  process.exit(0);
}

main().catch((e) => {
  print(`Fatal: ${String(e)}`);
  fs.writeFileSync("research_report.txt", out.join("\n"), "utf-8");
  process.exit(1);
});
