"use client";

import { motion } from "motion/react";
import { TRUST_GRADES, NaqiyGradeBadge } from "./naqiy-grade-badge";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export function NaqiyGradeShowcase({ className }: { className?: string }) {
  return (
    <div className={cn("flex flex-col gap-8", className)}>
      {/* Header */}
      <div className="flex flex-col gap-3 text-center">
        <Badge
          variant="outline"
          className="mx-auto w-fit border-primary/30 bg-primary/5 text-primary"
        >
          NaqiyScore
        </Badge>
        <h3 className="text-2xl font-bold md:text-3xl">
          Le <span className="text-gold-gradient">NaqiyScore</span>,
          <br className="hidden sm:block" /> notre label de confiance
        </h3>
        <p className="mx-auto max-w-lg text-muted-foreground">
          Inspiré du NutriScore, notre système évalue la fiabilité halal de
          chaque produit sur une échelle de 1 à 5, avec des chiffres arabes.
        </p>
      </div>

      {/* Strip demo */}
      <motion.div
        className="mx-auto flex flex-col items-center gap-6 rounded-2xl border border-border/50 bg-card p-8 shadow-sm"
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-80px" }}
        transition={{ duration: 0.5, ease: "easeOut" }}
      >
        {/* Full strip */}
        <div className="flex flex-col items-center gap-3">
          <span className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
            Vue complète
          </span>
          <NaqiyGradeBadge
            variant="strip"
            grade={TRUST_GRADES[0]}
            showLabel
          />
        </div>

        {/* Separator */}
        <div className="h-px w-full bg-border" />

        {/* All grades compact */}
        <div className="flex flex-col items-center gap-3">
          <span className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
            5 niveaux de confiance
          </span>
          <div className="flex flex-wrap justify-center gap-3">
            {TRUST_GRADES.map((grade, i) => (
              <motion.div
                key={grade.grade}
                initial={{ opacity: 0, scale: 0.8 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08, duration: 0.3 }}
              >
                <NaqiyGradeBadge
                  variant="compact"
                  grade={grade}
                  showLabel
                />
              </motion.div>
            ))}
          </div>
        </div>

        {/* Criteria */}
        <div className="h-px w-full bg-border" />
        <div className="grid gap-3 text-center text-xs text-muted-foreground sm:grid-cols-3">
          <div className="flex flex-col gap-1">
            <span className="font-semibold text-foreground">Certifications</span>
            <span>Organismes vérifiés et reconnus</span>
          </div>
          <div className="flex flex-col gap-1">
            <span className="font-semibold text-foreground">Ingrédients</span>
            <span>Analyse IA de chaque composant</span>
          </div>
          <div className="flex flex-col gap-1">
            <span className="font-semibold text-foreground">Sources savantes</span>
            <span>Références fiqh authentifiées</span>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
