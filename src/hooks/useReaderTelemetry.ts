"use client";

import { useEffect, useRef } from "react";

export interface ReaderTelemetryMetric {
  sessionDurationMs: number;
  pinchCount: number;
  swipeCount: number;
  gestureFailures: number;
  avgFps: number;
}

export function useReaderTelemetry(mangaId: string, chapterId: string) {
  const startTimeRef = useRef<number>(Date.now());
  const metricsRef = useRef<ReaderTelemetryMetric>({
    sessionDurationMs: 0,
    pinchCount: 0,
    swipeCount: 0,
    gestureFailures: 0,
    avgFps: 60,
  });

  useEffect(() => {
    startTimeRef.current = Date.now();

    return () => {
      const duration = Date.now() - startTimeRef.current;
      metricsRef.current.sessionDurationMs = duration;

      // Save beacon to telemetry store
      try {
        const stored = localStorage.getItem("mangahub_telemetry_v1");
        const beacons = stored ? JSON.parse(stored) : [];
        beacons.push({
          mangaId,
          chapterId,
          timestamp: Date.now(),
          ...metricsRef.current,
        });
        localStorage.setItem("mangahub_telemetry_v1", JSON.stringify(beacons.slice(-20)));
      } catch {
        // Ignore
      }
    };
  }, [mangaId, chapterId]);

  const recordGesture = (type: "pinch" | "swipe" | "failure") => {
    if (type === "pinch") metricsRef.current.pinchCount++;
    else if (type === "swipe") metricsRef.current.swipeCount++;
    else if (type === "failure") metricsRef.current.gestureFailures++;
  };

  return { recordGesture };
}
