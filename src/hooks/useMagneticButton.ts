"use client";

import { useCallback, useRef } from "react";
import { useMotionValue, useSpring, useTransform } from "framer-motion";

/**
 * useMagneticButton — applies a subtle magnetic pull effect to a button.
 *
 * Attach `ref` to the element and apply `x` / `y` as motion values.
 * Call `onMouseMove` and `onMouseLeave` on the element.
 *
 * @param strength  Magnetic pull strength (0–1). Default: 0.4
 */
export function useMagneticButton(strength = 0.4) {
  const ref = useRef<HTMLElement | null>(null);

  const rawX = useMotionValue(0);
  const rawY = useMotionValue(0);

  const x = useSpring(rawX, { stiffness: 300, damping: 25 });
  const y = useSpring(rawY, { stiffness: 300, damping: 25 });

  const onMouseMove = useCallback(
    (e: React.MouseEvent) => {
      const el = ref.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      rawX.set((e.clientX - cx) * strength);
      rawY.set((e.clientY - cy) * strength);
    },
    [rawX, rawY, strength]
  );

  const onMouseLeave = useCallback(() => {
    rawX.set(0);
    rawY.set(0);
  }, [rawX, rawY]);

  return { ref, x, y, onMouseMove, onMouseLeave };
}
