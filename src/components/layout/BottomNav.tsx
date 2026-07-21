"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { Home, Search, BookOpen, History, Settings, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { useHaptic } from "@/hooks/useHaptic";
import { ClientOnly } from "@/components/ui/ClientOnly";

const navItems = [
  { name: "Home", href: "/", icon: Home },
  { name: "Search", href: "/search", icon: Search },
  { name: "Library", href: "/library", icon: BookOpen },
  { name: "History", href: "/history", icon: History },
  { name: "Explore", href: "/recommendations", icon: Sparkles },
];

export function BottomNav() {
  const pathname = usePathname();
  const { triggerHaptic } = useHaptic();

  // Hide bottom nav inside chapter reader views
  if (pathname.includes("/read/")) {
    return null;
  }

  return (
    <ClientOnly>
      <nav
        aria-label="Mobile Bottom Navigation"
        className="fixed bottom-0 left-0 right-0 z-40 block md:hidden bg-ink-950/85 backdrop-blur-xl border-t border-ink-800/80 pb-safe"
      >
        <div className="flex items-center justify-around h-14 px-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive =
              pathname === item.href ||
              (item.href !== "/" && pathname.startsWith(item.href));

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => triggerHaptic("light")}
                className={cn(
                  "relative flex flex-col items-center justify-center w-full h-full text-xs font-medium transition-colors touch-target active-press",
                  isActive ? "text-primary" : "text-ink-400 hover:text-ink-200"
                )}
              >
                {isActive && (
                  <motion.div
                    layoutId="bottom-nav-active"
                    className="absolute -top-0.5 w-8 h-1 bg-primary rounded-full"
                    transition={{ type: "spring", stiffness: 350, damping: 25 }}
                  />
                )}
                <Icon className={cn("w-5 h-5 mb-0.5", isActive ? "scale-110" : "scale-100")} />
                <span className="text-[10px] tracking-tight">{item.name}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </ClientOnly>
  );
}
