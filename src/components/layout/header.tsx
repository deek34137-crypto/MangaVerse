"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X, Sun, Moon, Monitor, BookOpen, Heart, History, Settings, LogOut, User, Bell, Search, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import { useTheme } from "next-themes";

export function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const pathname = usePathname();
  const { theme, setTheme } = useTheme();

  const navigation = [
    { name: "Home", href: "/" },
    { name: "Search", href: "/search" },
    { name: "Library", href: "/library" },
    { name: "History", href: "/history" },
    { name: "Recommendations", href: "/recommendations" },
  ];

  return (
    <header className="fixed top-0 left-0 right-0 z-50 glass-strong border-b border-border/50">
      <div className="container-padded">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center gap-8">
            <Link href="/" className="flex items-center gap-2" aria-label="MangaHub Home">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-accent">
                <BookOpen className="h-5 w-5 text-primary-foreground" />
              </div>
              <span className="font-display font-bold text-xl text-foreground">MangaHub</span>
            </Link>

            <nav className="hidden md:flex items-center gap-1" role="navigation" aria-label="Main navigation">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className={cn(
                    "px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                    pathname === item.href
                      ? "bg-accent text-accent-foreground"
                      : "text-muted-foreground hover:text-foreground hover:bg-accent"
                  )}
                  aria-current={pathname === item.href ? "page" : undefined}
                >
                  {item.name}
                </Link>
              ))}
            </nav>
          </div>

          <div className="flex items-center gap-2">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-10 w-10"
                    onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                    aria-label="Toggle theme"
                  >
                    <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                    <Moon className="h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="bottom">{theme === "dark" ? "Light mode" : "Dark mode"}</TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-10 w-10 hidden sm:flex">
                    <Search className="h-5 w-5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="bottom">Search (⌘K)</TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-10 w-10 relative">
                    <Bell className="h-5 w-5" />
                    <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-destructive text-xs text-destructive-foreground">
                      3
                    </span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="bottom">Notifications</TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <div className="hidden sm:block w-px h-6 bg-border mx-2" />

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-10 w-10 rounded-full p-0">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src="/avatars/user.jpg" alt="User avatar" />
                    <AvatarFallback>U</AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">Username</p>
                    <p className="text-xs leading-none text-muted-foreground">user@mangahub.com</p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/library" className="flex items-center gap-2">
                    <BookOpen className="h-4 w-4" />
                    Library
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/history" className="flex items-center gap-2">
                    <History className="h-4 w-4" />
                    History
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/recommendations" className="flex items-center gap-2">
                    <Heart className="h-4 w-4" />
                    Recommendations
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/settings" className="flex items-center gap-2">
                    <Settings className="h-4 w-4" />
                    Settings
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="text-destructive focus:text-destructive">
                  <LogOut className="h-4 w-4 mr-2" />
                  Log out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <Button
              variant="ghost"
              size="icon"
              className="md:hidden h-10 w-10"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              aria-label="Open menu"
              aria-expanded={isMenuOpen}
            >
              {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </Button>
          </div>
        </div>
      </div>

      {isMenuOpen && (
        <div className="md:hidden border-t border-border bg-background p-4 animate-slide-down">
          <nav className="flex flex-col gap-2">
            {navigation.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  "px-3 py-2 rounded-lg text-sm font-medium",
                  pathname === item.href
                    ? "bg-accent text-accent-foreground"
                    : "text-muted-foreground hover:text-foreground hover:bg-accent"
                )}
                onClick={() => setIsMenuOpen(false)}
              >
                {item.name}
              </Link>
            ))}
            <div className="flex items-center gap-4 pt-4 border-t border-border">
              <Button variant="outline" className="flex-1" onClick={() => setTheme(theme === "dark" ? "light" : "dark")}>
                {theme === "dark" ? <Sun className="h-4 w-4 mr-2" /> : <Moon className="h-4 w-4 mr-2" />}
                {theme === "dark" ? "Light Mode" : "Dark Mode"}
              </Button>
              <Button variant="ghost" className="flex-1" onClick={() => setIsMenuOpen(false)}>
                <Settings className="h-4 w-4 mr-2" />
                Settings
              </Button>
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}