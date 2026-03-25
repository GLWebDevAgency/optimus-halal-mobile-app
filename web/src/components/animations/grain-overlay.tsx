"use client";

import { motion, useScroll, useTransform } from "motion/react";

export function GrainOverlay() {
  const { scrollYProgress } = useScroll();
  const opacity = useTransform(scrollYProgress, [0, 0.3, 0.5], [0.4, 0.4, 0]);

  return (
    <motion.div
      className="pointer-events-none fixed inset-0 z-[100]"
      style={{ opacity }}
      aria-hidden="true"
    >
      <svg width="100%" height="100%">
        <filter id="grain">
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.65"
            numOctaves="3"
            stitchTiles="stitch"
          />
          <feColorMatrix type="saturate" values="0" />
        </filter>
        <rect width="100%" height="100%" filter="url(#grain)" opacity="0.12" />
      </svg>
    </motion.div>
  );
}
