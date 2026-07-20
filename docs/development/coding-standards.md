# Coding Standards

```text
Document Version: 1.0
Last Updated: 2026-07-16
Status: Active Guide
```

This guide establishes the coding standards and quality practices to maintain a scalable, readable, and highly resilient codebase for the MangaHub project.

---

## 1. Type Safety & TypeScript Guidelines

- **Strict Mode**: `tsconfig.json` runs with `"strict": true`. All variables, function parameters, and return types must be explicitly typed.
- **Avoid `any`**: The `any` type is strictly forbidden unless absolutely necessary for low-level library interfaces (e.g. mapping raw third-party responses). Always prefer `unknown` coupled with runtime type guards, or `Record<string, unknown>`.
- **Enums vs. Union Types**:
  - Prefer string union types (e.g. `'ongoing' | 'completed'`) for transient models or mapping inputs.
  - Use `readonly const` or TypeScript `enum` structures when values represent critical, indexable states (e.g. `ProviderCapability` or `ProviderHealth`).

---

## 2. SOLID Design Principles

- **Single Responsibility (SRP)**: Each class/module must have exactly one reason to change.
  - *Scrapers*: Do not mix fetch calls (`client.ts`), CSS queries (`selectors.ts`), DOM parsing (`parser.ts`), and type transformation (`mapping.ts`). Keep them strictly separated.
- **Open/Closed (OCP)**: Code should be open for extension but closed for modification.
  - Register new scrapers dynamically using the `ProviderRegistry` lazy factories rather than mutating core synchronization loops.
- **Dependency Inversion (DIP)**: High-level orchestration layers must depend on abstractions (`IMangaProvider`), not concrete implementations (`MangaDexProvider`).

---

## 3. Runtime Schema Validation (Zod)

Every boundary where external data enters the system must be validated using Zod:
1. **API Requests**: Route handlers must parse query params and request bodies using Zod schemas.
2. **Provider Scrapers**: Parsed metadata must satisfy Zod validations before database insertion or caching.
3. **Environment Variables**: Load and validate `.env` configs during startup, failing fast if mandatory items like `DIRECT_URL` are missing.

```typescript
import { z } from "zod";

export const RawProviderMangaSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  coverImage: z.string().url().optional().or(z.literal("")),
  genres: z.array(z.string()).default([]),
  authors: z.array(z.string()).default([])
});
```

---

## 4. Code Reuse & DRY

- **Shared Infrastructure**: Reuse existing wrappers for database operations, rate limiting, logging, and circuit breakers. Never re-implement a retry loop or HTTP fetch configuration.
- **Utility Methods**: Place common parsers, string cleanups, and date transformations in `src/utils/` rather than duplicating them in separate provider modules.
