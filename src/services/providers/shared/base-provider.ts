import {
  IMangaProvider, ProviderCapabilities, ProviderConfig,
  RawProviderManga, RawProviderChapter, RawProviderPage,
  ProviderHealth, ProviderMetrics
} from "./types";
import { Transport } from "./transport/transport";
import { ProviderMetricsCollector } from "./metrics";
import { ProviderSnapshotWriter } from "./snapshots";
import type { ProviderManifest } from "./manifest-schema";

/**
 * Widened input type for the BaseProvider constructor.
 * JSON imports infer `manifestSchemaVersion` as `string`, not the literal `"1.0"`.
 * The Zod schema validates the actual value at registration time.
 */
export type ProviderManifestInput = Omit<ProviderManifest, "manifestSchemaVersion"> & {
  manifestSchemaVersion: string;
};

export abstract class BaseProvider implements IMangaProvider {
  public abstract readonly name: string;
  public abstract readonly version: string;

  protected readonly transport: Transport;
  private readonly _metrics: ProviderMetricsCollector;
  private readonly _snapshots: ProviderSnapshotWriter;
  private _confidenceSamples: number[] = [];

  // Expose manifest for registry introspection
  // Typed as ProviderManifestInput (string manifestSchemaVersion) to be assignable
  // from TypeScript JSON imports, which widen "1.0" → string. Zod validates at runtime.
  public readonly manifest: ProviderManifestInput;

  constructor(
    manifestOrConfig: ProviderManifestInput | ProviderConfig,
    public readonly capabilities: ProviderCapabilities
  ) {
    const isManifest = "manifestSchemaVersion" in manifestOrConfig;

    this.manifest = isManifest
      ? (manifestOrConfig as ProviderManifestInput)
      : this.synthesizeManifest(manifestOrConfig as ProviderConfig);

    const config: ProviderConfig = isManifest
      ? this.buildConfig(manifestOrConfig as ProviderManifestInput)
      : (manifestOrConfig as ProviderConfig);

    this._metrics   = new ProviderMetricsCollector();
    this._snapshots = new ProviderSnapshotWriter(this.manifest.id);
    this.transport  = new Transport(config, {
      metrics:   this._metrics,
      snapshots: this._snapshots,
    });
  }

  // ---------------------------------------------------------------------------
  // Public accessors
  // ---------------------------------------------------------------------------

  public get config(): ProviderConfig {
    return this.buildConfig(this.manifest);
  }

  /** Exposed for registry health computation without accessing private fields. */
  public get consecutiveFailures(): number {
    return this._metrics.getConsecutiveFailures();
  }

  public get metrics(): ProviderMetrics {
    return this._metrics.snapshot();
  }

  /**
   * Data quality confidence score 0–1, or null if insufficient samples.
   * Computed from titlesPresent, imageUrlsValid, and chapterNumbersValid checks
   * recorded via recordConfidenceSample().
   */
  public get confidence(): number | null {
    if (this._confidenceSamples.length < 5) return null;
    const sum = this._confidenceSamples.reduce((a, b) => a + b, 0);
    return Math.round((sum / this._confidenceSamples.length) * 100) / 100;
  }

  /** Called by provider implementations after parsing a response to record quality. */
  protected recordConfidenceSample(
    titlePresent: boolean,
    imageUrlValid: boolean,
    chapterNumberValid: boolean
  ): void {
    const score = [titlePresent, imageUrlValid, chapterNumberValid]
      .filter(Boolean).length / 3;
    this._confidenceSamples.push(score);
    // Keep a sliding window of last 50 samples
    if (this._confidenceSamples.length > 50) {
      this._confidenceSamples.shift();
    }
  }

  protected request(url: string, options?: RequestInit) {
    return this.transport.requestText(url, options);
  }

  // ---------------------------------------------------------------------------
  // Abstract interface
  // ---------------------------------------------------------------------------

  abstract searchManga(query: string, options?: Record<string, unknown>): Promise<RawProviderManga[]>;
  abstract getMangaDetail(providerMangaId: string): Promise<RawProviderManga>;
  abstract getChapters(providerMangaId: string): Promise<RawProviderChapter[]>;
  abstract getChapterPages(providerChapterId: string): Promise<RawProviderPage[]>;
  abstract healthCheck(): Promise<ProviderHealth>;

  // ---------------------------------------------------------------------------
  // Private helpers
  // ---------------------------------------------------------------------------

  private buildConfig(manifest: ProviderManifestInput): ProviderConfig {
    return {
      id: manifest.id,
      displayName: manifest.displayName,
      priority: manifest.priority,
      versions: {
        provider: manifest.providerVersion,
        parser: "1.0.0",
        schema: manifest.manifestSchemaVersion,
      },
      network: manifest.network
        ? {
            baseUrl:   manifest.baseUrl,
            timeoutMs: manifest.network.timeoutMs,
            retries:   manifest.network.retries,
            rateLimit: manifest.network.rateLimit,
          }
        : undefined,
      cache: manifest.cache,
      flags: {
        enabled:       manifest.enabled,
        searchEnabled: manifest.capabilities.search,
        readerEnabled: manifest.capabilities.reader,
        mergeEnabled:  manifest.capabilities.merge,
      },
    };
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private synthesizeManifest(config: ProviderConfig): any {
    // Fallback for any old-style ProviderConfig that doesn't have a manifest
    return {
      manifestSchemaVersion: "1.0",
      id: config.id || "unknown",
      displayName: config.displayName || "Unknown",
      providerVersion: config.versions?.provider || "1.0.0",
      priority: config.priority,
      baseUrl: config.network?.baseUrl || "",
      network: config.network,
      cache: config.cache,
      capabilities: {
        search:   config.flags?.searchEnabled ?? true,
        latest:   true,
        trending: false,
        merge:    config.flags?.mergeEnabled ?? true,
        reader:   config.flags?.readerEnabled ?? true,
      },
      enabled: config.flags?.enabled ?? config.enabled ?? true,
    };
  }
}
