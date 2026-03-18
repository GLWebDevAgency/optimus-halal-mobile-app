"use client";

import { motion, useSpring, useTransform } from "motion/react";
import { useEffect, useMemo, useRef, useState } from "react";
import { cn } from "@/lib/utils";

/* ═══════════════════════════════════════════════
   TYPES
   ═══════════════════════════════════════════════ */

type SlidingNumberProps = {
  value: number;
  className?: string;
  decimalPlaces?: number;
  padStart?: number;
};

type DigitColumnProps = {
  digit: number;
  className?: string;
};

/* ═══════════════════════════════════════════════
   SPRING CONFIG
   ═══════════════════════════════════════════════ */

const SPRING_CONFIG = {
  stiffness: 280,
  damping: 18,
  mass: 0.3,
};

const DIGITS = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];

/* ═══════════════════════════════════════════════
   DIGIT COLUMN — animates a single digit slot
   ═══════════════════════════════════════════════ */

function DigitColumn({ digit, className }: DigitColumnProps) {
  const [height, setHeight] = useState(0);
  const digitRef = useRef<HTMLSpanElement>(null);

  // Measure digit height on mount and resize
  useEffect(() => {
    const el = digitRef.current;
    if (!el) return;

    const measure = () => {
      setHeight(el.getBoundingClientRect().height);
    };

    measure();

    const observer = new ResizeObserver(measure);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const springValue = useSpring(digit, SPRING_CONFIG);
  const y = useTransform(springValue, (v) => -v * height);

  // Update spring target when digit changes
  useEffect(() => {
    springValue.set(digit);
  }, [digit, springValue]);

  return (
    <span
      className={cn("relative inline-block overflow-hidden", className)}
      style={{ height: height || "auto" }}
    >
      {/* Hidden measurer */}
      <span ref={digitRef} className="invisible" aria-hidden="true">
        0
      </span>

      {/* Animated column */}
      <motion.span
        className="absolute left-0 right-0 flex flex-col items-center"
        style={{ y }}
      >
        {DIGITS.map((d) => (
          <span
            key={d}
            className="flex items-center justify-center tabular-nums"
            style={{ height: height || "auto" }}
            aria-hidden={d !== digit}
          >
            {d}
          </span>
        ))}
      </motion.span>

      {/* Screen reader text */}
      <span className="sr-only">{digit}</span>
    </span>
  );
}

/* ═══════════════════════════════════════════════
   STATIC CHARACTER (sign, decimal point, comma)
   ═══════════════════════════════════════════════ */

function StaticChar({ char }: { char: string }) {
  return <span className="tabular-nums">{char}</span>;
}

/* ═══════════════════════════════════════════════
   MAIN COMPONENT
   ═══════════════════════════════════════════════ */

export function SlidingNumber({
  value,
  className,
  decimalPlaces = 0,
  padStart = 0,
}: SlidingNumberProps) {
  // Split the number into characters
  const chars = useMemo(() => {
    const isNegative = value < 0;
    const absValue = Math.abs(value);

    let formatted: string;
    if (decimalPlaces > 0) {
      formatted = absValue.toFixed(decimalPlaces);
    } else {
      formatted = Math.round(absValue).toString();
    }

    // Pad the integer part if needed
    if (padStart > 0) {
      const parts = formatted.split(".");
      parts[0] = parts[0].padStart(padStart, "0");
      formatted = parts.join(".");
    }

    const result: Array<{ type: "digit"; value: number } | { type: "static"; value: string }> = [];

    if (isNegative) {
      result.push({ type: "static", value: "-" });
    }

    for (const char of formatted) {
      const parsed = parseInt(char, 10);
      if (!isNaN(parsed)) {
        result.push({ type: "digit", value: parsed });
      } else {
        result.push({ type: "static", value: char });
      }
    }

    return result;
  }, [value, decimalPlaces, padStart]);

  return (
    <span
      className={cn("inline-flex items-baseline tabular-nums", className)}
      aria-label={value.toString()}
      role="text"
    >
      {chars.map((char, i) =>
        char.type === "digit" ? (
          <DigitColumn key={`d-${i}`} digit={char.value} />
        ) : (
          <StaticChar key={`s-${i}`} char={char.value} />
        )
      )}
    </span>
  );
}
