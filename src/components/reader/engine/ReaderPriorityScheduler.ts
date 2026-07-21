/**
 * Reader Engine Task & Image Request Priority Scheduler
 * 
 * Manages concurrency bounds (Mobile 2-3, Desktop 4-6, Slow Net 1-2),
 * P0-P4 priority queues, cancellation via AbortController, and latency tracking.
 */

export type RequestPriority = "P0_CURRENT" | "P1_NEXT" | "P2_PREV" | "P3_PREFETCH" | "P4_METADATA";

export interface ScheduledImageRequest {
  id: string;
  url: string;
  pageIndex: number;
  priority: RequestPriority;
  scheduledAt: number;
  abortController: AbortController;
  execute: (signal: AbortSignal) => Promise<any>;
}

export class ReaderPriorityScheduler {
  private queue: ScheduledImageRequest[] = [];
  private activeCount = 0;
  private maxConcurrency = 4; // Default desktop limit
  private queueLatencyHistory: number[] = [];

  constructor() {
    this.detectDeviceConcurrency();
  }

  private detectDeviceConcurrency(): void {
    if (typeof window === "undefined") return;

    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    const connection = (navigator as any).connection;

    if (connection && (connection.effectiveType === "2g" || connection.effectiveType === "slow-2g")) {
      this.maxConcurrency = 1;
    } else if (connection && connection.effectiveType === "3g") {
      this.maxConcurrency = 2;
    } else if (isMobile) {
      this.maxConcurrency = 3;
    } else {
      this.maxConcurrency = 5;
    }
  }

  public scheduleTask(task: { id: string; priority: string; execute: () => Promise<void> | void }): void {
    const priorityMap: Record<string, RequestPriority> = {
      CRITICAL: "P0_CURRENT",
      HIGH: "P1_NEXT",
      MEDIUM: "P3_PREFETCH",
      LOW: "P4_METADATA",
    };

    const requestPriority: RequestPriority = priorityMap[task.priority] || "P3_PREFETCH";

    this.scheduleRequest({
      id: task.id,
      url: task.id,
      pageIndex: 0,
      priority: requestPriority,
      execute: async () => {
        await task.execute();
      },
    });
  }

  public scheduleRequest(request: Omit<ScheduledImageRequest, "scheduledAt" | "abortController">): AbortController {
    // Cancel any existing lower-priority request for the same page ID
    this.cancelRequest(request.id);

    const abortController = new AbortController();
    const scheduledTask: ScheduledImageRequest = {
      ...request,
      scheduledAt: Date.now(),
      abortController,
    };

    this.queue.push(scheduledTask);
    this.sortQueue();
    this.processQueue();

    return abortController;
  }

  public cancelRequest(id: string): void {
    const idx = this.queue.findIndex((t) => t.id === id);
    if (idx !== -1) {
      this.queue[idx].abortController.abort();
      this.queue.splice(idx, 1);
    }
  }

  public cancelAll(): void {
    this.queue.forEach((t) => t.abortController.abort());
    this.queue = [];
  }

  private sortQueue(): void {
    const weights: Record<RequestPriority, number> = {
      P0_CURRENT: 5,
      P1_NEXT: 4,
      P2_PREV: 3,
      P3_PREFETCH: 2,
      P4_METADATA: 1,
    };

    this.queue.sort((a, b) => weights[b.priority] - weights[a.priority]);
  }

  private async processQueue(): Promise<void> {
    if (this.activeCount >= this.maxConcurrency || this.queue.length === 0) {
      return;
    }

    this.sortQueue();
    const task = this.queue.shift();
    if (!task) return;

    this.activeCount++;
    const queueLatency = Date.now() - task.scheduledAt;
    this.recordQueueLatency(queueLatency);

    try {
      if (!task.abortController.signal.aborted) {
        await task.execute(task.abortController.signal);
      }
    } catch (err: any) {
      if (err.name !== "AbortError") {
        console.warn(`[ReaderPriorityScheduler] Request ${task.id} failed:`, err);
      }
    } finally {
      this.activeCount--;
      this.processQueue();
    }
  }

  private recordQueueLatency(latency: number): void {
    this.queueLatencyHistory.push(latency);
    if (this.queueLatencyHistory.length > 50) {
      this.queueLatencyHistory.shift();
    }
  }

  public getAverageQueueLatency(): number {
    if (this.queueLatencyHistory.length === 0) return 0;
    const sum = this.queueLatencyHistory.reduce((a, b) => a + b, 0);
    return Math.round(sum / this.queueLatencyHistory.length);
  }

  public getActiveCount(): number {
    return this.activeCount;
  }

  public getQueueLength(): number {
    return this.queue.length;
  }
}

export const readerPriorityScheduler = new ReaderPriorityScheduler();
