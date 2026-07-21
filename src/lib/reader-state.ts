"use client";

export type ReaderStatus =
  | "IDLE"
  | "LOADING"
  | "RENDERING"
  | "READING"
  | "PREFETCHING"
  | "OFFLINE"
  | "RECOVERING"
  | "COMPLETED"
  | "ERROR";

export interface ReaderStateContext {
  status: ReaderStatus;
  mangaId: string;
  chapterId: string;
  currentPage: number;
  totalPages: number;
  zoomScale: number;
  scrollOffset: number;
  readingMode: "vertical" | "horizontal" | "webtoon" | "double";
  readingDirection: "rtl" | "ltr";
  errorMessage?: string;
}

export class ReaderStateMachine {
  private state: ReaderStateContext;
  private listeners: Set<(state: ReaderStateContext) => void> = new Set();

  constructor(initialState: Partial<ReaderStateContext>) {
    this.state = {
      status: "IDLE",
      mangaId: initialState.mangaId || "",
      chapterId: initialState.chapterId || "",
      currentPage: initialState.currentPage || 1,
      totalPages: initialState.totalPages || 0,
      zoomScale: initialState.zoomScale || 1.0,
      scrollOffset: initialState.scrollOffset || 0,
      readingMode: initialState.readingMode || "vertical",
      readingDirection: initialState.readingDirection || "rtl",
    };
  }

  public getState(): ReaderStateContext {
    return { ...this.state };
  }

  public transition(nextStatus: ReaderStatus, payload?: Partial<ReaderStateContext>) {
    const validTransitions: Record<ReaderStatus, ReaderStatus[]> = {
      IDLE: ["LOADING", "OFFLINE"],
      LOADING: ["RENDERING", "OFFLINE", "ERROR"],
      RENDERING: ["READING", "ERROR"],
      READING: ["PREFETCHING", "COMPLETED", "LOADING", "OFFLINE", "ERROR"],
      PREFETCHING: ["READING", "COMPLETED", "ERROR"],
      OFFLINE: ["RECOVERING", "READING"],
      RECOVERING: ["READING", "LOADING", "ERROR"],
      COMPLETED: ["LOADING", "IDLE"],
      ERROR: ["RECOVERING", "LOADING", "IDLE"],
    };

    const allowed = validTransitions[this.state.status];
    if (!allowed.includes(nextStatus)) {
      console.warn(`[ReaderStateMachine] Invalid transition from ${this.state.status} to ${nextStatus}`);
    }

    this.state = {
      ...this.state,
      ...payload,
      status: nextStatus,
    };

    this.notify();
  }

  public updateContext(payload: Partial<ReaderStateContext>) {
    this.state = { ...this.state, ...payload };
    this.notify();
  }

  public subscribe(listener: (state: ReaderStateContext) => void) {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notify() {
    this.listeners.forEach((fn) => fn(this.getState()));
  }
}
