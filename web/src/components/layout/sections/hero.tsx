"use client";

import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  ArrowDown,
  Bell,
  ShieldCheck,
  Leaf,
} from "@phosphor-icons/react";
import { motion, useScroll, useTransform } from "motion/react";
import { Badge } from "@/components/ui/badge";
import { AnimateIn } from "@/components/animations/animate-in";
import { AnimatedCounter } from "@/components/animations/animated-counter";
import { SplitText } from "@/components/animations/split-text";
import { useTrack } from "@/lib/posthog";
import { EVENTS } from "@/lib/analytics-events";

const topCertifiers = [
  { name: "AVS", src: "/images/certifications/avs.webp" },
  { name: "Achahada", src: "/images/certifications/achahada.webp" },
];

export function Hero() {
  const track = useTrack();
  const { scrollY } = useScroll();

  // Hero brand block: fades out + lifts up as user scrolls
  const brandOpacity = useTransform(scrollY, [0, 300], [1, 0]);
  const brandY = useTransform(scrollY, [0, 300], [0, -40]);
  const brandScale = useTransform(scrollY, [0, 300], [1, 0.88]);

  return (
    <section id="hero" className="relative flex min-h-svh items-center bg-background overflow-hidden">
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

      <div className="container pt-24 pb-16 lg:pt-28 lg:pb-14 relative z-10">
        {/* ─── Brand hero — large logo that fades on scroll ─── */}
        <motion.div
          style={{ opacity: brandOpacity, y: brandY, scale: brandScale }}
          className="origin-left"
        >
          <AnimateIn variant="blur">
            <div className="mb-6 flex items-center gap-4">
              <div className="relative">
                {/* Glow ring behind logo */}
                <div
                  className="absolute inset-0 rounded-3xl blur-3xl"
                  style={{ background: "oklch(0.76 0.14 88 / 18%)" }}
                  aria-hidden="true"
                />
                <Image
                  src="/images/logo_naqiy.webp"
                  alt="Naqiy"
                  width={72}
                  height={72}
                  className="relative size-[72px] drop-shadow-xl sm:size-[88px]"
                  priority
                />
              </div>
              <div>
                <h2 className="text-4xl font-black tracking-tight text-gold-gradient sm:text-5xl lg:text-6xl">
                  Naqiy
                </h2>
                <p className="text-sm font-medium text-muted-foreground tracking-wide sm:text-base">
                  L&apos;information halal, pure et transparente
                </p>
              </div>
            </div>
          </AnimateIn>
        </motion.div>

        {/* Badge */}
        <AnimateIn variant="blur" delay={0.15} ssrVisible>
          <Badge
            variant="outline"
            className="mb-5 gap-1.5 border-leaf/30 bg-leaf/5 px-3 py-1 text-leaf"
          >
            <Leaf className="size-3" weight="fill" />
            Est-ce que c&apos;est vraiment halal ?
          </Badge>
        </AnimateIn>

        {/* H1 — Massive tagline */}
        <h1 className="font-display text-4xl font-black tracking-tighter leading-[0.95] text-balance sm:text-5xl md:text-6xl lg:text-7xl">
          <SplitText as="span" delay={0.2} ssrVisible>
            Scanne.
          </SplitText>
          <br />
          <SplitText as="span" delay={0.5} ssrVisible>
            Comprends.
          </SplitText>
          <br />
          <SplitText as="span" delay={0.8} className="text-gold-gradient" ssrVisible>
            Choisis.
          </SplitText>
        </h1>

        {/* Subtitle */}
        <AnimateIn variant="fadeUp" delay={0.6} ssrVisible>
          <p className="mt-4 max-w-lg text-base leading-relaxed text-pretty text-muted-foreground md:text-lg">
            Tu retournes un paquet, tu lis gélatine, E471, lécithine… Tu comprends rien.
            Naqiy décrypte chaque produit pour que tu puisses{" "}
            <span className="font-semibold text-foreground">nourrir ta famille en confiance</span>.
          </p>
        </AnimateIn>

        {/* Store badges */}
        <AnimateIn variant="blur" delay={0.7} ssrVisible>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
            <a
              href="#waitlist"
              onClick={() => track(EVENTS.HERO_CTA_CLICKED)}
              className="border-gradient-gold group inline-flex items-center gap-3 rounded-full bg-foreground px-6 py-3 shadow-lg transition-all duration-300 hover:shadow-xl hover:scale-[1.03]"
            >
              <Bell className="size-5 text-background" weight="fill" />
              <span className="font-display text-base font-bold text-background">Me prévenir du lancement</span>
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
        <AnimateIn variant="fadeUp" delay={0.85} ssrVisible>
          <div className="mt-6 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground/60">
            <span><AnimatedCounter value={817000} suffix="+" className="font-semibold text-foreground/80" /> produits référencés</span>
            <span className="text-border">·</span>
            <span><AnimatedCounter value={383} className="font-semibold text-foreground/80" /> magasins</span>
            <span className="text-border">·</span>
            <span className="font-semibold text-leaf/70">100% gratuit</span>
          </div>
        </AnimateIn>

        {/* Trust bar — Top certifiers in France */}
        <AnimateIn variant="fadeUp" delay={0.9} ssrVisible>
          <div className="mt-6 flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <ShieldCheck className="size-4 text-leaf" weight="fill" />
              <span className="text-xs font-medium tracking-wider text-muted-foreground/70 uppercase">
                Top certifieurs France
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-2 sm:gap-4">
              {topCertifiers.map((cert) => (
                <div
                  key={cert.name}
                  className="flex items-center gap-2 rounded-lg bg-card px-3 py-1.5 shadow-sm"
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
              <span className="text-[11px] sm:text-xs text-muted-foreground/60">
                et d&apos;autres à découvrir dans l&apos;app
              </span>
            </div>
          </div>
        </AnimateIn>

        {/* Scroll indicator */}
        <AnimateIn variant="fadeUp" delay={1.2}>
          <div className="mt-6 flex flex-col items-center gap-1 text-muted-foreground/40">
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
