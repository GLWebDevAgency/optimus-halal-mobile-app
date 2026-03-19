"use client";

import { SectionContainer } from "@/components/layout/section-container";
import { Button } from "@/components/ui/button";
import { ArrowRight, Users } from "@phosphor-icons/react";
import { motion } from "motion/react";

export function Community() {
  return (
    <SectionContainer>
      <motion.div
        className="relative mx-auto max-w-3xl overflow-hidden rounded-2xl border border-gold/20 bg-card p-8 text-center md:p-12"
        initial={{ opacity: 0, scale: 0.96 }}
        whileInView={{ opacity: 1, scale: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5 }}
      >
        {/* Gold glow background */}
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse at center, oklch(0.78 0.17 82 / 6%) 0%, transparent 70%)",
          }}
        />

        <div className="relative z-10">
          <div className="mx-auto mb-6 flex size-14 items-center justify-center rounded-full bg-primary/10">
            <Users className="size-7 text-primary" />
          </div>

          <h2 className="text-3xl font-bold md:text-4xl">
            Rejoins la communauté{" "}
            <span className="text-gold-gradient">Naqiy</span>
          </h2>

          <p className="mx-auto mt-4 max-w-lg text-muted-foreground">
            Ensemble, on construit la référence halal en France. Signale,
            corrige, partage. Chaque contribution compte.
          </p>

          <div className="mt-8 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <Button size="lg" className="h-12 gap-2 px-8 text-base">
              Télécharger maintenant
              <ArrowRight className="size-4" />
            </Button>
          </div>
        </div>
      </motion.div>
    </SectionContainer>
  );
}
