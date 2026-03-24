"use client";

import { Clock, Star, Certificate } from "@phosphor-icons/react";
import { AnimateIn, Stagger, StaggerItem } from "@/components/animations/animate-in";
import { SplitText } from "@/components/animations/split-text";

const details = [
  {
    icon: Clock,
    title: "Horaires en temps réel",
    description: "Ouvert maintenant ? Ferme bientôt ? Tu sais avant de te déplacer.",
    color: "text-sky-500",
    bg: "bg-sky-500/10",
  },
  {
    icon: Star,
    title: "Avis clients vérifiés",
    description:
      "Notes et avis Google intégrés pour choisir en toute confiance.",
    color: "text-amber-500",
    bg: "bg-amber-500/10",
  },
  {
    icon: Certificate,
    title: "Certifieurs évalués par Naqiy",
    description:
      "AVS, Achahada — chaque organisme est noté selon nos critères de fiabilité.",
    color: "text-leaf",
    bg: "bg-leaf/10",
  },
];

export function RestaurantDetailSection() {
  return (
    <section className="flex items-center bg-dot-grid py-20 lg:min-h-screen lg:py-32">
      <div className="container max-w-xl">
        <SplitText
          as="h2"
          className="font-display text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl"
        >
          Tout savoir avant d&apos;y aller
        </SplitText>

        <AnimateIn variant="fadeUp" delay={0.2}>
          <p className="mt-6 max-w-lg text-lg leading-relaxed text-muted-foreground">
            Certifications, horaires, avis — toutes les informations réunies
            pour que tu choisisses en conscience.
          </p>
        </AnimateIn>

        <Stagger className="mt-10 space-y-4">
          {details.map((detail) => (
            <StaggerItem key={detail.title}>
              <div className="group rounded-2xl border border-border bg-card/50 p-5 backdrop-blur-sm transition-all duration-300 hover:border-border/80 hover:bg-card/70 hover:-translate-y-0.5">
                <div className="flex items-start gap-4">
                  <div className={`flex size-10 shrink-0 items-center justify-center rounded-xl ${detail.bg}`}>
                    <detail.icon className={`size-5 ${detail.color}`} weight="duotone" />
                  </div>
                  <div>
                    <p className="font-semibold text-foreground">
                      {detail.title}
                    </p>
                    <p className="mt-1 text-sm text-muted-foreground">
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
