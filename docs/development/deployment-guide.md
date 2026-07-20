# Deployment Guide

```text
Document Version: 1.0
Last Updated: 2026-07-16
Status: Active Guide
```

This guide details the procedures for compiling, building, migrating, and deploying the MangaHub platform.

---

## 1. Development and Compilation Commands

Ensure your local server is running and database connections are operational:

- **Local Server**: `npm run dev`
- **TypeScript Compilation check**: `npx tsc --noEmit`
- **Lint Check**: `npm run lint`

---

## 2. Database Migrations

MangaHub uses Drizzle ORM. Database schemas must be synchronized before deploying web builds.

- **Check/Push Schema**:
  ```bash
  npm run db:push
  ```
  *Maps schema changes directly to the target database specified by `DIRECT_URL`.*
- **Open Database Studio**:
  ```bash
  npm run db:studio
  ```

---

## 3. Production Build

Test your build locally before deploying to ensure server components compile cleanly:

```bash
npm run build
```

---

## 4. Vercel Deployment

Deployments are automated through Vercel integrations. Ensure `vercel.json` maps rewrites and headers correctly:

### vercel.json structure:
```json
{
  "version": 2,
  "framework": "nextjs",
  "regions": ["sin1"],
  "cleanUrls": true
}
```

### Environment Variable Requirements:
Make sure the following variables are configured in the Vercel dashboard:
- `DATABASE_URL`: Connection string for general operations.
- `DIRECT_URL`: Database direct access connection string for migrations.
- `MANGADEX_API_URL`: Optional (defaults to `https://api.mangadex.org`).
- `NEXTAUTH_SECRET`: Secret key for JWT hashing.
- `UPSTASH_REDIS_REST_URL`: Caching layer URL.
- `UPSTASH_REDIS_REST_TOKEN`: Token for Redis client authorization.
