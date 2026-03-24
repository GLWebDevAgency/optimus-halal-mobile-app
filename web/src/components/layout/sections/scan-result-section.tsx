"use client";

import { CheckCircle, ChartBar, MagnifyingGlass } from "@phosphor-icons/react";
import { AnimateIn, Stagger, StaggerItem } from "@/components/animations/animate-in";
import { SplitText } from "@/components/animations/split-text";

const resultFeatures = [
  {
    icon: CheckCircle,
    title: "Verdict instantané",
    description:
      "Halal, Haram ou Douteux — un résultat clair adapté à ton école juridique.",
    color: "text-leaf",
    bg: "bg-leaf/10",
  },
  {
    icon: ChartBar,
    title: "NaqiyScore™",
    description:
      "Un score de 0 à 100 pour mesurer le niveau de conformité du produit en un coup d'œil.",
    color: "text-gold",
    bg: "bg-gold/10",
  },
  {
    icon: MagnifyingGlass,
    title: "Détail par ingrédient",
    description:
      "Chaque ingrédient est analysé individuellement avec son statut et sa source.",
    color: "text-sky-500",
    bg: "bg-sky-500/10",
  },
];

export function ScanResultSection() {
  return (
    <section className="relative flex items-center py-20 lg:min-h-screen lg:py-32 overflow-hidden">
      {/* Gold spotlight */}
      <div className="pointer-events-none absolute inset-0 bg-gold-spotlight" aria-hidden="true" />
      <div className="container max-w-xl relative z-10">
        <SplitText
          as="h2"
          className="font-display text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl"
        >
          Résultat en moins de 3 secondes
        </SplitText>

        <AnimateIn variant="fadeUp" delay={0.2}>
          <p className="mt-6 max-w-lg text-lg leading-relaxed text-muted-foreground">
            Pas de zone grise. Un verdict clair, un détail par ingrédient,
            et la transparence que tu mérites pour chaque achat.
          </p>
        </AnimateIn>

        <Stagger className="mt-10 space-y-4">
          {resultFeatures.map((feature) => (
            <StaggerItem key={feature.title}>
              <div className="group rounded-2xl border border-border bg-card/50 p-5 backdrop-blur-sm transition-all duration-300 hover:border-border/80 hover:bg-card/70 hover:-translate-y-0.5">
                <div className="flex items-start gap-4">
                  <div className={`flex size-10 shrink-0 items-center justify-center rounded-xl ${feature.bg}`}>
                    <feature.icon className={`size-5 ${feature.color}`} weight="duotone" />
                  </div>
                  <div>
                    <p className="font-semibold text-foreground">
                      {feature.title}
                    </p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {feature.description}
                    </p>
                  </div>
                </div>
              </div>
            </StaggerItem>
          ))}
        </Stagger>
      </div>
    </section>
  );
}
