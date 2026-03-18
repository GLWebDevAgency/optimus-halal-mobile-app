"use client";

import { SectionContainer } from "@/components/layout/section-container";
import { ScrollReveal } from "@/components/ui/extras/scroll-reveal";

type Step = {
  number: string;
  title: string;
  description: string;
};

const steps: Step[] = [
  {
    number: "01",
    title: "Scanne",
    description:
      "Pointe ton appareil vers n\u2019importe quel code-barres. C\u2019est instantané.",
  },
  {
    number: "02",
    title: "Analyse",
    description:
      "Notre IA croise ingrédients, certifications, additifs et sources savantes.",
  },
  {
    number: "03",
    title: "Décide",
    description:
      "Un verdict clair, personnalisé selon ta propre école juridique.",
  },
];

export function HowItWorks() {
  return (
    <SectionContainer id="comment-ca-marche">
      {/* Section header */}
      <ScrollReveal>
        <div className="flex flex-col items-center text-center gap-3">
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold">
            Comment ça marche
          </h2>
          <p className="text-muted-foreground text-lg">
            Trois étapes. Zéro compromis.
          </p>
        </div>
      </ScrollReveal>

      {/* Steps row */}
      <div className="relative mt-20">
        {/* Connecting gold line — desktop only */}
        <div className="absolute top-[3.5rem] left-[16.67%] right-[16.67%] hidden lg:block">
          <div className="h-px divider-gold" />
        </div>

        {/* Step cards */}
        <div className="grid gap-16 sm:gap-12 lg:grid-cols-3 lg:gap-8">
          {steps.map((step, index) => (
            <ScrollReveal key={step.number} delay={index * 0.15}>
              <div className="flex flex-col items-center text-center">
                {/* Step number */}
                <div className="relative">
                  <span className="text-7xl font-black text-gold-gradient leading-none tracking-tighter">
                    {step.number}
                  </span>
                  {/* Gold dot connector — visible on desktop, sits on the line */}
                  <div className="absolute -bottom-[0.625rem] left-1/2 hidden size-3 -translate-x-1/2 rounded-full border-2 border-gold bg-background lg:block" />
                </div>

                {/* Title */}
                <h3 className="mt-6 text-xl font-semibold text-foreground">
                  {step.title}
                </h3>

                {/* Description */}
                <p className="mt-3 max-w-xs text-base leading-relaxed text-muted-foreground">
                  {step.description}
                </p>
              </div>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </SectionContainer>
  );
}
