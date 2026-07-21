"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Download, X, Smartphone, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { usePWAInstall } from "@/hooks/usePWAInstall";
import { ClientOnly } from "@/components/ui/ClientOnly";

export function InstallPromptBanner() {
  const { isInstallable, isInstalled, installPWA } = usePWAInstall();
  const [dismissed, setDismissed] = useState(false);
  const [showDelay, setShowDelay] = useState(false);
  const pathname = usePathname();

  // Show banner after 30s delay to prevent immediate content overlap
  useEffect(() => {
    const timer = setTimeout(() => setShowDelay(true), 30000);
    return () => clearTimeout(timer);
  }, []);

  // Do not show inside reader route or before delay
  if (!isInstallable || isInstalled || dismissed || !showDelay || pathname.includes("/chapter/")) {
    return null;
  }

  return (
    <ClientOnly>
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 50 }}
          className="fixed bottom-24 left-4 right-4 z-40 md:left-auto md:right-6 md:w-96 p-4 rounded-2xl bg-ink-900/95 border border-primary/30 backdrop-blur-xl shadow-2xl"
        >
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/20 text-primary">
              <Smartphone className="w-5 h-5" />
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5 font-semibold text-sm text-foreground">
                <span>Install MangaHub</span>
                <Sparkles className="w-3.5 h-3.5 text-gold-500 fill-gold-500" />
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                Add to your home screen for full offline reading and a native app experience.
              </p>

              <div className="flex items-center gap-2 mt-3">
                <Button
                  size="sm"
                  onClick={installPWA}
                  className="h-8 px-3.5 text-xs font-semibold bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg"
                >
                  <Download className="w-3.5 h-3.5 mr-1.5" />
                  Install App
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setDismissed(true)}
                  className="h-8 px-3 text-xs text-muted-foreground hover:text-foreground"
                >
                  Maybe later
                </Button>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setDismissed(true)}
              className="text-muted-foreground hover:text-foreground p-1 touch-target"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </motion.div>
      </AnimatePresence>
    </ClientOnly>
  );
}
