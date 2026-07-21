/**
 * Reader Engine v2 Formal Interfaces
 * Abstract contracts decoupling storage, networking, decoding, rendering, and gestures.
 */

import type { ReaderSessionRecord, OfflineChapterRecord } from "@/lib/reader-storage";

export interface StorageProvider {
  saveSession(session: ReaderSessionRecord): Promise<void>;
  getSession(mangaId: string): Promise<ReaderSessionRecord | null>;
  saveDownloadedChapter(record: OfflineChapterRecord): Promise<void>;
  getDownloadedChapter(chapterId: string): Promise<OfflineChapterRecord | null>;
  deleteDownloadedChapter(chapterId: string): Promise<void>;
}

export interface ImageDecoderProvider {
  decodeImage(src: string): Promise<ImageBitmap | HTMLImageElement>;
}

export interface GestureProvider {
  onTap(callback: (zone: "left" | "right" | "center") => void): void;
  onPinch(callback: (scale: number) => void): void;
  onSwipe(callback: (direction: "left" | "right" | "up" | "down") => void): void;
}

export interface RenderEngineProvider {
  renderViewport(currentPage: number, bufferSize: number): void;
  evictOffscreenNodes(): void;
}
