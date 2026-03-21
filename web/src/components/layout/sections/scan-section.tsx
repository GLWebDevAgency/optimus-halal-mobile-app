"use client";

import { Badge } from "@/components/ui/badge";
import { AnimateIn, Stagger, StaggerItem } from "@/components/animations/animate-in";
import { SplitText } from "@/components/animations/split-text";

export function ScanSection() {
  return (
    <section className="bg-[#0a0a0a] py-32">
      <div className="container">
        {/* Heading */}
        <SplitText
          as="h2"
          className="font-display text-4xl font-bold tracking-tight text-white md:text-5xl"
        >
          Scanne n&apos;importe quel produit
        </SplitText>

        {/* Subtitle */}
        <AnimateIn variant="fadeUp" delay={0.2}>
          <p className="mt-6 max-w-lg text-lg leading-relaxed text-white/60">
            Plus de 817 000 produits en base de données, analysés en temps réel.
            Scanne le code-barres et obtiens un verdict en moins de 3 secondes.
          </p>
        </AnimateIn>

        {/* Feature badges */}
        <Stagger className="mt-8 flex flex-wrap gap-3">
          <StaggerItem>
            <Badge variant="outline" className="border-white/20 text-white/80">
              Code-barres
            </Badge>
          </StaggerItem>
          <StaggerItem>
            <Badge variant="outline" className="border-white/20 text-white/80">
              QR Code
            </Badge>
          </StaggerItem>
          <StaggerItem>
            <Badge variant="outline" className="border-white/20 text-white/80">
              Recherche manuelle
            </Badge>
          </StaggerItem>
        </Stagger>
      </div>
    </section>
  );
}
