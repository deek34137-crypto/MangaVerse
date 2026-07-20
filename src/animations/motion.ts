/**
 * MangaHub — Animation Token System
 *
 * Single source of truth for all motion values.
 * Refactored for Inkline 2.0 (no bounce spring transitions, standardized speeds).
 */

import type { Transition, Variants, TargetAndTransition } from "framer-motion";

/* ─── Easing curves (Inkline 2.0) ────────────────────────────────────────── */
export const ease = {
  /** Standard ease curve — fast-in, smooth deceleration (default transition) */
  out: [0.4, 0, 0.2, 1] as const,
  /** Entrance ease curve — elements appearing */
  entrance: [0, 0, 0.2, 1] as const,
  /** Exit ease curve — elements leaving */
  exit: [0.4, 0, 1, 1] as const,
  /** Cinematic — standard ease out */
  cinematic: [0.4, 0, 0.2, 1] as const,
} as const;

/* ─── Duration scale (Inkline 2.0) ───────────────────────────────────────── */
export const duration = {
  /** 120ms — fast micro-interactions (button click, checkmark toggle) */
  fast: 0.12,
  /** 180ms — standard UI transitions (page fades, dropdowns, tabs) */
  base: 0.18,
  /** 280ms — slow transitions (modals, drawers) */
  slow: 0.28,
  /** 180ms — page route change transitions */
  page: 0.18,
  /** 280ms — cinematic entries */
  cinematic: 0.28,
} as const;

/* ─── Standard Transitions (tween-based, no bounce) ──────────────────────── */
export const spring = {
  /** Nav indicator / tab underline standard tween */
  nav: { type: "tween", ease: "easeOut", duration: duration.base } satisfies Transition,
  /** Base transition mapped from spring for compatibility */
  base: { type: "tween", ease: "easeOut", duration: duration.base } satisfies Transition,
  /** Gentle transition for panels */
  gentle: { type: "tween", ease: "easeOut", duration: duration.slow } satisfies Transition,
  /** Stiff transition for controls auto-hide */
  stiff: { type: "tween", ease: "easeOut", duration: duration.fast } satisfies Transition,
} as const;

/* ─── Shared transitions ─────────────────────────────────────────────────── */
export const transition = {
  fade: { duration: duration.base, ease: ease.out } satisfies Transition,
  slow: { duration: duration.slow, ease: ease.out } satisfies Transition,
  page: { duration: duration.page, ease: ease.out } satisfies Transition,
  cinematic: { duration: duration.cinematic, ease: ease.cinematic } satisfies Transition,
} as const;

/* ─── Reusable hover targets (Inkline 2.0: Lift & scale bounds) ──────────── */
export const hover = {
  /** Lift 2px - standard media card hover */
  lift: { y: -2 } satisfies TargetAndTransition,
  /** Subtle scale 1.02 - icon buttons */
  scale: { scale: 1.02 } satisfies TargetAndTransition,
  /** Subtle lift 1px for nav buttons */
  subtle: { y: -1 } satisfies TargetAndTransition,
} as const;

export const tap = {
  /** Standard active button scale 2% down */
  base: { scale: 0.98 } satisfies TargetAndTransition,
  /** Icon button active tap */
  icon: { scale: 0.98 } satisfies TargetAndTransition,
} as const;

/* ─── Reusable variant sets ─────────────────────────────────────────────── */

/** Fade up — content reveal */
export const reveal: Variants = {
  hidden: { opacity: 0, y: 8 },
  visible: { opacity: 1, y: 0, transition: transition.fade },
};

/** Fade — simple opacity */
export const fade: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: transition.fade },
};

/** Slide in from left */
export const slideInLeft: Variants = {
  hidden: { opacity: 0, x: -16 },
  visible: { opacity: 1, x: 0, transition: transition.fade },
};

/** Slide in from right */
export const slideInRight: Variants = {
  hidden: { opacity: 0, x: 16 },
  visible: { opacity: 1, x: 0, transition: transition.fade },
};

/** Scale in — badges, notifications */
export const scaleIn: Variants = {
  hidden: { opacity: 0, scale: 0.98 },
  visible: { opacity: 1, scale: 1, transition: spring.base },
};

/** Page transition (Fade Only, 180ms) */
export const pageTransition: Variants = {
  initial: { opacity: 0 },
  animate: { opacity: 1, transition: { duration: duration.base, ease: ease.out } },
  exit: { opacity: 0, transition: { duration: duration.fast, ease: ease.exit } },
};

/** Container with staggered children */
export const staggerContainer = (staggerDelay = 0.03): Variants => ({
  hidden: {},
  visible: {
    transition: {
      staggerChildren: staggerDelay,
      delayChildren: 0.03,
    },
  },
});

/** Staggered child — use with staggerContainer */
export const staggerChild: Variants = {
  hidden: { opacity: 0, y: 8 },
  visible: { opacity: 1, y: 0, transition: transition.fade },
};

/* ─── Helpers ────────────────────────────────────────────────────────────── */

/** Generate a stagger delay for index-based list items */
export const stagger = (index: number, step = 0.03, max = 0.24): number =>
  Math.min(index * step, max);
