# Provider Operations Runbook

```text
Specification Version: 1.0
Last Updated: 2026-07-16
Compatibility: MangaHub Aggregator v1.0
Status: Frozen / Reference Runbook
```

This document details the recovery protocols, monitoring configurations, and incident response procedures for managing manga scraper plugins.

---

## 1. Operations Dashboard Widgets

The operations dashboard provides real-time visibility into the health of all scrapers, rendering:

1. **Provider Status Grid**: Table showing all active providers and their current status (`Healthy`, `Slow`, `RateLimited`, `Degraded`, `Offline`, `Maintenance`).
2. **Circuit Breaker Status**: Indicators indicating whether the circuit is `closed`, `open`, or `half-open`.
3. **Average Latency**: Latency charts for search, details, and chapter page fetches.
4. **Cache Metrics**: Real-time cache hit/miss ratio charts (Target: `> 80%`).
5. **Requests / Min (RPM)**: Output traffic rate to track rate limit thresholds.
6. **Active Provider Versions**: Listing of current `Provider`, `Parser`, and `Schema` versions.
7. **Feature Flags Controller**: Buttons to toggle `enabled`, `searchEnabled`, `readerEnabled`, and `mergeEnabled` globally per provider.

---

## 2. State & Recovery Cycles

### State Logic
```
Healthy: Consecutive Failures = 0, Latency < 1.5s
   │
   ▼ (Consecutive Failures >= 5)
Degraded: Skip metadata merges; route traffic to healthy fallbacks.
   │
   ▼ (Consecutive Failures >= 15)
Offline: Circuit breaker opens. Stop all traffic for 5 minutes.
   │
   ▼ (After 5 minutes cooldown)
Half-Open: Route 1 test request.
   ├── Success -> Reset to Healthy (Consecutive Failures = 0)
   └── Failure -> Re-open Circuit (Back to Offline, double cooldown time)
```

---

## 3. Database Migration & Onboarding Guide

To register and migrate a new provider into production:
1. **Scaffold files**: Use `npm run generate:provider <provider_id>`.
2. **Write Implementation**: Code the Parser, Client, Mapper, and Provider classes.
3. **Write Fixture Tests**: Run local validations against static fixtures.
4. **Register**: Add the provider lazy factory in `src/services/providers/index.ts`.
5. **Initialize Metadata**: Add the provider entry into the database configuration.
6. **Initial Ingestion**: Execute initial synchronizations to map existing catalogs.
7. **Build Index**: Regenerate search parameters.
8. **Enable Flags**: Toggle the provider's feature flags in settings to start serving traffic.

---

## 4. Disaster Recovery Procedures

### Scenario A: Corrupted Metadata Merge
- **Cause**: Buggy parser mapped invalid HTML fields into canonical attributes.
- **Recovery Action**:
  1. Toggle feature flag `mergeEnabled: false` for the failing provider.
  2. Locate the database entities using `MangaMapping` linked to the provider.
  3. Clear corrupted values or re-trigger metadata sync using other providers.

### Scenario B: Search Index Corruption
- **Cause**: Massive parallel imports corrupted search token indexing.
- **Recovery Action**:
  1. Halt cron job syncs.
  2. Execute reindex command: `npm run db:reindex`.

### Scenario C: Cache Poisoning
- **Cause**: Broken scraper saved bad mock details or redirects in Redis.
- **Recovery Action**:
  1. Run the cache clear command: `npm run cache:clear -- --provider=<provider_id>`.
  2. Re-route searches directly to databases while the cache warms up.
