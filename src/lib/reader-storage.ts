"use client";

const DB_NAME = "mangahub_partitioned_v1";
const DB_VERSION = 1;

export interface ReaderSessionRecord {
  version: "1.0.0";
  mangaId: string;
  chapterId: string;
  pageNumber: number;
  zoomScale: number;
  scrollOffset: number;
  readingMode: string;
  updatedAt: number;
}

export interface OfflineChapterRecord {
  chapterId: string;
  mangaId: string;
  title: string;
  chapterNumber: string;
  pages: string[];
  downloadedAt: number;
  sizeBytes: number;
}

class PartitionedStorageManager {
  private dbPromise: Promise<IDBDatabase> | null = null;

  private getDB(): Promise<IDBDatabase> {
    if (typeof window === "undefined") {
      return Promise.reject(new Error("Server side DB access not permitted"));
    }

    if (!this.dbPromise) {
      this.dbPromise = new Promise((resolve, reject) => {
        const req = indexedDB.open(DB_NAME, DB_VERSION);

        req.onupgradeneeded = (e) => {
          const db = (e.target as IDBOpenDBRequest).result;

          if (!db.objectStoreNames.contains("sessions")) {
            db.createObjectStore("sessions", { keyPath: "mangaId" });
          }

          if (!db.objectStoreNames.contains("downloads")) {
            const downloadsStore = db.createObjectStore("downloads", { keyPath: "chapterId" });
            downloadsStore.createIndex("mangaId", "mangaId", { unique: false });
          }

          if (!db.objectStoreNames.contains("telemetry")) {
            db.createObjectStore("telemetry", { autoIncrement: true });
          }
        };

        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error);
      });
    }

    return this.dbPromise;
  }

  // ── Session Store API with Migration ─────────────────────────────────────
  public async saveSession(session: Omit<ReaderSessionRecord, "version"> & { version?: "1.0.0" }): Promise<void> {
    const fullRecord: ReaderSessionRecord = {
      version: "1.0.0",
      ...session,
    };

    try {
      const db = await this.getDB();
      const tx = db.transaction("sessions", "readwrite");
      tx.objectStore("sessions").put(fullRecord);
    } catch {
      try {
        localStorage.setItem(`mangahub_session_${session.mangaId}`, JSON.stringify(fullRecord));
      } catch {
        // Ignore
      }
    }
  }

  public async getSession(mangaId: string): Promise<ReaderSessionRecord | null> {
    try {
      const db = await this.getDB();
      const record = await new Promise<ReaderSessionRecord | null>((resolve) => {
        const tx = db.transaction("sessions", "readonly");
        const req = tx.objectStore("sessions").get(mangaId);
        req.onsuccess = () => resolve(req.result || null);
        req.onerror = () => resolve(null);
      });

      if (!record) return null;
      return this.migrateSessionSchema(record);
    } catch {
      try {
        const stored = localStorage.getItem(`mangahub_session_${mangaId}`);
        if (!stored) return null;
        const parsed = JSON.parse(stored);
        return this.migrateSessionSchema(parsed);
      } catch {
        return null;
      }
    }
  }

  private migrateSessionSchema(record: any): ReaderSessionRecord {
    // Migration logic for legacy records
    if (!record.version || record.version !== "1.0.0") {
      console.info("[StorageManager] Migrating session schema to v1.0.0");
      return {
        version: "1.0.0",
        mangaId: record.mangaId || "",
        chapterId: record.chapterId || "",
        pageNumber: typeof record.pageNumber === "number" ? record.pageNumber : 1,
        zoomScale: typeof record.zoomScale === "number" ? record.zoomScale : 1.0,
        scrollOffset: typeof record.scrollOffset === "number" ? record.scrollOffset : 0,
        readingMode: record.readingMode || "vertical",
        updatedAt: record.updatedAt || Date.now(),
      };
    }
    return record;
  }

  // ── Download Store API ─────────────────────────────────────────────────
  public async saveDownloadedChapter(record: OfflineChapterRecord): Promise<void> {
    const db = await this.getDB();
    const tx = db.transaction("downloads", "readwrite");
    tx.objectStore("downloads").put(record);
  }

  public async getDownloadedChapter(chapterId: string): Promise<OfflineChapterRecord | null> {
    const db = await this.getDB();
    return new Promise((resolve) => {
      const tx = db.transaction("downloads", "readonly");
      const req = tx.objectStore("downloads").get(chapterId);
      req.onsuccess = () => resolve(req.result || null);
      req.onerror = () => resolve(null);
    });
  }

  public async getDownloadedChaptersByManga(mangaId: string): Promise<OfflineChapterRecord[]> {
    const db = await this.getDB();
    return new Promise((resolve) => {
      const tx = db.transaction("downloads", "readonly");
      const index = tx.objectStore("downloads").index("mangaId");
      const req = index.getAll(mangaId);
      req.onsuccess = () => resolve(req.result || []);
      req.onerror = () => resolve([]);
    });
  }

  public async deleteDownloadedChapter(chapterId: string): Promise<void> {
    const db = await this.getDB();
    const tx = db.transaction("downloads", "readwrite");
    tx.objectStore("downloads").delete(chapterId);
  }

  public async getStorageEstimate(): Promise<{ usedBytes: number; quotaBytes: number; percentage: number }> {
    if (typeof window !== "undefined" && navigator.storage && navigator.storage.estimate) {
      try {
        const { usage = 0, quota = 1 } = await navigator.storage.estimate();
        return {
          usedBytes: usage,
          quotaBytes: quota,
          percentage: Math.round((usage / quota) * 100),
        };
      } catch {
        // Fallback
      }
    }
    return { usedBytes: 0, quotaBytes: 100 * 1024 * 1024, percentage: 0 };
  }
}

export const readerStorage = new PartitionedStorageManager();
