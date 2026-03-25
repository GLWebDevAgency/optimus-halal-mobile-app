"use client";

import Image from "next/image";
import { ShieldCheck, MagnifyingGlass, Knife, Path, Eye } from "@phosphor-icons/react";
import { AnimateIn, Stagger, StaggerItem } from "@/components/animations/animate-in";
import { CursorGlow } from "@/components/animations/cursor-glow";
import { SplitText } from "@/components/animations/split-text";
import { Badge } from "@/components/ui/badge";

/* ═══════════════════════════════════════════════
   Data
   ═══════════════════════════════════════════════ */

const TRUST_GRADES = [
  { grade: 1, arabic: "١", label: "Très fiable",         color: "#22c55e", range: "≥ 90" },
  { grade: 2, arabic: "٢", label: "Fiable",              color: "#84cc16", range: "70–89" },
  { grade: 3, arabic: "٣", label: "Vigilance",           color: "#f59e0b", range: "51–69" },
  { grade: 4, arabic: "٤", label: "Peu fiable",          color: "#f97316", range: "35–50" },
  { grade: 5, arabic: "٥", label: "Pas fiable du tout",  color: "#ef4444", range: "< 35" },
] as const;

const ACTIVE_GRADE = 1;

const CRITERIA = [
  {
    icon: Knife,
    title: "Méthode d'abattage",
    description: "Rituel vérifié, mention bismillah, sacrificateur musulman pratiquant.",
  },
  {
    icon: Path,
    title: "Traçabilité complète",
    description: "De l'élevage à l'assiette — chaque maillon de la chaîne est audité.",
  },
  {
    icon: Eye,
    title: "Contrôles terrain",
    description: "Présence physique en abattoir et en usine, pas seulement sur papier.",
  },
  {
    icon: MagnifyingGlass,
    title: "Indépendance financière",
    description: "Le certifieur est-il payé par ceux qu'il certifie ? On le vérifie.",
  },
];

const CERTIFIER_LOGOS = [
  { name: "AVS",           src: "/images/certifications/avs.webp" },
  { name: "Achahada",      src: "/images/certifications/achahada.webp" },
  { name: "ACMIF",         src: "/images/certifications/acmif.webp" },
  { name: "AFCAI",         src: "/images/certifications/afcai.webp" },
  { name: "Al-Takwa",      src: "/images/certifications/altakwa.webp" },
  { name: "ARGML",         src: "/images/certifications/argml.webp" },
  { name: "EHT",           src: "/images/certifications/eht.webp" },
  { name: "Halal Correct", src: "/images/certifications/halal_correct.webp" },
  { name: "HMC",           src: "/images/certifications/hmc.webp" },
  { name: "ICA",           src: "/images/certifications/ica.webp" },
  { name: "MCI",           src: "/images/certifications/mci.webp" },
  { name: "SFCVH",         src: "/images/certifications/sfcvh.webp" },
];

/* ═══════════════════════════════════════════════
   Component
   ═══════════════════════════════════════════════ */

export function NaqiyScoreSection() {
  return (
    <section className="relative flex items-center overflow-hidden py-20 lg:py-32">
      {/* Subtle warm background */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 70% 50% at 50% 20%, oklch(0.76 0.14 88 / 3%) 0%, transparent 70%)",
        }}
        aria-hidden="true"
      />

      <CursorGlow className="container relative z-10">
        {/* ── Header ── */}
        <div>
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
            className="font-display text-2xl font-bold tracking-tight sm:text-4xl md:text-5xl"
          >
            Le NaqiyScore&trade;
          </SplitText>

          <AnimateIn variant="fadeUp" delay={0.2}>
            <p className="mt-4 max-w-2xl text-base sm:text-lg text-pretty text-muted-foreground leading-relaxed">
              Tous les certifieurs ne se valent pas.{" "}
              <span className="font-semibold text-foreground">
                Le NaqiyScore&trade; évalue chacun d&apos;eux
              </span>{" "}
              sur des critères concrets — pour que tu saches vraiment
              à qui tu fais confiance.
            </p>
          </AnimateIn>
        </div>

        {/* ── NaqiyScore Strip ── */}
        <AnimateIn variant="fadeUp" delay={0.3}>
          <div className="mt-14 flex">
            <div className="inline-flex items-center gap-1.5 rounded-2xl bg-card px-4 py-3 shadow-sm">
              <span className="mr-1 text-lg font-black text-gold select-none">
                N
              </span>

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

              <span
                className="ml-3 text-sm font-semibold hidden sm:inline"
                style={{ color: TRUST_GRADES[ACTIVE_GRADE - 1].color }}
              >
                {TRUST_GRADES[ACTIVE_GRADE - 1].label}
              </span>
            </div>
          </div>
        </AnimateIn>

        {/* ── Grade explanation cards ── */}
        <Stagger className="mt-12 grid grid-cols-3 sm:grid-cols-5 gap-2 sm:gap-3 max-w-3xl items-stretch">
          {TRUST_GRADES.map((g) => (
            <StaggerItem key={g.grade} className="h-full">
              <div className="group h-full text-center rounded-xl bg-card p-3 sm:p-4 flex flex-col items-center justify-center shadow-sm transition-all duration-300 hover:shadow-md">
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

        {/* ── Evaluation criteria — what we actually check ── */}
        <AnimateIn variant="fadeUp" delay={0.5}>
          <div className="mt-16">
            <p className="text-sm font-semibold text-foreground tracking-wide uppercase">
              Ce que nous évaluons
            </p>
            <p className="mt-1.5 text-sm text-muted-foreground max-w-md">
              Chaque certifieur est noté sur des critères vérifiables — pas sur sa réputation.
            </p>
          </div>
        </AnimateIn>

        <Stagger className="mt-6 grid grid-cols-2 lg:grid-cols-4 gap-3 max-w-3xl">
          {CRITERIA.map((c) => (
            <StaggerItem key={c.title} className="h-full">
              <div className="group h-full rounded-xl bg-card p-4 shadow-sm ring-1 ring-border/50 transition-all duration-300 hover:shadow-md hover:-translate-y-0.5">
                <div className="inline-flex items-center justify-center size-9 rounded-lg bg-leaf/10 mb-3">
                  <c.icon className="size-[18px] text-leaf" weight="fill" />
                </div>
                <p className="text-sm font-bold text-foreground tracking-tight">
                  {c.title}
                </p>
                <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
                  {c.description}
                </p>
              </div>
            </StaggerItem>
          ))}
        </Stagger>

        {/* ── Certifier marquee ── */}
        <AnimateIn variant="fadeUp" delay={0.7}>
          <div className="mt-16">
            <p className="text-sm font-semibold text-foreground tracking-wide uppercase">
              {CERTIFIER_LOGOS.length} certifieurs couverts
            </p>
            <p className="mt-1.5 text-sm text-muted-foreground">
              Et ce n&apos;est que le début.
            </p>
          </div>

          <div className="mt-6 relative overflow-hidden">
            {/* Fade edges */}
            <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-16 bg-gradient-to-r from-background to-transparent" />
            <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-16 bg-gradient-to-l from-background to-transparent" />

            {/* Scrolling track */}
            <div
              className="flex items-center gap-10 w-max"
              style={{
                animation: "marquee 30s linear infinite",
              }}
            >
              {/* Duplicate for seamless loop */}
              {[...CERTIFIER_LOGOS, ...CERTIFIER_LOGOS].map((logo, i) => (
                <div
                  key={`${logo.name}-${i}`}
                  className="flex flex-col items-center gap-2 shrink-0"
                >
                  <div className="flex items-center justify-center size-14 rounded-xl bg-card shadow-sm ring-1 ring-border/50 p-2">
                    <Image
                      src={logo.src}
                      alt={logo.name}
                      width={40}
                      height={40}
                      className="size-10 object-contain"
                    />
                  </div>
                  <span className="text-[10px] text-muted-foreground/60 font-medium">
                    {logo.name}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </AnimateIn>

        {/* ── Brand reinforcement ── */}
        <AnimateIn variant="fadeUp" delay={0.8}>
          <div className="mt-10 flex items-center gap-3">
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
