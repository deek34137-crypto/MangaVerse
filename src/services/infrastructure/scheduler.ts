import { eventBus } from "./event-bus";
import { healthService } from "../providers/health-service";

export type JobType = 
  | "MetadataSyncJob" 
  | "ProviderHealthJob" 
  | "TrendingRefreshJob" 
  | "CacheWarmJob" 
  | "SmokeTestJob";

export interface ScheduledJob {
  id: string;
  type: JobType;
  intervalMs: number;
  lastRunAt?: number;
  nextRunAt: number;
  runCount: number;
  errorCount: number;
  status: "IDLE" | "RUNNING" | "FAILED";
}

export class JobScheduler {
  private static instance: JobScheduler;
  private jobs = new Map<string, ScheduledJob>();
  private timer: NodeJS.Timeout | null = null;

  private constructor() {
    this.registerDefaultJobs();
  }

  public static getInstance(): JobScheduler {
    if (!JobScheduler.instance) {
      JobScheduler.instance = new JobScheduler();
    }
    return JobScheduler.instance;
  }

  private registerDefaultJobs(): void {
    this.addJob("ProviderHealthJob", 60000);   // Recompute health every 60s
    this.addJob("TrendingRefreshJob", 3600000); // Refresh trending every 1h
    this.addJob("CacheWarmJob", 1800000);      // Warm cache every 30m
  }

  public addJob(type: JobType, intervalMs: number): ScheduledJob {
    const job: ScheduledJob = {
      id: `job_${type.toLowerCase()}`,
      type,
      intervalMs,
      nextRunAt: Date.now() + intervalMs,
      runCount: 0,
      errorCount: 0,
      status: "IDLE",
    };
    this.jobs.set(job.id, job);
    return job;
  }

  public async executeJob(jobId: string): Promise<boolean> {
    const job = this.jobs.get(jobId);
    if (!job || job.status === "RUNNING") return false;

    job.status = "RUNNING";
    const startTime = Date.now();

    try {
      switch (job.type) {
        case "ProviderHealthJob":
          // Recompute provider health scores across sliding windows
          console.log("[JobScheduler] Executing ProviderHealthJob...");
          break;
        case "TrendingRefreshJob":
          console.log("[JobScheduler] Executing TrendingRefreshJob...");
          break;
        case "CacheWarmJob":
          console.log("[JobScheduler] Executing CacheWarmJob...");
          break;
        default:
          break;
      }

      job.runCount++;
      job.lastRunAt = Date.now();
      job.nextRunAt = Date.now() + job.intervalMs;
      job.status = "IDLE";
      return true;
    } catch (err) {
      job.errorCount++;
      job.status = "FAILED";
      console.error(`[JobScheduler] Job ${jobId} failed:`, err);
      return false;
    }
  }

  public getJobs(): ScheduledJob[] {
    return Array.from(this.jobs.values());
  }
}

export const jobScheduler = JobScheduler.getInstance();
export default jobScheduler;
