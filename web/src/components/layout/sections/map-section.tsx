"use client";

import Image from "next/image";
import { Storefront, MapPin, Star, Check } from "@phosphor-icons/react";
import { AnimateIn, Stagger, StaggerItem } from "@/components/animations/animate-in";
import { SplitText } from "@/components/animations/split-text";

const featureItems = [
  {
    icon: Storefront,
    label: "Boucheries et épiceries certifiées AVS & Achahada",
    color: "text-leaf",
  },
  {
    icon: MapPin,
    label: "Restaurants halal vérifiés près de chez toi",
    color: "text-gold",
  },
  {
    icon: Star,
    label: "Avis clients, horaires, photos — tout en un",
    color: "text-foreground/60",
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
          ssrVisible
          className="font-display text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl"
        >
          Où manger halal en confiance ?
        </SplitText>

        <AnimateIn variant="fadeUp" delay={0.2}>
          <p className="mt-6 max-w-lg text-lg leading-relaxed text-pretty text-muted-foreground">
            T&apos;en as marre de demander &laquo;&thinsp;c&apos;est vraiment halal ici ?&thinsp;&raquo;
            Chaque adresse est vérifiée. Tu y vas{" "}
            <span className="font-semibold text-foreground">l&apos;esprit tranquille</span>.
          </p>
        </AnimateIn>

        <Stagger className="mt-8 space-y-3">
          {featureItems.map((item) => (
            <StaggerItem key={item.label} className="flex items-center gap-3">
              <Check className={`size-4 shrink-0 ${item.color}`} weight="bold" />
              <span className="text-foreground">{item.label}</span>
            </StaggerItem>
          ))}
        </Stagger>

        <AnimateIn delay={0.5} className="mt-10">
          <p className="text-xs font-medium tracking-wider text-muted-foreground/70 uppercase mb-3">
            Top certifieurs France — tous consultables dans l&apos;app
          </p>
          <div className="flex items-center gap-3">
            {certifierLogos.map((logo) => (
              <div
                key={logo.alt}
                className="flex items-center gap-2 rounded-lg bg-card px-3 py-1.5 shadow-sm"
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
