# Aggregator Merge Specification

```text
Specification Version: 1.0
Last Updated: 2026-07-16
Compatibility: MangaHub Aggregator v1.0
Status: Frozen / Reference Spec
```

This specification defines the conflict resolution rules and canonical metadata merging strategy within the MangaHub Aggregator.

---

## 1. Merging & Ingestion Pipeline Algorithm

```
                  ┌──────────────────────────────┐
                  │ Candidate Metadata Arrives   │
                  └──────────────┬───────────────┘
                                 │
                                 ▼
                  ┌──────────────────────────────┐
                  │ Zod Schema Validation        │
                  └──────────────┬───────────────┘
                                 │
                                 ▼
                  ┌──────────────────────────────┐
                  │ Canonical Field Mapping      │
                  └──────────────┬───────────────┘
                                 │
                                 ▼
                  ┌──────────────────────────────┐
                  │ Identity Resolution          │
                  │ (Lookup in MangaMapping)     │
                  └──────────────┬───────────────┘
                                 │
                                 ▼
                  ┌──────────────────────────────┐
                  │ Confidence Score Allocation  │
                  └──────────────┬───────────────┘
                                 │
                                 ▼
                  ┌──────────────────────────────┐
                  │ Conflict Resolution (Merge)  │
                  └──────────────┬───────────────┘
                                 │
                                 ▼
                  ┌──────────────────────────────┐
                  │ Database & Search Update     │
                  └──────────────┬───────────────┘
                                 │
                                 ▼
                  ┌──────────────────────────────┐
                  │ Cache Invalidation           │
                  └──────────────────────────────┘
```

---

## 2. Event Flow Lifecycle

During standard operation, the data ingestion triggers the following events:

1. **Provider Sync**: Scraper initiates connection and downloads source pages.
2. **Provider Parsed**: Raw HTML translated into schema-compliant JSON.
3. **Validation Passed**: Zod confirms title, chapter, and image schemas.
4. **Canonical Merge**: Aggregator aggregates metadata and compares trust ratings.
5. **Database Updated**: Writes results to `Manga` and `MangaMapping` tables.
6. **Search Index Updated**: Rebuilds search parameters (e.g. title indexes).
7. **Cache Invalidated**: Clears redis keys for listing, popular, and detail routes.
8. **Metrics Recorded**: Captures scraper and parser latencies.

---

## 3. Provenance Tracker Model

Every field in the canonical database is stored with metadata tracking its source and reliability:

```typescript
export interface ProvenanceTracker<T> {
  value: T;
  providerId: string;
  confidence: number; // Score from 0.0 to 1.0
  updatedAt: Date;
}
```

---

## 4. Provider Reliability Rankings

When multiple scrapers return metadata for the same canonical manga, the aggregator uses static trust scores to determine which value to select:

| Provider | Trust Score | Rationale |
| :--- | :---: | :--- |
| **MangaDex** | `0.98` | Official open API, verified title, clean tags and descriptions. |
| **ComicK** | `0.92` | Accurate releases but title tags sometimes have scraper artifacts. |
| **WEBTOON** | `0.95` | Source publisher for official series; high trust for webtoons. |
| **WeebCentral**| `0.80` | Scraping fallback, relies on title cards which can be altered. |
| **MangaBuddy** | `0.75` | Mirror content; fallback priority only. |
| **MangaTown**  | `0.70` | Old indexes; least preferred metadata. |

---

## 5. Database Identity Mapping Scheme

The canonical `Manga` entry is linked to providers using a separate relational lookup table, preventing provider-specific IDs from cluttering main tables:

### Entity `MangaMapping`
| Column | Type | Description |
| :--- | :--- | :--- |
| `canonical_manga_id` | UUID | Foreign Key referencing main Manga ID |
| `provider_id` | String | Scraper identifier (e.g., `"webtoon"`) |
| `external_id` | String | The ID used on the provider's domain |
| `external_slug` | String | Slug parameter for URL construction |
| `last_synced_at` | DateTime | Timestamp of last sync execution |
