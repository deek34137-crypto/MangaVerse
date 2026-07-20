"use client";

import { motion, AnimatePresence } from "framer-motion";
import { pageTransition } from "@/animations/motion";

interface PageTransitionProps {
  children: React.ReactNode;
  /** Unique key — typically the pathname, drives re-animation on route change */
  routeKey: string;
}

/**
 * PageTransition — wraps page content with a cinematic fade+scale entrance.
 * Place this inside the layout that wraps all pages.
 */
export function PageTransition({ children, routeKey }: PageTransitionProps) {
  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={routeKey}
        variants={pageTransition}
        initial="initial"
        animate="animate"
        exit="exit"
        style={{ willChange: "transform, opacity" }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}
