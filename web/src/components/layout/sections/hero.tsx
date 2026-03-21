"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowRight, DownloadSimple, Sparkle } from "@phosphor-icons/react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AnimateIn } from "@/components/animations/animate-in";
import { SplitText } from "@/components/animations/split-text";

const certifiers = [
  { name: "AVS", src: "/images/certifications/avs.webp" },
  { name: "Achahada", src: "/images/certifications/achahada.webp" },
  { name: "Halal Correct", src: "/images/certifications/halal_correct.webp" },
];

export function Hero() {
  return (
    <section className="flex min-h-screen items-center bg-[#0a0a0a]">
      <div className="container py-24 lg:py-32">
        {/* Badge */}
        <AnimateIn variant="blur">
          <Badge
            variant="outline"
            className="mb-8 gap-1.5 border-gold/30 bg-gold/5 px-3 py-1 text-gold"
          >
            <Sparkle className="size-3" />
            Nouveau — Scanne en toute confiance
          </Badge>
        </AnimateIn>

        {/* H1 — Massive tagline */}
        <h1 className="font-display text-6xl font-black tracking-tighter leading-[0.95] sm:text-7xl md:text-8xl">
          <SplitText as="span" delay={0}>
            Scanne.
          </SplitText>
          <br />
          <SplitText as="span" delay={0.3}>
            Comprends.
          </SplitText>
          <br />
          <SplitText as="span" delay={0.6} className="text-gold-gradient">
            Choisis.
          </SplitText>
        </h1>

        {/* Subtitle */}
        <AnimateIn variant="fadeUp" delay={0.4}>
          <p className="mt-6 max-w-lg text-lg leading-relaxed text-muted-foreground md:text-xl">
            L&apos;application halal qui analyse{" "}
            <span className="font-semibold text-foreground">817K+ produits</span>{" "}
            selon ta propre école juridique. Gratuit.
          </p>
        </AnimateIn>

        {/* CTAs */}
        <AnimateIn variant="blur" delay={0.5}>
          <div className="mt-10 flex flex-row gap-4">
            <Button
              size="lg"
              className="h-12 gap-2 px-8 text-base gold-glow-intense"
            >
              <DownloadSimple className="size-4" />
              Télécharger gratuitement
            </Button>
            <Link href="#demo">
              <Button
                variant="outline"
                size="lg"
                className="h-12 gap-2 px-8 text-base"
              >
                Voir la démo
                <ArrowRight className="size-4" />
              </Button>
            </Link>
          </div>
        </AnimateIn>

        {/* Trust bar — Certifier logos */}
        <AnimateIn variant="fadeUp" delay={0.7}>
          <div className="mt-12 flex flex-col gap-3">
            <span className="text-xs font-medium tracking-wider text-muted-foreground/70 uppercase">
              Certifié par
            </span>
            <div className="flex items-center gap-5">
              {certifiers.map((cert) => (
                <div
                  key={cert.name}
                  className="flex items-center gap-2 rounded-lg border border-border/50 bg-card/60 px-3 py-1.5 backdrop-blur-sm"
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
            </div>
          </div>
        </AnimateIn>
      </div>
    </section>
  );
}
