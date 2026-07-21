/**
 * Reader Engine v2 Download Bridge
 * Connects Reader Engine with client-side DownloadScheduler.
 */

import { downloadScheduler, type DownloadJob } from "@/services/download-scheduler";

export class DownloadBridge {
  public enqueueChapterDownload(job: Omit<DownloadJob, "status" | "progress">): void {
    downloadScheduler.enqueueChapter(job);
  }

  public getDownloadStatus(chapterId: string): string {
    const job = downloadScheduler.getJobs().find((j) => j.chapterId === chapterId);
    return job ? job.status : "NOT_DOWNLOADED";
  }
}

export const downloadBridge = new DownloadBridge();
