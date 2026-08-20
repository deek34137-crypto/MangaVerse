# MangaHub Cloudflare Worker Backend

An edge-native, high-performance manga aggregator platform built on **Cloudflare Workers** with **Hono**.

## Features

- **Edge-Native**: 100% pure Web APIs (`fetch`, `cheerio`, `AbortController`) running on Cloudflare Workers with global low latency.
- **Certified Provider Adapters**:
  - **Tier 1 (Core)**: WeebCentral, MangaKatana, MangaDex, ComicK, AsuraScans, FlameComics, MGeko.
  - **Tier 2 (Secondary)**: Bato, MangaRead, DemonicScans, KaliScan, WEBTOON, NovelCool.
- **Bounded Search Aggregation**: Parallel worker pool (max 4 concurrent) querying Tier 1 sources first, with layered identity deduplication to prevent false merges.
- **Normalized Reader Streaming**: Strict `ChapterPage` schema with provider-scoped reader headers.
- **SSRF-Hardened Image Proxy**: Validates target image URLs against certified provider `ProviderNetworkPolicy` domain allowlists and blocks all private/internal IP ranges.
- **Automated Contract Certification Suite**: 100+ contract tests verifying runtime execution, URL parsing, SSRF blocking, chapter numbering, and health monitoring.

---

## API Endpoints

### 1. `GET /api/sources`
List all certified providers and their capabilities.

**Response:**
```json
{
  "sources": [
    {
      "id": "weebcentral",
      "name": "WeebCentral",
      "baseUrl": "https://weebcentral.com",
      "tier": 1,
      "capabilities": {
        "search": true,
        "mangaDetail": true,
        "chapters": true,
        "pages": true
      },
      "status": "healthy"
    }
  ]
}
```

---

### 2. `POST /api/search`
Search across all certified sources (bounded parallel aggregation) or a specific source.

**Request:**
```json
{
  "query": "Solo Leveling",
  "source": "all",
  "limit": 24
}
```

**Response:**
```json
{
  "results": [
    {
      "id": "01j76xy5f...",
      "title": "Solo Leveling",
      "url": "https://weebcentral.com/series/01j76xy5f...",
      "coverImage": "https://...",
      "latestChapter": "179",
      "provider": "weebcentral"
    }
  ],
  "totalResults": 24,
  "sources": {
    "completed": ["weebcentral", "mangadex", "comick"],
    "failed": [],
    "skipped": ["mangakatana", "asurascan"]
  }
}
```

---

### 3. `POST /api/manga/detail`
Retrieve normalized metadata for a manga title.

**Request:**
```json
{
  "provider": "weebcentral",
  "id": "01j76xy5f..."
}
```

---

### 4. `POST /api/chapters`
Retrieve normalized chapter listings.

**Request:**
```json
{
  "provider": "weebcentral",
  "id": "01j76xy5f..."
}
```

---

### 5. `POST /api/pages`
Retrieve normalized reader page images.

**Request:**
```json
{
  "provider": "weebcentral",
  "chapterId": "01j76xy7w..."
}
```

**Response:**
```json
{
  "chapterId": "01j76xy7w...",
  "provider": "weebcentral",
  "pages": [
    {
      "index": 1,
      "url": "https://...",
      "headers": {
        "referer": "https://weebcentral.com/",
        "origin": "https://weebcentral.com"
      },
      "provider": "weebcentral"
    }
  ],
  "totalPages": 25
}
```

---

### 6. `GET /api/proxy/image`
SSRF-protected, CDN-cached image streaming proxy with referrer injection.

**Request:**
```text
GET /api/proxy/image?provider=weebcentral&url=https%3A%2F%2F...
```

---

### 7. `GET /api/health`
Public health status summary across all providers.

---

## Local Development & Testing

### 1. Run Contract Test Suite
```bash
npm run test:contract
```

### 2. Run Cloudflare Worker Locally
```bash
npm run dev
# Starts on http://localhost:8787
```

---

## Deployment to Cloudflare Workers

Deploy globally to Cloudflare Workers in seconds using Wrangler:

```bash
npm run deploy
```
