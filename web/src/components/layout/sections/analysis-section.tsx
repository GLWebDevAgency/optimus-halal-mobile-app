"use client";

import { Flask, Scales, Trophy, Heartbeat } from "@phosphor-icons/react";
import { AnimateIn, Stagger, StaggerItem } from "@/components/animations/animate-in";
import { TiltCard } from "@/components/animations/tilt-card";
import { SplitText } from "@/components/animations/split-text";

const features = [
  {
    icon: Flask,
    title: "Analyse des ingrédients",
    description:
      "Chaque composant est identifié et vérifié individuellement contre notre base de données.",
    accent: "gold" as const,
  },
  {
    icon: Scales,
    title: "Verdict personnalisé",
    description:
      "Le résultat s'adapte à ton école juridique : Hanafi, Shafi'i, Maliki ou Hanbali.",
    accent: "gold" as const,
  },
  {
    icon: Heartbeat,
    title: "Santé & Nutrition",
    description:
      "NutriScore, indice NOVA, additifs — parce que le tayyib, c'est aussi prendre soin de son corps.",
    accent: "leaf" as const,
  },
  {
    icon: Trophy,
    title: "NaqiyScore™",
    description:
      "Un score de 0 à 100 pour une compréhension instantanée du niveau de conformité.",
    accent: "gold" as const,
  },
];

export function AnalysisSection() {
  return (
    <section className="flex items-center bg-gradient-to-b from-background to-secondary/30 py-20 lg:min-h-screen lg:py-32">
      <div className="container max-w-xl">
        <SplitText
          as="h2"
          className="font-display text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl"
        >
          Halal & Tayyib — l&apos;analyse complète
        </SplitText>

        <AnimateIn variant="fadeUp" delay={0.2}>
          <p className="mt-6 max-w-lg text-lg leading-relaxed text-muted-foreground">
            <span className="text-base text-leaf/80" dir="rtl">
              «&thinsp;كُلُوا مِمَّا فِي الْأَرْضِ حَلَالًا طَيِّبًا&thinsp;»
            </span>
            <br />
            <span className="text-sm italic text-muted-foreground/70">
              Mangez de ce qui est sur terre, licite et pur — Al-Baqara, 2:168
            </span>
          </p>
          <p className="mt-3 max-w-lg text-lg leading-relaxed text-muted-foreground">
            Naqiy ne se limite pas au halal.
            On vérifie aussi la qualité nutritionnelle — parce que{" "}
            <span className="font-semibold text-foreground">
              ce qui est pur (tayyib) mérite autant d&apos;attention
            </span>.
          </p>
        </AnimateIn>

        <Stagger className="mt-10 space-y-4">
          {features.map((feature) => {
            const isLeaf = feature.accent === "leaf";
            return (
              <StaggerItem key={feature.title}>
                <TiltCard>
                  <div className={`group rounded-2xl border border-border bg-card/50 p-5 backdrop-blur-sm transition-all duration-300 hover:-translate-y-0.5 ${isLeaf ? "hover:border-leaf/20 hover:bg-card/70" : "hover:border-gold/20 hover:bg-card/70"}`}>
                    <div className="flex items-start gap-4">
                      <div className={`flex size-10 shrink-0 items-center justify-center rounded-xl ${isLeaf ? "bg-leaf/10" : "bg-gold/10"}`}>
                        <feature.icon className={`size-5 ${isLeaf ? "text-leaf" : "text-gold"}`} weight="duotone" />
                      </div>
                      <div>
                        <p className="font-semibold text-foreground">{feature.title}</p>
                        <p className="mt-1 text-sm text-muted-foreground">{feature.description}</p>
                      </div>
                    </div>
                  </div>
                </TiltCard>
              </StaggerItem>
            );
          })}
        </Stagger>
      </div>
    </section>
  );
}
