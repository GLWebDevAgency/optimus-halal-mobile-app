"use client";

import Image from "next/image";
import { Storefront, MapPin, Star, Check } from "@phosphor-icons/react";
import { AnimateIn, Stagger, StaggerItem } from "@/components/animations/animate-in";
import { SplitText } from "@/components/animations/split-text";
import { Badge } from "@/components/ui/badge";

const featureItems = [
  {
    icon: Storefront,
    label: "Revendeurs référencés par AVS & Achahada",
    color: "text-leaf",
    bg: "bg-leaf/10",
  },
  {
    icon: MapPin,
    label: "Restaurants et boucheries halal vérifiés",
    color: "text-gold",
    bg: "bg-gold/10",
  },
  {
    icon: Star,
    label: "Avis Google et horaires en temps réel",
    color: "text-amber-500",
    bg: "bg-amber-500/10",
  },
];

const certifierLogos = [
  { src: "/images/certifications/avs.webp", alt: "AVS" },
  { src: "/images/certifications/achahada.webp", alt: "Achahada" },
];

export function MapSection() {
  return (
    <section className="flex items-center bg-dot-grid py-20 lg:min-h-screen lg:py-32">
      <div className="container max-w-xl">
        <SplitText
          as="h2"
          className="font-display text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl"
        >
          Trouve des magasins certifiés
        </SplitText>

        <AnimateIn variant="fadeUp" delay={0.2}>
          <p className="mt-6 max-w-lg text-lg leading-relaxed text-muted-foreground">
            Des adresses de confiance, vérifiées et certifiées. Pour que chaque
            sortie reste un moment de sérénité.
          </p>
        </AnimateIn>

        <Stagger className="mt-8 space-y-3">
          {featureItems.map((item) => (
            <StaggerItem key={item.label} className="flex items-center gap-3">
              <div className={`flex size-6 shrink-0 items-center justify-center rounded-full ${item.bg}`}>
                <Check className={`size-3.5 ${item.color}`} weight="bold" />
              </div>
              <span className="text-foreground">{item.label}</span>
            </StaggerItem>
          ))}
        </Stagger>

        <AnimateIn delay={0.5} className="mt-10">
          <p className="text-xs font-medium tracking-wider text-muted-foreground/70 uppercase mb-3">
            Top certifieurs France — tous consultables dans l&apos;app
          </p>
          <div className="flex items-center gap-4">
            {certifierLogos.map((logo) => (
              <div
                key={logo.alt}
                className="flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-1.5 shadow-sm"
              >
                <Image
                  src={logo.src}
                  alt={logo.alt}
                  width={20}
                  height={20}
                  className="size-5 rounded-sm object-contain"
                />
                <span className="text-xs font-medium text-muted-foreground">
                  {logo.alt}
                </span>
              </div>
            ))}
          </div>
        </AnimateIn>
      </div>
    </section>
  );
}
