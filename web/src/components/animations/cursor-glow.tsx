"use client";

import { useRef, useState } from "react";
import { motion, useSpring } from "motion/react";

interface CursorGlowProps {
  children: React.ReactNode;
  className?: string;
  color?: string;
  size?: number;
}

export function CursorGlow({ children, className, color = "oklch(0.76 0.14 88 / 8%)", size = 200 }: CursorGlowProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  const x = useSpring(0, { stiffness: 200, damping: 30 });
  const y = useSpring(0, { stiffness: 200, damping: 30 });

  function handleMouseMove(e: React.MouseEvent) {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    x.set(e.clientX - rect.left);
    y.set(e.clientY - rect.top);
  }

  return (
    <div
      ref={ref}
      className={`relative ${className ?? ""}`}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setVisible(true)}
      onMouseLeave={() => setVisible(false)}
    >
      <motion.div
        className="pointer-events-none absolute hidden lg:block"
        style={{
          x,
          y,
          width: size,
          height: size,
          marginLeft: -size / 2,
          marginTop: -size / 2,
          borderRadius: "50%",
          background: `radial-gradient(circle, ${color}, transparent 70%)`,
          opacity: visible ? 1 : 0,
          transition: "opacity 300ms",
        }}
        aria-hidden="true"
      />
      <div className="relative z-10">{children}</div>
    </div>
  );
}
