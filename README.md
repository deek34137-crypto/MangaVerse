# MangaHub Aggregator

MangaHub is a production-grade multi-provider manga aggregator built using Next.js 16, React 19, TypeScript, Drizzle ORM, and PostgreSQL.

---

## 📖 Documentation Index

For detailed architectural specs, guides, and developer documentation, please start with:
- **[Project Context (`project_context.md`)](./project_context.md)**: The primary entry point for any development or AI session.

### Technical Architecture
- [Master Production Blueprint](./docs/architecture/master-blueprint.md)
- [Provider Development Guide](./docs/architecture/provider-development-guide.md)
- [Aggregator Merge Specification](./docs/architecture/aggregator-merge-spec.md)
- [Image Proxy Specification](./docs/architecture/image-proxy-spec.md)
- [Provider Operations Runbook](./docs/architecture/provider-operations-runbook.md)

### Development & Operational Guidelines
- [Coding Standards](./docs/development/coding-standards.md)
- [Project Conventions](./docs/development/project-conventions.md)
- [Testing Guide](./docs/development/testing-guide.md)
- [Deployment Guide](./docs/development/deployment-guide.md)

---

## Getting Started

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment
Create a `.env` file in the root based on `.env.example` and populate:
- `DATABASE_URL` / `DIRECT_URL` (PostgreSQL)
- `UPSTASH_REDIS_REST_URL` / `UPSTASH_REDIS_REST_TOKEN` (Redis Cache)

### 3. Run migrations
```bash
npm run db:push
```

### 4. Start Development Server
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser to view the application.
