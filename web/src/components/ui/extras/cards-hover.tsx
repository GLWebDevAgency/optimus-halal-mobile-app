"use client";

import {
  createContext,
  useCallback,
  useContext,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { motion, AnimatePresence } from "motion/react";
import { cn } from "@/lib/utils";

/* ═══════════════════════════════════════════════
   CONSTANTS
   ═══════════════════════════════════════════════ */

const EXIT_DELAY = 0.3;

const SPRING_CONFIG = {
  type: "spring" as const,
  stiffness: 200,
  damping: 20,
};

/* ═══════════════════════════════════════════════
   TYPES
   ═══════════════════════════════════════════════ */

type CardsHoverContextValue = {
  activeId: string | null;
  setActiveId: (id: string | null) => void;
  layoutId: string;
};

type CardsHoverProviderProps = {
  children: ReactNode;
  className?: string;
};

type CardsHoverItemProps = {
  children: ReactNode;
  id: string;
  className?: string;
  hoverClassName?: string;
};

/* ═══════════════════════════════════════════════
   CONTEXT
   ═══════════════════════════════════════════════ */

const CardsHoverContext = createContext<CardsHoverContextValue | null>(null);

function useCardsHover() {
  const ctx = useContext(CardsHoverContext);
  if (!ctx) {
    throw new Error("useCardsHover must be used within a CardsHoverProvider");
  }
  return ctx;
}

/* ═══════════════════════════════════════════════
   PROVIDER
   ═══════════════════════════════════════════════ */

let providerIdCounter = 0;

export function CardsHoverProvider({
  children,
  className,
}: CardsHoverProviderProps) {
  const [activeId, setActiveIdState] = useState<string | null>(null);
  const exitTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [layoutId] = useState(() => `cards-hover-${++providerIdCounter}`);

  const setActiveId = useCallback((id: string | null) => {
    // Clear any pending exit timeout
    if (exitTimeoutRef.current) {
      clearTimeout(exitTimeoutRef.current);
      exitTimeoutRef.current = null;
    }

    if (id === null) {
      // Delay exit to prevent flicker between cards
      exitTimeoutRef.current = setTimeout(() => {
        setActiveIdState(null);
      }, EXIT_DELAY * 1000);
    } else {
      setActiveIdState(id);
    }
  }, []);

  return (
    <CardsHoverContext.Provider value={{ activeId, setActiveId, layoutId }}>
      <div className={cn("relative", className)}>{children}</div>
    </CardsHoverContext.Provider>
  );
}

/* ═══════════════════════════════════════════════
   ITEM
   ═══════════════════════════════════════════════ */

export function CardsHoverItem({
  children,
  id,
  className,
  hoverClassName,
}: CardsHoverItemProps) {
  const { activeId, setActiveId, layoutId } = useCardsHover();
  const isActive = activeId === id;

  return (
    <div
      className={cn("relative", className)}
      onMouseEnter={() => setActiveId(id)}
      onMouseLeave={() => setActiveId(null)}
    >
      <AnimatePresence>
        {isActive && (
          <motion.div
            layoutId={layoutId}
            className={cn(
              "absolute inset-0 rounded-xl bg-muted/50",
              hoverClassName
            )}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={SPRING_CONFIG}
            style={{ zIndex: 0 }}
          />
        )}
      </AnimatePresence>

      <div className="relative z-10">{children}</div>
    </div>
  );
}

/* ═══════════════════════════════════════════════
   RE-EXPORT CONTEXT HOOK
   ═══════════════════════════════════════════════ */

export { useCardsHover };
