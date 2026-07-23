"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Download, X, Smartphone, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { usePWAInstall } from "@/hooks/usePWAInstall";
import { ClientOnly } from "@/components/ui/ClientOnly";

const DISMISS_DAYS = 7;
const DISMISS_KEY = "mangahub_install_dismissed_until";

export function InstallPromptBanner() {
  const { isInstallable, isInstalled, installPWA } = usePWAInstall();
  const [dismissed, setDismissed] = useState(false);
  const [hasScrolled, setHasScrolled] = useState(false);
  const pathname = usePathname();

  // Check 7-day dismissal persistence in localStorage
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const until = localStorage.getItem(DISMISS_KEY);
      if (until && parseInt(until, 10) > Date.now()) {
        setDismissed(true);
      }
    } catch {}
  }, []);

  // Trigger banner after scroll interaction (>400px)
  useEffect(() => {
    if (typeof window === "undefined" || dismissed) return;
    const handleScroll = () => {
      if (window.scrollY > 400) {
        setHasScrolled(true);
      }
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [dismissed]);

  const handleDismiss = () => {
    setDismissed(true);
    if (typeof window !== "undefined") {
      try {
        const nextTime = Date.now() + DISMISS_DAYS * 24 * 60 * 60 * 1000;
        localStorage.setItem(DISMISS_KEY, nextTime.toString());
      } catch {}
    }
  };

  // Do not show inside reader route, if already installed, dismissed, or not scrolled
  if (!isInstallable || isInstalled || dismissed || !hasScrolled || pathname.includes("/chapter/")) {
    return null;
  }

  return (
    <ClientOnly>
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0, y: 50, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 50, scale: 0.95 }}
          transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
          className="fixed bottom-6 left-4 md:left-6 z-40 w-[calc(100%-2rem)] md:w-96 p-4 rounded-2xl bg-ink-900/95 border border-primary/30 backdrop-blur-xl shadow-2xl"
        >
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/20 text-primary">
              <Smartphone className="w-5 h-5" />
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5 font-semibold text-sm text-foreground">
                <span>Install MangaHub</span>
                <Sparkles className="w-3.5 h-3.5 text-yellow-400 fill-yellow-400" />
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                Add to home screen for full offline reading and native app performance.
              </p>

              <div className="flex items-center gap-2 mt-3">
                <Button
                  size="sm"
                  onClick={installPWA}
                  className="h-8 px-3.5 text-xs font-semibold bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5 mr-1.5" />
                  Install App
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={handleDismiss}
                  className="h-8 px-3 text-xs text-muted-foreground hover:text-foreground cursor-pointer"
                >
                  Maybe later
                </Button>
              </div>
            </div>

            <button
              type="button"
              onClick={handleDismiss}
              className="text-muted-foreground hover:text-foreground p-1 touch-target cursor-pointer"
              aria-label="Close banner"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </motion.div>
      </AnimatePresence>
    </ClientOnly>
  );
}
