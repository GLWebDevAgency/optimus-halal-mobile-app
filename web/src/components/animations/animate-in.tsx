"use client";

import { motion, useInView, type Variants } from "motion/react";
import { useRef } from "react";

type AnimateInVariant = "fadeUp" | "fadeDown" | "fadeLeft" | "fadeRight" | "scaleIn" | "blur" | "reveal" | "parallaxUp";

const variants: Record<AnimateInVariant, Variants> = {
  fadeUp: { hidden: { opacity: 0, y: 24 }, visible: { opacity: 1, y: 0 } },
  fadeDown: { hidden: { opacity: 0, y: -24 }, visible: { opacity: 1, y: 0 } },
  fadeLeft: { hidden: { opacity: 0, x: -24 }, visible: { opacity: 1, x: 0 } },
  fadeRight: { hidden: { opacity: 0, x: 24 }, visible: { opacity: 1, x: 0 } },
  scaleIn: { hidden: { opacity: 0, scale: 0.8 }, visible: { opacity: 1, scale: 1 } },
  blur: { hidden: { opacity: 0, filter: "blur(6px)" }, visible: { opacity: 1, filter: "blur(0px)" } },
  reveal: { hidden: { opacity: 0, clipPath: "inset(8% 0 8% 0)" }, visible: { opacity: 1, clipPath: "inset(0% 0 0% 0)" } },
  parallaxUp: { hidden: { opacity: 0, y: 40, scale: 0.98 }, visible: { opacity: 1, y: 0, scale: 1 } },
};

interface AnimateInProps {
  children: React.ReactNode;
  className?: string;
  variant?: AnimateInVariant;
  delay?: number;
  duration?: number;
  once?: boolean;
  amount?: number;
  ssrVisible?: boolean;
}

export function AnimateIn({
  children,
  className,
  variant = "fadeUp",
  delay = 0,
  duration = 0.6,
  once = true,
  amount = 0.4,
  ssrVisible = false,
}: AnimateInProps) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once, amount });

  return (
    <motion.div
      ref={ref}
      className={className}
      initial={ssrVisible ? "visible" : "hidden"}
      animate={isInView ? "visible" : "hidden"}
      variants={variants[variant]}
      transition={{ duration, delay, ease: [0.25, 0.1, 0.25, 1] }}
    >
      {children}
    </motion.div>
  );
}

interface StaggerProps {
  children: React.ReactNode;
  className?: string;
  stagger?: number;
  once?: boolean;
}

export function Stagger({ children, className, stagger = 0.05, once = true }: StaggerProps) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once, amount: 0.3 });

  const staggerVariants: Variants = {
    hidden: {},
    visible: { transition: { staggerChildren: stagger } },
  };

  return (
    <motion.div
      ref={ref}
      className={className}
      initial="hidden"
      animate={isInView ? "visible" : "hidden"}
      variants={staggerVariants}
    >
      {children}
    </motion.div>
  );
}

interface StaggerItemProps {
  children: React.ReactNode;
  className?: string;
  variant?: AnimateInVariant;
}

export function StaggerItem({ children, className, variant = "fadeUp" }: StaggerItemProps) {
  return (
    <motion.div
      className={className}
      variants={variants[variant]}
      transition={{ duration: 0.5, ease: [0.25, 0.1, 0.25, 1] }}
    >
      {children}
    </motion.div>
  );
}
