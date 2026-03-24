"use client";

import { QrCode, AppleLogo, GooglePlayLogo, ArrowDown, Leaf } from "@phosphor-icons/react";
import { SplitText } from "@/components/animations/split-text";
import { AnimateIn } from "@/components/animations/animate-in";

export function CtaDownload() {
  return (
    <section className="relative flex items-center overflow-hidden bg-secondary/50 py-20 lg:min-h-screen lg:py-32">
      {/* Warm ambient glow */}
      <div
        className="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[700px] w-[700px] rounded-full"
        style={{
          background:
            "radial-gradient(circle, oklch(0.76 0.14 88 / 6%) 0%, oklch(0.76 0.14 88 / 2%) 40%, transparent 70%)",
          animation: "breathe 6s ease-in-out infinite",
        }}
        aria-hidden="true"
      />

      <div className="mx-auto max-w-4xl px-6 text-center relative z-10">
        {/* Headline */}
        <SplitText
          as="h2"
          className="font-display text-3xl font-bold tracking-tight sm:text-4xl md:text-6xl text-glow-gold"
        >
          Prêt à scanner en confiance ?
        </SplitText>

        {/* Subtitle */}
        <AnimateIn variant="fadeUp" delay={0.2}>
          <p className="mt-6 text-lg text-muted-foreground max-w-xl mx-auto">
            Rejoins ceux qui ont choisi la transparence.
            <span className="inline-flex items-center gap-1 ml-1">
              <Leaf className="size-4 text-leaf" weight="fill" />
              Gratuit sur iOS et Android.
            </span>
          </p>
        </AnimateIn>

        {/* Store badges — premium glass style */}
        <AnimateIn variant="blur" delay={0.4}>
          <div className="mt-10 flex justify-center">
            <a
              href="#"
              className="border-gradient-gold group relative inline-flex items-center gap-3 rounded-full bg-foreground px-8 py-4 shadow-lg transition-all duration-300 hover:shadow-xl hover:scale-[1.03]"
              style={{ animation: "glow-pulse 5s ease-in-out infinite" }}
            >
              <AppleLogo className="size-6 text-background" weight="fill" />
              <GooglePlayLogo className="size-6 text-background" weight="fill" />
              <span className="font-display text-lg font-bold text-background">Download</span>
            </a>
          </div>
        </AnimateIn>

        {/* QR Code — premium treatment */}
        <AnimateIn variant="fadeUp" delay={0.6}>
          <div className="mt-14 inline-flex flex-col items-center gap-4">
            <div className="relative">
              {/* Glow behind QR */}
              <div
                className="absolute inset-0 rounded-2xl blur-xl opacity-30"
                style={{ background: "oklch(0.76 0.14 88 / 30%)" }}
                aria-hidden="true"
              />
              <div className="relative rounded-2xl bg-white p-4 shadow-2xl shadow-black/20 ring-1 ring-white/10">
                <QrCode className="size-28 text-black" weight="fill" />
              </div>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground/50">
              <ArrowDown className="size-3 animate-bounce" />
              Scanne avec la caméra de ton téléphone
            </div>
          </div>
        </AnimateIn>
      </div>
    </section>
  );
}
