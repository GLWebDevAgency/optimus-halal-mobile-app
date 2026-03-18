"use client";

import { Button } from "@/components/ui/button";
import { ScrollReveal } from "@/components/ui/extras/scroll-reveal";
import { DownloadSimple, DeviceMobileCamera } from "@phosphor-icons/react";

export function CtaDownload() {
  return (
    <section className="relative overflow-hidden bg-gold-mesh">
      {/* Subtle radial depth layer */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 60% 50% at 50% 50%, oklch(0.78 0.17 82 / 6%) 0%, transparent 70%)",
        }}
      />

      <div className="container relative z-10 py-24 sm:py-32">
        <div className="mx-auto flex max-w-2xl flex-col items-center text-center">
          {/* Headline */}
          <ScrollReveal>
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl">
              Prêt à scanner{" "}
              <span className="text-gold-gradient">en confiance</span> ?
            </h2>
          </ScrollReveal>

          {/* Subtitle */}
          <ScrollReveal delay={0.1}>
            <p className="mt-6 max-w-lg text-lg leading-relaxed text-muted-foreground">
              Rejoins les milliers d&apos;utilisateurs qui font confiance à
              Naqiy pour leur alimentation halal.
            </p>
          </ScrollReveal>

          {/* CTA buttons */}
          <ScrollReveal delay={0.2}>
            <div className="mt-10 flex flex-col gap-4 sm:flex-row">
              <Button
                size="lg"
                className="h-12 gap-2 px-8 text-base font-semibold gold-glow-intense"
              >
                <DownloadSimple className="size-4" />
                Télécharger sur iOS
              </Button>
              <Button
                size="lg"
                className="h-12 gap-2 px-8 text-base font-semibold gold-glow-intense"
              >
                <DeviceMobileCamera className="size-4" />
                Télécharger sur Android
              </Button>
            </div>
          </ScrollReveal>

          {/* Trust line */}
          <ScrollReveal delay={0.3}>
            <p className="mt-8 text-sm font-medium text-muted-foreground/70">
              Gratuit. Sans publicité. Sans compromis.
            </p>
          </ScrollReveal>
        </div>
      </div>
    </section>
  );
}
