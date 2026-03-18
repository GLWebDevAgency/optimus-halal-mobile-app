"use client";

import { motion } from "motion/react";
import { ArrowRight, Check, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { BackgroundBeams } from "@/components/ui/extras/background-beams";

const trustIndicators = [
  "Gratuit pour toujours",
  "817K+ produits",
  "4 écoles juridiques",
];

export function Hero() {
  return (
    <BackgroundBeams className="relative">
      <section className="container pt-32 pb-20">
        <div className="mx-auto flex max-w-4xl flex-col items-center text-center">
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <Badge
              variant="outline"
              className="mb-6 gap-1.5 border-gold/30 bg-gold/5 text-gold"
            >
              <Sparkles className="size-3" />
              Nouveau — Version 2.0
            </Badge>
          </motion.div>

          {/* Heading */}
          <motion.h1
            className="text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl lg:text-7xl"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            L&apos;information halal,
            <br />
            <span className="text-gold-gradient">pure et transparente.</span>
          </motion.h1>

          {/* Subtitle */}
          <motion.p
            className="mt-6 max-w-2xl text-lg text-muted-foreground md:text-xl"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            Scanne n&apos;importe quel produit. Obtiens un verdict halal
            personnalisé selon ton école juridique. Gratuit.
          </motion.p>

          {/* CTAs */}
          <motion.div
            className="mt-10 flex flex-col gap-4 sm:flex-row"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <Button size="lg" className="h-12 px-8 text-base gold-glow">
              Télécharger l&apos;app
            </Button>
            <Button variant="outline" size="lg" className="h-12 gap-2 px-8 text-base">
              Découvrir
              <ArrowRight className="size-4" />
            </Button>
          </motion.div>

          {/* Trust indicators */}
          <motion.div
            className="mt-12 flex flex-wrap items-center justify-center gap-x-8 gap-y-3"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.5 }}
          >
            {trustIndicators.map((indicator) => (
              <div
                key={indicator}
                className="flex items-center gap-2 text-sm text-muted-foreground"
              >
                <Check className="size-4 text-primary" />
                <span>{indicator}</span>
              </div>
            ))}
          </motion.div>
        </div>
      </section>
    </BackgroundBeams>
  );
}
