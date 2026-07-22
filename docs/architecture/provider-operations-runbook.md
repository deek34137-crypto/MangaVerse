# Provider Operations Runbook

Version: 1.1  
Last Updated: 2026-07-22  
Related Phase: Phase 2 & Phase 9  
Related Components:  
- ProviderHealthModel  
- ProviderMetricsCollector  
- CircuitBreaker  
- OperationsDashboard  

This document details the recovery protocols, monitoring configurations, health models, and incident response procedures for managing manga scraper plugins in MangaHub.

---

## 1. Operations Dashboard Widgets

The operations dashboard provides real-time visibility into the health of all scrapers, rendering:

1. **Provider Status Grid**: Table showing all active providers and their current 5-state health status (`ONLINE`, `DEGRADED`, `RATE_LIMITED`, `BLOCKED`, `OFFLINE`).
2. **Circuit Breaker Status**: Indicators indicating whether the circuit is `closed`, `open`, or `half-open`.
3. **Average Latency**: Latency charts for search, details, and chapter page fetches computed from 15-minute rolling metrics windows (`ProviderMetricsCollector`).
4. **Data Quality Confidence**: Confidence score (0–1) calculated from recorded parsing samples (`recordConfidenceSample()`).
5. **Debug Snapshots**: Diagnostics logger (`ProviderSnapshotWriter`) gated by `PROVIDER_SNAPSHOTS=true` for deep troubleshooting.
6. **Active Provider Versions**: Listing of current `Provider`, `Parser`, and `Schema` versions declared in `provider.json`.
7. **Feature Flags Controller**: Buttons to toggle `enabled`, `searchEnabled`, `readerEnabled`, and `mergeEnabled` globally per provider.

---

## 2. 5-State Provider Health Model & Recovery Cycles

### State Transition Logic
```text
ONLINE: Rolling Success Rate > 95%, Average Latency < 2.0s
   │
   ▼ (Consecutive Failures >= 5 or HTTP 429)
RATE_LIMITED / DEGRADED: Skip metadata merges; route traffic to healthy fallbacks.
   │
   ▼ (Consecutive Failures >= 10 or HTTP 403 / Bot Blocked)
BLOCKED / OFFLINE: Circuit breaker opens. Stop all traffic for 5-minute cooldown.
   │
   ▼ (After 5 minutes cooldown)
HALF-OPEN: Route 1 test request.
   ├── Success -> Reset to ONLINE (Consecutive Failures = 0)
   └── Failure -> Re-open Circuit (Back to OFFLINE, double cooldown time)
```

---

## 3. Provider Generator & Onboarding Guide

To register and migrate a new provider into production:
1. **Scaffold files**: Use `npm run generate:provider <provider_id>`.
2. **Write Implementation**: Code `provider.json` manifest, Parser, Client, Mapper, and Provider classes.
3. **Write Fixture Tests**: Run local validations against static fixtures.
4. **Register**: Add the provider lazy factory in `src/services/providers/index.ts`.
5. **Run Certification**: Execute 9-check test suite (`scripts/test-provider-suite.ts`).
6. **Image Proxy Whitelist**: Add provider domain and CDN hosts to `ALLOWED_HOSTS` in `src/app/api/image/route.ts`.
7. **Enable Flags**: Set `"enabled": true` in `provider.json` to start serving traffic.

---

## 4. Disaster Recovery Procedures

### Scenario A: Corrupted Metadata Merge
- **Cause**: Buggy parser mapped invalid HTML fields into canonical attributes.
- **Recovery Action**:
  1. Toggle feature flag `mergeEnabled: false` in provider manifest or admin UI.
  2. Locate database entities using `MangaMapping` linked to the failing provider.
  3. Clear corrupted values or re-trigger metadata sync using higher confidence providers.

### Scenario B: Search Index Corruption
- **Cause**: Massive parallel imports corrupted search token indexing.
- **Recovery Action**:
  1. Halt sync tasks.
  2. Execute reindex command: `npm run db:reindex`.

### Scenario C: Cache Poisoning
- **Cause**: Broken scraper saved bad mock details or redirects in Redis.
- **Recovery Action**:
  1. Run the cache clear command: `npm run cache:clear -- --provider=<provider_id>`.
  2. Re-route searches directly to databases while the cache warms up.

---

## 5. Known Certification Exceptions

```text
Provider: MangaKatana
Check: 8. Cache Behavior
Reason: Current implementation bypasses L1/L2 memory cache for search requests.
Impact: Performance measurement only (2nd search request takes ~313ms vs target <180ms under live network variance). No functional impact on search, detail, chapter, or image extraction.
Owner: Future Phase (Provider Performance & Cache Optimization)
Status: Accepted Technical Debt
```

