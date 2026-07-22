# MangaHub — Project Roadmap & Production Architecture

> **Last Updated:** 2026-07-22  
> **Current Phase:** Phase 18 — MangaTown Provider Integration

This document is the canonical reference for the MangaHub build sequence and platform architecture. Every phase is scoped to a clear objective, produces verifiable technical deliverables, and serves as a prerequisite for downstream development.

---

## Executive Summary & Progress

### Legend

- ✅ **Complete** — Implementation complete and verified against criteria
- 🟡 **Partially Complete** — Architecture established; automated tests or formal audits ongoing
- 🔴 **Pending** — Planned future roadmap phase

### Project Progress Summary

| Status | Count |
|---|---:|
| ✅ Complete | 12 |
| 🟡 Partially Complete | 5 |
| 🔴 Pending | 15 |
| **Total Phases** | **32** |

### Current Development Focus

**Active Phase:**  
Phase 18 — MangaTown Provider Integration

**Stable Platform Areas:**  
- ✓ Core Scraper Architecture & Shared Transport Infrastructure
- ✓ Provider Health Lifecycle, Rolling Metrics & Debug Snapshots
- ✓ Provider Metrics, Health Telemetry & Structured Logging Foundations
- ✓ Streaming Image Proxy, MIME Validation & SSRF Defense System
- ✓ Runtime Error Boundaries, Auto-Retry Pipeline & Request Coalescing
- ✓ Cross-Provider Security Hardening & Session Invalidation
- ✓ Production Authentication, Route Protection & Session Management
- ✓ Design System Modernization, Motion Framework & Responsive Components
- ✓ Reader Engine V2 (Finite State Machine, Priority Scheduler, Prefetching)
- ✓ Mobile Experience Platform (Gesture Engine & Viewport Optimization)

**Next Major Goals:**  
- Integrate target scrapers: MangaToon (Phase 16), MangaBuddy (Phase 17), and MangaTown (Phase 18)
- Complete Multi-Provider Aggregation Orchestration & Merge Engine (Phase 19)
- Finalize production performance audit and ship MangaHub v1.0 Release (Phase 20)
- Evolve Canonical Metadata Aggregation Platform & Offline Search Engine (Milestone 4)

---

## Milestone Overview

| Milestone | Phases | Theme |
|---|---|---|
| **Milestone 1 — Core Platform & Infrastructure Foundation** | 1 – 10 | Build a resilient, secure provider scraper framework, image proxy, and validation suite |
| **Milestone 2 — Application Platform & User Experience** | 11 – 14 | Ship production auth, modernized design system, Reader Engine V2, and mobile platform |
| **Milestone 3 — Provider Ecosystem & MangaHub v1.0 Release** | 15 – 20 | Integrate target providers, multi-provider aggregation engine, and ship production release |
| **Milestone 4 — Large-Scale Content Aggregation & Intelligence** | 21 – 28 | Scale platform to canonical metadata, background job queue, search index, and media optimization |
| **Milestone 5 — Enterprise Scalability, Automation & Reliability** | 29 – 32 | Add observability, distributed processing, event-driven automation, and disaster recovery |

---

## Milestone 1 — Core Platform & Infrastructure Foundation (Phases 1 – 10)

---

### ✅ Phase 1 — Provider Platform Refactor & Shared Infrastructure

**Status:** Complete

**Objective:** Migrate active provider scrapers from monolithic implementations onto a modular, decoupled plugin architecture using a unified transport layer without altering runtime contract behavior.

**Key Deliverables:**
- `src/services/providers/shared/` modular infrastructure (Transport, CircuitBreaker, RateLimiter, Cache, Errors, Types)
- `BaseProvider` abstract class enforcing common life cycle hooks and request execution contexts
- Compatibility shims (`types.ts`, `transport.ts`, `registry.ts`) re-exporting shared infrastructure
- MangaDex, ComicK, WeebCentral, and MangaKatana provider modules migrated to `BaseProvider`
- Standardized error hierarchy handling network timeouts, HTTP status failures, and DOM parsing errors
- Zero compilation errors verified via `npx tsc --noEmit`

---

### ✅ Phase 2 — Provider Platform Stabilization & Metadata Model

**Status:** Complete

**Objective:** Establish formal provider contracts, capability schemas, rolling health metrics, and automated debug diagnostics prior to scaling scraper integrations.

**Key Deliverables:**
- Declarative `provider.json` manifests per provider validated at registration time via Zod schema
- Strongly typed `ProviderCapabilities` flags replacing legacy capability sets
- Five-state health lifecycle model (`ONLINE | DEGRADED | RATE_LIMITED | BLOCKED | OFFLINE`)
- Rolling 15-minute window health metrics computation (`ProviderMetrics`)
- Data quality confidence scoring (0–1 scale) attached to provider metadata (`ProviderMetadata`)
- Debug snapshot recorder (`ProviderSnapshotWriter`) gated by `PROVIDER_SNAPSHOTS=true`
- Standardized 9-check provider certification suite (`scripts/test-provider-suite.ts`)
- Directory isolation refactor for MangaDex and ComicK scraper modules

---

### ✅ Phase 3 — Image Pipeline Architecture & Media Resilience

**Status:** Complete

**Objective:** Build a secure, high-throughput image proxy service to handle cross-origin image retrieval, header injection, content validation, and CDN compatibility.

**Key Deliverables:**
- Edge-ready streaming image proxy handling upstream image streams without memory buffer bloat
- SSRF protection layer with strict domain whitelisting, private IP blocklists, and protocol filtering
- MIME type validation and image header verification preventing arbitrary payload proxying
- Dynamic header injection (Referer, User-Agent) mapped per provider CDN requirements
- Timeout handling and request abort management via `AbortController`
- Edge caching headers (`Cache-Control`, `ETag`, 304 Not Modified optimization)

---

### ✅ Phase 4 — Runtime Resilience, Error Isolation & Stabilization

**Status:** Complete

**Objective:** Protect application runtime stability by isolating failures, preventing request cascading, and enforcing automated recovery boundaries across client and server.

**Key Deliverables:**
- Global and sub-tree React error boundaries preventing full-page UI crashes from component faults
- Automatic request retry pipeline with exponential backoff and jitter for transient transport failures
- Request coalescing and deduplication mechanism eliminating redundant in-flight network requests
- Circuit breaker integration halting requests to failing upstream provider endpoints
- Server-side fallback handlers ensuring graceful degradation during partial provider outages

---

### ✅ Phase 5 — Cross-Provider Security & System Hardening

**Status:** Complete

**Objective:** Harden security boundaries across network endpoints, image proxy routing, session states, and environment secrets.

**Key Deliverables:**
- Strict URL parsing and sanitization across all external image proxy and scraper endpoints
- Host header validation and SSRF boundary defense on proxy routes
- Secret hygiene audit ensuring zero plain-text API credentials or keys in client bundles
- Comprehensive session invalidation and token revoking on logout and security state changes
- Input sanitization and parameter validation on all public search and reader routes

---

### 🟡 Phase 6 — Comprehensive Scraper & Pipeline Regression Validation

**Status:** Partially Complete

**Objective:** Verify zero regressions across active providers, API contracts, and the sync pipeline under simulated network degradation and high traffic conditions.

**Key Deliverables:**
- Runtime regression fixes completed across MangaDex, ComicK, WeebCentral, and MangaKatana
- Full API route contract testing for `/api/health`, `/api/search`, `/api/manga/[slug]`, and `/api/image`
- Image proxy CDN regression checks verified across active provider asset domains
- Automated execution of 9-check test suite across all providers in CI/CD pipeline *(Pending)*
- Automated stress and load testing report for shared transport resilience under concurrency *(Pending)*

---

### 🟡 Phase 7 — Database Integrity, Canonical Data & Quality Assurance

**Status:** Partially Complete

**Objective:** Establish canonical entity management, audit database relationships, and eliminate orphan or duplicated manga and chapter records.

**Key Deliverables:**
- Refactored canonical manga schema supporting multi-provider external ID mappings
- Standardized deduplication and merge rules resolving title and chapter number collisions
- Verification of zero orphan chapter records across WeebCentral and MangaKatana imports
- Automated `db-integrity-check.ts` execution integrated into pre-push CI hooks *(Pending)*
- Comprehensive schema migration reversibility audit for all Drizzle migration steps *(Pending)*

---

### 🟡 Phase 8 — Runtime Validation & End-to-End Environment Verification

**Status:** Partially Complete

**Objective:** Validate end-to-end user workflows from search ingestion to reader rendering under production build conditions.

**Key Deliverables:**
- Next.js production build (`npm run build`) compilation and server SSR/ISR validation complete
- Real-world UI interaction testing across detail view, search modal, and chapter list
- Image proxy performance validated under production conditions (target cold-start proxy latency < 1.5s, warm proxy latency < 300ms)
- Auth route session persistence and route protection verified
- Automated Playwright/Cypress end-to-end test suite execution covering full user journeys *(Pending)*

---

### 🟡 Phase 9 — Adaptive Provider Intelligence & Fault Routing

**Status:** Partially Complete

**Objective:** Enable runtime traffic routing to dynamically adapt based on real-time provider health metrics and circuit breaker states.

**Key Deliverables:**
- Integrated circuit breaker telemetry and five-state health evaluation per provider
- Real-time confidence scoring calculation based on rolling request success/failure ratios
- Adaptive search aggregator weighting results according to provider health and confidence
- Automatic fallback routing switching chapter image sources to secondary providers when primary is DEGRADED or OFFLINE *(Pending)*

---

### 🔴 Phase 10 — Architecture Documentation & Developer Onboarding Baseline

**Status:** Pending

**Objective:** Publish definitive architectural specifications and developer guides to streamline future provider scraper onboarding.

**Key Deliverables:**
- `docs/architecture/provider-contract.md` — interface specification and life cycle contracts
- `docs/development/new-provider-guide.md` — step-by-step scraper creation guide with worked example
- `docs/architecture/master-blueprint.md` updated to reflect final platform architecture
- Inline TSDoc comments across `BaseProvider`, `Transport`, `Registry`, and schema definitions
- Git baseline tag release: `v0.1.0-platform-stable`

---

## Milestone 2 — Application Platform & User Experience (Phases 11 – 14)

---

### ✅ Phase 11 — Production Authentication Platform & Authorization

**Status:** Complete

**Objective:** Deploy a secure authentication platform managing user identity, protected routes, session persistence, and authorization controls.

**Key Deliverables:**
- NextAuth.js v5 integration with centralized route matcher configuration
- Secure middleware-based route protection for user library and administrative views
- Robust session handling with auto-refresh and clean token invalidation on logout
- Auth UI polish including responsive modal dialogs, loading states, and error toasts
- Resolved edge-case logout race conditions and session hydration mismatches

---

### ✅ Phase 12 — UI / Design System Modernization & Motion Framework

**Status:** Complete

**Objective:** Redesign the user interface using a high-grade design system, cohesive tokens, fluid animations, and premium card layouts.

**Key Deliverables:**
- Redesigned homepage featuring hero showcase carousel, trending categories, and layout grids
- Migration to Inkline design system patterns integrated with custom CSS variable design tokens
- Premium manga cards with hover scaling, badge overlays, and responsive typography
- Framer Motion animation framework integration for smooth page transitions and micro-interactions
- Skeleton loading state components preventing layout shifts (CLS < 0.05)
- Full dark mode palette and responsive layout tuning for mobile, tablet, and desktop viewports

---

### ✅ Phase 13 — Reader Engine V2 Architecture & Delivery System

**Status:** Complete

**Objective:** Architect an ultra-performant, resilient manga reader engine supporting state-driven navigation, priority request scheduling, and progressive rendering.

**Key Deliverables:**
- Finite State Machine (`ReaderStateMachine`) governing reading modes (Webtoon / Single / Double Page) and loading states
- Priority request scheduler prioritizing active page rendering over background prefetching
- Request deduplication and generation guards preventing redundant image fetches during rapid page turns
- Intelligent prefetching pipeline adaptively preloading N pages ahead based on connection speed
- Multi-tiered cache architecture (in-memory LRU + browser HTTP cache)
- Virtualized list rendering designed for smooth scrolling of long Webtoon chapters (>100 pages)
- Seamless scroll position restoration and reading progress tracking

---

### ✅ Phase 14 — Mobile Experience Platform & Touch Optimization

**Status:** Complete

**Objective:** Optimize the mobile web experience with gesture controls, responsive layout adaptations, and touch-first reader interactions.

**Key Deliverables:**
- Custom touch gesture engine supporting swipe, double-tap zoom, pinch-to-zoom, and drag panning
- Reader UX controls with auto-hiding navigation bars and gesture tap zones
- Dynamic viewport adjustments eliminating mobile browser bar jumping and scrolling glitches
- Touch-optimized drawer menus, search sheet dialogs, and chapter selectors
- Performance optimization for mobile GPU rendering and memory management on high-DPI displays

---

## Milestone 3 — Provider Ecosystem & MangaHub v1.0 Release (Phases 15 – 20)

---

### ✅ Phase 15 — WEBTOON Provider Integration

**Status:** Complete

**Objective:** Implement and certify the WEBTOON scraper provider conforming to the `BaseProvider` platform contract.

**Key Deliverables:**
- `src/services/providers/webtoon/` implementation (`provider.json`, `provider.ts`, `parser.ts`, `client.ts`, `mapping.ts`, `selectors.ts`)
- Passed all 9 standardized provider certification suite checks
- Integrated into provider registry and canonical search pipeline
- Image proxy domain whitelisting configured for `webtoons.com` CDN origins

---

### ✅ Phase 16 — MangaToon Provider Integration

**Status:** Complete

**Objective:** Implement and certify the MangaToon scraper provider against the platform contract.

**Key Deliverables:**
- `src/services/providers/mangatoon/` directory implementation conforming to `BaseProvider` (`provider.json`, `provider.ts`, `parser.ts`, `client.ts`, `mapping.ts`, `selectors.ts`, `index.ts`, `README.md`)
- Dedicated HTML parser and selectors handling MangaToon layout structures
- Passed all 9 standardized provider certification suite checks (`scripts/test-provider-suite.ts mangatoon`)
- Registry registration, capability declaration, and CDN image proxy whitelist entries (`mangatoon.mobi`, `cdn.mangatoon.mobi`, `mangatoon.net`, `mktoon.com`)

---

### ✅ Phase 17 — MangaBuddy Provider Integration

**Status:** Complete

**Objective:** Implement and certify the MangaBuddy scraper provider against the platform contract.

**Key Deliverables:**
- `src/services/providers/shared/html/` utilities (`antiBot.ts`, `url.ts`)
- `src/services/providers/mangabuddy/` directory implementation conforming to `BaseProvider` (`provider.json`, `provider.ts`, `parser.ts`, `client.ts`, `mapping.ts`, `selectors.ts`, `index.ts`, `README.md`)
- Dual-mode search handling JSON search API with HTML catalog fallback
- Passed all 9 standardized provider certification suite checks (`scripts/test-provider-suite.ts mangabuddy`)
- Registry registration, capability declaration, and explicit CDN image proxy whitelist entries (`mangabuddy1.co.uk`, `cdn1.love4awalk.xyz`, `cdn2.love4awalk.xyz`)

---

### 🔴 Phase 18 — MangaTown Provider Integration

**Status:** Pending

**Objective:** Implement and certify the MangaTown scraper provider against the platform contract.

**Key Deliverables:**
- `src/services/providers/mangatown/` directory implementation conforming to `BaseProvider`
- HTML parser supporting legacy pagination and search layouts
- 9-check certification suite validation and registry registration
- Image proxy whitelist updates

---

### 🔴 Phase 19 — Multi-Provider Aggregation Orchestration & Merge Engine

**Status:** Pending

**Objective:** Validate real-time multi-provider search aggregation, canonical deduplication, and chapter merging across all 8 active scrapers under load.

**Key Deliverables:**
- Canonical deduplication verified across MangaDex, ComicK, WeebCentral, MangaKatana, WEBTOON, MangaToon, MangaBuddy, and MangaTown
- Conflict resolution algorithm prioritizing high-confidence provider metadata
- Automated execution of 72 certification checks (8 providers × 9 checks)
- Full fault tolerance verification: single or multiple provider failures produce zero UI disruptions

---

### 🟡 Phase 20 — Production Release Readiness & Final Audit

**Status:** Partially Complete

**Objective:** Complete comprehensive production audits, finalize system performance metrics, write release notes, and cut the v1.0.0 release.

**Key Deliverables:**

#### Technical Validation
- Security audit: SSRF protection, MIME validation, URL sanitization, secret hygiene, and session security complete
- Performance audit: Core Web Vitals profiling, proxy latency benchmarking, and reader memory usage review (partially complete)

#### Documentation & Operations
- Final documentation accuracy audit across architecture specs and developer guides *(Pending)*
- Operational deployment runbooks finalized *(Pending)*

#### Release Artifacts
- Production changelog compilation *(Pending)*
- Formal release tag generation (`v1.0.0`) *(Pending)*

---

## Milestone 4 — Large-Scale Content Aggregation & Intelligence (Phases 21 – 28)

---

### 🔴 Phase 21 — Canonical Metadata Platform & Unified Content Model

**Status:** Pending

**Objective:** Evolve database schema from provider-centric model to a canonical-first architecture supporting rich taxonomy, genres, demographics, and author disambiguation.

**Key Deliverables:**
- Extended Drizzle ORM schema migration establishing canonical manga core entity
- Normalized genre, demographic, and tag mapping registry across all provider taxonomies
- Author and artist disambiguation table with cross-provider entity linkage
- Provider confidence scoring integrated into canonical record selection

---

### 🔴 Phase 22 — Background Workers, Job Queue & Content Synchronization

**Status:** Pending

**Objective:** Replace ad-hoc background scripts with a distributed job queue managing chapter ingestion, cover refreshes, and integrity checks.

**Key Deliverables:**
- Job queue engine integration (pg-boss or BullMQ backed by Upstash Redis)
- Job definitions: `chapter.sync`, `cover.refresh`, `health.poll`, `integrity.audit`
- Automatic exponential backoff retries and dead-letter queue (DLQ) processing
- Real-time job monitor dashboard in administrative portal

---

### 🔴 Phase 23 — Metadata Synchronization & Canonical Merge Pipeline

**Status:** Pending

**Objective:** Deploy an automated synchronization engine that continuously ingests provider updates into canonical records with conflict resolution and change auditing.

**Key Deliverables:**
- Scheduled sync pipeline: detect → fetch → diff → merge → commit lifecycle
- Rules-based conflict resolution incorporating confidence scores and recency
- Immutable sync audit log recording source provider and timestamp per field modification
- Automated rollback mechanism for invalid record merges

---

### 🔴 Phase 24 — Dynamic Provider Registry & Plugin Ecosystem

**Status:** Pending

**Objective:** Support hot-reloading provider plugins from external directories without requiring application redeployments.

**Key Deliverables:**
- External plugin loader reading runtime provider bundles from a configured filesystem path
- Registry hot-reload handler responding to administrative API signals or SIGHUP
- Plugin isolation sandbox preventing misbehaving plugins from crashing process runtime
- Manifest contract version enforcement

---

### 🔴 Phase 25 — Intelligent Content Matching & Canonical Merge Engine

**Status:** Pending

**Objective:** Implement advanced fuzzy string matching and external ID mapping (MyAnimeList / AniList) for automated multi-provider title deduplication.

**Key Deliverables:**
- Normalized Unicode string distance algorithms (Levenshtein, Jaro-Winkler) for title comparison
- MyAnimeList (MAL) and AniList ID cross-reference resolver service
- Weighted confidence calculation determining canonical record dominance
- Administrative merge review portal for manual resolution of ambiguous titles

---

### 🔴 Phase 26 — Offline Search Platform & Indexing Infrastructure

**Status:** Pending

**Objective:** Replace relational database text searches with a dedicated search index delivering sub-100ms query latency at scale.

**Key Deliverables:**
- Search engine integration (Meilisearch or Typesense) with automated index synchronization
- Incremental index update pipeline triggered on canonical record state changes
- Multi-faceted search support: genre, demographic, status, provider count, release year
- Search latency target: p99 < 100ms across a 50,000+ title catalog

---

### 🔴 Phase 27 — Provider Intelligence, Health Monitoring & Automatic Failover

**Status:** Pending

**Objective:** Build a real-time provider health dashboard, automated fallback routing, and incident notification alerts.

**Key Deliverables:**
- Administrative health dashboard rendering real-time provider metrics and status timelines
- Transparent fallback router switching chapter image traffic to secondary providers upon primary outage
- Alerting integration (Webhook / Slack / PagerDuty) on sustained provider degraded state
- Historical health metrics persistence for provider uptime trend analysis

---

### 🔴 Phase 28 — Image Pipeline Transcoding, Media Optimization & CDN Infrastructure

**Status:** Pending

**Objective:** Add on-the-fly image transcoding, WebP conversion, blurhash placeholder generation, and optional object storage caching.

**Key Deliverables:**
- On-the-fly image format conversion (JPEG/PNG to WebP/AVIF) in proxy stream
- Blurhash generation for cover images enabling instant visual placeholders
- Optional cloud storage cache layer (Cloudflare R2 or AWS S3) for high-traffic chapter pages
- Target proxy streaming latency: p99 < 500ms under load

---

## Milestone 5 — Enterprise Scalability, Automation & Reliability (Phases 29 – 32)

---

### 🔴 Phase 29 — Observability, Telemetry & Operational Monitoring

**Status:** Pending

**Objective:** Implement structured JSON logging, distributed OpenTelemetry tracing, and Prometheus metrics exporting.

**Key Deliverables:**
- Structured JSON logger across Next.js app routes, background workers, and provider clients
- OpenTelemetry tracing headers propagated across HTTP → API → Database → Scraper calls
- `/api/metrics` endpoint exposing Prometheus metrics for provider health and traffic rates
- Grafana operational dashboard rendering latency distributions, proxy error rates, and cache hits

---

### 🔴 Phase 30 — Distributed Processing, Scalability & Performance Infrastructure

**Status:** Pending

**Objective:** Separate background worker execution into scalable worker instances and optimize database connection pooling.

**Key Deliverables:**
- Decoupled worker process architecture running independently from web application instances
- Horizontal scaling test suite validating lock safety and zero duplicate job executions
- Database query optimization audit (`EXPLAIN ANALYZE`) on all hot path query routes
- Upstash Redis cache hit ratio > 85% on warm traffic paths
- Postgres connection pool tuning under high concurrent request volumes

---

### 🔴 Phase 31 — Event-Driven Architecture & Platform Automation

**Status:** Pending

**Objective:** Deploy an event bus broadcasting platform events to trigger downstream indexing, notification, and cache invalidation tasks.

**Key Deliverables:**
- Lightweight event bus system (Redis Pub/Sub or Postgres `LISTEN/NOTIFY`)
- Event schemas: `chapter.published`, `provider.status_changed`, `manga.merged`
- Asynchronous event handlers: search index sync, user notifications, cache purging
- Event replay log supporting recovering missed events following outages

---

### 🔴 Phase 32 — Enterprise Production Hardening, Disaster Recovery & Reliability Baseline

**Status:** Pending

**Objective:** Establish automated database backup procedures, disaster recovery runbooks, zero-downtime deployment pipelines, and formal SLAs.

**Key Deliverables:**
- Automated daily database backup with verified Point-in-Time Recovery (PITR) procedure
- Zero-downtime blue/green deployment pipeline with instant rollback capability
- Comprehensive operational runbooks covering provider outages, DB failovers, and cache crashes
- Defined platform SLO targets: 99.9% uptime, < 2s warm page load latency, < 15 min incident response time

---

## Phase Dependency Graph

```text
TRACK 1: Core Platform & Infrastructure
Phase 1 ──► Phase 2 ──► Phase 3 ──► Phase 4 ──► Phase 5 ──► Phase 6 ──► Phase 7 ──► Phase 8 ──► Phase 9 ──► Phase 10 ──┐
                                                                                                                    │
TRACK 2: Application Platform & User Experience                                                                     │
Phase 11 ──► Phase 12 ──► Phase 13 ──► Phase 14 ────────────────────────────────────────────────────────────────────┼──┐
                                                                                                                    │  │
TRACK 3: Provider Ecosystem & Scrapers                                                                              │  │
Phase 15 (WEBTOON) ──► Phase 16 (MangaToon) ──► Phase 17 (MangaBuddy) ──► Phase 18 (MangaTown) ──► Phase 19 (Orch) ──┘  │
                                                                                                                       │
                                                               ┌───────────────────────────────────────────────────────┘
                                                               ▼
                                                  Phase 20 — Release Readiness (v1.0)
                                                               │
                               ┌───────────────────────────────┴───────────────────────────────┐
                               ▼                                                               ▼
            Milestone 4 — Aggregation & Intelligence                       Milestone 5 — Enterprise & Ops
            Phase 21 (Canonical Metadata)                                  Phase 29 (Observability & Telemetry)
               │                                                              │
               ▼                                                              ▼
            Phase 22 (Background Workers)                                  Phase 30 (Distributed Workers)
               │                                                              │
               ▼                                                              ▼
            Phase 23 (Sync Pipeline)                                       Phase 31 (Event-Driven Bus)
               │                                                              │
               ▼                                                              ▼
            Phase 24 (Plugin Registry)                                     Phase 32 (Disaster Recovery & SLAs)
               │
               ▼
            Phase 25 (Fuzzy Matching)
               │
               ▼
            Phase 26 (Offline Search)
               │
               ▼
            Phase 27 (Health Failover)
               │
               ▼
            Phase 28 (Media Optimization)
```

---

*Each phase is gated by explicit verification criteria. A phase does not begin until all gates from the preceding phase are confirmed and documented.*
