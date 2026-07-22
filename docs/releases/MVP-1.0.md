# MangaHub MVP 1.0 — Architecture & Release Certification Document

**Release Identifier**: `v1.0.0`  
**Release Date**: July 22, 2026  
**Status**: MVP Complete & Certified for Production Deployment  

---

## 1. System Architecture Overview

```
                      ┌───────────────────────────┐
                      │    Next.js UI Pages       │
                      │ (Home, Detail, Reader,    │
                      │  Search, Library, Admin)  │
                      └─────────────┬─────────────┘
                                    │
                      ┌─────────────▼─────────────┐
                      │ Route Loaders & ViewModels│
                      │   (src/services/ui/)      │
                      └─────────────┬─────────────┘
                                    │
                      ┌─────────────▼─────────────┐
                      │    Aggregator Facade      │
                      │  (aggregator.search/get)  │
                      └─────────────┬─────────────┘
                                    │
       ┌────────────────────────────┼────────────────────────────┐
       │                            │                            │
┌──────▼──────┐              ┌──────▼──────┐              ┌──────▼──────┐
│ Snapshot    │              │ Canonical   │              │ Reader      │
│ Serving     │              │ Entity      │              │ Failover    │
│ Engine      │              │ Engine      │              │ & Hedging   │
└──────┬──────┘              └──────┬──────┘              └──────┬──────┘
       │                            │                            │
       └────────────────────────────┼────────────────────────────┘
                                    │
                      ┌─────────────▼─────────────┐
                      │ Provider Policy Registry  │
                      │ (MangaDex, ComicK, etc.)  │
                      └───────────────────────────┘
```

---

## 2. Core Subsystems Delivered

1. **Provider Abstraction & Policy Layer (`src/services/providers/`)**:
   - Manifest-driven provider registration for 8 providers (`MangaDex`, `ComicK`, `WeebCentral`, `MangaKatana`, `Webtoon`, `MangaTown`, `MangaToon`, `MangaBuddy`).
   - Centralized health state machine, transport policies, and error handling.

2. **Canonical Entity Engine (`src/services/aggregation/`)**:
   - Multi-attribute identity resolution using normalized title, aliases, author, year, and status.
   - Snapshot serving layer, prioritized repair worker queue (`CRITICAL`, `HIGH`, `MEDIUM`, `LOW`), and confidence model scoring.

3. **Adaptive Reader Engine (`src/components/reader/`)**:
   - 5 Reading Modes: Webtoon (continuous long-strip), Single Vertical, Single Horizontal, Double Page, and RTL.
   - Versioned session persistence (`reader-session-v1`) storing `currentChapterId`, `lastReadPage`, `readingProgress %`, `chapterVersion`, and `lastReadAt`.
   - Memory-aware page preloader (`navigator.deviceMemory`, `saveData`).
   - Adaptive hedging delay clamping ($150\text{ms} \le \text{delay} \le 750\text{ms}$) with backup failover alert banners.

4. **UI & Route Data Loader Layer (`src/services/ui/`)**:
   - Route Data Loaders (`home.loader.ts`, `manga.loader.ts`, `reader.loader.ts`, `search.loader.ts`) parallelizing calls to `aggregator`.
   - Pure UI ViewModels with pre-formatted strings (`ratingLabel: "★★★★☆ 8.72"` or `"Not Rated"`) and UI decision flags (`showHero`, `showTrending`, `showProviderMatrix`).

5. **Instant Search & Typo Tolerance (`src/app/search/`)**:
   - Typo-tolerant alias search matching English, Romaji, and Japanese titles (e.g. `snk` $\rightarrow$ Attack on Titan, `kimetsu` $\rightarrow$ Demon Slayer).

6. **Operations Telemetry Admin Dashboard (`src/app/admin/`)**:
   - Real-time monitoring of provider health status, P95 latency, cache hit ratios, and quality tier distribution (`TIER_A`, `TIER_B`, `TIER_C`).

---

## 3. Supported Aggregated Providers

| Provider | Search | Reader | Covers | Trust Score | Status |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **MangaDex** | Yes | Yes | High-Res | 0.95 | Online |
| **ComicK** | Yes | Yes | High-Res | 0.90 | Online |
| **WeebCentral** | Yes | Yes | Standard | 0.85 | Online |
| **MangaKatana** | Yes | Yes | Standard | 0.80 | Online |
| **Webtoon** | Yes | Yes | High-Res | 0.95 | Online |
| **MangaToon** | Yes | Yes | Standard | 0.80 | Online |
| **MangaBuddy** | Yes | Yes | Standard | 0.75 | Online |
| **MangaTown** | Yes | Yes | Standard | 0.70 | Online |

---

## 4. Release Certification Verification Results

- **Data Certification Suite (`test-phase24-e2e-data.ts`)**: PASS (Zero duplicate canonical IDs, HTTPS URLs validated, 0-page drop protection).
- **Archived Data Audit (`generate-data-audit.ts`)**: PASS (JSON reports archived to `audits/audit-YYYY-MM-DD.json`).
- **Reader Journey Suite (`test-phase24-reader-journey.ts`)**: PASS (Session restore, 5 reading modes, zoom, hedged failover banner).
- **Post-Deployment Smoke Test (`test-phase24-smoke-test.ts`)**: PASS (Dynamic seed traversal across Home, Detail, Reader, Search).
- **Phase 21 Product Quality Suite (`test-phase21-quality-suite.ts`)**: PASS (20 / 20 checks).
- **Phase 20 Production Suite (`test-phase20-production-suite.ts`)**: PASS (15 / 15 checks).
- **Scale & Chaos Benchmarks (`test-benchmarks.ts`)**: PASS (9,141 ops/sec, +2.15 MB heap growth).
- **TypeScript Typecheck (`npx tsc --noEmit`)**: PASS (0 errors).
- **Restricted Health API (`/api/health`)**: PASS (200 OK).

---

## 5. Post-MVP Future Roadmap

- **v1.x — Operations & RUM**: Real-user monitoring, provider analytics, automated incident alerts, and cost optimization.
- **v2.x — Product Expansion**: Collections & lists, social comments, reading statistics heatmaps, and notifications.
