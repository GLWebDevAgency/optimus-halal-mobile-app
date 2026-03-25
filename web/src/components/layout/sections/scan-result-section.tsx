"use client";

import { CheckCircle, ChartBar, MagnifyingGlass } from "@phosphor-icons/react";
import { AnimateIn, Stagger, StaggerItem } from "@/components/animations/animate-in";
import { SplitText } from "@/components/animations/split-text";

const resultFeatures = [
  {
    icon: CheckCircle,
    title: "Halal, Haram ou Douteux — sans ambiguïté",
    description:
      "Un verdict clair adapté à ton école juridique, pas un avis flou trouvé sur un forum.",
    color: "text-leaf",
  },
  {
    icon: ChartBar,
    title: "Un score clair, de 0 à 100",
    description:
      "Le NaqiyScore résume tout en un chiffre. Plus il est haut, plus tu peux acheter sereinement.",
    color: "text-gold",
  },
  {
    icon: MagnifyingGlass,
    title: "Chaque ingrédient a son dossier",
    description:
      "Statut, source, dalil — tu vois tout. Et si un ingrédient est douteux, on t'explique pourquoi.",
    color: "text-foreground/60",
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
          ssrVisible
          className="font-display text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl"
        >
          3 secondes. Zéro doute.
        </SplitText>

        <AnimateIn variant="fadeUp" delay={0.2}>
          <p className="mt-6 max-w-lg text-lg leading-relaxed text-pretty text-muted-foreground">
            Plus besoin de chercher pendant des heures. Tu scannes, tu sais.
            Et si tu veux comprendre{" "}
            <span className="font-semibold text-foreground">pourquoi</span>,
            tout est là — sources incluses.
          </p>
        </AnimateIn>

        <Stagger className="mt-10 space-y-3">
          {resultFeatures.map((feature) => (
            <StaggerItem key={feature.title}>
              <div className="group rounded-2xl bg-card p-5 shadow-sm transition-all duration-300 hover:shadow-md hover:-translate-y-0.5">
                <div className="flex items-start gap-4">
                  <feature.icon
                    className={`size-5 shrink-0 mt-0.5 ${feature.color}`}
                    weight="duotone"
                  />
                  <div>
                    <p className="font-semibold text-foreground">
                      {feature.title}
                    </p>
                    <p className="mt-1 text-sm text-muted-foreground leading-relaxed">
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
