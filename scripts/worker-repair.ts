import { snapshotStorage } from "../src/services/aggregation/snapshot-engine";
import { qualityPipeline } from "../src/services/aggregation/quality-validator";
import { CanonicalManga } from "../src/services/aggregation/types";

export type RepairPriority = "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";

export interface RepairTask {
  entityId: string;
  priority: RepairPriority;
  reason: string;
  enqueuedAt: string;
}

export class PrioritizedRepairWorker {
  private repairQueue: RepairTask[] = [];
  private repairedCount = 0;

  public enqueueForRepair(entityId: string, priority: RepairPriority, reason: string): void {
    if (this.repairQueue.some((t) => t.entityId === entityId)) return;

    this.repairQueue.push({
      entityId,
      priority,
      reason,
      enqueuedAt: new Date().toISOString(),
    });

    // Sort queue by priority order: CRITICAL -> HIGH -> MEDIUM -> LOW
    const priorityWeights: Record<RepairPriority, number> = {
      CRITICAL: 4,
      HIGH: 3,
      MEDIUM: 2,
      LOW: 1,
    };

    this.repairQueue.sort((a, b) => priorityWeights[b.priority] - priorityWeights[a.priority]);
  }

  public async processNextRepair(
    repairFn: (id: string) => Promise<CanonicalManga | null>
  ): Promise<boolean> {
    if (this.repairQueue.length === 0) return false;

    const task = this.repairQueue.shift()!;
    try {
      const repaired = await repairFn(task.entityId);
      if (repaired) {
        const report = qualityPipeline.evaluateManga(repaired);
        if (report.isValid) {
          await snapshotStorage.saveMangaSnapshot(repaired);
          this.repairedCount++;
          return true;
        }
      }
      return false;
    } catch {
      return false;
    }
  }

  public getStats(): { pending: number; repaired: number } {
    return {
      pending: this.repairQueue.length,
      repaired: this.repairedCount,
    };
  }
}

export const repairWorker = new PrioritizedRepairWorker();
