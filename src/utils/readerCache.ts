const DB_NAME = "mangahub-reader-cache";
const STORE_NAME = "images";
const MAX_CACHE_SIZE_BYTES = 200 * 1024 * 1024; // 200 MB

export interface CacheEntry {
  url: string;
  blob: Blob;
  size: number;
  lastUsed: number;
}

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: "url" });
        store.createIndex("lastUsed", "lastUsed", { unique: false });
      }
    };
  });
}

export async function getCachedImage(url: string): Promise<string | null> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, "readwrite");
      const store = transaction.objectStore(STORE_NAME);
      const request = store.get(url);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        const entry = request.result as CacheEntry | undefined;
        if (entry) {
          entry.lastUsed = Date.now();
          store.put(entry);
          resolve(URL.createObjectURL(entry.blob));
        } else {
          resolve(null);
        }
      };
    });
  } catch (err) {
    console.error("[ReaderCache] Error reading from IndexedDB:", err);
    return null;
  }
}

export async function cacheImage(url: string, blob: Blob): Promise<void> {
  try {
    const db = await openDB();
    const size = blob.size;
    const entry: CacheEntry = {
      url,
      blob,
      size,
      lastUsed: Date.now(),
    };

    await evictIfNecessary(db, size);

    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, "readwrite");
      const store = transaction.objectStore(STORE_NAME);
      const request = store.put(entry);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  } catch (err) {
    console.error("[ReaderCache] Error writing to IndexedDB:", err);
  }
}

async function evictIfNecessary(db: IDBDatabase, newSize: number): Promise<void> {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, "readwrite");
    const store = transaction.objectStore(STORE_NAME);
    
    const request = store.getAll();
    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      const entries = request.result as CacheEntry[];
      let totalSize = entries.reduce((sum, e) => sum + e.size, 0);

      if (totalSize + newSize <= MAX_CACHE_SIZE_BYTES) {
        resolve();
        return;
      }

      entries.sort((a, b) => a.lastUsed - b.lastUsed);

      const deleteTx = db.transaction(STORE_NAME, "readwrite");
      const deleteStore = deleteTx.objectStore(STORE_NAME);

      for (const entry of entries) {
        if (totalSize + newSize <= MAX_CACHE_SIZE_BYTES) break;
        deleteStore.delete(entry.url);
        totalSize -= entry.size;
        console.log(`[ReaderCache] Evicted stale image from IndexedDB: ${entry.url}`);
      }

      deleteTx.oncomplete = () => resolve();
      deleteTx.onerror = () => reject(deleteTx.error);
    };
  });
}
