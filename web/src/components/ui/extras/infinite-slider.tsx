"use client";

import { motion, useMotionValue } from "motion/react";
import useMeasure from "react-use-measure";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";

/* ═══════════════════════════════════════════════
   TYPES
   ═══════════════════════════════════════════════ */

type InfiniteSliderProps = {
  children: ReactNode;
  speed?: number;
  speedOnHover?: number;
  direction?: "horizontal" | "vertical";
  reverse?: boolean;
  className?: string;
  gap?: number;
};

/* ═══════════════════════════════════════════════
   COMPONENT
   ═══════════════════════════════════════════════ */

export function InfiniteSlider({
  children,
  speed = 20,
  speedOnHover = 10,
  direction = "horizontal",
  reverse = false,
  className,
  gap = 16,
}: InfiniteSliderProps) {
  const [ref, bounds] = useMeasure();
  const position = useMotionValue(0);
  const [isHovered, setIsHovered] = useState(false);
  const rafRef = useRef<number>(0);
  const lastTimeRef = useRef<number>(0);

  const isHorizontal = direction === "horizontal";
  const dimension = isHorizontal ? bounds.width : bounds.height;
  const sign = reverse ? 1 : -1;
  const contentReady = dimension > 0;

  // Animation loop using requestAnimationFrame
  useEffect(() => {
    if (!contentReady || dimension <= 0) return;

    const halfDimension = dimension + gap;

    function animate(timestamp: number) {
      if (lastTimeRef.current === 0) {
        lastTimeRef.current = timestamp;
      }

      const delta = (timestamp - lastTimeRef.current) / 1000;
      lastTimeRef.current = timestamp;

      const currentSpeed = isHovered ? speedOnHover : speed;
      const movement = currentSpeed * delta * sign;

      let current = position.get() + movement;

      // Seamless loop: reset when we've scrolled one full copy
      if (sign < 0 && current <= -halfDimension) {
        current += halfDimension;
      } else if (sign > 0 && current >= 0) {
        current -= halfDimension;
      }

      position.set(current);
      rafRef.current = requestAnimationFrame(animate);
    }

    rafRef.current = requestAnimationFrame(animate);

    return () => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
      lastTimeRef.current = 0;
    };
  }, [
    contentReady,
    dimension,
    gap,
    isHovered,
    position,
    sign,
    speed,
    speedOnHover,
  ]);

  const maskDirection = isHorizontal ? "to right" : "to bottom";
  const maskImage = `linear-gradient(${maskDirection}, transparent 0%, black 10%, black 90%, transparent 100%)`;

  return (
    <div
      className={cn("overflow-hidden", className)}
      style={{
        maskImage,
        WebkitMaskImage: maskImage,
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <motion.div
        className={cn(
          "flex w-max",
          isHorizontal ? "flex-row" : "flex-col"
        )}
        style={
          isHorizontal
            ? { x: position, gap: `${gap}px` }
            : { y: position, gap: `${gap}px` }
        }
      >
        {/* Original content */}
        <div
          ref={ref}
          className={cn(
            "flex shrink-0",
            isHorizontal ? "flex-row" : "flex-col"
          )}
          style={{ gap: `${gap}px` }}
        >
          {children}
        </div>

        {/* Duplicate for seamless loop */}
        <div
          className={cn(
            "flex shrink-0",
            isHorizontal ? "flex-row" : "flex-col"
          )}
          style={{ gap: `${gap}px` }}
          aria-hidden="true"
        >
          {children}
        </div>
      </motion.div>
    </div>
  );
}
