/**
 * Reader State Machine Telemetry & Transition Tracker (RFC-002 / Operational Readiness)
 * Logs structured state transition duration metrics (reader.state.enter, reader.state.exit, reader.state.duration).
 */

import { ReaderState } from "@/components/reader/reader";
import { logger } from "@/lib/observability";

export interface StateTransitionEvent {
  mangaId: string;
  chapterId: string;
  fromState: ReaderState;
  toState: ReaderState;
  durationMs: number;
  provider?: string;
  pageCount?: number;
}

const STATE_TIMERS = new Map<string, number>();

export function trackReaderStateEnter(mangaId: string, chapterId: string, state: ReaderState) {
  const key = `${mangaId}:${chapterId}:${state}`;
  STATE_TIMERS.set(key, performance.now());
  logger.info(`reader.state.enter: ${state}`, { mangaId, chapterId, state }, "READER_TELEMETRY");
}

export function trackReaderStateExit(
  mangaId: string,
  chapterId: string,
  fromState: ReaderState,
  toState: ReaderState,
  extra?: { provider?: string; pageCount?: number }
): number {
  const key = `${mangaId}:${chapterId}:${fromState}`;
  const startTime = STATE_TIMERS.get(key);
  const durationMs = startTime ? Math.round(performance.now() - startTime) : 0;
  STATE_TIMERS.delete(key);

  const event: StateTransitionEvent = {
    mangaId,
    chapterId,
    fromState,
    toState,
    durationMs,
    ...extra,
  };

  logger.info(`reader.state.transition: ${fromState} -> ${toState} (${durationMs}ms)`, event, "READER_TELEMETRY");
  return durationMs;
}
