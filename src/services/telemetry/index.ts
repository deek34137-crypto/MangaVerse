/**
 * MangaHub Production Telemetry & Analytics Platform (Bifurcated)
 * 
 * Explicitly separates:
 * 1. Operational Telemetry (Engineering Infrastructure Health)
 * 2. Product Analytics (User Experience & Engagement)
 */

export interface OperationalTelemetryEvent {
  timestamp: string;
  eventType: "reader_load" | "proxy_failure" | "circuit_breaker" | "cache_miss" | "snapshot_rebuild" | "db_latency";
  component: "reader" | "image_proxy" | "aggregator" | "cache" | "database";
  latencyMs?: number;
  cacheHit?: boolean;
  providerId?: string;
  statusCode?: number;
  isPermanent?: boolean;
  metadata?: Record<string, any>;
}

export interface ProductAnalyticsEvent {
  timestamp: string;
  eventType: "search_click" | "continue_reading_click" | "chapter_complete" | "library_add" | "favourite_toggle" | "reader_dropoff";
  userId?: string;
  mangaId: string;
  chapterId?: string;
  pagesRead?: number;
  totalPages?: number;
  completionPct?: number;
  timeSpentSec?: number;
  sourceSection?: string;
}

class TelemetryManager {
  private opsBuffer: OperationalTelemetryEvent[] = [];
  private productBuffer: ProductAnalyticsEvent[] = [];
  private readonly MAX_BUFFER_SIZE = 100;

  // ── Operational Telemetry (Engineering) ──────────────────────────────────
  public logOperationalEvent(event: Omit<OperationalTelemetryEvent, "timestamp">): void {
    const payload: OperationalTelemetryEvent = {
      timestamp: new Date().toISOString(),
      ...event,
    };

    if (process.env.NODE_ENV !== "test") {
      console.log(`[OPS_TELEMETRY] ${JSON.stringify(payload)}`);
    }

    this.opsBuffer.push(payload);
    if (this.opsBuffer.length >= this.MAX_BUFFER_SIZE) {
      this.flushOpsBuffer();
    }
  }

  // ── Product Analytics (Product & Design) ──────────────────────────────────
  public logProductEvent(event: Omit<ProductAnalyticsEvent, "timestamp">): void {
    const payload: ProductAnalyticsEvent = {
      timestamp: new Date().toISOString(),
      ...event,
    };

    if (process.env.NODE_ENV !== "test") {
      console.log(`[PRODUCT_ANALYTICS] ${JSON.stringify(payload)}`);
    }

    this.productBuffer.push(payload);
    if (this.productBuffer.length >= this.MAX_BUFFER_SIZE) {
      this.flushProductBuffer();
    }
  }

  public getOperationalStats(): { totalOpsEvents: number; recentOps: OperationalTelemetryEvent[] } {
    return {
      totalOpsEvents: this.opsBuffer.length,
      recentOps: [...this.opsBuffer].slice(-20),
    };
  }

  public getProductStats(): { totalProductEvents: number; recentProduct: ProductAnalyticsEvent[] } {
    return {
      totalProductEvents: this.productBuffer.length,
      recentProduct: [...this.productBuffer].slice(-20),
    };
  }

  private flushOpsBuffer(): void {
    this.opsBuffer = [];
  }

  private flushProductBuffer(): void {
    this.productBuffer = [];
  }
}

export const telemetry = new TelemetryManager();
