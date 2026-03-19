"use client";

import { SectionContainer } from "@/components/layout/section-container";
import { ScrollReveal } from "@/components/ui/extras/scroll-reveal";
import Image from "next/image";

type Certifier = {
  slug: string;
  name: string;
};

const certifiers: Certifier[] = [
  { slug: "avs", name: "AVS" },
  { slug: "achahada", name: "Achahada" },
  { slug: "halal_correct", name: "Halal Correct" },
  { slug: "acmif", name: "ACMIF" },
  { slug: "altakwa", name: "Al Takwa" },
  { slug: "afcai", name: "AFCAI" },
  { slug: "argml", name: "ARGML" },
  { slug: "eht", name: "EHT" },
  { slug: "hmc", name: "HMC" },
  { slug: "ica", name: "ICA" },
  { slug: "mci", name: "MCI" },
  { slug: "sfcvh", name: "SFCVH" },
];

function CertifierLogo({ certifier }: { certifier: Certifier }) {
  return (
    <div className="group/logo flex shrink-0 items-center justify-center px-8">
      <Image
        src={`/images/certifications/${certifier.slug}.webp`}
        alt={`Logo ${certifier.name}`}
        width={60}
        height={60}
        className="size-[60px] object-contain grayscale opacity-50 transition-all duration-500 group-hover/logo:grayscale-0 group-hover/logo:opacity-100"
      />
    </div>
  );
}

export function Certifiers() {
  return (
    <SectionContainer id="certifieurs" className="overflow-hidden">
      {/* Section header */}
      <ScrollReveal>
        <div className="flex flex-col items-center text-center gap-4">
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold max-w-2xl">
            Reconnu par les organismes de référence
          </h2>
        </div>
      </ScrollReveal>

      {/* Infinite marquee */}
      <div className="relative mt-16">
        {/* Left fade */}
        <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-24 bg-gradient-to-r from-background to-transparent" />
        {/* Right fade */}
        <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-24 bg-gradient-to-l from-background to-transparent" />

        {/* Marquee track */}
        <div
          className="flex w-max items-center"
          style={{ animation: "marquee 40s linear infinite" }}
        >
          {/* First set */}
          {certifiers.map((c) => (
            <CertifierLogo key={`a-${c.slug}`} certifier={c} />
          ))}
          {/* Duplicate set for seamless loop */}
          {certifiers.map((c) => (
            <CertifierLogo key={`b-${c.slug}`} certifier={c} />
          ))}
        </div>
      </div>

      {/* Bottom text */}
      <ScrollReveal delay={0.2}>
        <p className="mt-12 text-center text-sm text-muted-foreground">
          12 organismes de certification vérifiés et traçables
        </p>
      </ScrollReveal>
    </SectionContainer>
  );
}
