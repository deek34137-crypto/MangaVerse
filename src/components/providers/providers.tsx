"use client";

import { SessionProvider } from "next-auth/react";
import { ThemeProvider } from "next-themes";
import { usePathname } from "next/navigation";
import { ReactNode } from "react";
import { Toaster } from "@/components/ui/toaster";
import { PageTransition } from "@/components/ui/PageTransition";
import { MotionConfig } from "framer-motion";
import { BottomNav } from "@/components/layout/BottomNav";
import { InstallPromptBanner } from "@/components/pwa/InstallPromptBanner";

interface ProvidersProps {
  children: ReactNode;
}

export function Providers({ children }: ProvidersProps) {
  const pathname = usePathname();

  return (
    <SessionProvider>
      <ThemeProvider
        attribute="class"
        defaultTheme="dark"
        enableSystem
        disableTransitionOnChange
      >
        <MotionConfig reducedMotion="user">
          <PageTransition routeKey={pathname}>
            {children}
          </PageTransition>
        </MotionConfig>
        <BottomNav />
        <InstallPromptBanner />
        <Toaster />
      </ThemeProvider>
    </SessionProvider>
  );
}