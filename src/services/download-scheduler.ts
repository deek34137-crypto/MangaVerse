"use client";

import { readerStorage, type OfflineChapterRecord } from "@/lib/reader-storage";

export type DownloadStatus = "IDLE" | "QUEUED" | "DOWNLOADING" | "PAUSED" | "COMPLETED" | "ERROR";
export type DownloadPriorityTier = "VISIBLE_CHAPTER" | "CURRENT_MANGA" | "BACKGROUND_QUEUE" | "LIBRARY_BATCH";

export interface DownloadJob {
  chapterId: string;
  mangaId: string;
  title: string;
  chapterNumber: string;
  pages: string[];
  priorityTier: DownloadPriorityTier;
  status: DownloadStatus;
  progress: number; // 0 to 100
  error?: string;
}

class DownloadSchedulerService {
  private queue: Map<string, DownloadJob> = new Map();
  private isProcessing = false;
  private listeners: Set<() => void> = new Set();

  public enqueueChapter(job: Omit<DownloadJob, "status" | "progress" | "priorityTier"> & { priorityTier?: DownloadPriorityTier }) {
    if (this.queue.has(job.chapterId)) return;

    const fullJob: DownloadJob = {
      ...job,
      priorityTier: job.priorityTier || "BACKGROUND_QUEUE",
      status: "QUEUED",
      progress: 0,
    };

    this.queue.set(job.chapterId, fullJob);
    this.sortQueue();
    this.notify();
    this.processQueue();
  }

  private sortQueue(): void {
    const tierWeight: Record<DownloadPriorityTier, number> = {
      VISIBLE_CHAPTER: 4,
      CURRENT_MANGA: 3,
      BACKGROUND_QUEUE: 2,
      LIBRARY_BATCH: 1,
    };

    const sortedArray = Array.from(this.queue.values()).sort(
      (a, b) => tierWeight[b.priorityTier] - tierWeight[a.priorityTier]
    );

    this.queue = new Map(sortedArray.map((job) => [job.chapterId, job]));
  }

  public pauseJob(chapterId: string) {
    const job = this.queue.get(chapterId);
    if (job) {
      job.status = "PAUSED";
      this.notify();
    }
  }

  public resumeJob(chapterId: string) {
    const job = this.queue.get(chapterId);
    if (job && job.status === "PAUSED") {
      job.status = "QUEUED";
      this.notify();
      this.processQueue();
    }
  }

  public getJobs(): DownloadJob[] {
    return Array.from(this.queue.values());
  }

  public subscribe(fn: () => void) {
    this.listeners.add(fn);
    return () => {
      this.listeners.delete(fn);
    };
  }

  private notify() {
    this.listeners.forEach((fn) => fn());
  }

  private async processQueue() {
    if (this.isProcessing) return;
    this.isProcessing = true;

    while (true) {
      this.sortQueue();
      const nextJob = Array.from(this.queue.values()).find((j) => j.status === "QUEUED");
      if (!nextJob) break;

      if (typeof window !== "undefined" && !navigator.onLine) {
        nextJob.status = "PAUSED";
        nextJob.error = "Paused due to offline network";
        this.notify();
        break;
      }

      nextJob.status = "DOWNLOADING";
      this.notify();

      try {
        const downloadedPages: string[] = [];
        const total = nextJob.pages.length;

        for (let i = 0; i < total; i++) {
          if ((nextJob.status as DownloadStatus) === "PAUSED") break;

          const url = nextJob.pages[i];
          const res = await fetch(url);
          if (res.ok) {
            downloadedPages.push(url);
          }

          nextJob.progress = Math.round(((i + 1) / total) * 100);
          this.notify();
        }

        if (nextJob.status === "DOWNLOADING") {
          const record: OfflineChapterRecord = {
            chapterId: nextJob.chapterId,
            mangaId: nextJob.mangaId,
            title: nextJob.title,
            chapterNumber: nextJob.chapterNumber,
            pages: downloadedPages,
            downloadedAt: Date.now(),
            sizeBytes: downloadedPages.length * 150000,
          };

          await readerStorage.saveDownloadedChapter(record);
          nextJob.status = "COMPLETED";
          nextJob.progress = 100;
          this.notify();
        }
      } catch (err) {
        nextJob.status = "ERROR";
        nextJob.error = (err as Error).message || "Download failed";
        this.notify();
      }
    }

    this.isProcessing = false;
  }
}

export const downloadScheduler = new DownloadSchedulerService();
