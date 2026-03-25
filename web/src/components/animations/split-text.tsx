"use client";

import { motion, useInView } from "motion/react";
import { useRef, useMemo } from "react";

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

  // Split into words to preserve word boundaries (prevents mid-word line breaks)
  const words = children.split(" ");

  // Pre-compute char offsets to avoid mutable variable in render
  const charOffsets = useMemo(
    () =>
      words.reduce<number[]>(
        (acc, word, i) => [
          ...acc,
          i === 0 ? 0 : acc[i - 1] + words[i - 1].length + 1,
        ],
        []
      ),
    [words]
  );

  return (
    <Tag
      ref={ref as React.Ref<never>}
      className={className}
      aria-label={children}
      style={{ textWrap: "balance" }}
    >
      <span className="sr-only">{children}</span>
      <span aria-hidden="true" style={{ perspective: "800px" }}>
        {words.map((word, wordIdx) => {
          const wordChars = word.split("");
          const startIndex = charOffsets[wordIdx];

          return (
            <span key={wordIdx}>
              {/* Word wrapper — keeps letters together */}
              <span style={{ whiteSpace: "nowrap" }}>
                {wordChars.map((char, ci) => (
                  <motion.span
                    key={ci}
                    style={{ display: "inline-block" }}
                    initial={{ opacity: 0, rotateX: 90, y: 20 }}
                    animate={
                      isInView
                        ? { opacity: 1, rotateX: 0, y: 0 }
                        : { opacity: 0, rotateX: 90, y: 20 }
                    }
                    transition={{
                      duration: 0.5,
                      delay: delay + (startIndex + ci) * stagger,
                      ease: [0.25, 0.1, 0.25, 1],
                    }}
                  >
                    {char}
                  </motion.span>
                ))}
              </span>
              {/* Space between words (breakable) */}
              {wordIdx < words.length - 1 && (
                <motion.span
                  style={{ display: "inline-block", whiteSpace: "pre" }}
                  initial={{ opacity: 0 }}
                  animate={isInView ? { opacity: 1 } : { opacity: 0 }}
                  transition={{
                    duration: 0.3,
                    delay: delay + (startIndex + word.length) * stagger,
                  }}
                >
                  {" "}
                </motion.span>
              )}
            </span>
          );
        })}
      </span>
    </Tag>
  );
}
