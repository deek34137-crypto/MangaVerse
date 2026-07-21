/**
 * Reader Engine v2 Task Priority Scheduler & Starvation Prevention
 *
 * GOVERNANCE CLAIM:
 * Prioritizes rendering-critical tasks over background work to reduce the
 * likelihood of dropped frames and improve scrolling responsiveness.
 */

export type TaskPriority = "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";

export interface ScheduledTask {
  id: string;
  priority: TaskPriority;
  scheduledAt: number;
  execute: () => void | Promise<void>;
}

export class ReaderPriorityScheduler {
  private queue: ScheduledTask[] = [];
  private isExecuting = false;

  public scheduleTask(task: Omit<ScheduledTask, "scheduledAt">): void {
    const fullTask: ScheduledTask = {
      ...task,
      scheduledAt: Date.now(),
    };

    this.queue.push(fullTask);
    this.sortQueue();
    this.processQueue();
  }

  /**
   * Starvation Prevention & Task Aging:
   * Promotes LOW tasks waiting >30s to MEDIUM, and MEDIUM tasks waiting >15s to HIGH.
   */
  private applyTaskAging(): void {
    const now = Date.now();
    this.queue.forEach((task) => {
      const waitTime = now - task.scheduledAt;
      if (task.priority === "LOW" && waitTime > 30000) {
        task.priority = "MEDIUM";
      } else if (task.priority === "MEDIUM" && waitTime > 15000) {
        task.priority = "HIGH";
      }
    });
  }

  private sortQueue(): void {
    this.applyTaskAging();

    const priorityWeight: Record<TaskPriority, number> = {
      CRITICAL: 4,
      HIGH: 3,
      MEDIUM: 2,
      LOW: 1,
    };

    this.queue.sort((a, b) => priorityWeight[b.priority] - priorityWeight[a.priority]);
  }

  private async processQueue(): Promise<void> {
    if (this.isExecuting || this.queue.length === 0) return;
    this.isExecuting = true;

    while (this.queue.length > 0) {
      this.sortQueue();
      const nextTask = this.queue.shift();

      if (nextTask) {
        try {
          if (typeof window !== "undefined" && "requestIdleCallback" in window && nextTask.priority === "LOW") {
            window.requestIdleCallback(async () => {
              await nextTask.execute();
            });
          } else {
            await nextTask.execute();
          }
        } catch (err) {
          console.error(`[ReaderPriorityScheduler] Task ${nextTask.id} failed:`, err);
        }
      }
    }

    this.isExecuting = false;
  }
}

export const readerPriorityScheduler = new ReaderPriorityScheduler();
