/**
 * Reader Engine Recovery & Automatic Mirror Failover Manager
 * 
 * Classifies image load errors and automatically attempts alternate mirror proxies
 * before surfacing error UI.
 */

import { readerStorage, type ReaderSessionRecord } from "@/lib/reader-storage";

export type ImageErrorClassification = 
  | "NETWORK_TIMEOUT"
  | "HTTP_404_403"
  | "DECODE_FAILURE"
  | "ABORTED"
  | "UNKNOWN";

export interface ImageRecoveryAttempt {
  originalUrl: string;
  currentProxyIndex: number;
  retryCount: number;
  lastError: ImageErrorClassification;
}

export class RecoveryManager {
  private activeAttempts = new Map<string, ImageRecoveryAttempt>();
  private mirrorProxies = [
    (url: string) => `/api/image?url=${encodeURIComponent(url)}`,
    (url: string) => `/api/image/proxy?url=${encodeURIComponent(url)}`,
    (url: string) => url, // Direct fallback
  ];

  public classifyError(error: any): ImageErrorClassification {
    if (error?.name === "AbortError") return "ABORTED";
    if (error?.message?.includes("404") || error?.message?.includes("403")) return "HTTP_404_403";
    if (error?.message?.includes("timeout") || error?.name === "TimeoutError") return "NETWORK_TIMEOUT";
    if (error?.message?.includes("Failed to load image") || error?.message?.includes("decode")) return "DECODE_FAILURE";
    return "UNKNOWN";
  }

  public getNextProxyUrl(originalUrl: string, error: any): { nextUrl: string; canRetry: boolean } {
    let attempt = this.activeAttempts.get(originalUrl);
    const classification = this.classifyError(error);

    if (!attempt) {
      attempt = {
        originalUrl,
        currentProxyIndex: 0,
        retryCount: 0,
        lastError: classification,
      };
      this.activeAttempts.set(originalUrl, attempt);
    }

    attempt.retryCount++;
    attempt.lastError = classification;

    if (attempt.retryCount <= 2) {
      // Retry with current proxy
      return { nextUrl: this.mirrorProxies[attempt.currentProxyIndex](originalUrl), canRetry: true };
    } else if (attempt.currentProxyIndex < this.mirrorProxies.length - 1) {
      // Switch to next mirror proxy
      attempt.currentProxyIndex++;
      attempt.retryCount = 0;
      return { nextUrl: this.mirrorProxies[attempt.currentProxyIndex](originalUrl), canRetry: true };
    }

    // All retries and mirror proxies exhausted
    return { nextUrl: originalUrl, canRetry: false };
  }

  public clearAttempt(originalUrl: string): void {
    this.activeAttempts.delete(originalUrl);
  }

  public async restoreSession(mangaId: string): Promise<ReaderSessionRecord | null> {
    return await readerStorage.getSession(mangaId);
  }

  public async saveSession(session: ReaderSessionRecord): Promise<void> {
    await readerStorage.saveSession(session);
  }
}

export const recoveryManager = new RecoveryManager();
