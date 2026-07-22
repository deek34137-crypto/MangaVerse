# Master Production Blueprint: Multi-Provider Platform

Version: 1.1  
Last Updated: 2026-07-22  
Related Phase: Phase 1 & Phase 2  
Related Components:  
- BaseProvider  
- ProviderRegistry  
- Transport  
- CircuitBreaker  

This blueprint defines the core platform architecture and integration standards for provider scrapers, shared transport infrastructure, and canonical metadata ingestion in MangaHub.

---

## 1. Architectural Principles

To ensure long-term maintainability, the scraper platform relies on the following core principles:

- **Plugin-first architecture**: Each provider exists as a self-contained plugin exposing a standard interface manifest.
- **Single Responsibility Principle (SRP)**: Clean separation between network requests, HTML parsing, database mapping, and canonical data ingestion.
- **Shared infrastructure over duplicated logic**: Networking details (such as retries, rate limits, and caching) must utilize the shared Transport module.
- **Schema validation at all external boundaries**: Zod schemas must validate data payloads directly at boundary limits.
- **Canonical data model**: Scrapers are decoupled from UI concerns, normalizing all data into standard types.
- **Provider independence**: Outages or schema changes on one source must not affect other providers or aggregations.
- **Fail-fast on invalid provider data**: Throw data incomplete errors immediately if essential fields (like titles) are missing.
- **Observability by default**: Structured JSON logging on every sync, parser run, and mapping transaction.
- **Secure-by-default networking**: Enforced SSRF whitelisting, redirect validation, and stream constraints on the Image Proxy.
- **Backward-compatible public interfaces**: Stable registry endpoints that handle dynamic capabilities natively.

---

## 2. Modular Shared Infrastructure

The shared provider logic resides under `src/services/providers/shared/`:

```text
src/services/providers/shared/
├── transport/
│   ├── transport.ts       # Main Transport orchestrator
│   ├── retry.ts           # Retry policy mapping and backoff logic
│   ├── circuit-breaker.ts # Trips provider state based on failures
│   ├── rate-limiter.ts    # Token bucket rate-limiter
│   ├── headers.ts         # User-Agent, Accept, and Referer headers
│   └── cache.ts           # Cache layer wrapper (TTL configuration)
├── validation/
│   └── schemas.ts         # Zod schemas (Manga, Chapter, Page models)
├── normalization/
│   └── registry.ts        # Canonical status and genre matching registries
├── metrics.ts             # ProviderMetricsCollector (15-min rolling & lifetime metrics)
├── snapshots.ts           # ProviderSnapshotWriter (Gated debug diagnostics)
├── errors.ts              # Strongly-typed custom ProviderError classes
└── utils.ts               # General helper functions
```

---

## 3. Shared Responsibilities

| Component | Responsibility | Technical Scope |
| :--- | :--- | :--- |
| **Transport** | Network Communication | Executing HTTP requests, retries, rate-limiting, and caching. |
| **Parser** | Content Extraction | Converting raw HTML/API text into parsed models (no networking). |
| **Mapping** | Data Normalization | Normalizing parsed inputs to canonical keys and validation. |
| **Validation** | Runtime Verification | Enforcing schemas using Zod validation at ingestion. |
| **Registry** | Plugin Discovery | Dynamic instantiation, capabilities filtering, and health computation. |
| **Aggregator** | Data Integration | Deduplication, provenance weighting, and database updates. |
| **Image Proxy** | Media Delivery | Safe image hotlink bypassing, SSRF defense, and stream proxying. |

---

## 4. Provider Manifest & Plugin Scrapers

Every provider scraper is a plugin module exported from `src/services/providers/`:

```text
src/services/providers/
├── shared/           # Modular infrastructure
├── webtoon/
│   ├── constants.ts  # Metadata, constants, rate limits
│   ├── selectors.ts  # Cheerio selector strings
│   ├── parser.ts     # HTML parsing with Cheerio (exposes PARSER_VERSION)
│   ├── client.ts     # Networking using shared Transport
│   ├── mapping.ts    # Canonical normalizations & validations
│   ├── provider.json # Manifest schema 1.0 declaration
│   ├── provider.ts   # BaseProvider implementation
│   └── index.ts      # Exposes ProviderManifest
```

### The Manifest Schema (v1.0)
Each provider contains a declarative `provider.json` validated via Zod schema at registration time:

```typescript
import { ProviderManifest } from "./shared/manifest-schema";

// Validated via Zod at provider registration time
export interface ProviderManifest {
  manifestSchemaVersion: "1.0";
  id: string;
  displayName: string;
  providerVersion: string;
  priority: number;
  baseUrl: string;
  capabilities: {
    search: boolean;
    latest: boolean;
    trending: boolean;
    merge: boolean;
    reader: boolean;
  };
  enabled: boolean;
}
```

---

## 5. Event Ingestion Pipeline

The operational lifecycle of a request flows through the following pipeline:

```text
Request (Search/Manga/Chapter)
        │
        ▼
Provider Registry (Finds registered plugin)
        │
        ▼
Provider Orchestrator (Invokes scraper method)
        │
        ▼
Transport (Rate limits, caches, executes fetch)
        │
        ▼
Parser (Cheerio DOM parse or JSON API parse; strictly sync)
        │
        ▼
Validation (Zod matches RawProviderSchemas)
        │
        ▼
Normalization (Mappers resolve canonical enums)
        │
        ▼
Aggregator Merge (Computes confidence score / merges)
        │
        ▼
Database / Index (Writes to DB, triggers cache invalidation)
```

---

## 6. Provider Plugin Lifecycle

```text
Load Plugin
    │
Validate Manifest (Assert provider.json schema via Zod)
    │
Register (Add to ProviderRegistry list)
    │
Health Check (Initial ping and search endpoints)
    │
Ready (Serving requests with 5-state health tracking)
    │
Health Monitoring (Interval checks; rolling 15-min window metrics)
    │
Recovery (Circuit breaker resets; state transitions ONLINE -> DEGRADED -> OFFLINE)
```

---

## 7. Configuration, State & Lifecycle

```typescript
export interface ProviderConfig {
  id: string;
  displayName: string;
  priority: number;
  versions: {
    provider: string;
    parser: string;
    schema: string;
  };
  network?: {
    baseUrl: string;
    timeoutMs: number;
    retries: number;
    rateLimit: {
      maxRequests: number;
      intervalMs: number;
    };
  };
  cache?: {
    ttlSearchMs: number;
    ttlMangaMs: number;
    ttlChaptersMs: number;
    ttlPagesMs: number;
  };
  flags: {
    enabled: boolean;
    searchEnabled: boolean;
    readerEnabled: boolean;
    mergeEnabled: boolean;
  };
}

// Standardized 5-State Provider Health Model
export type ProviderHealth = "ONLINE" | "DEGRADED" | "RATE_LIMITED" | "BLOCKED" | "OFFLINE";

export interface ProviderRuntimeState {
  health: ProviderHealth;
  lastSuccess?: Date;
  lastFailure?: Date;
  consecutiveFailures: number;
  averageLatencyMs: number;
  circuitState: "closed" | "open" | "half-open";
}
```

---

## 8. Metadata Normalization, Provenance & Mappings

### Merged Provenance & Confidence Scoring
To handle metadata conflicts when deduplicating manga across multiple providers, canonical fields track source and confidence ratings:
```typescript
export interface ProvenanceTracker<T> {
  value: T;
  providerId: string;
  confidence: number; // 0.0 to 1.0 ranking quality
  updatedAt: Date;
}
```

### Canonical Mapping Database Scheme
The Aggregator maintains a distinct mapping registry linking provider IDs rather than nesting them directly inside the Manga database entity:
```text
Canonical Manga ID
      ├── providerId = "mangadex",   externalId = "32feade8-3c8e..."
      ├── providerId = "webtoon",    externalId = "fantasy/tower-of-god..."
      └── providerId = "mangakatana", externalId = "solo-leveling.21147"
```

---

## 9. Performance Budgets

Engineering limits are enforced to prevent runaway loop execution or thread exhaustion:

- **Maximum retries**: 3
- **Maximum redirects**: 5
- **Maximum HTML size**: 5 MB (Ignore larger response payloads)
- **Maximum image size**: 15 MB (Enforced by content-length filters in Image Proxy)
- **Maximum parser execution**: 300 ms (Time for Cheerios' DOM parse)
- **Maximum request timeout**: 8 seconds

---

## 10. Architectural Decisions (ADRs)

Major architectural changes must be documented as ADRs under `docs/decisions/adr/`.
- The Master Blueprint is considered stable.
- Changes should be additive whenever possible.
- Breaking changes require incrementing the blueprint version.
