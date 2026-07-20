import * as fs from "fs";
import * as path from "path";

// ---------------------------------------------------------------------------
// ProviderSnapshotWriter
// ---------------------------------------------------------------------------

/**
 * Writes a debug snapshot of failed provider requests to disk.
 *
 * Only active when the environment variable PROVIDER_SNAPSHOTS=true is set.
 * Snapshots are written to:
 *   <project-root>/debug/provider-snapshots/<providerId>/<ISO-timestamp>.json
 *
 * The debug/ directory is gitignored. It is created automatically on first write.
 */
export interface SnapshotPayload {
  providerId:            string;
  providerVersion:       string;
  manifestSchemaVersion: string;
  url:                   string;
  timestamp:             string;
  requestDurationMs:     number;
  retryCount:            number;
  statusCode?:           number;
  responseHeaders?:      Record<string, string>;
  /** First 8 KB of the response body for postmortem analysis. */
  responseBodyPrefix?:   string;
  errorMessage?:         string;
}

const SNAPSHOTS_ENABLED =
  process.env.PROVIDER_SNAPSHOTS === "true" ||
  process.env.PROVIDER_SNAPSHOTS === "1";

const SNAPSHOTS_ROOT = path.resolve(process.cwd(), "debug", "provider-snapshots");

export class ProviderSnapshotWriter {
  constructor(private readonly providerId: string) {}

  async write(payload: SnapshotPayload): Promise<void> {
    if (!SNAPSHOTS_ENABLED) return;

    const dir = path.join(SNAPSHOTS_ROOT, this.providerId);
    const filename = `${new Date().toISOString().replace(/[:.]/g, "-")}.json`;
    const filepath = path.join(dir, filename);

    try {
      fs.mkdirSync(dir, { recursive: true });
      fs.writeFileSync(filepath, JSON.stringify(payload, null, 2), "utf-8");
      console.debug(`[Snapshot] Written: ${filepath}`);
    } catch (err) {
      // Never throw from snapshot writer — it must not affect the request lifecycle
      console.warn(`[Snapshot] Failed to write snapshot for ${this.providerId}:`, err);
    }
  }
}
