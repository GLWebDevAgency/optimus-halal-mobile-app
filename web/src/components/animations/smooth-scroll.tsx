"use client";

import { useEffect, useRef } from "react";
import Lenis from "lenis";
import Snap from "lenis/snap";

export function SmoothScroll({ children }: { children: React.ReactNode }) {
  const lenisRef = useRef<Lenis | null>(null);
  const snapRef = useRef<Snap | null>(null);

  useEffect(() => {
    const prefersReduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;
    if (prefersReduced) return;

    const lenis = new Lenis({
      lerp: 0.08,
      smoothWheel: true,
    });
    lenisRef.current = lenis;

    // Snap: gently pull to section boundaries
    const snap = new Snap(lenis, {
      type: "proximity",
      lerp: 0.1,
      debounce: 150,
    });
    snapRef.current = snap;

    // Register all [data-snap] elements as snap points
    const sections = document.querySelectorAll<HTMLElement>("[data-snap]");
    const removers: (() => void)[] = [];
    sections.forEach((el) => {
      removers.push(snap.addElement(el, { align: ["start"] }));
    });

    let rafId: number;
    function raf(time: number) {
      lenis.raf(time);
      rafId = requestAnimationFrame(raf);
    }
    rafId = requestAnimationFrame(raf);

    return () => {
      cancelAnimationFrame(rafId);
      removers.forEach((remove) => remove());
      snap.destroy();
      lenis.destroy();
      lenisRef.current = null;
      snapRef.current = null;
    };
  }, []);

  return <>{children}</>;
}
