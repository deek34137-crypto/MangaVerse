/**
 * Reader Engine v2 Configuration Layer & Governance
 * Config versioning, migration strategy, and deprecation flags.
 */

export interface ReaderEngineConfig {
  CONFIG_VERSION: string;
  MAX_DOM_NODES: number;
  PREFETCH_DEPTH: number;
  RETRY_LIMIT: number;
  BUFFER_SIZE: number;
  IMAGE_TIMEOUT: number;
  GESTURE_THRESHOLD: number;
  MAX_CACHE_SIZE_MB: number;
  IMAGE_DECODE_TIMEOUT_MS: number;
  TELEMETRY_FLUSH_INTERVAL_MS: number;
  DEPRECATED_FLAGS?: Record<string, boolean>;
}

export const DEFAULT_READER_CONFIG: ReaderEngineConfig = {
  CONFIG_VERSION: "2.0.0",
  MAX_DOM_NODES: 50,
  PREFETCH_DEPTH: 3,
  RETRY_LIMIT: 3,
  BUFFER_SIZE: 2,
  IMAGE_TIMEOUT: 15000,
  GESTURE_THRESHOLD: 15, // px
  MAX_CACHE_SIZE_MB: 250,
  IMAGE_DECODE_TIMEOUT_MS: 5000,
  TELEMETRY_FLUSH_INTERVAL_MS: 30000,
  DEPRECATED_FLAGS: {
    USE_LEGACY_CANVAS_RENDERER: false,
  },
};

export function migrateConfig(userConfig: Partial<ReaderEngineConfig>): ReaderEngineConfig {
  if (!userConfig.CONFIG_VERSION || userConfig.CONFIG_VERSION !== DEFAULT_READER_CONFIG.CONFIG_VERSION) {
    console.info(`[ReaderConfig] Migrating config from ${userConfig.CONFIG_VERSION || "v1"} to ${DEFAULT_READER_CONFIG.CONFIG_VERSION}`);
  }

  return {
    ...DEFAULT_READER_CONFIG,
    ...userConfig,
    CONFIG_VERSION: DEFAULT_READER_CONFIG.CONFIG_VERSION,
  };
}
