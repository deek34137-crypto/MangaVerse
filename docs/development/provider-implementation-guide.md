# Provider Implementation Guide

```text
Document Version: 1.0
Last Updated: 2026-07-19
Status: Active Guide / Checklist
```

This guide details the standard, step-by-step procedure for adding a new manga or comic provider to MangaHub. Every provider must follow this implementation guide to ensure codebase consistency, maintainability, and clean separation of concerns.

---

## Guiding Principles

1. **Strict Separation of Concerns (SRP)**: Do not mix HTTP fetching, DOM selection, HTML parsing, and data mapping. Keep them in separate modules.
2. **Future-Proofing (Robust Parsing)**: Parse intermediate raw shapes from HTML that capture extra data attributes. This isolates parser updates when site HTML changes, without affecting mapping logic.
3. **Stateless ID Mapping**: Design provider IDs to contain all routing tokens needed to build absolute resource URLs. For example, if a provider requires both a slug and a title number to access a detail page, encode both in the ID: `{genre}:{slug}:{titleNo}`.
4. **Resiliency**: Wrap all network traffic in the shared [Transport](file:///c:/Users/kumku/MangaHub/mangahub/src/services/providers/shared/transport/transport.ts) class to automatically benefit from retries, rate limiting, and circuit breakers.

---

## Directory Layout

All provider logic is self-contained. Create a new directory under `src/services/providers/` named after your provider.

```text
src/services/providers/[provider-id]/
├── client.ts         # HTTP Client wrapper (defines routes, headers, caches responses)
├── constants.ts      # Scraper constants (Base URL, default headers, cache TTLs)
├── index.ts          # Re-exports the main Provider class
├── mapping.ts        # Maps intermediate shapes to standard RawProvider shapes
├── parser.ts         # Extracts data from HTML using cheerio and selectors
├── provider.json     # JSON Manifest specifying configuration and capabilities
├── provider.ts       # Subclass of BaseProvider implementing IMangaProvider
└── selectors.ts      # CSS selectors for DOM traversal

scripts/
├── probe-[provider-id].ts                 # Live integration check script
└── test-[provider-id]-parser.ts           # Offline parser unit tests

tests/fixtures/[provider-id]/              # Saved HTML snapshots for offline tests
├── search.html
├── detail.html
├── chapters.html
└── pages.html
```

---

## Step-by-Step Implementation

### Step 1: Create the Manifest (`provider.json`)
Every provider must declare its metadata, network rules, capabilities, and cache TTL configurations in a `provider.json` file.

> [!NOTE]
> The Zod schema validating this manifest is located in [manifest-schema.ts](file:///c:/Users/kumku/MangaHub/mangahub/src/services/providers/shared/manifest-schema.ts).

Create `src/services/providers/[provider-id]/provider.json`:
```json
{
  "manifestSchemaVersion": "1.0",
  "id": "myprovider",
  "displayName": "My Provider",
  "providerVersion": "1.0.0",
  "priority": 5,
  "baseUrl": "https://www.myprovider.com",
  "network": {
    "timeoutMs": 12000,
    "retries": 2,
    "rateLimit": {
      "maxRequests": 2,
      "intervalMs": 1000
    }
  },
  "cache": {
    "ttlSearchMs": 300000,
    "ttlMangaMs": 86400000,
    "ttlChaptersMs": 1800000,
    "ttlPagesMs": 86400000
  },
  "capabilities": {
    "search": true,
    "latest": false,
    "trending": false,
    "merge": true,
    "reader": true
  },
  "enabled": true
}
```

---

### Step 2: Establish Constants (`constants.ts`)
Define base URLs, common scrape headers, and fallback cache lifetimes.

Create `src/services/providers/[provider-id]/constants.ts`:
```typescript
export const BASE_URL = "https://www.myprovider.com";

export const BASE_HEADERS: Record<string, string> = {
  "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
  "Referer": "https://www.myprovider.com/",
  "Accept-Language": "en-US,en;q=0.9",
};

export const CACHE_TTL = {
  SEARCH: 5 * 60 * 1000,        // 5 mins
  DETAIL: 24 * 60 * 60 * 1000,   // 24 hours
  CHAPTERS: 30 * 60 * 1000,     // 30 mins
  PAGES: 24 * 60 * 60 * 1000,    // 24 hours
} as const;
```

---

### Step 3: Define Selectors (`selectors.ts`)
Store all CSS selectors in a single file, grouped logically by page type. This simplifies maintenance when the source website updates its DOM markup.

Create `src/services/providers/[provider-id]/selectors.ts`:
```typescript
export const SELECTORS = {
  SEARCH: {
    card: "div.manga-card",
    title: "h3.title",
    cover: "img.lazy-load",
    link: "a.manga-link",
  },
  DETAIL: {
    title: "h1.entry-title",
    author: "span.author-name",
    description: "div.synopsis",
    cover: "div.poster img",
    genres: "span.genre-tag",
  },
  EPISODES: {
    list: "ul.chapter-list",
    item: "li.chapter-item",
    link: "a.chapter-link",
    date: "span.chapter-date",
  },
  VIEWER: {
    container: "div.reader-images",
    image: "img.page-img",
  },
} as const;
```

---

### Step 4: Write the DOM Parser (`parser.ts`)
The parser consumes raw HTML, loads it into `cheerio`, and extracts intermediate "Raw Parsed" shapes.

> [!IMPORTANT]
> The parser must focus strictly on DOM querying. Avoid converting custom IDs, formatting dates, or doing deep business logic mappings here. If a parser fails to locate a critical element, throw a `ParsingFailure` (imported from [transport](file:///c:/Users/kumku/MangaHub/mangahub/src/services/providers/transport.ts)).

Create `src/services/providers/[provider-id]/parser.ts`:
```typescript
import * as cheerio from "cheerio";
import { SELECTORS } from "./selectors";
import { ParsingFailure } from "../transport";

export interface RawParsedSearchItem {
  id: string;
  title: string;
  coverUrl: string;
  linkUrl: string;
}

export interface RawParsedDetail {
  title: string;
  author: string;
  description: string;
  coverUrl: string;
  genres: string[];
}

export interface RawParsedEpisode {
  chapterNo: string;
  title: string;
  url: string;
  dateText: string;
}

export class MyProviderParser {
  public parseSearch(html: string): RawParsedSearchItem[] {
    const $ = cheerio.load(html);
    const results: RawParsedSearchItem[] = [];

    $(SELECTORS.SEARCH.card).each((_, el) => {
      const card = $(el);
      const title = card.find(SELECTORS.SEARCH.title).text().trim();
      const coverUrl = card.find(SELECTORS.SEARCH.cover).attr("src") ?? "";
      const linkUrl = card.find(SELECTORS.SEARCH.link).attr("href") ?? "";
      const id = card.attr("data-id") ?? "";

      if (title && id) {
        results.push({ id, title, coverUrl, linkUrl });
      }
    });
    return results;
  }

  public parseDetail(html: string): RawParsedDetail {
    const $ = cheerio.load(html);
    const title = $(SELECTORS.DETAIL.title).text().trim();
    if (!title) {
      throw new ParsingFailure("MyProvider", "Failed to parse title from detail page");
    }

    const author = $(SELECTORS.DETAIL.author).text().trim();
    const description = $(SELECTORS.DETAIL.description).text().trim();
    const coverUrl = $(SELECTORS.DETAIL.cover).attr("src") ?? "";
    const genres: string[] = [];
    $(SELECTORS.DETAIL.genres).each((_, el) => {
      genres.push($(el).text().trim());
    });

    return { title, author, description, coverUrl, genres };
  }

  public parseEpisodes(html: string): RawParsedEpisode[] {
    const $ = cheerio.load(html);
    const episodes: RawParsedEpisode[] = [];

    $(SELECTORS.EPISODES.list).find(SELECTORS.EPISODES.item).each((_, el) => {
      const item = $(el);
      const anchor = item.find(SELECTORS.EPISODES.link);
      const title = anchor.text().trim();
      const url = anchor.attr("href") ?? "";
      const chapterNo = item.attr("data-num") ?? "";
      const dateText = item.find(SELECTORS.EPISODES.date).text().trim();

      if (chapterNo && url) {
        episodes.push({ chapterNo, title, url, dateText });
      }
    });

    return episodes;
  }

  public parsePages(html: string): string[] {
    const $ = cheerio.load(html);
    const pages: string[] = [];

    $(SELECTORS.VIEWER.container).find(SELECTORS.VIEWER.image).each((_, el) => {
      const src = $(el).attr("data-src") || $(el).attr("src");
      if (src) pages.push(src);
    });

    if (pages.length === 0) {
      throw new ParsingFailure("MyProvider", "Failed to parse images from chapter reader");
    }

    return pages;
  }
}
```

---

### Step 5: Implement the Mapper (`mapping.ts`)
Mappers transform intermediate "raw parsed" data structures into unified schema models: `RawProviderManga`, `RawProviderChapter`, and `RawProviderPage` from [types.ts](file:///c:/Users/kumku/MangaHub/mangahub/src/services/providers/shared/types.ts).

#### Design Custom ID Parsers
Since providers must operate statelessly, define helper functions that encode and parse the provider's composite IDs.
* Format: `{genre}:{slug}:{id}`
* The mapper is responsible for parsing these IDs to rebuild URLs for detail views, chapter fetching, or reader pages.

Create `src/services/providers/[provider-id]/mapping.ts`:
```typescript
import type { RawProviderManga, RawProviderChapter, RawProviderPage } from "../types";
import type { RawParsedSearchItem, RawParsedDetail, RawParsedEpisode } from "./parser";

export function parseProviderId(id: string) {
  const parts = id.split(":");
  if (parts.length < 2) {
    throw new Error(`MyProvider: invalid ID format: "${id}"`);
  }
  return { slug: parts[0], titleId: parts[1] };
}

export class MyProviderMapper {
  public static mapSearchItem(item: RawParsedSearchItem): RawProviderManga {
    // Extract slug from URL if needed
    const slugMatch = item.linkUrl.match(/\/series\/([^/]+)/);
    const slug = slugMatch ? slugMatch[1] : "";
    const compoundId = `${slug}:${item.id}`;

    return {
      id: compoundId,
      title: item.title,
      coverImage: item.coverUrl,
      status: "ongoing",
      type: "manga",
      rawMetadata: { slug, originalId: item.id },
    };
  }

  public static mapDetail(compoundId: string, item: RawParsedDetail): RawProviderManga {
    const { slug, titleId } = parseProviderId(compoundId);
    return {
      id: compoundId,
      title: item.title,
      description: item.description,
      coverImage: item.coverUrl,
      authors: item.author ? [item.author] : [],
      genres: item.genres.map(g => this.normalizeGenre(g)),
      status: "ongoing",
      type: "manga",
      rawMetadata: { slug, titleId },
    };
  }

  public static mapEpisode(seriesId: string, ep: RawParsedEpisode): RawProviderChapter {
    const chapterNum = parseFloat(ep.chapterNo);
    return {
      id: `${seriesId}:${ep.chapterNo}`,
      number: isNaN(chapterNum) ? null : chapterNum,
      title: ep.title,
      language: "en",
      displayNumber: ep.chapterNo,
      publishedAt: ep.dateText ? new Date(ep.dateText) : new Date(),
      scanlatorGroups: ["MyProvider"],
      rawMetadata: { url: ep.url },
    };
  }

  public static mapPages(urls: string[]): RawProviderPage[] {
    return urls.map((url, idx) => ({
      number: idx + 1,
      url,
    }));
  }

  private static normalizeGenre(genre: string): string {
    return genre.trim().toLowerCase().replace(/(^\w|\s\w)/g, m => m.toUpperCase());
  }
}
```

---

### Step 6: Create the Client (`client.ts`)
The client encapsulates network calls using the shared `Transport` class. It manages caching, user-agents, referers, and query constructions.

Create `src/services/providers/[provider-id]/client.ts`:
```typescript
import { Transport } from "../transport";
import { BASE_URL, BASE_HEADERS, CACHE_TTL } from "./constants";
import { cacheGet, cacheSet } from "@/services/cache";

export class MyProviderClient {
  private transport: Transport;

  constructor() {
    this.transport = new Transport({
      providerName: "MyProvider",
      timeoutMs: 12000,
      retries: 2,
      backoffMs: 2000,
      circuitBreaker: { failureThreshold: 4, cooldownMs: 60000 },
      rateLimit: { maxRequests: 2, intervalMs: 1000 },
    });
  }

  public async fetchSearch(query: string): Promise<string> {
    const cacheKey = `myprovider:search:${query.toLowerCase().trim()}`;
    const cached = await cacheGet<string>(cacheKey);
    if (cached) return cached;

    const url = `${BASE_URL}/search?q=${encodeURIComponent(query)}`;
    const html = await this.transport.requestText(url, { headers: BASE_HEADERS });
    await cacheSet(cacheKey, html, CACHE_TTL.SEARCH);
    return html;
  }

  public async fetchDetail(slug: string, titleId: string): Promise<string> {
    const cacheKey = `myprovider:detail:${titleId}`;
    const cached = await cacheGet<string>(cacheKey);
    if (cached) return cached;

    const url = `${BASE_URL}/series/${slug}-${titleId}`;
    const html = await this.transport.requestText(url, { headers: BASE_HEADERS });
    await cacheSet(cacheKey, html, CACHE_TTL.DETAIL);
    return html;
  }

  public async fetchChapters(slug: string, titleId: string): Promise<string> {
    const cacheKey = `myprovider:chapters:${titleId}`;
    const cached = await cacheGet<string>(cacheKey);
    if (cached) return cached;

    const url = `${BASE_URL}/series/${slug}-${titleId}/chapters`;
    const html = await this.transport.requestText(url, { headers: BASE_HEADERS });
    await cacheSet(cacheKey, html, CACHE_TTL.CHAPTERS);
    return html;
  }

  public async fetchPages(chapterUrl: string, chapterId: string): Promise<string> {
    const cacheKey = `myprovider:pages:${chapterId}`;
    const cached = await cacheGet<string>(cacheKey);
    if (cached) return cached;

    const html = await this.transport.requestText(chapterUrl, { headers: BASE_HEADERS });
    await cacheSet(cacheKey, html, CACHE_TTL.PAGES);
    return html;
  }

  public async pingBase(): Promise<string> {
    return this.transport.requestText(BASE_URL, { headers: BASE_HEADERS });
  }
}
```

---

### Step 7: Define the Provider Class (`provider.ts`)
Assemble the client, parser, and mapper inside a provider class extending the abstract `BaseProvider`.

Create `src/services/providers/[provider-id]/provider.ts`:
```typescript
import { BaseProvider } from "../shared/base-provider";
import {
  ProviderCapabilities,
  ProviderHealth,
  RawProviderManga,
  RawProviderChapter,
  RawProviderPage,
  SearchOptions,
} from "../shared/types";
import { MyProviderClient } from "./client";
import { MyProviderParser } from "./parser";
import { MyProviderMapper, parseProviderId } from "./mapping";
import manifest from "./provider.json";

export class MyProviderProvider extends BaseProvider {
  public readonly name = "MyProvider";
  public readonly version = manifest.providerVersion;

  private client: MyProviderClient;
  private parser: MyProviderParser;

  constructor() {
    const capabilities: ProviderCapabilities = {
      search: manifest.capabilities.search,
      latest: manifest.capabilities.latest,
      trending: manifest.capabilities.trending,
      merge: manifest.capabilities.merge,
      reader: manifest.capabilities.reader,
    };
    super(manifest, capabilities);

    this.client = new MyProviderClient();
    this.parser = new MyProviderParser();
  }

  public async searchManga(query: string, options?: SearchOptions): Promise<RawProviderManga[]> {
    const html = await this.client.fetchSearch(query);
    const parsed = this.parser.parseSearch(html);
    const items = options?.limit ? parsed.slice(0, options.limit) : parsed;
    return items.map(item => MyProviderMapper.mapSearchItem(item));
  }

  public async getMangaDetail(providerMangaId: string): Promise<RawProviderManga> {
    const { slug, titleId } = parseProviderId(providerMangaId);
    const html = await this.client.fetchDetail(slug, titleId);
    const detail = this.parser.parseDetail(html);
    return MyProviderMapper.mapDetail(providerMangaId, detail);
  }

  public async getChapters(providerMangaId: string): Promise<RawProviderChapter[]> {
    const { slug, titleId } = parseProviderId(providerMangaId);
    const html = await this.client.fetchChapters(slug, titleId);
    const episodes = this.parser.parseEpisodes(html);
    
    // Providers expect chapters returned in ascending order
    const ascending = episodes.reverse();
    return ascending.map(ep => MyProviderMapper.mapEpisode(providerMangaId, ep));
  }

  public async getChapterPages(providerChapterId: string): Promise<RawProviderPage[]> {
    // Expected ID: "slug:titleId:chapterNo"
    const parts = providerChapterId.split(":");
    const slug = parts[0];
    const titleId = parts[1];
    const chapterNo = parts[2];

    // Read full details to get correct chapter URL (or construct via state if possible)
    const chapters = await this.getChapters(`${slug}:${titleId}`);
    const targetChapter = chapters.find(c => c.displayNumber === chapterNo);
    if (!targetChapter || !targetChapter.rawMetadata?.url) {
      throw new Error(`MyProvider: chapter ${chapterNo} not found or missing source URL`);
    }

    const html = await this.client.fetchPages(targetChapter.rawMetadata.url, providerChapterId);
    const pageUrls = this.parser.parsePages(html);
    return MyProviderMapper.mapPages(pageUrls);
  }

  public async healthCheck(): Promise<ProviderHealth> {
    const start = Date.now();
    try {
      await this.client.pingBase();
      return {
        status: "ONLINE",
        latencyMs: Date.now() - start,
        lastSuccessAt: new Date(),
        errorRate: 0,
        consecutiveFailures: 0,
      };
    } catch {
      return {
        status: "OFFLINE",
        latencyMs: Date.now() - start,
        lastSuccessAt: new Date(0),
        errorRate: 1.0,
        consecutiveFailures: 1,
      };
    }
  }
}
```

Create an exports file in `src/services/providers/[provider-id]/index.ts`:
```typescript
export { MyProviderProvider } from "./provider";
```

---

### Step 8: Register the Provider
Hook your new provider into the system's registry index.

Modify [src/services/providers/index.ts](file:///c:/Users/kumku/MangaHub/mangahub/src/services/providers/index.ts):
```typescript
import { providerRegistry } from "./registry";
import { MyProviderProvider } from "./myprovider"; // Import new provider

// Register providers with their factories for lazy loading
providerRegistry.register("myprovider", () => new MyProviderProvider());
```

---

## Testing & Verification Checklist

To maintain high data quality, every new provider requires both **Offline Unit Tests** using static HTML snapshots (fixtures) and a **Live Probe Script** executing real network operations.

### 1. Offline Parser Unit Tests (`test-[provider-id]-parser.ts`)
Unit tests verify that your DOM parsing logic survives package upgrades and successfully extracts tags when offline.

#### Capture HTML Fixtures
Save live HTML pages under `tests/fixtures/[provider-id]/`:
* `search.html`: Query search output page containing expected cards.
* `detail.html`: Series detail landing page.
* `chapters.html`: Series chapter table or list component.
* `pages.html`: Reader container showing loaded page images.

#### Implement Parser Test Runner
Create `scripts/test-[provider-id]-parser.ts` to execute locally against static file streams:
```typescript
import * as fs from "fs";
import * as path from "path";
import { MyProviderParser } from "../src/services/providers/myprovider/parser";

const FIXTURES_DIR = path.join(__dirname, "../tests/fixtures/myprovider");

async function runParserTests() {
  console.log("=== Running MyProvider Fixture Parser Tests ===");
  const parser = new MyProviderParser();

  // 1. Search Parser
  const searchHtml = fs.readFileSync(path.join(FIXTURES_DIR, "search.html"), "utf-8");
  const searchItems = parser.parseSearch(searchHtml);
  console.log(`Parsed ${searchItems.length} search items.`);
  if (searchItems.length === 0) throw new Error("FAIL: Search parsed 0 items");

  // 2. Detail Parser
  const detailHtml = fs.readFileSync(path.join(FIXTURES_DIR, "detail.html"), "utf-8");
  const detail = parser.parseDetail(detailHtml);
  console.log(`Parsed series detail: "${detail.title}" by "${detail.author}"`);
  if (!detail.title) throw new Error("FAIL: Title missing");

  // 3. Chapters Parser
  const chaptersHtml = fs.readFileSync(path.join(FIXTURES_DIR, "chapters.html"), "utf-8");
  const chapters = parser.parseEpisodes(chaptersHtml);
  console.log(`Parsed ${chapters.length} chapters.`);
  if (chapters.length === 0) throw new Error("FAIL: Chapters list is empty");

  // 4. Pages Parser
  const pagesHtml = fs.readFileSync(path.join(FIXTURES_DIR, "pages.html"), "utf-8");
  const pages = parser.parsePages(pagesHtml);
  console.log(`Parsed ${pages.length} page URLs.`);
  if (pages.length === 0) throw new Error("FAIL: Pages list is empty");

  console.log("=== ALL PARSER TESTS PASSED SUCCESSFULLY! ===");
}

runParserTests().catch(err => {
  console.error("Test execution failed:", err);
  process.exit(1);
});
```

---

### 2. Live Probe Integration (`probe-[provider-id].ts`)
Probe scripts are end-to-end sanity tests executing real requests. They confirm the target website has not introduced bot challenges or updated its endpoint layouts.

Create `scripts/probe-[provider-id].ts`:
```typescript
import { MyProviderProvider } from "@/services/providers/myprovider/provider";

const CANONICAL_TEST_ID = "one-piece:12345"; // Seed with a known stable series

async function main() {
  const provider = new MyProviderProvider();
  let failed = 0;

  function ok(label: string) {
    console.log(`  ✅ ${label}`);
  }
  function fail(label: string, reason: string) {
    console.error(`  ❌ ${label}: ${reason}`);
    failed++;
  }

  // 1. Live Search Check
  console.log("\n[1] Testing Search...");
  try {
    const results = await provider.searchManga("One Piece", { limit: 1 });
    results.length > 0 ? ok(`Search: found ${results[0].title}`) : fail("Search", "0 results");
  } catch (e) {
    fail("Search", String(e));
  }

  // 2. Live Detail Check
  console.log("\n[2] Testing Manga Detail...");
  try {
    const detail = await provider.getMangaDetail(CANONICAL_TEST_ID);
    detail.title ? ok(`Detail: "${detail.title}"`) : fail("Detail", "Title empty");
  } catch (e) {
    fail("Detail", String(e));
  }

  // 3. Live Chapters Check
  console.log("\n[3] Testing Chapters List...");
  try {
    const chapters = await provider.getChapters(CANONICAL_TEST_ID);
    chapters.length > 0 ? ok(`Chapters: parsed ${chapters.length} items`) : fail("Chapters", "0 items");
  } catch (e) {
    fail("Chapters", String(e));
  }

  // 4. Live Pages Check
  console.log("\n[4] Testing Chapter Pages Reader...");
  try {
    const pages = await provider.getChapterPages(`${CANONICAL_TEST_ID}:1`);
    pages.length > 0 ? ok(`Pages: parsed ${pages.length} URLs`) : fail("Pages", "0 URLs");
  } catch (e) {
    fail("Pages", String(e));
  }

  // 5. Health Check
  console.log("\n[5] Testing Health Check...");
  try {
    const health = await provider.healthCheck();
    health.status === "ONLINE" ? ok("Health: ONLINE") : fail("Health", health.status);
  } catch (e) {
    fail("Health", String(e));
  }

  if (failed > 0) {
    console.log(`\n❌ Integration failures found: ${failed}`);
    process.exit(1);
  } else {
    console.log("\n✅ Provider check completed successfully.");
    process.exit(0);
  }
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
```

Execute your live integration test using:
```bash
npx tsx scripts/probe-[provider-id].ts
```

---

## Pull Request checklist

Before filing a Pull Request for a new provider, verify all checklist entries:

- [ ] Directory layout matches the schema pattern exactly.
- [ ] No `any` types used. Interfaces declare specific fields.
- [ ] Zod schema is satisfied by `provider.json`.
- [ ] No network requests bypass the shared `Transport` (no raw `axios`, `fetch`, etc.).
- [ ] Selectors are fully isolated within `selectors.ts`.
- [ ] Static HTML fixture files reside in `tests/fixtures/`.
- [ ] `npm run lint` yields no warnings.
- [ ] `npx tsx scripts/test-[provider-id]-parser.ts` runs offline and passes.
- [ ] `npx tsx scripts/probe-[provider-id].ts` returns `0` exit code.
