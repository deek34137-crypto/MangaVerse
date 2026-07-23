# Project Context

```text
Specification Version: 1.0
Last Updated: 2026-07-16
Status: Active Session Entry Point
```

This file serves as the primary technical entry point for any development session on MangaHub. Read this file completely before writing code.

---

## 1. Project Overview

MangaHub is a production-grade multi-provider manga aggregator. It queries metadata, chapters, and image paths from various third-party manga scrapers, merges the results into a unified canonical index, resolves conflicts dynamically, and serves the content through a modern reader UI.

---

## 2. Tech Stack

- **Core**: HTML5, Next.js 16 (App Router), React 19, TypeScript
- **Styling**: TailwindCSS, Vanilla CSS, Radix UI colors and components
- **Database**: PostgreSQL with Drizzle ORM
- **Cache**: Upstash Redis (Serverless Cache)
- **Scraping**: Cheerio
- **Validation**: Zod (Runtime validation)
- **Auth**: NextAuth.js (v5 beta)

---

## 3. Folder Structure

```text
mangahub/
├── docs/                     # Project documentation
│   ├── architecture/         # High-level architecture specifications
│   │   ├── master-blueprint.md
│   │   ├── provider-development-guide.md
│   │   ├── aggregator-merge-spec.md
│   │   ├── image-proxy-spec.md
│   │   └── provider-operations-runbook.md
│   ├── development/          # Technical workflows & coding guides
│   │   ├── coding-standards.md
│   │   ├── project-conventions.md
│   │   ├── testing-guide.md
│   │   └── deployment-guide.md
│   └── decisions/            # ADRs
├── drizzle/                  # Drizzle ORM generated migration queries
├── public/                   # Static icons and assets
├── scripts/                  # Command-line diagnostics, tests, and workers
└── src/                      # Source code
    ├── actions/              # Server Actions
    ├── app/                  # Next.js App Router (Views and APIs)
    ├── components/           # React UI components
    ├── db/                   # Drizzle schema definitions and pool setup
    ├── lib/                  # Resiliency libraries (rate limits, circuit breakers)
    └── services/             # Core business logic (cache, sync, providers)
        └── providers/        # Scraper plugin modules
```

---

## 4. Documentation Index

The following specifications serve as the source of truth for the project:

### Architecture Specs
1. [Master Production Blueprint](file:///c:/Users/kumku/MangaHub/mangahub/docs/architecture/master-blueprint.md) - Provider framework, state, and SLO definitions.
2. [Inkline 2.2.1 Design System Standard](file:///c:/Users/kumku/MangaHub/mangahub/docs/architecture/inkline-design-system.md) - Immutable 7-Layer Design System architecture, tokens, and primitives.
3. [Product Architecture Specification](file:///c:/Users/kumku/MangaHub/mangahub/docs/architecture/product-architecture.md) - Core product engines, Phase 1-4 roadmap, and system composition.
4. [Provider Development Guide](file:///c:/Users/kumku/MangaHub/mangahub/docs/architecture/provider-development-guide.md) - Standard layout, `BaseProvider` class, and certification checks.
5. [Aggregator Merge Specification](file:///c:/Users/kumku/MangaHub/mangahub/docs/architecture/aggregator-merge-spec.md) - Trust scores, merge logic, and database schemas.
6. [Image Proxy Specification](file:///c:/Users/kumku/MangaHub/mangahub/docs/architecture/image-proxy-spec.md) - SSRF blocking, referrer injection, caching, and stream sizes.
7. [Provider Operations Runbook](file:///c:/Users/kumku/MangaHub/mangahub/docs/architecture/provider-operations-runbook.md) - Dashboards, state lifecycles, and disaster recovery.

### Development Guides
1. [Coding Standards](file:///c:/Users/kumku/MangaHub/mangahub/docs/development/coding-standards.md) - Type safety, SOLID principles, and Zod checks.
2. [Project Conventions](file:///c:/Users/kumku/MangaHub/mangahub/docs/development/project-conventions.md) - Naming conventions and Drizzle parameters.
3. [Testing Guide](file:///c:/Users/kumku/MangaHub/mangahub/docs/development/testing-guide.md) - Using HTML fixtures and local test scripts.
4. [Deployment Guide](file:///c:/Users/kumku/MangaHub/mangahub/docs/development/deployment-guide.md) - Compilation, migrations, and environment setups.

---

## 5. Development Operations

### Key Build & Run Commands
- Run local server: `npm run dev`
- Run DB Migration: `npm run db:push`
- Open DB Studio: `npm run db:studio`
- Build production check: `npm run build`
- Type-check compile: `npx tsc --noEmit`
- Run E2E tests: `npm run test:e2e`

### Environment Variables
Setup `.env` in root containing:
- `DATABASE_URL`: Standard query database pool
- `DIRECT_URL`: Direct database connection for schema pushes
- `MANGADEX_API_URL`: Base endpoint
- `NEXTAUTH_SECRET`: Secret key for JWT hashing
- `UPSTASH_REDIS_REST_URL`: Upstash connection URL
- `UPSTASH_REDIS_REST_TOKEN`: Upstash token

---

## 6. Current Implementation Status & Roadmap

### Scrapers Status
- **MangaDex**: `Active` (API based)
- **ComicK**: `Active` (API based)
- **WeebCentral**: `Active` (HTML scraping)
- **MangaKatana**: `Active` (HTML scraping)
- **WEBTOON**: `Planning Finalized` (Next integration target)
- **MangaToon**: `Planning Finalized` (Next integration target)
- **MangaBuddy**: `Planning Finalized` (Next integration target)
- **MangaTown**: `Planning Finalized` (Next integration target)

---

## 7. AI Instructions & Workflow

> [!IMPORTANT]
> **Mandatory AI Directives:**
> 1. **Read Before Writing**: Read this `project_context.md` before making any code changes in any session.
> 2. **Check Linked Specs**: Always read the linked architecture specifications before implementing features.
> 3. **Follow Patterns**: Follow the modular plugin architecture defined in the guides. Use `BaseProvider` and write parsers as pure functions.
> 4. **No Code Duplication**: Do not write redundant fetching, rate-limiting, or logging code. Use shared infrastructure under `src/services/providers/shared/`.
> 5. **Schema Checks**: Validate all incoming objects at boundaries using Zod.
> 6. **Zero Regression**: Maintain backward compatibility and verify compilation using `npx tsc --noEmit` before concluding.

### Structured AI Workflow
1. Read `project_context.md` and check active documentation links.
2. Read the specific architecture specifications linked above matching the current task.
3. Inspect existing implementations in `src/services/providers/`.
4. Outline a concise step-by-step implementation plan.
5. Code incrementally.
6. Verify compilation and run local tests (`npx tsx scripts/test-...`).
7. Update documentation files if design details shift.
