"use client";

import { motion } from "motion/react";
import { ArrowRight, DownloadSimple, Sparkle } from "@phosphor-icons/react";
import Image from "next/image";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  PhoneMockup,
  PhoneScreen,
} from "@/components/ui/extras/phone-mockup";

const certifiers = [
  { name: "AVS", src: "/images/certifications/avs.webp" },
  { name: "Achahada", src: "/images/certifications/achahada.webp" },
  { name: "Halal Correct", src: "/images/certifications/halal_correct.webp" },
];

export function Hero() {
  return (
    <section className="relative flex min-h-screen items-center overflow-hidden bg-gold-mesh">
      {/* Subtle radial overlay for depth */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 70% 50% at 70% 50%, oklch(0.78 0.17 82 / 4%) 0%, transparent 70%)",
        }}
      />

      <div className="container relative z-10 py-24 lg:py-32">
        <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-20">
          {/* ─── Left column: Typography + CTAs ─── */}
          <div className="flex flex-col items-start">
            {/* Badge */}
            <motion.div
              initial={{ opacity: 0, y: 24, filter: "blur(6px)" }}
              animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              transition={{ duration: 0.6, ease: [0.25, 0.1, 0.25, 1] }}
            >
              <Badge
                variant="outline"
                className="mb-8 gap-1.5 border-gold/30 bg-gold/5 px-3 py-1 text-gold"
              >
                <Sparkle className="size-3" />
                Nouveau — Scanne en toute confiance
              </Badge>
            </motion.div>

            {/* H1 — Massive tagline */}
            <motion.h1
              className="text-6xl leading-[0.95] font-black tracking-tighter text-foreground sm:text-7xl md:text-8xl"
              initial={{ opacity: 0, y: 32 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                duration: 0.7,
                delay: 0.1,
                ease: [0.25, 0.1, 0.25, 1],
              }}
            >
              Scanne.
              <br />
              Comprends.
              <br />
              <span className="text-gold-gradient">Choisis.</span>
            </motion.h1>

            {/* Subtitle */}
            <motion.p
              className="mt-6 max-w-lg text-lg leading-relaxed text-muted-foreground md:text-xl"
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                duration: 0.6,
                delay: 0.25,
                ease: [0.25, 0.1, 0.25, 1],
              }}
            >
              L&apos;application halal qui analyse{" "}
              <span className="font-semibold text-foreground">817K+ produits</span>{" "}
              selon ta propre école juridique. Gratuit.
            </motion.p>

            {/* CTAs */}
            <motion.div
              className="mt-10 flex flex-col gap-4 sm:flex-row"
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                duration: 0.6,
                delay: 0.4,
                ease: [0.25, 0.1, 0.25, 1],
              }}
            >
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
            </motion.div>

            {/* Trust bar — Certifier logos */}
            <motion.div
              className="mt-12 flex flex-col gap-3"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.65 }}
            >
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
            </motion.div>
          </div>

          {/* ─── Right column: Phone mockup ─── */}
          <div className="relative flex justify-center lg:justify-end">
            {/* Ambient gold orb behind phone */}
            <div
              className="pointer-events-none absolute top-1/2 left-1/2 -z-10 h-[500px] w-[500px] -translate-x-1/2 -translate-y-1/2 rounded-full opacity-40"
              style={{
                background:
                  "radial-gradient(circle, oklch(0.78 0.17 82 / 18%) 0%, oklch(0.78 0.17 82 / 6%) 40%, transparent 70%)",
                animation: "glow-pulse 5s ease-in-out infinite",
              }}
            />

            <PhoneMockup showScanLine>
              <PhoneScreen
                productName="Nutella 400g"
                brand="Ferrero"
                verdict="halal"
                score={87}
              />
            </PhoneMockup>
          </div>
        </div>
      </div>

      {/* Bottom fade to next section */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-background to-transparent" />
    </section>
  );
}
