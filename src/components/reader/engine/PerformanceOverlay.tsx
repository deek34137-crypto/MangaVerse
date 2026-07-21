"use client";

import { useState, useEffect } from "react";
import { Activity, Cpu, HardDrive, Zap, Layers } from "lucide-react";
import { readerPerformanceMonitor, type ReaderPerformanceMetrics } from "./ReaderPerformanceMonitor";
import { useNetworkPolicy } from "@/hooks/useNetworkPolicy";
import { useCapabilityTier } from "@/hooks/useCapabilityTier";

export function PerformanceOverlay() {
  const [metrics, setMetrics] = useState<ReaderPerformanceMetrics>({
    fps: 60,
    heapUsedMB: 0,
    droppedFrames: 0,
    avgDecodeTimeMs: 0,
    longTaskCount: 0,
  });

  const network = useNetworkPolicy();
  const hardware = useCapabilityTier();

  useEffect(() => {
    readerPerformanceMonitor.start();
    const unsubscribe = readerPerformanceMonitor.subscribe((m) => setMetrics(m));

    return () => {
      unsubscribe();
      readerPerformanceMonitor.stop();
    };
  }, []);

  // Only render in development or debug mode
  if (process.env.NODE_ENV === "production") {
    return null;
  }

  return (
    <div className="fixed top-20 right-4 z-50 p-3 rounded-xl bg-ink-950/90 border border-primary/40 backdrop-blur-md text-xs font-mono shadow-2xl text-ink-50 space-y-1.5 min-w-[200px] pointer-events-none">
      <div className="flex items-center justify-between font-bold text-primary border-b border-ink-800 pb-1 mb-1">
        <span className="flex items-center gap-1">
          <Activity className="w-3.5 h-3.5" /> Reader Metrics
        </span>
        <span className={metrics.fps >= 55 ? "text-green-400" : "text-amber-400"}>
          {metrics.fps} FPS
        </span>
      </div>

      <div className="flex items-center justify-between text-[11px]">
        <span className="text-muted-foreground flex items-center gap-1">
          <HardDrive className="w-3 h-3" /> Heap:
        </span>
        <span>{metrics.heapUsedMB} MB</span>
      </div>

      <div className="flex items-center justify-between text-[11px]">
        <span className="text-muted-foreground flex items-center gap-1">
          <Layers className="w-3 h-3" /> Hardware Tier:
        </span>
        <span className="font-bold text-gold-500">{hardware.tier}</span>
      </div>

      <div className="flex items-center justify-between text-[11px]">
        <span className="text-muted-foreground flex items-center gap-1">
          <Zap className="w-3 h-3" /> Network:
        </span>
        <span className="uppercase">{network.tier} ({network.imageQuality})</span>
      </div>

      <div className="flex items-center justify-between text-[11px]">
        <span className="text-muted-foreground">Dropped Frames:</span>
        <span className={metrics.droppedFrames > 0 ? "text-amber-400" : "text-muted-foreground"}>
          {metrics.droppedFrames}
        </span>
      </div>
    </div>
  );
}
