"use client";

import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  ArrowDown,
  Sparkle,
  AppleLogo,
  GooglePlayLogo,
  ShieldCheck,
  Leaf,
} from "@phosphor-icons/react";
import { motion } from "motion/react";
import { Badge } from "@/components/ui/badge";
import { AnimateIn } from "@/components/animations/animate-in";
import { AnimatedCounter } from "@/components/animations/animated-counter";
import { SplitText } from "@/components/animations/split-text";

const topCertifiers = [
  { name: "AVS", src: "/images/certifications/avs.webp" },
  { name: "Achahada", src: "/images/certifications/achahada.webp" },
];

export function Hero() {
  return (
    <section className="relative flex min-h-screen items-center bg-background overflow-hidden">
      {/* Animated mesh blob — gold (top-right, drifts) */}
      <div
        className="pointer-events-none absolute -top-40 -right-40 h-[600px] w-[600px] rounded-full"
        style={{
          background: "radial-gradient(circle, oklch(0.76 0.14 88 / 8%) 0%, transparent 70%)",
          animation: "float-slow 20s ease-in-out infinite",
        }}
        aria-hidden="true"
      />
      {/* Animated mesh blob — leaf (bottom-left, drifts opposite) */}
      <div
        className="pointer-events-none absolute -bottom-60 -left-40 h-[500px] w-[500px] rounded-full"
        style={{
          background: "radial-gradient(circle, oklch(0.50 0.14 142 / 6%) 0%, transparent 70%)",
          animation: "float-slow 25s ease-in-out infinite reverse",
        }}
        aria-hidden="true"
      />
      {/* Animated mesh blob — warm (center, subtle) */}
      <div
        className="pointer-events-none absolute top-1/3 left-1/4 h-[400px] w-[400px] rounded-full"
        style={{
          background: "radial-gradient(circle, oklch(0.90 0.04 88 / 5%) 0%, transparent 60%)",
          animation: "float-slow 30s ease-in-out infinite",
          animationDelay: "-10s",
        }}
        aria-hidden="true"
      />

      <div className="container py-20 lg:py-32 relative z-10">
        {/* ─── Brand hero — spectacular logo reveal ─── */}
        <AnimateIn variant="blur">
          <div className="mb-10 flex items-center gap-5">
            <div className="relative">
              {/* Glow ring behind logo */}
              <div
                className="absolute inset-0 rounded-2xl blur-2xl"
                style={{ background: "oklch(0.76 0.14 88 / 15%)" }}
                aria-hidden="true"
              />
              <Image
                src="/images/logo_naqiy.webp"
                alt="Naqiy"
                width={72}
                height={72}
                className="relative size-[72px] drop-shadow-lg"
                priority
              />
            </div>
            <div>
              <h2 className="text-4xl font-black tracking-tight text-gold-gradient sm:text-5xl">
                Naqiy
              </h2>
              <p className="text-sm font-medium text-muted-foreground tracking-wide">
                L&apos;information halal, pure et transparente
              </p>
            </div>
          </div>
        </AnimateIn>

        {/* Badge */}
        <AnimateIn variant="blur" delay={0.15}>
          <Badge
            variant="outline"
            className="mb-8 gap-1.5 border-leaf/30 bg-leaf/5 px-3 py-1 text-leaf"
          >
            <Leaf className="size-3" weight="fill" />
            La transparence que tu mérites
          </Badge>
        </AnimateIn>

        {/* H1 — Massive tagline */}
        <h1 className="font-display text-5xl font-black tracking-tighter leading-[0.95] sm:text-6xl md:text-7xl lg:text-8xl">
          <SplitText as="span" delay={0.2}>
            Scanne.
          </SplitText>
          <br />
          <SplitText as="span" delay={0.5}>
            Comprends.
          </SplitText>
          <br />
          <SplitText as="span" delay={0.8} className="text-gold-gradient">
            Choisis.
          </SplitText>
        </h1>

        {/* Subtitle */}
        <AnimateIn variant="fadeUp" delay={0.6}>
          <p className="mt-6 max-w-lg text-lg leading-relaxed text-muted-foreground md:text-xl">
            Ce que tu consommes compte. Naqiy t&apos;aide à
            {" "}<span className="font-semibold text-foreground">nourrir ta famille en toute sérénité</span>
            {" "}— avec clarté et confiance.
          </p>
        </AnimateIn>

        {/* Store badges */}
        <AnimateIn variant="blur" delay={0.7}>
          <div className="mt-10 flex flex-col gap-3 sm:flex-row sm:items-center">
            <a
              href="#"
              className="group inline-flex items-center gap-3 rounded-xl border border-border bg-card px-5 py-3 shadow-sm transition-all duration-300 hover:border-gold/30 hover:shadow-md hover:scale-[1.02]"
            >
              <AppleLogo className="size-7 text-foreground" weight="fill" />
              <div className="text-left">
                <p className="text-[9px] font-medium uppercase tracking-wider text-muted-foreground leading-none">
                  Télécharger sur
                </p>
                <p className="text-base font-semibold text-foreground leading-tight">
                  App Store
                </p>
              </div>
            </a>

            <a
              href="#"
              className="group inline-flex items-center gap-3 rounded-xl border border-border bg-card px-5 py-3 shadow-sm transition-all duration-300 hover:border-gold/30 hover:shadow-md hover:scale-[1.02]"
            >
              <GooglePlayLogo className="size-7 text-foreground" weight="fill" />
              <div className="text-left">
                <p className="text-[9px] font-medium uppercase tracking-wider text-muted-foreground leading-none">
                  Disponible sur
                </p>
                <p className="text-base font-semibold text-foreground leading-tight">
                  Google Play
                </p>
              </div>
            </a>

            <Link
              href="#features"
              className="inline-flex items-center gap-2 px-4 py-3 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              Voir les fonctionnalités
              <ArrowRight className="size-3.5" />
            </Link>
          </div>
        </AnimateIn>

        {/* Stats micro-strip */}
        <AnimateIn variant="fadeUp" delay={0.85}>
          <div className="mt-6 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground/60">
            <span><AnimatedCounter value={817000} suffix="+" className="font-semibold text-foreground/80" /> produits analysés</span>
            <span className="text-border">·</span>
            <span><AnimatedCounter value={383} className="font-semibold text-foreground/80" /> magasins</span>
            <span className="text-border">·</span>
            <span className="font-semibold text-leaf/70">100% gratuit</span>
          </div>
        </AnimateIn>

        {/* Trust bar — Top certifiers in France */}
        <AnimateIn variant="fadeUp" delay={0.9}>
          <div className="mt-12 flex flex-col gap-3">
            <div className="flex items-center gap-2">
              <ShieldCheck className="size-4 text-leaf" weight="fill" />
              <span className="text-xs font-medium tracking-wider text-muted-foreground/70 uppercase">
                Top certifieurs France
              </span>
            </div>
            <div className="flex items-center gap-4">
              {topCertifiers.map((cert) => (
                <div
                  key={cert.name}
                  className="flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-1.5 shadow-sm"
                >
                  <Image
                    src={cert.src}
                    alt={cert.name}
                    width={20}
                    height={20}
                    className="size-5 rounded-sm object-contain"
                  />
                  <span className="text-xs font-medium text-muted-foreground">
                    {cert.name}
                  </span>
                </div>
              ))}
              <span className="text-xs text-muted-foreground/60">
                + tous les certifieurs dans l&apos;app
              </span>
            </div>
          </div>
        </AnimateIn>

        {/* Scroll indicator */}
        <AnimateIn variant="fadeUp" delay={1.2}>
          <div className="mt-16 flex flex-col items-center gap-2 text-muted-foreground/40">
            <motion.div
              animate={{ y: [0, 8, 0] }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            >
              <ArrowDown className="size-5" />
            </motion.div>
            <span className="text-xs tracking-widest uppercase">Découvrir</span>
          </div>
        </AnimateIn>
      </div>
    </section>
  );
}
