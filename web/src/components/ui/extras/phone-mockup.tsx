"use client";

import { motion } from "motion/react";
import Image from "next/image";
import { type ReactNode } from "react";
import { cn } from "@/lib/utils";

type PhoneMockupProps = {
  className?: string;
  children?: ReactNode;
  showScanLine?: boolean;
};

export function PhoneMockup({
  className,
  children,
  showScanLine = false,
}: PhoneMockupProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 40, rotateX: 8 }}
      animate={{ opacity: 1, y: 0, rotateX: 0 }}
      transition={{ duration: 0.8, delay: 0.3, ease: [0.25, 0.1, 0.25, 1] }}
      className={cn("relative", className)}
      style={{ perspective: "1200px" }}
    >
      {/* Phone frame */}
      <div className="relative mx-auto w-[280px] sm:w-[320px] md:w-[340px]">
        {/* Outer frame with gold accent */}
        <div className="relative rounded-[40px] border-[3px] border-foreground/10 bg-foreground/5 p-[10px] phone-shadow">
          {/* Gold edge highlight */}
          <div
            className="pointer-events-none absolute inset-0 rounded-[40px]"
            style={{
              background:
                "linear-gradient(135deg, oklch(0.78 0.17 82 / 15%) 0%, transparent 40%, transparent 60%, oklch(0.78 0.17 82 / 10%) 100%)",
            }}
          />

          {/* Inner screen */}
          <div className="relative overflow-hidden rounded-[32px] bg-foreground/5">
            {/* Dynamic island */}
            <div className="absolute top-0 left-1/2 z-20 flex h-[28px] w-[100px] -translate-x-1/2 items-center justify-center rounded-b-[16px] bg-black">
              <div className="size-[10px] rounded-full bg-foreground/10" />
            </div>

            {/* Screen content */}
            <div className="relative aspect-[9/19.5] w-full overflow-hidden bg-background">
              {children}

              {/* Scan line animation */}
              {showScanLine && (
                <div
                  className="pointer-events-none absolute inset-x-0 top-[20%] z-10 h-[2px]"
                  style={{
                    background:
                      "linear-gradient(90deg, transparent 0%, oklch(0.78 0.17 82 / 80%) 30%, oklch(0.85 0.17 82) 50%, oklch(0.78 0.17 82 / 80%) 70%, transparent 100%)",
                    boxShadow:
                      "0 0 20px oklch(0.78 0.17 82 / 40%), 0 0 60px oklch(0.78 0.17 82 / 20%)",
                    animation: "scan-line 4s ease-in-out infinite",
                  }}
                />
              )}
            </div>
          </div>
        </div>

        {/* Ambient glow behind phone */}
        <div
          className="pointer-events-none absolute -inset-[30%] -z-10 rounded-full opacity-60"
          style={{
            background:
              "radial-gradient(ellipse at center, oklch(0.78 0.17 82 / 12%) 0%, transparent 70%)",
            animation: "glow-pulse 4s ease-in-out infinite",
          }}
        />
      </div>
    </motion.div>
  );
}

export function PhoneScreen({
  productName = "Nutella 400g",
  brand = "Ferrero",
  verdict = "halal",
  score = 87,
}: {
  productName?: string;
  brand?: string;
  verdict?: "halal" | "douteux" | "haram";
  score?: number;
}) {
  const verdictConfig = {
    halal: { label: "Halal", color: "oklch(0.55 0.18 155)", emoji: "1" },
    douteux: { label: "Douteux", color: "oklch(0.78 0.16 75)", emoji: "3" },
    haram: { label: "Haram", color: "oklch(0.55 0.24 27)", emoji: "5" },
  };

  const config = verdictConfig[verdict];

  return (
    <div className="flex h-full flex-col bg-background">
      {/* App header */}
      <div className="flex items-center justify-between px-5 pt-10 pb-3">
        <Image
          src="/images/logo_naqiy.webp"
          alt="Naqiy"
          width={28}
          height={28}
          className="rounded-md"
        />
        <span className="text-[10px] font-semibold text-foreground/60 tracking-wider uppercase">
          Résultat du scan
        </span>
        <div className="size-6 rounded-full bg-muted" />
      </div>

      {/* Product image area */}
      <div className="relative mx-5 flex h-[35%] items-center justify-center rounded-2xl bg-muted/50">
        <div className="text-center">
          <div className="text-3xl">📦</div>
          <p className="mt-1 text-[9px] font-medium text-muted-foreground">{brand}</p>
          <p className="text-[11px] font-bold text-foreground">{productName}</p>
        </div>
      </div>

      {/* Verdict card */}
      <div className="mx-5 mt-4 rounded-2xl border border-border p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[9px] font-medium text-muted-foreground uppercase tracking-wider">
              Verdict Naqiy
            </p>
            <p className="text-lg font-black" style={{ color: config.color }}>
              {config.label}
            </p>
          </div>
          {/* NaqiyScore badge */}
          <div
            className="flex size-12 items-center justify-center rounded-xl font-black text-lg text-white"
            style={{ backgroundColor: config.color }}
          >
            {score}
          </div>
        </div>

        {/* Score bar */}
        <div className="mt-3 h-2 overflow-hidden rounded-full bg-muted">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${score}%` }}
            transition={{ duration: 1.5, delay: 1, ease: "easeOut" }}
            className="h-full rounded-full"
            style={{
              background: `linear-gradient(90deg, ${config.color}, oklch(0.78 0.17 82))`,
            }}
          />
        </div>
      </div>

      {/* Info pills */}
      <div className="mx-5 mt-3 flex gap-2">
        {["Hanafi", "4 certifications", "12 ingrédients"].map((item) => (
          <div
            key={item}
            className="rounded-full bg-muted px-2.5 py-1 text-[8px] font-medium text-muted-foreground"
          >
            {item}
          </div>
        ))}
      </div>
    </div>
  );
}
