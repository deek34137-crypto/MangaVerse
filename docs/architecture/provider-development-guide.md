# Provider Development Guide

Version: 1.2  
Last Updated: 2026-07-22  
Related Phase: Phase 1 & Phase 2  
Related Components:  
- BaseProvider  
- ProviderManifest  
- ProviderMetricsCollector  
- ProviderSnapshotWriter  

This guide details how to implement, version, test, and register a new provider plugin in the MangaHub platform. Every future provider should follow exactly the specifications and checklists laid out in this document.

---

## 1. Folder Structure

Every new provider must reside in its own folder under `src/services/providers/<provider_id>/` and contain the following file structure:

```text
src/services/providers/<provider_id>/
├── constants.ts     # Static metadata, config, network settings, and selectors
├── parser.ts        # Cheerio HTML parser or API parser implementing ProviderParser
├── client.ts        # Fetch client invoking the shared Transport
├── mapping.ts       # Normalization of parsed objects to raw provider models
├── provider.json    # Manifest declaring metadata and capabilities (validated via Zod)
├── provider.ts      # Main class extending BaseProvider
└── index.ts         # Export config, metadata, and provider instance
```

---

## 2. BaseProvider SDK Class

To prevent duplicate boilerplate across scrapers, all new provider classes extend the `BaseProvider` abstract base class, which wires up the shared `Transport` layer, rolling metrics collector, debug snapshot recorder, and confidence scoring automatically:

```typescript
import {
  IMangaProvider, ProviderCapabilities, ProviderConfig,
  RawProviderManga, RawProviderChapter, RawProviderPage,
  ProviderHealth
} from "../shared/types";
import { Transport } from "../shared/transport/transport";
import { ProviderManifestInput } from "../shared/base-provider";

export abstract class BaseProvider implements IMangaProvider {
  public abstract readonly name: string;
  public abstract readonly version: string;

  protected readonly transport: Transport;

  constructor(
    manifestOrConfig: ProviderManifestInput | ProviderConfig,
    public readonly capabilities: ProviderCapabilities
  ) {
    // Shared Transport, ProviderMetricsCollector, and ProviderSnapshotWriter initialized automatically
  }

  protected request(url: string, options?: RequestInit) {
    return this.transport.requestText(url, options);
  }

  /** Called by provider implementations after parsing a response to record data quality. */
  protected recordConfidenceSample(
    titlePresent: boolean,
    imageUrlValid: boolean,
    chapterNumberValid: boolean
  ): void;

  abstract searchManga(query: string, options?: Record<string, unknown>): Promise<RawProviderManga[]>;
  abstract getMangaDetail(providerMangaId: string): Promise<RawProviderManga>;
  abstract getChapters(providerMangaId: string): Promise<RawProviderChapter[]>;
  abstract getChapterPages(providerChapterId: string): Promise<RawProviderPage[]>;
  abstract healthCheck(): Promise<ProviderHealth>;
}
```

---

## 3. Scaffolding CLI Command

To add a new provider with standard boilerplate, use the generator command:

```bash
npm run generate:provider <provider_id>
```

This automatically scaffolds:
- The provider directory containing stubbed files (`provider.json`, `provider.ts`, `parser.ts`, `client.ts`, `mapping.ts`, `index.ts`).
- The fixture path under `tests/fixtures/<provider_id>/`.
- The testing file `scripts/test-<provider_id>.ts`.

---

## 4. Provider Manifest (`provider.json`) & Capabilities

Every provider must include a `provider.json` file in its root module directory, validated by Zod at registration time:

```json
{
  "manifestSchemaVersion": "1.0",
  "id": "mangatoon",
  "displayName": "MangaToon",
  "providerVersion": "1.0.0",
  "priority": 4,
  "baseUrl": "https://mangatoon.mobi",
  "network": {
    "timeoutMs": 8000,
    "retries": 3,
    "rateLimit": {
      "maxRequests": 10,
      "intervalMs": 1000
    }
  },
  "cache": {
    "ttlSearchMs": 300000,
    "ttlMangaMs": 3600000,
    "ttlChaptersMs": 1800000,
    "ttlPagesMs": 86400000
  },
  "capabilities": {
    "search": true,
    "latest": true,
    "trending": false,
    "merge": true,
    "reader": true
  },
  "enabled": true
}
```

---

## 5. Provider Limitations

Every provider has quirks or weird behavior. Document these clearly in the provider's codebase or documentation so future maintainers immediately understand why logic may look unusual.

Example list to maintain in the provider's module:
- Search limited to 20 results per page.
- No latest updates endpoint provided by source API.
- Official translations only; no fan scanlations.
- Requires `Referer` header to fetch pages.
- Viewer pages require a placeholder slug segment.
- Chapter numbering resets every season.

---

## 6. Versioning Strategy (Provider vs. Parser)

Distinguish between changes to HTTP client routes and changes to HTML parsing. Track versions independently:

* **providerVersion**: Tracks logic changes in the client, API structures, or base network behaviors.
* **parserVersion**: Tracks the parsing code itself. If the host site modifies its HTML layout, update the selectors/parsers and increment `parserVersion++` while leaving `providerVersion` unchanged.

---

## 7. DOM Drift Detection

When site layouts drift and selectors fail to yield data, scrapers must fail loudly and informatively. Instead of throwing simple error strings, throw a structured `ParsingFailure` detailing the context:

```typescript
throw new ParsingFailure({
  provider: "webtoon",
  page: "detail",
  selector: SELECTORS.DETAIL.title,
  url,
  message: "Title selector missing"
});
```

This makes fixing selector breakages take minutes rather than hours.

---

## 8. Golden Dataset

Probes and integration tests must not perform random searches. Establish a stable, static ID mapping for exactly one canonical manga per provider that is guaranteed to exist.

* **WEBTOON**: `fantasy:tower-of-god:95`
* **MangaDex**: `32feade8-3c8e-4770-ac22-de9ef016c277` (One Piece)
* **ComicK**: `00-one-piece`
* **MangaKatana**: `solo-leveling.21147`

---

## 9. Parser Fixtures & Output Testing

Do not limit parser tests to simply asserting `results.length > 0`. Save the expected JSON output alongside your static HTML snapshots under `tests/fixtures/<provider_id>/`:

```text
fixtures/
├── search.html
├── search.expected.json
├── detail.html
├── detail.expected.json
├── chapters.html
├── chapters.expected.json
```

Parser unit tests must load the HTML, run the parser, and perform deep equality checks against the `.expected.json` file. This catches subtle parsing regressions.

---

## 10. Provider Scoring & Health Lifecycle

Calculate dynamic runtime provider score based on rolling 15-minute metrics and 5-state health lifecycle (`ONLINE | DEGRADED | RATE_LIMITED | BLOCKED | OFFLINE`):

$$\text{ProviderScore} = \text{priority} + \text{confidence} + \text{health} + \text{latency}$$

* **priority**: Static importance configured in `provider.json`.
* **confidence**: Runtime data quality confidence score (0 to 1) computed from `recordConfidenceSample()`.
* **health**: Operational health classification (`ONLINE`, `DEGRADED`, etc.).
* **latency**: Observed network performance from rolling 15-minute metric windows.

---

## 11. Failure Classification

Categorize errors strictly to help administrative dashboards summarize operational issues:

- `NETWORK`: Failed HTTP requests, DNS resolution issues, or transport drops.
- `TIMEOUT`: Host did not respond within the allocated timeout period.
- `RATE_LIMIT`: Rate limit headers or HTTP 429 received.
- `BLOCKED`: Host returned HTTP 403, Cloudflare challenges, or bot detection walls.
- `PARSER`: Selectors yielded empty data or malformed tags due to DOM drift.
- `INVALID_DATA`: Parsed values failed Zod model validations.
- `NOT_FOUND`: Resource missing or host returned HTTP 404.
- `UNSUPPORTED`: Requested capability not supported by this provider.

---

## 12. Canonical Mapping Rules

Every mapper implementation must strictly transform external data into standard, normalized formats:

- **Genres**: Lowercase, trimmed, mapped to canonical names.
- **Languages**: ISO 639-1 two-letter codes (e.g., `en`, `ja`).
- **Status**: Standardized to `ongoing` | `completed` | `hiatus` | `cancelled`.
- **Dates**: Formatted as UTC ISO strings.
- **Numbers**: Numbers (such as chapter indices) must be numeric, not strings.
- **Titles**: Trimmed of extra whitespace and brackets.
- **Images**: Verified as fully qualified absolute URLs.
- **Descriptions**: Stripped of inline HTML markup or raw BBCode.

---

## 13. Data Quality Checklist

Mappers must validate each object against this quality checklist before returning data to the merge engine:

- [ ] `title` is non-empty and present.
- [ ] `coverImage` is a valid absolute URL.
- [ ] `id` contains all routing parameters.
- [ ] `chapters` list contains valid index numbers.
- [ ] `pages` array contains only absolute image links.
- [ ] `language` matches a valid ISO country code.
- [ ] `status` contains a valid enum value.
- [ ] No duplicate chapters exist in lists.
- [ ] No duplicate image URLs exist in pages.

---

## 14. Provider Certification Checklist

Before merging any scraper branch into the main production branch, it must pass the 9 standardized certification checks (`scripts/test-provider-suite.ts`):

- [ ] **1. Manifest Validation**: `provider.json` passes Zod manifest schema checks.
- [ ] **2. Functional Searches**: Search query successfully returns matching catalogs.
- [ ] **3. Manga Details**: Metadata (title, description, cover image) parses completely.
- [ ] **4. Chapter Indexes**: Returns a list of active chapters matching source indices.
- [ ] **5. Pages List**: Chapter pages return valid image arrays with no blank placeholders.
- [ ] **6. SSRF & Image Proxy Checks**: Proxy loads images and appends headers without error.
- [ ] **7. Health Check**: `healthCheck()` reports correct states and latencies.
- [ ] **8. Fixtures & Expected Outputs**: HTML mock pages and `.expected.json` files recorded.
- [ ] **9. Linter & Typings**: No TS compilation issues (`npx tsc --noEmit`) or ESLint warnings.
