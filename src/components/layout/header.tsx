"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { motion, AnimatePresence, useScroll, useTransform } from "framer-motion";
import {
  Menu, X, Sun, Moon, BookOpen, Heart, History,
  Settings, LogOut, User, Bell, Search, ChevronDown, Command,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { useTheme } from "next-themes";
import { ClientOnly } from "@/components/ui/ClientOnly";

import { MobileSearchOverlay } from "@/components/search/MobileSearchOverlay";

/* ── Nav items ───────────────────────────────────────────────────────────── */
const navItems = [
  { name: "Home",            href: "/" },
  { name: "Search",          href: "/search" },
  { name: "Library",         href: "/library" },
  { name: "History",         href: "/history" },
  { name: "Recommendations", href: "/recommendations" },
];

/* ── Search trigger tooltip label ───────────────────────────────────────── */
function KbdHint({ children }: { children: React.ReactNode }) {
  return (
    <kbd className="inline-flex items-center rounded border border-border px-1.5 py-0.5 text-xs text-muted-foreground ml-2">
      {children}
    </kbd>
  );
}

/* ── Notification dot ────────────────────────────────────────────────────── */
function NotifBadge({ count }: { count: number }) {
  if (!count) return null;
  return (
    <motion.span
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      className="absolute -top-1.5 -right-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-destructive-foreground ring-2 ring-background"
    >
      {count > 9 ? "9+" : count}
    </motion.span>
  );
}

/* ── Mobile menu item ────────────────────────────────────────────────────── */
function MobileNavItem({ href, name, pathname, onClick }: {
  href: string; name: string; pathname: string; onClick: () => void;
}) {
  const active = pathname === href || (href !== "/" && pathname.startsWith(href));
  return (
    <motion.div
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ ease: [0, 0, 0.2, 1], duration: 0.12 }}
    >
      <Link
        href={href}
        onClick={onClick}
        className={cn(
          "flex items-center gap-3 px-4 py-3 rounded-sm text-sm font-medium transition-all",
          active
            ? "bg-primary/10 text-primary border border-primary/20"
            : "text-ink-400 hover:text-ink-50 hover:bg-ink-800"
        )}
      >
        {name}
        {active && (
          <span className="ml-auto w-1.5 h-1.5 rounded-full bg-primary" />
        )}
      </Link>
    </motion.div>
  );
}

/* ── Main Header ─────────────────────────────────────────────────────────── */
export function Header() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [hidden, setHidden] = useState(false);
  const lastScrollY = useRef(0);
  const pathname = usePathname();
  const router = useRouter();
  const { theme, setTheme } = useTheme();

  // Scroll-aware glass effect and hide-on-scroll down
  useEffect(() => {
    const handle = () => {
      const currentScrollY = window.scrollY;
      setScrolled(currentScrollY > 20);

      // Auto-hide mobile header when scrolling down past 80px, show when scrolling up
      if (currentScrollY > 80 && currentScrollY > lastScrollY.current + 10) {
        setHidden(true);
      } else if (currentScrollY < lastScrollY.current - 10 || currentScrollY <= 80) {
        setHidden(false);
      }
      lastScrollY.current = currentScrollY;
    };

    window.addEventListener("scroll", handle, { passive: true });
    return () => window.removeEventListener("scroll", handle);
  }, []);

  // Close mobile menu on route change (render-phase state update)
  const [prevPathname, setPrevPathname] = useState(pathname);
  if (pathname !== prevPathname) {
    setPrevPathname(pathname);
    if (mobileOpen) {
      setMobileOpen(false);
    }
  }

  // ⌘K opens search
  useEffect(() => {
    const handle = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        router.push("/search");
      }
    };
    document.addEventListener("keydown", handle);
    return () => document.removeEventListener("keydown", handle);
  }, [router]);

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  return (
    <>
      <header
        className={cn(
          "fixed top-0 left-0 right-0 z-50 transition-transform duration-300 ease-in-out pt-safe",
          hidden ? "-translate-y-full" : "translate-y-0",
          scrolled
            ? "glass-nav shadow-lg"
            : "bg-transparent border-b border-transparent"
        )}
      >
        <div className="container-padded">
          <div className="flex h-16 items-center justify-between gap-4">

            {/* ── Logo ── */}
            <Link
              href="/"
              className="flex items-center gap-2.5 group flex-shrink-0"
              aria-label="MangaHub Home"
            >
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary shadow-sm"
              >
                <BookOpen className="h-4.5 w-4.5 text-primary-foreground" />
              </motion.div>
              <span className="font-display font-bold text-xl tracking-tight text-foreground group-hover:text-primary transition-colors duration-180">
                MangaHub
              </span>
            </Link>

            {/* ── Desktop nav ── */}
            <nav className="hidden md:flex items-center gap-1 bg-ink-950/20 p-1 rounded-full border border-ink-800/30" role="navigation" aria-label="Main navigation">
              {navItems.map((item) => {
                const active = isActive(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "relative px-4 py-1.5 rounded-full text-xs font-semibold transition-colors duration-180",
                      active
                        ? "text-foreground"
                        : "text-ink-200 hover:text-foreground hover:bg-ink-800/40"
                    )}
                    aria-current={active ? "page" : undefined}
                  >
                    {item.name}
                    {active && (
                      <motion.div
                        layoutId="nav-indicator"
                        className="absolute inset-0 rounded-full bg-primary/10 border border-primary/20 -z-10"
                        transition={{ type: "spring", stiffness: 380, damping: 30 }}
                      />
                    )}
                  </Link>
                );
              })}
            </nav>

            {/* ── Right actions ── */}
            <div className="flex items-center gap-3 sm:gap-4">

              {/* Search Trigger Mock Input */}
              <TooltipProvider delayDuration={200}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <motion.button
                      onClick={() => router.push("/search")}
                      className="hidden sm:flex items-center justify-between w-44 lg:w-52 h-9 px-3 rounded-full bg-ink-900/60 hover:bg-ink-800/80 text-ink-400 hover:text-ink-200 text-xs transition-all border border-ink-700 hover:border-ink-600 cursor-pointer"
                      whileHover={{ scale: 1.01 }}
                      whileTap={{ scale: 0.99 }}
                      aria-label="Search manga (Ctrl+K)"
                    >
                      <div className="flex items-center gap-2">
                        <Search className="h-3.5 w-3.5 text-ink-400" />
                        <span>Search manga...</span>
                      </div>
                      <KbdHint>⌘K</KbdHint>
                    </motion.button>
                  </TooltipTrigger>
                  <TooltipContent side="bottom">Quick search</TooltipContent>
                </Tooltip>
              </TooltipProvider>

              {/* Theme toggle */}
              <ClientOnly fallback={
                <button
                  className="h-9 w-9 rounded-full flex items-center justify-center text-ink-200 border border-transparent opacity-50 cursor-default"
                  aria-label="Loading theme toggle"
                  disabled
                >
                  <div className="h-4.5 w-4.5 rounded-full bg-current opacity-20" />
                </button>
              }>
                <TooltipProvider delayDuration={200}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <motion.button
                        onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                        className="h-9 w-9 rounded-full flex items-center justify-center text-ink-200 hover:text-ink-50 hover:bg-ink-800/80 transition-all border border-transparent hover:border-ink-700 cursor-pointer"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        aria-label="Toggle theme"
                      >
                        <AnimatePresence mode="wait" initial={false}>
                          {theme === "dark" ? (
                            <motion.div key="sun" initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }} transition={{ duration: 0.15 }}>
                              <Sun className="h-4 w-4" />
                            </motion.div>
                          ) : (
                            <motion.div key="moon" initial={{ rotate: 90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: -90, opacity: 0 }} transition={{ duration: 0.15 }}>
                              <Moon className="h-4 w-4" />
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </motion.button>
                    </TooltipTrigger>
                    <TooltipContent side="bottom">{theme === "dark" ? "Light mode" : "Dark mode"}</TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </ClientOnly>

              {/* Notifications Dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <motion.button
                    className="relative h-9 w-9 rounded-full flex items-center justify-center text-ink-200 hover:text-ink-50 hover:bg-ink-800/80 transition-all border border-transparent hover:border-ink-700 cursor-pointer"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    aria-label="Notifications (3 unread)"
                  >
                    <Bell className="h-4 w-4" />
                    <NotifBadge count={3} />
                  </motion.button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-80 bg-popover border border-ink-700 shadow-dropdown mt-2 rounded-xl p-1" sideOffset={8}>
                  <DropdownMenuLabel className="font-semibold text-sm px-3 py-2 text-foreground">
                    Notifications
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <div className="max-h-64 overflow-y-auto">
                    {[
                      { id: "1", title: "New Chapter Available", message: "Solo Leveling Chapter 120 has been updated.", time: "2 hours ago", read: false },
                      { id: "2", title: "Manga Recommendation", message: "Based on your library, check out Chainsaw Man.", time: "1 day ago", read: false },
                      { id: "3", title: "Welcome to MangaHub!", message: "Enjoy the premium cinematic manga experience.", time: "3 days ago", read: true }
                    ].map((notif) => (
                      <DropdownMenuItem key={notif.id} className="flex flex-col items-start gap-0.5 p-3 cursor-pointer border-b border-ink-800/40 last:border-0 hover:bg-ink-800/60 focus:bg-ink-800/60 rounded-lg">
                        <div className="flex items-center gap-2 w-full">
                          <span className={cn("font-semibold text-xs text-foreground", !notif.read && "text-primary")}>{notif.title}</span>
                          {!notif.read && <span className="h-1.5 w-1.5 rounded-full bg-primary ml-auto" />}
                        </div>
                        <p className="text-[11px] text-ink-400 leading-normal line-clamp-2 mt-1">{notif.message}</p>
                        <span className="text-[9px] text-ink-400/50 mt-1.5">{notif.time}</span>
                      </DropdownMenuItem>
                    ))}
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem className="w-full text-center text-[11px] font-semibold text-primary hover:text-primary-hover focus:text-primary py-2 cursor-pointer flex justify-center hover:bg-transparent focus:bg-transparent">
                    Mark all as read
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              <div className="hidden sm:block w-px h-5 bg-ink-700/60 mx-1" />

              {/* User menu */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <motion.button
                    className="flex items-center gap-1.5 h-9 px-2 rounded-full hover:bg-ink-800/80 transition-all border border-transparent cursor-pointer"
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                  >
                    <Avatar className="h-7 w-7 border border-ink-700 shadow-sm">
                      <AvatarFallback className="text-xs font-bold bg-ink-800 text-ink-50 border border-ink-700">
                        U
                      </AvatarFallback>
                    </Avatar>
                    <ChevronDown className="h-3.5 w-3.5 text-ink-400 hidden sm:block" />
                  </motion.button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56 bg-popover border border-ink-700 shadow-dropdown mt-2 rounded-xl p-1" sideOffset={8}>
                  <DropdownMenuLabel className="font-normal pb-3 p-3">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-9 w-9">
                        <AvatarFallback className="text-sm font-bold bg-ink-800 text-ink-50 border border-ink-700">U</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="text-sm font-semibold leading-none mb-1">Username</p>
                        <p className="text-xs leading-none text-ink-400 mt-1">user@mangahub.com</p>
                      </div>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {[
                    { href: "/library",         icon: BookOpen, label: "My Library" },
                    { href: "/history",          icon: History,  label: "Reading History" },
                    { href: "/recommendations",  icon: Heart,    label: "Recommendations" },
                  ].map(({ href, icon: Icon, label }) => (
                    <DropdownMenuItem key={href} asChild>
                      <Link href={href} className="flex items-center gap-2.5 p-2 rounded-lg cursor-pointer text-sm">
                        <Icon className="h-4 w-4 text-ink-400" />
                        {label}
                      </Link>
                    </DropdownMenuItem>
                  ))}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href="/settings" className="flex items-center gap-2.5 p-2 rounded-lg cursor-pointer text-sm">
                      <Settings className="h-4 w-4 text-ink-400" />
                      Settings
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem className="text-destructive focus:text-destructive focus:bg-destructive/10 p-2 rounded-lg cursor-pointer text-sm">
                    <LogOut className="h-4 w-4 mr-2.5" />
                    Sign Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Mobile search button */}
              <button
                type="button"
                className="md:hidden h-9 w-9 rounded-full flex items-center justify-center text-ink-200 hover:text-ink-50 hover:bg-ink-800/80 transition-all border border-transparent hover:border-ink-700 cursor-pointer touch-target"
                onClick={() => setMobileSearchOpen(true)}
                aria-label="Open mobile search"
              >
                <Search className="h-5 w-5" />
              </button>

              {/* Mobile hamburger */}
              <motion.button
                className="md:hidden h-9 w-9 rounded-full flex items-center justify-center text-ink-200 hover:text-ink-50 hover:bg-ink-800/80 transition-all ml-1 border border-transparent hover:border-ink-700 cursor-pointer"
                onClick={() => setMobileOpen((p) => !p)}
                aria-label={mobileOpen ? "Close menu" : "Open menu"}
                aria-expanded={mobileOpen}
                whileTap={{ scale: 0.98 }}
              >
                <AnimatePresence mode="wait" initial={false}>
                  {mobileOpen ? (
                    <motion.div key="x" initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }} transition={{ duration: 0.15 }}>
                      <X className="h-5 w-5" />
                    </motion.div>
                  ) : (
                    <motion.div key="menu" initial={{ rotate: 90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: -90, opacity: 0 }} transition={{ duration: 0.15 }}>
                      <Menu className="h-5 w-5" />
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.button>
            </div>
          </div>
        </div>
      </header>

      {/* ── Mobile menu ── */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2, ease: [0, 0, 0.2, 1] }}
            className="fixed top-16 left-0 right-0 z-40 bg-card/95 backdrop-blur-xl border-b border-ink-700 p-4 md:hidden shadow-lg rounded-b-2xl"
          >
            {/* Search bar in mobile */}
            <button
              onClick={() => { router.push("/search"); setMobileOpen(false); }}
              className="flex items-center gap-3 w-full mb-4 px-4 py-3 rounded-full bg-ink-900 border border-ink-700 text-ink-400 text-sm hover:bg-ink-800 transition-colors"
            >
              <Search className="h-4 w-4" />
              <span>Search manga…</span>
              <KbdHint>⌘K</KbdHint>
            </button>

            {/* Nav links */}
            <nav className="flex flex-col gap-1.5" role="navigation">
              {navItems.map((item, i) => (
                <motion.div
                  key={item.href}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.03, ease: [0, 0, 0.2, 1], duration: 0.12 }}
                >
                  <MobileNavItem
                    href={item.href}
                    name={item.name}
                    pathname={pathname}
                    onClick={() => setMobileOpen(false)}
                  />
                </motion.div>
              ))}
            </nav>

            {/* Theme toggle row */}
            <div className="flex items-center gap-3 mt-4 pt-4 border-t border-ink-700">
              <button
                onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-full bg-ink-800 border border-ink-700 text-sm font-medium hover:bg-ink-700 text-ink-200 transition-colors cursor-pointer"
              >
                {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
                {theme === "dark" ? "Light Mode" : "Dark Mode"}
              </button>
              <Link
                href="/settings"
                onClick={() => setMobileOpen(false)}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-full bg-ink-800 border border-ink-700 text-sm font-medium hover:bg-ink-700 text-ink-200 transition-colors"
              >
                <Settings className="h-4 w-4" />
                Settings
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Mobile Search Overlay */}
      <MobileSearchOverlay
        isOpen={mobileSearchOpen}
        onClose={() => setMobileSearchOpen(false)}
      />
    </>
  );
}