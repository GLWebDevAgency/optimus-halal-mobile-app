"use client";

import { motion, useInView } from "motion/react";
import { useRef } from "react";

interface SplitTextProps {
  children: string;
  className?: string;
  as?: "h1" | "h2" | "h3" | "p" | "span";
  delay?: number;
  stagger?: number;
  once?: boolean;
}

export function SplitText({
  children,
  className,
  as: Tag = "h2",
  delay = 0,
  stagger = 0.02,
  once = true,
}: SplitTextProps) {
  const ref = useRef<HTMLElement>(null);
  const isInView = useInView(ref, { once, amount: 0.4 });

  const chars = children.split("");

  return (
    <Tag ref={ref as React.RefObject<HTMLElement>} className={className} aria-label={children}>
      <span className="sr-only">{children}</span>
      <span aria-hidden="true" style={{ perspective: "800px" }}>
        {chars.map((char, i) => (
          <motion.span
            key={i}
            style={{
              display: "inline-block",
              whiteSpace: char === " " ? "pre" : undefined,
            }}
            initial={{ opacity: 0, rotateX: 90, y: 20 }}
            animate={
              isInView
                ? { opacity: 1, rotateX: 0, y: 0 }
                : { opacity: 0, rotateX: 90, y: 20 }
            }
            transition={{
              duration: 0.5,
              delay: delay + i * stagger,
              ease: [0.25, 0.1, 0.25, 1],
            }}
          >
            {char}
          </motion.span>
        ))}
      </span>
    </Tag>
  );
}
