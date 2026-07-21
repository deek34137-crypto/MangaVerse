/**
 * Reader Engine v2 Recovery Manager
 * Manages auto-retry and session restoration on network interruptions or crashes.
 */

import { readerStorage, type ReaderSessionRecord } from "@/lib/reader-storage";

export class RecoveryManager {
  public async restoreSession(mangaId: string): Promise<ReaderSessionRecord | null> {
    return await readerStorage.getSession(mangaId);
  }

  public async saveSession(session: ReaderSessionRecord): Promise<void> {
    await readerStorage.saveSession(session);
  }
}

export const recoveryManager = new RecoveryManager();
