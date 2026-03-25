"use client";

import { motion, useScroll, useTransform } from "motion/react";

interface StickyPhoneProps {
  children: React.ReactNode;
}

export function StickyPhone({ children }: StickyPhoneProps) {
  const { scrollYProgress } = useScroll();

  const rotateY = useTransform(scrollYProgress, [0, 0.5, 1], [-2, 0, 2]);
  const rotateX = useTransform(scrollYProgress, [0, 0.5, 1], [1, 0, -1]);
  const scale = useTransform(scrollYProgress, [0, 0.5, 1], [0.98, 1.02, 0.98]);
  const y = useTransform(scrollYProgress, [0, 0.5, 1], [-8, 0, 8]);

  return (
    <div className="hidden lg:flex items-start justify-center h-full">
      <div className="sticky top-[50vh] -translate-y-1/2" style={{ perspective: "1200px" }}>
        <div
          className="pointer-events-none absolute top-1/2 left-1/2 -z-10 h-[500px] w-[500px] -translate-x-1/2 -translate-y-1/2 rounded-full"
          style={{
            background:
              "radial-gradient(circle, oklch(0.76 0.14 88 / 15%) 0%, oklch(0.76 0.14 88 / 5%) 40%, transparent 70%)",
            animation: "glow-pulse 5s ease-in-out infinite",
          }}
          aria-hidden="true"
        />
        <motion.div style={{ rotateY, rotateX, scale, y }}>
          {children}
        </motion.div>
      </div>
    </div>
  );
}
