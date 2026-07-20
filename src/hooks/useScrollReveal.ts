"use client";

import { useEffect, useRef, useState } from "react";

/**
 * useScrollReveal — triggers animation when element enters the viewport.
 *
 * @param threshold  Fraction of element visible before triggering (0–1)
 * @param rootMargin IntersectionObserver rootMargin
 * @param once       If true, only triggers once (default: true)
 */
export function useScrollReveal(
  threshold = 0.15,
  rootMargin = "0px",
  once = true
) {
  const ref = useRef<HTMLElement | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          if (once) observer.unobserve(el);
        } else if (!once) {
          setIsVisible(false);
        }
      },
      { threshold, rootMargin }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [threshold, rootMargin, once]);

  return { ref, isVisible };
}
