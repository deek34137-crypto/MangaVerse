# Project Conventions

```text
Document Version: 1.0
Last Updated: 2026-07-16
Status: Active Guide
```

This document maps out directory layouts, naming rules, database mapping expectations, and general architecture conventions.

---

## 1. Directory Structure

MangaHub is a Next.js (App Router) project integrated with Drizzle ORM and PostgreSQL:

```text
src/
├── actions/         # Server Actions for form submissions and mutations
├── animations/      # Framer Motion animation configurations
├── app/             # App Router pages and API routes
├── components/      # UI components (Atomic design structure)
│   ├── ui/          # Low-level primitives (Radix UI, buttons, inputs)
│   └── common/      # Composite layout components (Headers, Sidebars)
├── config/          # Central configuration settings
├── db/              # Database initialization, schemas, and seeds
├── hooks/           # Shared React hooks
├── lib/             # Utility classes (circuit-breaker, rate-limiter)
├── services/        # Business logic services (cache, providers, aggregator)
├── types/           # Core TypeScript definitions
└── utils/           # Helper scripts
```

---

## 2. Naming Conventions

- **Folders**: Lowercase separated by dashes (kebab-case), e.g. `src/services/providers/weebcentral/`.
- **TypeScript Files**: kebab-case for utilities/types; PascalCase for React components (e.g. `MangaReader.tsx`).
- **Classes**: PascalCase (e.g. `MangaDexProvider`).
- **Variables / Functions**: camelCase (e.g. `searchManga`).
- **Constants**: Upper Snake Case (e.g. `BASE_URL`).

---

## 3. Import Aliases

Always use the `@/` path alias pointing to the `src/` directory. Relative imports going up multiple directories (e.g., `../../../../`) are forbidden:

* **Correct**: `import { Transport } from "@/services/providers/transport";`
* **Incorrect**: `import { Transport } from "../../../../providers/transport";`

---

## 4. Drizzle ORM Guidelines

- **Schema definition**: Define schemas under `src/db/schema.ts` or separated files. Always name columns in snake_case inside the database and map them to camelCase inside TypeScript:

```typescript
import { pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

export const manga = pgTable("manga", {
  id: uuid("id").primaryKey().defaultRandom(),
  title: text("title").notNull(),
  coverImage: text("cover_image"),
  createdAt: timestamp("created_at").defaultNow().notNull()
});
```

- **Migrations**: Always generate migrations via drizzle-kit schema pushes or generated SQL scripts. Do not alter tables manually inside the PostgreSQL database.
