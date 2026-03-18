"use client";

import { AnimatePresence, motion } from "motion/react";
import {
  createContext,
  useCallback,
  useContext,
  useState,
  type ReactNode,
} from "react";
import { cn } from "@/lib/utils";

/* ═══════════════════════════════════════════════
   TYPES
   ═══════════════════════════════════════════════ */

type AnimatedBackgroundProps = {
  children: ReactNode;
  defaultValue: string;
  className?: string;
  transition?: Record<string, unknown>;
  onValueChange?: (value: string) => void;
};

type AnimatedBackgroundItemProps = {
  children: ReactNode;
  value: string;
  className?: string;
  activeClassName?: string;
};

type AnimatedBackgroundContextValue = {
  activeValue: string;
  setActiveValue: (value: string) => void;
  transition: Record<string, unknown>;
  layoutId: string;
};

/* ═══════════════════════════════════════════════
   CONTEXT
   ═══════════════════════════════════════════════ */

const AnimatedBackgroundContext =
  createContext<AnimatedBackgroundContextValue | null>(null);

function useAnimatedBackground() {
  const ctx = useContext(AnimatedBackgroundContext);
  if (!ctx) {
    throw new Error(
      "useAnimatedBackground must be used within an AnimatedBackground"
    );
  }
  return ctx;
}

/* ═══════════════════════════════════════════════
   PROVIDER
   ═══════════════════════════════════════════════ */

let idCounter = 0;

export function AnimatedBackground({
  children,
  defaultValue,
  className,
  transition = {
    type: "spring",
    stiffness: 350,
    damping: 30,
    mass: 0.8,
  },
  onValueChange,
}: AnimatedBackgroundProps) {
  const [activeValue, setActiveValueState] = useState(defaultValue);
  const [layoutId] = useState(() => `animated-bg-${++idCounter}`);

  const setActiveValue = useCallback(
    (value: string) => {
      setActiveValueState(value);
      onValueChange?.(value);
    },
    [onValueChange]
  );

  return (
    <AnimatedBackgroundContext.Provider
      value={{ activeValue, setActiveValue, transition, layoutId }}
    >
      <div className={cn("relative", className)}>{children}</div>
    </AnimatedBackgroundContext.Provider>
  );
}

/* ═══════════════════════════════════════════════
   ITEM
   ═══════════════════════════════════════════════ */

export function AnimatedBackgroundItem({
  children,
  value,
  className,
  activeClassName,
}: AnimatedBackgroundItemProps) {
  const { activeValue, setActiveValue, transition, layoutId } =
    useAnimatedBackground();
  const isActive = activeValue === value;

  return (
    <button
      type="button"
      className={cn(
        "relative z-10 cursor-pointer px-3 py-1.5 text-sm transition-colors",
        isActive ? activeClassName : "",
        className
      )}
      onClick={() => setActiveValue(value)}
      data-state={isActive ? "active" : "inactive"}
    >
      <AnimatePresence>
        {isActive && (
          <motion.div
            layoutId={layoutId}
            className="absolute inset-0 rounded-md bg-muted"
            initial={false}
            exit={{ opacity: 0 }}
            transition={transition}
            style={{ zIndex: -1 }}
          />
        )}
      </AnimatePresence>
      <span className="relative z-10">{children}</span>
    </button>
  );
}
