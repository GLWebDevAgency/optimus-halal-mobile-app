"use client";

import { SectionContainer } from "@/components/layout/section-container";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PaperPlaneTilt } from "@phosphor-icons/react";
import { motion } from "motion/react";

export function Newsletter() {
  return (
    <SectionContainer>
      <motion.div
        className="mx-auto max-w-2xl text-center"
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5 }}
      >
        <h2 className="text-3xl font-bold md:text-4xl">Reste informé</h2>
        <p className="mt-4 text-muted-foreground">
          Reçois les dernières mises à jour et conseils halal directement dans
          ta boîte mail.
        </p>

        <form
          className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-center"
          onSubmit={(e) => e.preventDefault()}
        >
          <Input
            type="email"
            placeholder="ton@email.com"
            className="h-12 sm:max-w-sm"
            required
          />
          <Button
            type="submit"
            size="lg"
            className="h-12 gap-2 bg-primary px-6 text-primary-foreground"
          >
            <PaperPlaneTilt className="size-4" />
            S&apos;inscrire
          </Button>
        </form>

        <p className="mt-3 text-xs text-muted-foreground">
          Pas de spam. Désabonnement en un clic.
        </p>
      </motion.div>
    </SectionContainer>
  );
}
