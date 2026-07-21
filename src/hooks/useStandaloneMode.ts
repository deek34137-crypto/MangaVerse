"use client";

import { useState, useEffect } from "react";

export function useStandaloneMode() {
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const checkStandalone = () => {
      const isDisplayStandalone = window.matchMedia("(display-mode: standalone)").matches;
      // iOS Safari standalone check
      const isNavStandalone = (navigator as unknown as { standalone?: boolean }).standalone === true;
      setIsStandalone(isDisplayStandalone || isNavStandalone);
    };

    checkStandalone();

    const mediaQuery = window.matchMedia("(display-mode: standalone)");
    const handleChange = (e: MediaQueryListEvent) => setIsStandalone(e.matches);

    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, []);

  return { isStandalone };
}
