import Link from "next/link";
import { WifiOff, BookOpen, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function OfflinePage() {
  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 text-center">
      <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-ink-900 border border-ink-700 text-primary mb-6 shadow-xl">
        <WifiOff className="w-10 h-10 animate-pulse" />
      </div>

      <h1 className="font-display text-2xl font-bold text-foreground mb-2">
        You are currently offline
      </h1>
      <p className="text-muted-foreground text-sm max-w-sm mb-8">
        No internet connection detected. You can still read any chapters you have downloaded or saved to your offline cache.
      </p>

      <div className="flex flex-col sm:flex-row gap-3 w-full max-w-xs">
        <Button asChild className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold">
          <Link href="/library">
            <BookOpen className="w-4 h-4 mr-2" />
            Open Offline Library
          </Link>
        </Button>
      </div>
    </div>
  );
}
