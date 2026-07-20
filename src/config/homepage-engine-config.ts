/**
 * Homepage Content Engine configuration.
 *
 * NOTE: Keep `layoutVersion` and `cacheVersion` separate — they are distinct concepts:
 *
 *   layoutVersion — the algorithm/schema version. Bump when the ranking formula,
 *                   section structure, or EngineResult shape changes. Used for
 *                   diagnostics and audit logs only.
 *
 *   cacheVersion  — the Redis cache compatibility version. Lives in homeService,
 *                   NOT here. The engine has no awareness of caching infrastructure.
 *
 * Future example:
 *   layoutVersion: "2.1"   ← algorithm refactored
 *   cacheVersion:  "v2"    ← cache payload schema changed (in homeService)
 */
export const HomepageEngineConfig = {
  layoutVersion: "1.3",
} as const;
