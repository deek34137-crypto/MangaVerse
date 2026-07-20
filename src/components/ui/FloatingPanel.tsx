"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface FloatingPanelProps {
  children: React.ReactNode;
  className?: string;
  /** Panel position preset */
  position?: "top" | "bottom" | "left" | "right" | "center" | "none";
  /** Whether to show an animated entrance */
  animate?: boolean;
  /** If true, adds a subtle border glow */
  glow?: boolean;
  /** aria-label for the panel region */
  label?: string;
  id?: string;
}

const positionClasses: Record<string, string> = {
  top: "top-0 left-0 right-0",
  bottom: "bottom-0 left-0 right-0",
  left: "top-0 left-0 bottom-0",
  right: "top-0 right-0 bottom-0",
  center: "top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2",
  none: "",
};

const positionVariants: Record<string, object> = {
  top: { initial: { y: -12, opacity: 0 }, animate: { y: 0, opacity: 1 }, exit: { y: -12, opacity: 0 } },
  bottom: { initial: { y: 12, opacity: 0 }, animate: { y: 0, opacity: 1 }, exit: { y: 12, opacity: 0 } },
  left: { initial: { x: -12, opacity: 0 }, animate: { x: 0, opacity: 1 }, exit: { x: -12, opacity: 0 } },
  right: { initial: { x: 12, opacity: 0 }, animate: { x: 0, opacity: 1 }, exit: { x: 12, opacity: 0 } },
  center: { initial: { scale: 0.95, opacity: 0 }, animate: { scale: 1, opacity: 1 }, exit: { scale: 0.95, opacity: 0 } },
  none: { initial: { opacity: 0 }, animate: { opacity: 1 }, exit: { opacity: 0 } },
};

/**
 * FloatingPanel — glassmorphic floating surface.
 * Used for: reader toolbar, reader settings, command palette, popovers.
 */
export function FloatingPanel({
  children,
  className,
  position = "none",
  animate = true,
  glow = false,
  label,
  id,
}: FloatingPanelProps) {
  const variants = positionVariants[position] ?? positionVariants.none;
  const posClass = positionClasses[position] ?? "";

  const baseClass = cn(
    "glass-dark rounded-2xl shadow-xl",
    glow && "ring-1 ring-primary/20",
    posClass,
    className
  );

  if (!animate) {
    return (
      <div
        className={baseClass}
        role="region"
        aria-label={label}
        id={id}
      >
        {children}
      </div>
    );
  }

  return (
    <motion.div
      {...variants}
      transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
      className={baseClass}
      role="region"
      aria-label={label}
      id={id}
    >
      {children}
    </motion.div>
  );
}
