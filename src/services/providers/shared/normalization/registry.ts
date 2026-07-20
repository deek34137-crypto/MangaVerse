import type { IMangaProvider, ProviderMetadata, ProviderState } from "@/services/providers/shared/types";
import { ProviderManifestSchema } from "@/services/providers/shared/manifest-schema";
import type { BaseProvider } from "@/services/providers/shared/base-provider";

export type ProviderEntry = ProviderMetadata & { state?: ProviderState };

export class ProviderRegistry {
  private factories  = new Map<string, () => IMangaProvider>();
  private instances  = new Map<string, IMangaProvider>();

  // ---------------------------------------------------------------------------
  // Registration
  // ---------------------------------------------------------------------------

  /**
   * Register a provider factory.
   * The factory is validated against the Zod manifest schema when the provider
   * is first instantiated (lazy). If you want eager validation, call register()
   * with a pre-built manifest check.
   */
  public register(name: string, factory: () => IMangaProvider): void {
    const key = name.toLowerCase();
    if (this.factories.has(key)) {
      // Already registered — skip silently (prevents duplicate logs on HMR / cold boot)
      return;
    }
    this.factories.set(key, factory);
    console.log(`[ProviderRegistry] Registered factory for provider: ${name}`);
  }

  public has(name: string): boolean {
    return this.factories.has(name.toLowerCase());
  }

  // ---------------------------------------------------------------------------
  // Instance retrieval (lazy)
  // ---------------------------------------------------------------------------

  public get(name: string): IMangaProvider {
    const key = name.toLowerCase();

    if (this.instances.has(key)) {
      return this.instances.get(key)!;
    }

    const factory = this.factories.get(key);
    if (!factory) {
      throw new Error(`[ProviderRegistry] Unknown provider requested: ${name}`);
    }

    const instance = factory();

    // Validate manifest if the provider extends BaseProvider
    const base = instance as unknown as BaseProvider;
    if (base.manifest) {
      const result = ProviderManifestSchema.safeParse(base.manifest);
      if (!result.success) {
        throw new Error(
          `[ProviderRegistry] Manifest validation failed for provider "${name}":\n` +
          result.error.errors.map((e) => `  ${e.path.join(".")}: ${e.message}`).join("\n")
        );
      }
    }

    this.instances.set(key, instance);
    console.log(`[ProviderRegistry] Instantiated provider: ${name} (lazy-loaded)`);
    return instance;
  }

  public getAll(): IMangaProvider[] {
    for (const name of this.factories.keys()) {
      this.get(name);
    }
    return Array.from(this.instances.values());
  }

  /**
   * Returns only providers where enabled = true, sorted by priority (ascending).
   */
  public getEnabled(): IMangaProvider[] {
    return this.getAll()
      .filter((p) => {
        if (p.config.flags && typeof p.config.flags.enabled === "boolean") {
          return p.config.flags.enabled;
        }
        return p.config.enabled !== false;
      })
      .sort((a, b) => a.config.priority - b.config.priority);
  }

  // ---------------------------------------------------------------------------
  // Metadata introspection
  // ---------------------------------------------------------------------------

  /**
   * Returns full metadata + runtime state for every registered provider,
   * including disabled ones. Used by admin dashboards and health APIs.
   */
  public getProviders(): ProviderEntry[] {
    // Ensure all factories have been instantiated
    this.getAll();

    return Array.from(this.instances.entries()).map(([, instance]) => {
      const base = instance as unknown as BaseProvider;
      const manifest = base.manifest;

      const metadata: ProviderMetadata = manifest
        ? {
            id:                    manifest.id,
            displayName:           manifest.displayName,
            providerVersion:       manifest.providerVersion,
            manifestSchemaVersion: manifest.manifestSchemaVersion,
            priority:              manifest.priority,
            capabilities:          instance.capabilities,
            enabled:               manifest.enabled,
            disabledReason:        manifest.reason,
          }
        : {
            id:                    instance.config.id || instance.name.toLowerCase(),
            displayName:           instance.config.displayName || instance.name,
            providerVersion:       instance.version,
            manifestSchemaVersion: "unknown",
            priority:              instance.config.priority,
            capabilities:          instance.capabilities,
            enabled:               instance.config.flags?.enabled ?? instance.config.enabled ?? true,
          };

      const entry: ProviderEntry = { ...metadata };

      // Attach runtime state if the provider exposes metrics
      if (typeof base.metrics !== "undefined") {
        const metrics = base.metrics;
        const consecutiveFailures = base.consecutiveFailures ?? 0;

        entry.state = {
          health: {
            status:              computeHealthStatus(metrics, consecutiveFailures),
            latencyMs:           metrics.rolling.averageLatencyMs,
            lastSuccessAt:       metrics.lifetime.lastSuccessAt ?? new Date(0),
            errorRate:           1 - metrics.rolling.successRate,
            consecutiveFailures,
          },
          metrics,
          confidence: base.confidence ?? null,
          lastChecked: metrics.lifetime.lastRequestAt,
        };
      }

      return entry;
    });
  }

  // ---------------------------------------------------------------------------
  // Lifecycle
  // ---------------------------------------------------------------------------

  public async initializeAll(): Promise<void> {
    const enabled = this.getEnabled();
    for (const provider of enabled) {
      if (provider.initialize) {
        console.log(`[ProviderRegistry] Initializing ${provider.name}...`);
        await provider.initialize();
      }
    }
  }

  public async shutdownAll(): Promise<void> {
    for (const provider of this.instances.values()) {
      if (provider.shutdown) {
        console.log(`[ProviderRegistry] Shutting down ${provider.name}...`);
        await provider.shutdown();
      }
    }
  }
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

function computeHealthStatus(
  metrics: import("@/services/providers/shared/types").ProviderMetrics,
  consecutiveFailures: number
): import("@/services/providers/shared/types").ProviderHealth["status"] {
  const r = metrics.rolling;
  if (consecutiveFailures >= 5)                        return "OFFLINE";
  if (r.requestCount > 0 && r.successRate < 0.3)      return "OFFLINE";
  if (r.requestCount > 0 && (r.successRate < 0.75 || r.averageLatencyMs > 3000)) return "DEGRADED";
  return "ONLINE";
}

// ---------------------------------------------------------------------------
// Singleton — persisted in globalThis to survive Next.js HMR reloads
// ---------------------------------------------------------------------------

const REGISTRY_KEY = Symbol.for("__mangahub_providerRegistry__");

function getOrCreateRegistry(): ProviderRegistry {
  const g = globalThis as typeof globalThis & { [key: symbol]: ProviderRegistry };
  if (!g[REGISTRY_KEY]) {
    g[REGISTRY_KEY] = new ProviderRegistry();
  }
  return g[REGISTRY_KEY];
}

export const providerRegistry = getOrCreateRegistry();
export default providerRegistry;
