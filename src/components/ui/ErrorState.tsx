"use client";

import { motion } from "framer-motion";
import { AlertTriangle, RefreshCw, WifiOff, ServerCrash } from "lucide-react";
import { cn } from "@/lib/utils";
import { scaleIn } from "@/animations/motion";
import { Button } from "@/components/ui/button";

type ErrorType = "network" | "server" | "notFound" | "generic";

interface ErrorStateProps {
  /** Visual error type — drives icon and default title */
  type?: ErrorType;
  title?: string;
  description?: string;
  onRetry?: () => void;
  retryLabel?: string;
  className?: string;
  contained?: boolean;
}

const errorConfig: Record<ErrorType, { icon: React.ElementType; title: string; description: string }> = {
  network: {
    icon: WifiOff,
    title: "No connection",
    description: "Check your internet connection and try again.",
  },
  server: {
    icon: ServerCrash,
    title: "Server error",
    description: "Something went wrong on our end. We're working on it.",
  },
  notFound: {
    icon: AlertTriangle,
    title: "Not found",
    description: "This content doesn't exist or has been removed.",
  },
  generic: {
    icon: AlertTriangle,
    title: "Something went wrong",
    description: "An unexpected error occurred. Please try again.",
  },
};

/**
 * ErrorState — consistent error placeholder across the app.
 * Used for: failed search, failed manga load, API errors.
 */
export function ErrorState({
  type = "generic",
  title,
  description,
  onRetry,
  retryLabel = "Try again",
  className,
  contained = true,
}: ErrorStateProps) {
  const config = errorConfig[type];
  const Icon = config.icon;

  return (
    <motion.div
      variants={scaleIn}
      initial="hidden"
      animate="visible"
      className={cn(
        "flex flex-col items-center justify-center text-center py-16 px-8",
        contained && "rounded-2xl bg-destructive/5 border border-destructive/20",
        className
      )}
    >
      <div
        className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-destructive/10 text-destructive"
        aria-hidden="true"
      >
        <Icon className="h-8 w-8" />
      </div>

      <h3 className="font-display font-bold text-foreground text-lg mb-2">
        {title ?? config.title}
      </h3>

      <p className="text-muted-foreground text-sm max-w-sm leading-relaxed mb-6">
        {description ?? config.description}
      </p>

      {onRetry && (
        <Button
          variant="outline"
          onClick={onRetry}
          className="gap-2 border-destructive/30 hover:border-destructive/60"
        >
          <RefreshCw className="h-4 w-4" />
          {retryLabel}
        </Button>
      )}
    </motion.div>
  );
}
