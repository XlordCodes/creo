import Lenis from "lenis";
import { useEffect, useRef } from "react";
import { useLocation } from "react-router";

/**
 * Inertial smooth scrolling (Lenis) for the marketing pages.
 * Skipped entirely for users who prefer reduced motion and on touch devices,
 * where native momentum scrolling already feels right.
 */
export function SmoothScroll() {
  const lenisRef = useRef<Lenis | null>(null);
  const { pathname } = useLocation();

  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const touch = window.matchMedia("(pointer: coarse)").matches;
    if (reduce || touch) return;

    const lenis = new Lenis({
      duration: 1.15,
      easing: (t) => Math.min(1, 1.001 - 2 ** (-10 * t)),
      smoothWheel: true,
      anchors: { offset: -80 },
      autoRaf: true,
      // Let nested scroll areas (tables, dialogs, dropdowns) scroll natively
      prevent: (node) =>
        node.closest("[data-lenis-prevent], [role='dialog'], .overflow-x-auto") !== null,
    });
    lenisRef.current = lenis;
    return () => {
      lenis.destroy();
      lenisRef.current = null;
    };
  }, []);

  // New page → start at the top without an animated scroll back
  useEffect(() => {
    lenisRef.current?.scrollTo(0, { immediate: true, force: true });
  }, [pathname]);

  return null;
}
