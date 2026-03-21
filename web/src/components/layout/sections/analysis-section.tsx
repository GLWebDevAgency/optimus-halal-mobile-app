"use client";

import { AnimateIn, Stagger, StaggerItem } from "@/components/animations/animate-in";
import { SplitText } from "@/components/animations/split-text";

const features = [
  {
    icon: "🧪",
    title: "Analyse des ingrédients",
    description:
      "Chaque composant est identifié et vérifié individuellement contre notre base de données.",
  },
  {
    icon: "⚖️",
    title: "Verdict personnalisé",
    description:
      "Le résultat s'adapte à ton école juridique : Hanafi, Shafi'i, Maliki ou Hanbali.",
  },
  {
    icon: "🏆",
    title: "Score Naqiy",
    description:
      "Un score de 0 à 100 pour une compréhension instantanée du niveau de conformité.",
  },
];

export function AnalysisSection() {
  return (
    <section className="py-32">
      <div className="container max-w-xl">
        <SplitText
          as="h2"
          className="font-display text-4xl font-bold tracking-tight text-white md:text-5xl"
        >
          Intelligence artificielle au service du halal
        </SplitText>

        <AnimateIn variant="fadeUp" delay={0.2}>
          <p className="mt-6 max-w-lg text-lg leading-relaxed text-white/60">
            Notre IA analyse chaque ingrédient, croise les données avec les certifications
            officielles et adapte le verdict à ton école juridique.
          </p>
        </AnimateIn>

        <Stagger className="mt-10 space-y-4">
          {features.map((feature) => (
            <StaggerItem key={feature.title}>
              <div className="rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur-sm">
                <div className="flex items-start gap-4">
                  <span className="text-2xl leading-none">{feature.icon}</span>
                  <div>
                    <p className="font-semibold text-white">{feature.title}</p>
                    <p className="mt-1 text-sm text-white/50">{feature.description}</p>
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
