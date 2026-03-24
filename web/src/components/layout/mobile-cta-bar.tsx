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
      <div className="mx-auto flex items-center justify-center gap-3 border-t border-border/50 bg-background/80 px-4 py-3 backdrop-blur-xl">
        <span className="text-sm font-semibold text-foreground">Télécharger Naqiy</span>
        <div className="flex gap-2">
          <a href="#" className="flex items-center gap-1.5 rounded-lg bg-foreground px-3 py-1.5 text-xs font-medium text-background">
            <AppleLogo className="size-3.5" weight="fill" />
            iOS
          </a>
          <a href="#" className="flex items-center gap-1.5 rounded-lg bg-foreground px-3 py-1.5 text-xs font-medium text-background">
            <GooglePlayLogo className="size-3.5" weight="fill" />
            Android
          </a>
        </div>
      </div>
    </motion.div>
  );
}
