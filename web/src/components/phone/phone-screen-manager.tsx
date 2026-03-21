"use client";

import React, { useRef, useMemo } from "react";
import { AnimatePresence, motion } from "motion/react";

export interface ScreenConfig {
  key: string;
  component: React.ReactNode;
  category: string;
}

interface PhoneScreenManagerProps {
  screens: ScreenConfig[];
  activeScreen: string;
}

export function PhoneScreenManager({
  screens,
  activeScreen,
}: PhoneScreenManagerProps) {
  const screenMap = useMemo(
    () => new Map(screens.map((s) => [s.key, s])),
    [screens]
  );

  const currentScreen = screenMap.get(activeScreen);

  const prevCategoryRef = useRef<string | undefined>(undefined);
  const prevCategory = prevCategoryRef.current;
  const currentCategory = currentScreen?.category;

  const direction =
    prevCategory !== undefined && prevCategory === currentCategory
      ? "horizontal"
      : "vertical";

  // Update ref after computing direction so next render can compare
  if (prevCategory !== currentCategory) {
    prevCategoryRef.current = currentCategory;
  }

  const variants =
    direction === "horizontal"
      ? {
          initial: { x: "100%", opacity: 0.5 },
          animate: { x: 0, opacity: 1 },
          exit: { x: "-30%", opacity: 0 },
        }
      : {
          initial: { y: "100%", opacity: 0.5 },
          animate: { y: 0, opacity: 1 },
          exit: { y: "-30%", opacity: 0 },
        };

  const springTransition = {
    type: "spring" as const,
    stiffness: 100,
    damping: 20,
    mass: 0.8,
  };

  return (
    <div className="relative w-full h-full overflow-hidden bg-[#0f0f0f]">
      <AnimatePresence mode="wait">
        <motion.div
          key={activeScreen}
          initial={variants.initial}
          animate={variants.animate}
          exit={variants.exit}
          transition={springTransition}
          style={{ position: "absolute", inset: 0 }}
        >
          {currentScreen?.component ?? null}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
