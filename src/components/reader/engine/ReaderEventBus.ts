/**
 * Reader Engine v2 Event Bus & Governance
 * Categorized, strongly-typed publish-subscribe event bus.
 */

// ── Event Category Definitions ──────────────────────────────────────────────

export type ReaderCategoryEvent = "READER_PAGE_CHANGED" | "READER_ZOOM_CHANGED" | "READER_MODE_CHANGED" | "READER_STATE_CHANGED";
export type StorageCategoryEvent = "STORAGE_SESSION_RESTORED" | "STORAGE_QUOTA_WARNING";
export type DownloadCategoryEvent = "DOWNLOAD_QUEUED" | "DOWNLOAD_COMPLETED" | "DOWNLOAD_FAILED";
export type SystemCategoryEvent = "SYSTEM_NETWORK_CHANGED" | "SYSTEM_BATTERY_CHANGED" | "SYSTEM_THERMAL_WARNING";
export type TelemetryCategoryEvent = "TELEMETRY_BEACON_FLUSHED" | "TELEMETRY_LATENCY_SPIKE";
export type LifecycleCategoryEvent = "LIFECYCLE_STAGE_CHANGED";

export type CategorizedEventType =
  | ReaderCategoryEvent
  | StorageCategoryEvent
  | DownloadCategoryEvent
  | SystemCategoryEvent
  | TelemetryCategoryEvent
  | LifecycleCategoryEvent;

export interface CategorizedEventPayloads {
  READER_PAGE_CHANGED: { pageNumber: number; totalPages: number };
  READER_ZOOM_CHANGED: { zoomScale: number };
  READER_MODE_CHANGED: { mode: string };
  READER_STATE_CHANGED: { from: string; to: string; timestamp: number };
  STORAGE_SESSION_RESTORED: { pageNumber: number; zoomScale: number };
  STORAGE_QUOTA_WARNING: { percentageUsed: number };
  DOWNLOAD_QUEUED: { chapterId: string };
  DOWNLOAD_COMPLETED: { chapterId: string };
  DOWNLOAD_FAILED: { chapterId: string; error: string };
  SYSTEM_NETWORK_CHANGED: { tier: "2g" | "3g" | "4g" | "wifi" };
  SYSTEM_BATTERY_CHANGED: { isLowPower: boolean; batteryLevel: number };
  SYSTEM_THERMAL_WARNING: { cpuSlowdownFactor: number };
  TELEMETRY_BEACON_FLUSHED: { count: number };
  TELEMETRY_LATENCY_SPIKE: { frameDropCount: number };
  LIFECYCLE_STAGE_CHANGED: { stage: string };
}

type CategorizedCallback<T extends CategorizedEventType> = (payload: CategorizedEventPayloads[T]) => void;

export class CategorizedEventBus {
  private listeners: Map<CategorizedEventType, Set<CategorizedCallback<any>>> = new Map();

  public on<T extends CategorizedEventType>(event: T, callback: CategorizedCallback<T>): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(callback);

    return () => {
      this.listeners.get(event)?.delete(callback);
    };
  }

  public emit<T extends CategorizedEventType>(event: T, payload: CategorizedEventPayloads[T]): void {
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      callbacks.forEach((cb) => cb(payload));
    }
  }

  public clear(): void {
    this.listeners.clear();
  }
}

export const categorizedEventBus = new CategorizedEventBus();
