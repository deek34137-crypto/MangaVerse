# MangaHub Product Architecture Specification

```text
Specification Version: 1.0
Status: Master Product & Engine Architecture
Last Updated: 2026-07-23
Sits Alongside: docs/architecture/inkline-design-system.md
```

---

## 1. Product Architectural Hierarchy

While `inkline-design-system.md` governs how the UI looks and behaves, this specification governs **how the MangaHub product engines operate and compose**.

```text
MangaHub Application
├── Inkline 2.2.1 Design System (Frontend UI & Micro-interactions)
├── Multi-Provider Aggregator Platform (Scrapers, Trust Scores, De-duplication)
├── Phase 1: Discovery Engine (Typo-Tolerant Search, Multi-Provider Queries, Filters)
├── Phase 2: Reader Platform Engine (Predictive Prefetching, Offline Caching, Sync)
├── Phase 3: Personal Library System (Collections, Progress Tracking, Goals)
└── Phase 4: Recommendation Engine (Collaborative & Content-Based Filtering)
```

---

## 2. Product Architecture Principles

1. **Separation of UI and Engine Logic**: The design system handles chrome, layout, and presentation. Engines handle search indexing, scraper normalization, reader prefetching, and state sync.
2. **Resilient Multi-Provider Aggregation**: Content metadata is dynamically resolved, merged, and cache-backed across providers without exposing scraper failures to the reader.
3. **Immediate Scannability & Speed**: Search, chapter loading, and library state transitions target sub-100ms response times.
4. **Data Privacy & Local-First Resilience**: Reading progress and library states are cached locally first, then synchronized asynchronously with the server.

---

## 3. Product Engine Specifications & Roadmap

### Phase 1 — Discovery Engine (Highest Priority)
- **Typo-Tolerant Search**: Fuzzy match indexing across titles, alt titles, authors, and genres (`fuzzyMatch`).
- **Multi-Provider Search Execution**: Parallel querying across active scraper plugins (MangaDex, ComicK, WeebCentral, MangaKatana).
- **Advanced Filtering & Ranking**: Multi-attribute filtering (Status, Type, Demographic, Genre, Rating) with relevance ranking.
- **Search Suggestions & Recent Queries**: Instant auto-complete overtitles and client-side recent search persistence.

### Phase 2 — Reader Platform Engine (Retention Engine)
- **Predictive Prefetching**: Background loading of upcoming chapter pages (`useChapterDetail`) based on reading speed and scroll depth.
- **Offline Caching**: Service worker and Upstash Redis caching for offline reading capability.
- **Cross-Device Reading Sync**: Seamless checkpoint saving (`sessionStorage` + backend API) allowing readers to resume exact chapter and page offsets.
- **Reading Analytics & Resume Reliability**: Real-time position persistence with instant recovery.

### Phase 3 — Personal Library System
- **Custom Collections & Categories**: Reading, Completed, On Hold, Dropped, Plan to Read, Rereading.
- **Progress Tracking & Reading Goals**: Chapter counter meters, annual reading challenges, and history timestamps.
- **Favorites & Watchlists**: One-click library status updates with quick action dropdowns.

### Phase 4 — Recommendation Engine (Data-Driven Discovery)
- **Similar Series & Adaptations**: Content-based filtering using genre tags, demographic overlap, and author/artist mappings.
- **"Because You Read..."**: Personalized suggestions derived from reading history and library status trends.
- **Collaborative Filtering**: Aggregated user rating trends and popular discovery shelves.

---

## 4. Immutable vs. Evolving Boundaries

### Permanently Frozen (Design System Standards)
- Inkline 2.2.1 7-Layer Framework
- Brand colors (Vermilion `#C6303E`, Ink `#0B0B0C`, Restrained Gold `#B8934F`)
- Typography (Fraunces Title Case headings, Inter overtitles, JetBrains Mono `CH.129`)
- Surface elevations (0–4) & Radius scale (14px/10px/18px/pill)
- 3-Tier dividers & 4-Tier badges
- Disappearing Reader philosophy

### Evolving Product Features (Driven by Usage Data)
- Homepage section ordering & shelf composition
- Recommendation ranking models
- Search result scoring weights
- Library feature modules & reading goal tracking
