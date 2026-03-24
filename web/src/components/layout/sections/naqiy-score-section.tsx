"use client";

import Image from "next/image";
import { ShieldCheck } from "@phosphor-icons/react";
import { AnimateIn, Stagger, StaggerItem } from "@/components/animations/animate-in";
import { CursorGlow } from "@/components/animations/cursor-glow";
import { SplitText } from "@/components/animations/split-text";
import { Badge } from "@/components/ui/badge";

/* ═══════════════════════════════════════════════
   NAQIY TRUST GRADES — exact replica of mobile app
   NaqiyGradeBadge.tsx — Arabic numerals ١٢٣٤٥
   ═══════════════════════════════════════════════ */

const TRUST_GRADES = [
  { grade: 1, arabic: "١", label: "Très fiable",         color: "#22c55e", range: "≥ 90" },
  { grade: 2, arabic: "٢", label: "Fiable",              color: "#84cc16", range: "70–89" },
  { grade: 3, arabic: "٣", label: "Vigilance",           color: "#f59e0b", range: "51–69" },
  { grade: 4, arabic: "٤", label: "Peu fiable",          color: "#f97316", range: "35–50" },
  { grade: 5, arabic: "٥", label: "Pas fiable du tout",  color: "#ef4444", range: "< 35" },
] as const;

/** Demo: highlight grade 1 as the "active" one */
const ACTIVE_GRADE = 1;

export function NaqiyScoreSection() {
  return (
    <section className="relative flex items-center overflow-hidden py-20 lg:py-32">
      {/* Subtle warm background */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 70% 50% at 50% 20%, oklch(0.76 0.14 88 / 4%) 0%, transparent 70%)",
        }}
        aria-hidden="true"
      />

      <CursorGlow className="mx-auto max-w-5xl px-6 relative z-10">
        {/* Header */}
        <div className="text-center">
          <AnimateIn variant="blur">
            <Badge
              variant="outline"
              className="mb-6 gap-1.5 border-leaf/30 bg-leaf/5 px-3 py-1 text-leaf"
            >
              <ShieldCheck className="size-3" weight="fill" />
              Exclusivité Naqiy
            </Badge>
          </AnimateIn>

          <SplitText
            as="h2"
            className="font-display text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl"
          >
            Le NaqiyScore&trade;
          </SplitText>

          <AnimateIn variant="fadeUp" delay={0.2}>
            <p className="mt-4 max-w-2xl mx-auto text-lg text-muted-foreground leading-relaxed">
              Un indice de confiance halal de 0 à 100, clair et immédiat.
              Comme le Nutri-Score pour la nutrition,{" "}
              <span className="font-semibold text-foreground">
                le NaqiyScore&trade; t&apos;aide à choisir en un coup d&apos;œil
              </span>.
            </p>
          </AnimateIn>
        </div>

        {/* ─── NaqiyScore Strip — exact replica of mobile GradeStrip ─── */}
        <AnimateIn variant="fadeUp" delay={0.3}>
          <div className="mt-14 flex justify-center">
            <div className="inline-flex items-center gap-1.5 rounded-2xl border border-border bg-card px-4 py-3 shadow-sm">
              {/* Gold "N" prefix — signature Naqiy branding */}
              <span className="mr-1 text-lg font-black text-gold select-none">
                N
              </span>

              {/* 5 grade pills — Arabic numerals */}
              {TRUST_GRADES.map((g) => {
                const isActive = g.grade === ACTIVE_GRADE;
                return (
                  <div
                    key={g.grade}
                    className="flex items-center justify-center rounded-lg font-black text-white transition-all duration-200 hover:scale-105"
                    style={{
                      backgroundColor: g.color,
                      opacity: isActive ? 1 : 0.18,
                      width: isActive ? 56 : 32,
                      height: isActive ? 34 : 28,
                      fontSize: isActive ? 20 : 14,
                    }}
                  >
                    {g.arabic}
                  </div>
                );
              })}

              {/* Active label */}
              <span
                className="ml-3 text-sm font-semibold hidden sm:inline"
                style={{ color: TRUST_GRADES[ACTIVE_GRADE - 1].color }}
              >
                {TRUST_GRADES[ACTIVE_GRADE - 1].label}
              </span>
            </div>
          </div>
        </AnimateIn>

        {/* ─── Grade explanation cards ─── */}
        <Stagger className="mt-12 grid grid-cols-5 gap-2 sm:gap-3 max-w-4xl mx-auto items-stretch">
          {TRUST_GRADES.map((g) => (
            <StaggerItem key={g.grade} className="h-full">
              <div className="group h-full text-center rounded-xl border border-border bg-card/50 p-3 sm:p-4 flex flex-col items-center justify-center transition-all duration-300 hover:border-border/80 hover:bg-card hover:shadow-sm">
                {/* Grade pill */}
                <div
                  className="inline-flex items-center justify-center rounded-lg text-white font-black mb-2"
                  style={{
                    backgroundColor: g.color,
                    width: 36,
                    height: 28,
                    fontSize: 16,
                  }}
                >
                  {g.arabic}
                </div>
                <p className="text-xs sm:text-sm font-semibold text-foreground leading-tight">{g.label}</p>
                <p className="text-[10px] sm:text-xs text-muted-foreground mt-0.5">{g.range}</p>
              </div>
            </StaggerItem>
          ))}
        </Stagger>

        {/* Bottom note */}

        {/* Brand reinforcement */}
        <AnimateIn variant="fadeUp" delay={0.7}>
          <div className="mt-8 flex items-center justify-center gap-3">
            <Image
              src="/images/logo_naqiy.webp"
              alt="Naqiy"
              width={28}
              height={28}
              className="size-7"
            />
            <span className="text-sm font-semibold text-muted-foreground">
              Développé par{" "}
              <span className="text-foreground">Naqiy&reg;</span> — transparent,
              indépendant, gratuit.
            </span>
          </div>
        </AnimateIn>
      </CursorGlow>
    </section>
  );
}
