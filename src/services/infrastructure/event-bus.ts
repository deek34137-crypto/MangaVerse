import { EventEmitter } from "events";

export interface ProviderSucceededEventV1 {
  version: 1;
  providerId: string;
  operation: string;
  durationMs: number;
  requestId: string;
  traceId: string;
  timestamp: number;
}

export interface ProviderFailedEventV1 {
  version: 1;
  providerId: string;
  operation: string;
  error: string;
  durationMs: number;
  requestId: string;
  traceId: string;
  timestamp: number;
}

export interface ProviderBlockedEventV1 {
  version: 1;
  providerId: string;
  operation: string;
  statusCode: number;
  durationMs: number;
  requestId: string;
  traceId: string;
  timestamp: number;
}

export interface ProviderSlowEventV1 {
  version: 1;
  providerId: string;
  operation: string;
  durationMs: number;
  thresholdMs: number;
  requestId: string;
  traceId: string;
  timestamp: number;
}

export interface CircuitOpenedEventV1 {
  version: 1;
  providerId: string;
  reason: string;
  timestamp: number;
}

export interface CircuitClosedEventV1 {
  version: 1;
  providerId: string;
  timestamp: number;
}

export interface ChapterMergedEventV1 {
  version: 1;
  canonicalMangaId: string;
  canonicalChapterId: string;
  primarySource: string;
  mirrorsCount: number;
  timestamp: number;
}

export interface MetadataUpdatedEventV1 {
  version: 1;
  canonicalMangaId: string;
  source: string;
  fieldName: string;
  timestamp: number;
}

export type SystemEventMap = {
  "provider:succeeded": ProviderSucceededEventV1;
  "provider:failed": ProviderFailedEventV1;
  "provider:blocked": ProviderBlockedEventV1;
  "provider:slow": ProviderSlowEventV1;
  "circuit:opened": CircuitOpenedEventV1;
  "circuit:closed": CircuitClosedEventV1;
  "chapter:merged": ChapterMergedEventV1;
  "metadata:updated": MetadataUpdatedEventV1;
};

export class SystemEventBus {
  private emitter: EventEmitter;
  private static instance: SystemEventBus;

  private constructor() {
    this.emitter = new EventEmitter();
    this.emitter.setMaxListeners(50);
  }

  public static getInstance(): SystemEventBus {
    if (!SystemEventBus.instance) {
      SystemEventBus.instance = new SystemEventBus();
    }
    return SystemEventBus.instance;
  }

  public emit<K extends keyof SystemEventMap>(event: K, payload: SystemEventMap[K]): boolean {
    return this.emitter.emit(event, payload);
  }

  public on<K extends keyof SystemEventMap>(
    event: K,
    listener: (payload: SystemEventMap[K]) => void
  ): this {
    this.emitter.on(event, listener);
    return this;
  }

  public off<K extends keyof SystemEventMap>(
    event: K,
    listener: (payload: SystemEventMap[K]) => void
  ): this {
    this.emitter.off(event, listener);
    return this;
  }

  public once<K extends keyof SystemEventMap>(
    event: K,
    listener: (payload: SystemEventMap[K]) => void
  ): this {
    this.emitter.once(event, listener);
    return this;
  }

  public removeAllListeners(): void {
    this.emitter.removeAllListeners();
  }
}

export const eventBus = SystemEventBus.getInstance();
export default eventBus;
