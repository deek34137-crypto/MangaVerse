import { z } from "zod";

// ---------------------------------------------------------------------------
// Current manifest schema version
// Increment this when the manifest shape changes in a breaking way.
// ---------------------------------------------------------------------------
export const MANIFEST_SCHEMA_VERSION = "1.0" as const;

/**
 * Zod schema for provider.json manifests.
 *
 * All providers must pass this validation before being accepted by the
 * ProviderRegistry. A malformed manifest throws a ZodError at startup,
 * preventing the provider from entering the registry.
 */
export const ProviderManifestSchema = z.object({
  manifestSchemaVersion: z.literal("1.0"),

  /** Lowercase kebab-case identifier, unique across all providers. */
  id: z.string().min(1).regex(/^[a-z][a-z0-9-]+$/, {
    message: "Provider ID must be lowercase kebab-case (e.g. 'manga-dex')",
  }),

  displayName: z.string().min(1),

  /** Semantic version of the provider implementation. */
  providerVersion: z.string().regex(/^\d+\.\d+\.\d+$/, {
    message: "providerVersion must follow semver (e.g. '1.0.0')",
  }),

  /** Lower number = higher priority in merge / routing decisions. */
  priority: z.number().int().min(1).max(1000),

  /** Base URL of the provider's API or website. */
  baseUrl: z.string().url(),

  network: z.object({
    timeoutMs: z.number().int().min(1000).max(60000),
    retries:   z.number().int().min(0).max(10),
    rateLimit: z.object({
      maxRequests: z.number().int().min(1),
      intervalMs:  z.number().int().min(100),
    }),
  }),

  cache: z.object({
    ttlSearchMs:   z.number().int().positive(),
    ttlMangaMs:    z.number().int().positive(),
    ttlChaptersMs: z.number().int().positive(),
    ttlPagesMs:    z.number().int().positive(),
  }),

  capabilities: z.object({
    search:   z.boolean(),
    latest:   z.boolean(),
    trending: z.boolean(),
    merge:    z.boolean(),
    reader:   z.boolean(),
  }),

  enabled: z.boolean(),

  /**
   * Required when enabled = false.
   * Explains why the provider is disabled (e.g. "Cloudflare Managed Challenge").
   */
  reason: z.string().optional(),
}).refine(
  (manifest) => manifest.enabled || !!manifest.reason,
  { message: "Disabled providers must include a 'reason' field." }
);

export type ProviderManifest = z.infer<typeof ProviderManifestSchema>;
