"use client";

import { SectionContainer } from "@/components/layout/section-container";
import {
  StaggerContainer,
  StaggerItem,
} from "@/components/ui/extras/scroll-reveal";
import {
  Barcode,
  Scales,
  ShieldCheck,
  MapPin,
  Bell,
  Sparkle,
} from "@phosphor-icons/react";
import type { IconProps } from "@phosphor-icons/react";

type FeatureCard = {
  icon: React.ComponentType<IconProps>;
  title: string;
  description: string;
};

const features: FeatureCard[] = [
  {
    icon: Barcode,
    title: "Scan intelligent",
    description:
      "Scanner un code-barres suffit. Notre IA analyse les ingrédients, additifs et certifications en temps réel.",
  },
  {
    icon: Scales,
    title: "Verdict personnalisé",
    description:
      "Chaque verdict est adapté à ton école juridique : Hanafi, Maliki, Shafi\u2019i ou Hanbali.",
  },
  {
    icon: ShieldCheck,
    title: "Certifieurs vérifiés",
    description:
      "12 organismes de certification référencés. Chaque source est traçable et transparente.",
  },
  {
    icon: MapPin,
    title: "Magasins halal",
    description:
      "383 magasins vérifiés avec avis Google, horaires et certification. Trouve le plus proche.",
  },
  {
    icon: Bell,
    title: "Alertes en temps réel",
    description:
      "Rappels produits, changements de formule, nouveaux boycotts. Sois le premier informé.",
  },
  {
    icon: Sparkle,
    title: "Score Naqiy",
    description:
      "Un score de confiance de 1 à 5, calculé sur les certifications, ingrédients et sources savantes.",
  },
];

export function Features() {
  return (
    <SectionContainer id="fonctionnalites">
      {/* Section header */}
      <div className="flex flex-col items-center text-center gap-4">
        <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold max-w-3xl">
          Tout ce qu&apos;il faut pour manger halal{" "}
          <span className="text-gold-gradient">en confiance</span>
        </h2>
      </div>

      {/* Feature grid */}
      <StaggerContainer
        className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-3"
        staggerDelay={0.08}
      >
        {features.map((feature) => {
          const Icon = feature.icon;
          return (
            <StaggerItem key={feature.title}>
              <div className="group relative h-full rounded-2xl border border-border bg-card p-6 transition-all duration-500 hover:border-gold/40 hover:gold-glow">
                {/* Subtle gold gradient on hover — top-right corner */}
                <div className="pointer-events-none absolute inset-0 rounded-2xl bg-gradient-to-br from-gold/0 via-gold/0 to-gold/0 transition-all duration-500 group-hover:from-gold/[0.03] group-hover:via-transparent group-hover:to-gold/[0.06]" />

                {/* Icon container */}
                <div className="relative mb-4 flex size-12 items-center justify-center rounded-xl bg-primary/10 transition-colors duration-300 group-hover:bg-primary/15">
                  <Icon className="size-5 text-primary transition-transform duration-300 group-hover:scale-110" />
                </div>

                {/* Content */}
                <div className="relative">
                  <h3 className="text-lg font-semibold text-foreground">
                    {feature.title}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                    {feature.description}
                  </p>
                </div>
              </div>
            </StaggerItem>
          );
        })}
      </StaggerContainer>
    </SectionContainer>
  );
}
