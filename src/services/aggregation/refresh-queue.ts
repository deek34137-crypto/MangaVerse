import { snapshotStorage } from "./snapshot-engine";
import { CanonicalManga } from "./types";

export interface RefreshTask {
  entityId: string;
  enqueuedAt: string;
  attempt: number;
}

export class SnapshotRefreshQueue {
  private inFlightTasks = new Map<string, Promise<any>>();
  private enqueuedTasks = new Map<string, RefreshTask>();
  private completedCount = 0;
  private failedCount = 0;

  public async enqueueRefresh(
    entityId: string,
    refreshFn: (id: string) => Promise<CanonicalManga | null>
  ): Promise<boolean> {
    const key = `snapshot:manga:${entityId}`;

    // If task is already running/enqueued for this entity, deduplicate!
    if (this.inFlightTasks.has(entityId) || this.enqueuedTasks.has(entityId)) {
      return false;
    }

    const task: RefreshTask = {
      entityId,
      enqueuedAt: new Date().toISOString(),
      attempt: 1,
    };

    this.enqueuedTasks.set(entityId, task);
    snapshotStorage.setSnapshotState(key, "REFRESHING");

    // Execute refresh asynchronously in queue without blocking caller
    const promise = (async () => {
      try {
        const updated = await refreshFn(entityId);
        if (updated) {
          await snapshotStorage.saveMangaSnapshot(updated);
          snapshotStorage.setSnapshotState(key, "FRESH");
          this.completedCount++;
        } else {
          snapshotStorage.setSnapshotState(key, "FAILED");
          this.failedCount++;
        }
      } catch {
        snapshotStorage.setSnapshotState(key, "FAILED");
        this.failedCount++;
      } finally {
        this.inFlightTasks.delete(entityId);
        this.enqueuedTasks.delete(entityId);
      }
    })();

    this.inFlightTasks.set(entityId, promise);
    return true;
  }

  public getQueueStats(): { enqueued: number; inFlight: number; completed: number; failed: number } {
    return {
      enqueued: this.enqueuedTasks.size,
      inFlight: this.inFlightTasks.size,
      completed: this.completedCount,
      failed: this.failedCount,
    };
  }
}

export const refreshQueue = new SnapshotRefreshQueue();
