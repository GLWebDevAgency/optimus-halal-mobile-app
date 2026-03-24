"use client";

import { motion, useScroll, useTransform } from "motion/react";
import { AppleLogo, GooglePlayLogo } from "@phosphor-icons/react";

export function MobileCTABar() {
  const { scrollYProgress } = useScroll();
  const opacity = useTransform(scrollYProgress, [0.1, 0.15, 0.88, 0.92], [0, 1, 1, 0]);
  const y = useTransform(scrollYProgress, [0.1, 0.15], [60, 0]);

  return (
    <motion.div
      className="fixed bottom-0 inset-x-0 z-50 lg:hidden"
      style={{ opacity, y }}
    >
      <div className="mx-auto flex items-center justify-center border-t border-border/50 bg-background/80 px-4 py-3 backdrop-blur-xl">
        <a
          href="#"
          className="inline-flex items-center gap-2 rounded-full bg-foreground px-6 py-2.5 font-display font-bold text-sm text-background transition-all duration-200 hover:scale-[1.02]"
        >
          <AppleLogo className="size-4" weight="fill" />
          <GooglePlayLogo className="size-4" weight="fill" />
          <span>Download</span>
        </a>
      </div>
    </motion.div>
  );
}
