"use client";

import { motion, useScroll, useTransform } from "motion/react";
import { Barcode, MapPinArea, ShoppingCart } from "@phosphor-icons/react";

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
        {/* ── Radial glow ── */}
        <div
          className="pointer-events-none absolute top-1/2 left-1/2 -z-10 h-[500px] w-[500px] -translate-x-1/2 -translate-y-1/2 rounded-full"
          style={{
            background:
              "radial-gradient(circle, oklch(0.76 0.14 88 / 15%) 0%, oklch(0.76 0.14 88 / 5%) 40%, transparent 70%)",
            animation: "glow-pulse 5s ease-in-out infinite",
          }}
          aria-hidden="true"
        />

        {/* ── Decorative feature icons ── */}
        <div
          className="pointer-events-none absolute top-1/2 left-1/2 -z-10 h-[600px] w-[600px] -translate-x-1/2 -translate-y-1/2"
          aria-hidden="true"
        >
          {/* Top-left — Barcode (scan feature) */}
          <Barcode
            size={220}
            weight="thin"
            className="absolute -top-16 -left-20 -rotate-[25deg]"
            style={{ color: "oklch(0.76 0.14 88 / 3%)" }}
          />
          {/* Top-right — Shopping cart (marketplace feature) */}
          <ShoppingCart
            size={160}
            weight="thin"
            className="absolute -top-4 -right-12 rotate-[18deg]"
            style={{ color: "oklch(0.76 0.14 88 / 3%)" }}
          />
          {/* Bottom-right — Map pin (nearby stores feature) */}
          <MapPinArea
            size={190}
            weight="thin"
            className="absolute -bottom-12 -right-16 rotate-[12deg]"
            style={{ color: "oklch(0.76 0.14 88 / 3%)" }}
          />
        </div>

        <motion.div style={{ rotateY, rotateX, scale, y }}>
          {children}
        </motion.div>
      </div>
    </div>
  );
}
