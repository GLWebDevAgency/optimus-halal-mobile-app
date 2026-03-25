"use client";

import React, { useState, useMemo } from "react";
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
  const currentCategory = currentScreen?.category;

  // React-recommended "adjusting state during render" pattern
  // See: https://react.dev/reference/react/useState#storing-information-from-previous-renders
  const [prev, setPrev] = useState({
    category: currentCategory,
    screen: activeScreen,
  });
  const [direction, setDirection] = useState<"horizontal" | "vertical">(
    "vertical"
  );

  if (activeScreen !== prev.screen) {
    const nextDirection =
      prev.category !== undefined && prev.category === currentCategory
        ? "horizontal"
        : "vertical";
    setDirection(nextDirection);
    setPrev({ category: currentCategory, screen: activeScreen });
  }

  // Include both x AND y in all variants to prevent stuck properties
  const variants =
    direction === "horizontal"
      ? {
          initial: { x: "100%", y: 0, opacity: 0.5 },
          animate: { x: 0, y: 0, opacity: 1 },
          exit: { x: "-30%", y: 0, opacity: 0 },
        }
      : {
          initial: { x: 0, y: "100%", opacity: 0.5 },
          animate: { x: 0, y: 0, opacity: 1 },
          exit: { x: 0, y: "-30%", opacity: 0 },
        };

  const springTransition = {
    type: "spring" as const,
    stiffness: 100,
    damping: 20,
    mass: 0.8,
  };

  // First render: initial=false so screen appears immediately without animation
  const isInitialScreen = prev.screen === activeScreen && direction === "vertical";

  return (
    <div className="relative w-full h-full overflow-hidden bg-[#0f0f0f]">
      <AnimatePresence mode="wait">
        <motion.div
          key={activeScreen}
          initial={isInitialScreen ? false : variants.initial}
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
