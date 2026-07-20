# Testing Guide

```text
Document Version: 1.0
Last Updated: 2026-07-16
Status: Active Guide
```

This guide explains how to construct, execute, and verify unit tests, scraper checks, and E2E regression pipelines.

---

## 1. Directory Layout

All tests reside under the `tests/` directory:

```text
tests/
├── fixtures/        # Mock HTML responses per provider
│   ├── webtoon/
│   └── mangabuddy/
├── unit/            # Isolated unit tests for utility functions/mappers
├── integration/     # Integration checks for providers and database syncs
└── regression/      # End-to-End user path checks
```

---

## 2. Scraper Fixtures & Mocking

Since external websites shift layout, parsers must be tested against saved HTML pages. This guarantees we can differentiate between code regression and design updates.

### Creating a Fixture:
1. Fetch the raw HTML of a target page.
2. Save it under `tests/fixtures/<provider_id>/<page_name>.html`.
3. Load and feed this string to the parser in unit tests:

```typescript
import * as fs from "fs";
import * as path from "path";
import { ExampleParser } from "@/services/providers/example/parser";

describe("Example Parser Tests", () => {
  const parser = new ExampleParser();

  it("should parse manga metadata correctly", () => {
    const filePath = path.resolve(__dirname, "../../fixtures/example/manga_detail.html");
    const html = fs.readFileSync(filePath, "utf-8");
    const result = parser.parseManga(html);

    expect(result.title).toBe("Target Manga Title");
    expect(result.coverUrl).toContain("cover.jpg");
  });
});
```

---

## 3. Running Scraper Tests

Use the CLI script structure to verify live scraper connections:

```bash
npx tsx scripts/test-<provider_id>.ts
```

These scripts run assertions on:
- Search results count.
- Metadata integrity.
- Page index matches.
- Image proxy fetch compatibility.

---

## 4. End-to-End Regression Testing

To verify the complete ingestion flow (Provider → Parser → Mapping → Aggregation → Database), run:

```bash
npm run test:e2e
```

This ensures duplicates are resolved, metadata merged cleanly, and caches cleared on updates.
