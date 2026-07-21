"use client";

import { useState, useEffect } from "react";

export interface BatteryStatus {
  isLowPower: boolean;
  batteryLevel: number;
}

export function useBatteryGuard(): BatteryStatus {
  const [status, setStatus] = useState<BatteryStatus>({
    isLowPower: false,
    batteryLevel: 1.0,
  });

  useEffect(() => {
    if (typeof window === "undefined") return;

    if ("getBattery" in navigator) {
      (navigator as unknown as { getBattery: () => Promise<BatteryManager> })
        .getBattery()
        .then((battery) => {
          const update = () => {
            const isLow = battery.level <= 0.15 && !battery.charging;
            setStatus({
              isLowPower: isLow,
              batteryLevel: battery.level,
            });
          };

          update();
          battery.addEventListener("levelchange", update);
          battery.addEventListener("chargingchange", update);
        })
        .catch(() => {
          // Ignore
        });
    }
  }, []);

  return status;
}

interface BatteryManager extends EventTarget {
  charging: boolean;
  chargingTime: number;
  dischargingTime: number;
  level: number;
}
