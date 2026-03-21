"use client";

import Image from "next/image";
import { AnimateIn, Stagger, StaggerItem } from "@/components/animations/animate-in";
import { SplitText } from "@/components/animations/split-text";

const featureItems = [
  "Magasins certifiés AVS & Achahada",
  "Restaurants halal vérifiés",
  "Avis Google et horaires en temps réel",
];

const certifierLogos = [
  { src: "/images/certifications/avs.webp", alt: "AVS" },
  { src: "/images/certifications/achahada.webp", alt: "Achahada" },
  { src: "/images/certifications/halal_correct.webp", alt: "Halal" },
];

export function MapSection() {
  return (
    <section className="py-32">
      <div className="container max-w-xl">
        <SplitText
          as="h2"
          className="font-display text-4xl font-bold tracking-tight text-foreground md:text-5xl"
        >
          Trouve des magasins certifiés
        </SplitText>

        <AnimateIn variant="fadeUp" delay={0.2}>
          <p className="mt-6 max-w-lg text-lg leading-relaxed text-muted-foreground">
            383 magasins et restaurants vérifiés avec horaires, avis Google et certifications
            officielles.
          </p>
        </AnimateIn>

        <Stagger className="mt-8 space-y-3">
          {featureItems.map((item) => (
            <StaggerItem key={item} className="flex items-center gap-3">
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-green-500 text-white">
                <svg
                  width="10"
                  height="8"
                  viewBox="0 0 10 8"
                  fill="none"
                  aria-hidden="true"
                >
                  <path
                    d="M1 4L3.5 6.5L9 1"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </span>
              <span className="text-foreground">{item}</span>
            </StaggerItem>
          ))}
        </Stagger>

        <AnimateIn delay={0.5} className="mt-10 flex items-center gap-6">
          {certifierLogos.map((logo) => (
            <Image
              key={logo.alt}
              src={logo.src}
              alt={logo.alt}
              width={40}
              height={40}
              className="opacity-60 grayscale transition-all duration-500 hover:opacity-100 hover:grayscale-0"
            />
          ))}
        </AnimateIn>
      </div>
    </section>
  );
}
