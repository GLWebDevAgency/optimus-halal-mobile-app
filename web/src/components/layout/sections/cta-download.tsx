"use client";

import {
  Bell,
  ShieldCheck,
  Package,
  Flask,
  Storefront,
} from "@phosphor-icons/react";
import { SplitText } from "@/components/animations/split-text";
import { AnimateIn } from "@/components/animations/animate-in";
import { NaqiyLogo } from "@/components/brand/naqiy-logo";
import { AnimatedCounter } from "@/components/animations/animated-counter";

/* ═══════════════════════════════════════════════
   Trust metrics — social proof concret
   ═══════════════════════════════════════════════ */

const trustMetrics = [
  {
    icon: Package,
    value: 817000,
    suffix: "+",
    label: "produits référencés",
  },
  {
    icon: Flask,
    value: 140,
    suffix: "+",
    label: "additifs vérifiés",
  },
  {
    icon: Storefront,
    value: 383,
    suffix: "",
    label: "commerces certifiés",
  },
];

export function CtaDownload() {
  return (
    <section className="relative flex items-center overflow-hidden bg-secondary/50 py-20 lg:min-h-screen lg:py-32">
      {/* Double ambient glow — premium warmth */}
      <div
        className="pointer-events-none absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[800px] w-[800px] rounded-full"
        style={{
          background:
            "radial-gradient(circle, oklch(0.76 0.14 88 / 8%) 0%, oklch(0.76 0.14 88 / 3%) 35%, transparent 65%)",
          animation: "breathe 6s ease-in-out infinite",
        }}
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute bottom-0 left-1/2 -translate-x-1/2 h-[400px] w-[600px] rounded-full"
        style={{
          background:
            "radial-gradient(ellipse, oklch(0.76 0.14 88 / 4%) 0%, transparent 70%)",
        }}
        aria-hidden="true"
      />

      <div className="mx-auto max-w-4xl px-6 text-center relative z-10">
        {/* ── Logo + Brand ── */}
        <AnimateIn variant="blur">
          <div className="mb-8 flex justify-center">
            <NaqiyLogo size="xl" variant="brand" />
          </div>
        </AnimateIn>

        {/* ── Headline — émotion pure ── */}
        <SplitText
          as="h2"
          className="font-display text-3xl font-bold tracking-tight sm:text-4xl md:text-6xl text-glow-gold"
          ssrVisible
        >
          Ta famille mérite de savoir
        </SplitText>

        {/* ── Subtitle — sakina (tranquillité) ── */}
        <AnimateIn variant="fadeUp" delay={0.2}>
          <p className="mt-5 text-lg text-pretty text-muted-foreground max-w-lg mx-auto leading-relaxed">
            Un scan. Un verdict.
            <br className="sm:hidden" />{" "}
            <span className="font-semibold text-foreground">
              La tranquillité à chaque course.
            </span>
          </p>
        </AnimateIn>

        {/* ── Trust metrics — social proof ── */}
        <AnimateIn variant="fadeUp" delay={0.3}>
          <div className="mt-8 flex items-center justify-center gap-6 sm:gap-10">
            {trustMetrics.map((metric) => (
              <div key={metric.label} className="flex flex-col items-center gap-1">
                <div className="flex items-center gap-1.5">
                  <metric.icon
                    className="size-4 text-gold"
                    weight="fill"
                  />
                  <span className="text-xl font-black text-foreground sm:text-2xl tabular-nums">
                    <AnimatedCounter
                      value={metric.value}
                      suffix={metric.suffix}
                      duration={2}
                    />
                  </span>
                </div>
                <span className="text-[11px] text-muted-foreground">
                  {metric.label}
                </span>
              </div>
            ))}
          </div>
        </AnimateIn>

        {/* ── Waitlist CTA ── */}
        <AnimateIn variant="blur" delay={0.45}>
          <div className="mt-10 flex flex-col items-center gap-3">
            <a
              href="#waitlist"
              className="inline-flex items-center gap-2.5 rounded-xl bg-gold px-8 py-4 text-base font-semibold text-background shadow-lg shadow-gold/20 transition-all duration-300 hover:bg-gold/90 hover:shadow-xl hover:shadow-gold/30 hover:scale-[1.03] active:scale-[0.98]"
            >
              <Bell className="size-5" weight="fill" />
              Rejoindre la liste d&apos;attente
            </a>
            <p className="text-sm text-muted-foreground/50">
              Bient&ocirc;t sur iOS et Android
            </p>
          </div>
        </AnimateIn>

        {/* ── Gratuit — lever le dernier frein ── */}
        <AnimateIn variant="fadeUp" delay={0.55}>
          <div className="mt-5 flex items-center justify-center gap-1.5">
            <ShieldCheck className="size-4 text-leaf" weight="fill" />
            <p className="text-sm text-muted-foreground">
              Gratuit pour toujours — sans pub, sans revente de données
            </p>
          </div>
        </AnimateIn>
      </div>
    </section>
  );
}
