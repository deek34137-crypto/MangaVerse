# MangaHub — Project Roadmap

> **Last Updated:** 2026-07-19
> **Current Phase:** Phase 8 — MangaToon Provider Integration

This document is the canonical reference for the MangaHub build sequence. Every phase is scoped to a clear objective, produces verifiable deliverables, and serves as a prerequisite for the phase that follows it.

---

## Milestone Overview

| Milestone | Phases | Theme |
|---|---|---|
| **Core Platform Foundation** | 1 – 6 | Build a stable, testable, well-documented scraper platform |
| **Provider Ecosystem & MangaHub v1.0** | 7 – 12 | Integrate all target providers and ship a production release |
| **Large-Scale Content Aggregation** | 13 – 20 | Scale the platform to canonical metadata, distributed jobs, and intelligent routing |
| **Enterprise Scalability & Operations** | 21 – 24 | Add observability, distributed processing, event-driven automation, and disaster recovery |

---

## Milestone 1 — Core Platform Foundation (Phases 1 – 6)

---

### ✅ Phase 1 — Provider Platform Refactor & Shared Infrastructure

**Status:** Complete

**Objective:** Migrate all active providers from monolithic files onto a modular, shared plugin architecture without changing runtime behavior.

**Key Deliverables:**
- `src/services/providers/shared/` — modular infrastructure (Transport, CircuitBreaker, RateLimiter, Cache, Errors, Types)
- `BaseProvider` abstract class
- Legacy compatibility shims (`types.ts`, `transport.ts`, `registry.ts`) — re-exporting from `shared/`
- MangaDex, ComicK, WeebCentral, MangaKatana migrated to `BaseProvider`
- `npx tsc --noEmit` → 0 errors
- All 7 verification gates passed

---

### ✅ Phase 1.5 — Provider Platform Stabilization

**Status:** Complete

**Objective:** Establish the provider contract, metadata model, observability foundation, and automated validation suite before expanding the provider ecosystem.

**Key Deliverables:**
- `provider.json` manifests per provider (TypeScript build-time JSON imports)
- Zod manifest schema validation at provider registration time
- `ProviderCapabilities` typed object (replaces `Set<ProviderCapability>`)
- Five-state health model: `ONLINE | DEGRADED | RATE_LIMITED | BLOCKED | OFFLINE`
- Health computed from rolling metrics — never set manually by providers
- `ProviderMetrics` with lifetime + rolling (15-minute) windows
- `ProviderMetadata` with `confidence` score (data quality, 0–1)
- `ProviderSnapshotWriter` (gated by `PROVIDER_SNAPSHOTS=true`) with full debug context
- `registry.getProviders()` returning full `ProviderMetadata[]`
- Standardized 9-check provider test suite (`scripts/test-provider-suite.ts`)
- MangaDex and ComicK migrated from flat files to provider directories

---

### Phase 2 — Comprehensive Regression, Compatibility & Stability Validation

**Status:** Pending

**Objective:** Prove that the Phase 1 + 1.5 refactor introduced zero regressions across all active providers, all APIs, and the full sync pipeline under realistic conditions.

**Key Deliverables:**
- Full regression run of all 3 active providers against the standardized 9-check suite
- E2E pipeline regression: search → dedup → chapter sync → page ingestion → DB integrity
- API regression: all public endpoints (`/api/health`, `/api/search`, `/api/image`, `/api/manga/[slug]`, etc.)
- Image proxy regression across all provider CDN domains
- Load and stress test of Transport layer (rate limiter, circuit breaker, retry under concurrent load)
- Regression report artifact

---

### Phase 3 — Database Integrity, Canonical Data & Quality Assurance

**Status:** Pending

**Objective:** Audit and enforce the quality of canonical data in the database; establish ongoing integrity checks; validate the deduplication and merge pipeline.

**Key Deliverables:**
- Extended `db-integrity-check.ts`: duplicate slugs, orphan mappings, ambiguous chapter numbers, broken foreign keys, invalid image URLs
- Canonical manga and chapter deduplication audit (WeebCentral + MangaKatana overlap verified)
- Merge conflict resolution rules documented and tested
- Automated integrity check as a CI pre-push hook (or scheduled script)
- Schema migration audit — all migrations idempotent and reversible

---

### Phase 4 — Runtime Validation, UI Verification & End-to-End Testing

**Status:** Pending

**Objective:** Validate the full user-facing stack — Next.js pages, API routes, and the image proxy — under real runtime conditions.

**Key Deliverables:**
- All Next.js pages compile and render without runtime errors
- All API routes return correct responses with correct status codes
- Image proxy: whitelist audit, SSRF validation, MIME type checks, ETag/304 caching verified
- Search, manga detail, chapter reader, and homepage routes tested end-to-end
- Auth session endpoints verified
- Homepage profiling: cold-start latency < 10s, warm latency < 2s

---

### Phase 5 — Cross-Platform Runtime Intelligence & Adaptive Experience

**Status:** Pending

**Objective:** Make the runtime aware of provider health and capable of routing around degraded providers automatically.

**Key Deliverables:**
- Provider fallback routing: if primary provider returns DEGRADED/OFFLINE, route to secondary
- Adaptive search merging: weight results by provider confidence score
- Provider-aware image proxy: graceful fallback if CDN for a provider is unreachable
- Circuit breaker tuning validated under real failure scenarios
- Health state transitions logged and observable

---

### Phase 6 — Architecture Documentation, Developer Experience & Stable Baseline

**Status:** Pending

**Objective:** Document the platform so any developer can onboard a new provider without guidance. Establish this commit as the v0.1.0 stable baseline.

**Key Deliverables:**
- `docs/architecture/provider-contract.md` — the full provider interface specification
- `docs/development/new-provider-guide.md` — step-by-step guide with a worked example
- `docs/architecture/master-blueprint.md` updated to reflect Phase 1.5 architecture
- All inline code comments on `BaseProvider`, `Transport`, `Registry`, and manifest schema current
- Git tag: `v0.1.0-platform-stable`

---

## Milestone 2 — Provider Ecosystem & MangaHub v1.0 (Phases 7 – 12)

---

### ✅ Phase 7 — WEBTOON Provider Integration

**Status:** Complete

**Objective:** Implement the WEBTOON provider against the Phase 1.5 platform contract.

**Key Deliverables:**
- `src/services/providers/webtoon/` — full directory structure (`provider.json`, `provider.ts`, `parser.ts`, `client.ts`, `mapping.ts`, `selectors.ts`, `index.ts`)
- Passes all 9 standardized provider suite checks
- Integrated into registry and E2E pipeline
- Image proxy whitelist updated for `webtoons.com` CDN domains

---

### Phase 8 — MangaToon Provider Integration

**Status:** Pending

**Objective:** Implement the MangaToon provider.

**Key Deliverables:**
- `src/services/providers/mangatoon/` — full directory structure
- Passes all 9 standardized provider suite checks
- Integrated into registry and E2E pipeline

---

### Phase 9 — MangaBuddy Provider Integration

**Status:** Pending

**Objective:** Implement the MangaBuddy provider.

**Key Deliverables:**
- `src/services/providers/mangabuddy/` — full directory structure
- Passes all 9 standardized provider suite checks
- Integrated into registry and E2E pipeline

---

### Phase 10 — MangaTown Provider Integration

**Status:** Pending

**Objective:** Implement the MangaTown provider.

**Key Deliverables:**
- `src/services/providers/mangatown/` — full directory structure
- Passes all 9 standardized provider suite checks
- Integrated into registry and E2E pipeline

---

### Phase 11 — Multi-Provider Orchestration, Merge Engine & Production Hardening

**Status:** Pending

**Objective:** With all 7 providers active, validate the full aggregation and merge pipeline at scale.

**Key Deliverables:**
- Canonical deduplication verified across all 7 providers
- Merge conflict resolution tested under all overlap scenarios
- Provider priority weighting validated in search and detail merge
- Full regression suite (all 7 providers × 9 checks = 63 tests)
- Production-grade error handling: no provider failure cascades to UI

---

### Phase 12 — Production Readiness, Final Audit & Version 1.0 Release

**Status:** Pending

**Objective:** Ship MangaHub v1.0.

**Key Deliverables:**
- Final security audit (SSRF, auth, rate limiting, input validation)
- Performance audit (homepage, search, chapter reader cold/warm latency)
- All documentation current
- Changelog written
- Git tag: `v1.0.0`

---

## Milestone 3 — Large-Scale Content Aggregation (Phases 13 – 20)

---

### Phase 13 — Canonical Metadata Platform & Unified Content Model

**Status:** Pending

**Objective:** Evolve the database schema from provider-centric to canonical-first, with rich metadata (genres, demographics, tags, author disambiguation).

**Key Deliverables:**
- Schema migration: canonical manga table extended with richer metadata fields
- Author and artist disambiguation table
- Tag and genre normalization registry (per-provider → canonical mapping)
- Provider confidence incorporated into canonical record selection

---

### Phase 14 — Metadata Synchronization & Canonical Merge Pipeline

**Status:** Pending

**Objective:** Build a scheduled pipeline that continuously synchronizes provider data into the canonical model, resolving conflicts automatically.

**Key Deliverables:**
- Scheduled sync pipeline: detect → fetch → diff → merge → commit
- Conflict resolution rules: priority weighting, confidence scoring, timestamp preference
- Sync audit log (every canonical change attributed to a provider and timestamp)
- Rollback mechanism for bad merges

---

### Phase 15 — Dynamic Provider Registry & Plugin Ecosystem

**Status:** Pending

**Objective:** Make the provider registry hot-reloadable and support external plugin providers loaded at runtime without redeployment.

**Key Deliverables:**
- Provider plugins loadable from a configured path at startup
- Registry hot-reload on SIGHUP or admin API call
- Plugin isolation: a misbehaving plugin cannot crash the registry
- Plugin manifest versioning enforced

---

### Phase 16 — Background Workers, Job Queue & Content Synchronization

**Status:** Pending

**Objective:** Replace ad-hoc sync scripts with a proper job queue for background chapter ingestion, cover updates, and health checks.

**Key Deliverables:**
- Job queue integration (e.g. BullMQ or pg-boss)
- Jobs: chapter sync, cover refresh, provider health poll, DB integrity check
- Job retry and dead-letter handling
- Job status visible in admin dashboard

---

### Phase 17 — Intelligent Content Matching & Canonical Merge Engine

**Status:** Pending

**Objective:** Implement fuzzy title matching, external ID cross-referencing (MAL, AniList), and confidence-weighted merging to accurately deduplicate manga across 7+ providers.

**Key Deliverables:**
- Fuzzy title matching (Levenshtein, normalized Unicode comparison)
- MAL / AniList ID cross-reference resolver
- Confidence-weighted canonical record selection
- Merge conflict report surfaced in admin UI

---

### Phase 18 — Offline Search Platform & Indexing Infrastructure

**Status:** Pending

**Objective:** Replace database full-text search with a dedicated search index for sub-100ms search latency at scale.

**Key Deliverables:**
- Search index integration (e.g. Meilisearch or Typesense)
- Incremental index updates on canonical record changes
- Faceted search: genre, status, type, year, provider
- Search latency p99 < 100ms at 10K title catalog

---

### Phase 19 — Provider Intelligence, Health Monitoring & Automatic Failover

**Status:** Pending

**Objective:** Build a real-time provider health dashboard, automatic failover routing, and alerting on provider degradation.

**Key Deliverables:**
- Real-time health dashboard (polling registry metrics)
- Automatic failover: route requests to secondary provider when primary is OFFLINE/BLOCKED
- Alerting on consecutive failures or sustained DEGRADED state
- Health history stored for trend analysis

---

### Phase 20 — Image Pipeline, Media Optimization & CDN Infrastructure

**Status:** Pending

**Objective:** Add image transcoding, lazy loading, blurhash placeholders, and optional CDN offloading for chapter pages.

**Key Deliverables:**
- WebP conversion on image proxy (for JPEG/PNG sources)
- Blurhash placeholder generation for cover images
- Optional CDN offload (R2 / S3) for frequently-accessed chapter pages
- Image proxy latency p99 < 500ms

---

## Milestone 4 — Enterprise Scalability & Operations (Phases 21 – 24)

---

### Phase 21 — Observability, Telemetry & Operational Monitoring

**Status:** Pending

**Objective:** Integrate structured logging, distributed tracing, and Prometheus-compatible metrics export. Wire provider metrics into a Grafana dashboard.

**Key Deliverables:**
- Structured JSON logging across all services (provider, sync, API)
- Prometheus `/metrics` endpoint exposing provider metrics
- Grafana dashboard: provider health, latency, success rate, pages scraped
- Distributed trace IDs propagated through sync → DB → API paths

---

### Phase 22 — Distributed Processing, Scalability & Performance Infrastructure

**Status:** Pending

**Objective:** Move sync jobs to horizontally scalable workers; optimize DB query patterns and cache hit rates under load.

**Key Deliverables:**
- Worker service separated from the Next.js app process
- Horizontal scaling tested (multiple worker replicas, no double-processing)
- DB query optimization: explain-analyze audit on all hot paths
- Redis cache hit rate > 80% for search and manga detail on warm traffic
- Connection pool tuning for Postgres under concurrency

---

### Phase 23 — Event-Driven Architecture & Platform Automation

**Status:** Pending

**Objective:** Introduce an event bus so provider syncs, chapter releases, and health state changes trigger downstream actions automatically.

**Key Deliverables:**
- Event bus integration (e.g. pg-notify, Redis pub/sub, or lightweight broker)
- Events: `chapter.released`, `provider.degraded`, `canonical.merged`, `sync.completed`
- Event consumers: notification dispatch, search index update, webhook delivery
- Event replay for missed consumers

---

### Phase 24 — Enterprise Production Hardening, Disaster Recovery & Long-Term Reliability

**Status:** Pending

**Objective:** Establish backup/restore, point-in-time recovery, deployment rollback, runbooks, and a formal reliability baseline.

**Key Deliverables:**
- Database backup schedule and restore procedure tested
- Point-in-time recovery (PITR) verified on staging
- Deployment rollback strategy documented and tested
- Runbook: provider outage, DB incident, search index failure, high error rate
- SLA definition: uptime target, incident response time, recovery time objective (RTO)

---

## Phase Dependency Graph

```
Phase 1 ──► Phase 1.5 ──► Phase 2 ──► Phase 3 ──► Phase 4 ──► Phase 5 ──► Phase 6
                                                                                  │
                                                         ┌────────────────────────┘
                                                         ▼
                                          Phase 7 ──► Phase 8 ──► Phase 9 ──► Phase 10
                                                                                      │
                                                              ┌───────────────────────┘
                                                              ▼
                                                   Phase 11 ──► Phase 12  (v1.0)
                                                                        │
                              ┌─────────────────────────────────────────┘
                              ▼
           Phase 13 ──► Phase 14 ──► Phase 15 ──► Phase 16 ──► Phase 17
                                                                       │
                                       ┌───────────────────────────────┘
                                       ▼
                            Phase 18 ──► Phase 19 ──► Phase 20
                                                            │
                         ┌──────────────────────────────────┘
                         ▼
              Phase 21 ──► Phase 22 ──► Phase 23 ──► Phase 24
```

---

*Each phase is gated by explicit verification criteria. A phase does not begin until all gates from the preceding phase are confirmed and documented.*
