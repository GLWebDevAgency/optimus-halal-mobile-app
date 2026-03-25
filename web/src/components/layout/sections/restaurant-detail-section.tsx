"use client";

import { Clock, Star, Certificate } from "@phosphor-icons/react";
import { AnimateIn, Stagger, StaggerItem } from "@/components/animations/animate-in";
import { SplitText } from "@/components/animations/split-text";

const details = [
  {
    icon: Clock,
    title: "Ouvert ou fermé ? Tu sais avant de partir",
    description: "Horaires en temps réel. Plus de mauvaises surprises devant un rideau baissé.",
    color: "text-foreground/60",
  },
  {
    icon: Star,
    title: "Les avis des gens comme toi",
    description:
      "Notes et retours Google intégrés — pas besoin d'ouvrir 3 apps pour se décider.",
    color: "text-gold",
  },
  {
    icon: Certificate,
    title: "Chaque certifieur a sa note de fiabilité",
    description:
      "AVS, Achahada — Naqiy évalue chaque organisme selon des critères stricts et transparents.",
    color: "text-leaf",
  },
];

export function RestaurantDetailSection() {
  return (
    <section className="flex items-center bg-dot-grid py-20 lg:min-h-screen lg:py-32">
      <div className="container max-w-xl">
        <SplitText
          as="h2"
          ssrVisible
          className="font-display text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl"
        >
          Tout vérifier avant de te déplacer
        </SplitText>

        <AnimateIn variant="fadeUp" delay={0.2}>
          <p className="mt-6 max-w-lg text-lg leading-relaxed text-pretty text-muted-foreground">
            Certification, horaires, avis — toute la fiche du commerce{" "}
            <span className="font-semibold text-foreground">avant même de sortir de chez toi</span>.
          </p>
        </AnimateIn>

        <Stagger className="mt-10 space-y-3">
          {details.map((detail) => (
            <StaggerItem key={detail.title}>
              <div className="group rounded-2xl bg-card p-5 shadow-sm transition-all duration-300 hover:shadow-md hover:-translate-y-0.5">
                <div className="flex items-start gap-4">
                  <detail.icon
                    className={`size-5 shrink-0 mt-0.5 ${detail.color}`}
                    weight="duotone"
                  />
                  <div>
                    <p className="font-semibold text-foreground">
                      {detail.title}
                    </p>
                    <p className="mt-1 text-sm text-muted-foreground leading-relaxed">
                      {detail.description}
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
