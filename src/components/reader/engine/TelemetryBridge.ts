/**
 * Reader Engine v2 Telemetry Bridge & Governance
 * Sampling, local ring-buffer aggregation, and flush throttling.
 */

import { readerPriorityScheduler } from "./ReaderPriorityScheduler";

export class TelemetryBridge {
  private samplingRate = process.env.NODE_ENV === "production" ? 0.1 : 1.0;

  public flushTelemetry(mangaId: string, chapterId: string, durationMs: number): void {
    // Apply sampling rate
    if (Math.random() > this.samplingRate) return;

    readerPriorityScheduler.scheduleTask({
      id: `telemetry_${chapterId}`,
      priority: "LOW",
      execute: () => {
        try {
          const stored = localStorage.getItem("mangahub_telemetry_v1");
          const beacons = stored ? JSON.parse(stored) : [];
          beacons.push({ mangaId, chapterId, durationMs, timestamp: Date.now() });
          // Limit local ring buffer to max 50 beacons
          localStorage.setItem("mangahub_telemetry_v1", JSON.stringify(beacons.slice(-50)));
        } catch {
          // Ignore
        }
      },
    });
  }
}

export const telemetryBridge = new TelemetryBridge();
