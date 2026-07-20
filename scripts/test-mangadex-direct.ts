import { MangaDexProvider } from "./../src/services/providers/mangadex";
import * as dotenv from "dotenv";
import * as path from "path";
import dns from "dns";

const resolver = new dns.Resolver();
resolver.setServers(["8.8.8.8"]);
const originalLookup = dns.lookup.bind(dns);

// Intercept dns.lookup so that api.mangadex.org is resolved via Google DNS 8.8.8.8
// rather than the local DNS server (which refuses the lookup on this machine).
// We cast through unknown to avoid fighting the overloaded signature of dns.lookup.
(dns as unknown as Record<string, unknown>)["lookup"] = function (
  hostname: string,
  options: unknown,
  callback: (err: NodeJS.ErrnoException | null, address: string | dns.LookupAddress[], family?: number) => void,
): void {
  if (typeof options === "function") {
    callback = options as typeof callback;
    options = {};
  }
  const isAll = options && (options as Record<string, unknown>).all;
  if (hostname === "api.mangadex.org") {
    resolver.resolve4(hostname, (err, addresses) => {
      if (err || !addresses || addresses.length === 0) {
        (originalLookup as Function)(hostname, options, callback);
        return;
      }
      if (isAll) {
        callback(null, [{ address: addresses[0], family: 4 }]);
      } else {
        callback(null, addresses[0], 4);
      }
    });
    return;
  }
  (originalLookup as Function)(hostname, options, callback);
};


dotenv.config({ path: path.resolve(process.cwd(), ".env") });

async function run() {
  const provider = new MangaDexProvider();
  
  console.log("Testing MangaDex Provider health check...");
  const health = await provider.healthCheck();
  console.log("Health Check Result:", JSON.stringify(health, null, 2));

  console.log("\nTesting MangaDex search for 'Frieren'...");
  try {
    const results = await provider.searchManga("Frieren");
    console.log(`Search returned ${results.length} results.`);
    if (results.length > 0) {
      console.log("First result detail:", {
        id: results[0].id,
        title: results[0].title,
        coverImage: results[0].coverImage,
        genres: results[0].genres,
        authors: results[0].authors,
        year: results[0].year,
      });

      console.log(`\nFetching chapters for manga ID ${results[0].id}...`);
      const chapters = await provider.getChapters(results[0].id);
      console.log(`Chapters fetched: ${chapters.length}`);
      if (chapters.length > 0) {
        console.log("First few chapters:", chapters.slice(0, 3).map(c => ({
          id: c.id,
          number: c.number,
          title: c.title,
          language: c.language,
          pageCount: c.pageCount
        })));
        
        console.log(`\nFetching pages for chapter ID ${chapters[0].id}...`);
        const pages = await provider.getChapterPages(chapters[0].id);
        console.log(`Pages fetched: ${pages.length}`);
        console.log("First 3 page URLs:", pages.slice(0, 3));
      }
    }
  } catch (err: any) {
    console.error("MangaDex provider test failed:", err);
  }
}

run();
