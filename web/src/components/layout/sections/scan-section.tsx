"use client";

import { Barcode, QrCode, MagnifyingGlass } from "@phosphor-icons/react";
import { Badge } from "@/components/ui/badge";
import { AnimateIn, Stagger, StaggerItem } from "@/components/animations/animate-in";
import { SplitText } from "@/components/animations/split-text";

const scanModes = [
  { label: "Code-barres", icon: Barcode },
  { label: "QR Code", icon: QrCode },
  { label: "Recherche manuelle", icon: MagnifyingGlass },
];

export function ScanSection() {
  return (
    <section id="features" className="relative flex items-center bg-secondary/50 bg-grid-subtle py-20 lg:min-h-screen lg:py-32 overflow-hidden">
      {/* Subtle ambient glow */}
      <div
        className="pointer-events-none absolute top-1/2 -right-40 h-[400px] w-[400px] rounded-full"
        style={{
          background:
            "radial-gradient(circle, oklch(0.76 0.14 88 / 6%) 0%, transparent 70%)",
        }}
        aria-hidden="true"
      />
      <div className="container relative z-10">
        {/* Heading */}
        <SplitText
          as="h2"
          className="font-display text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl"
        >
          Scanne n&apos;importe quel produit
        </SplitText>

        {/* Subtitle */}
        <AnimateIn variant="fadeUp" delay={0.2}>
          <p className="mt-6 max-w-lg text-lg leading-relaxed text-muted-foreground">
            Un doute au supermarché ? Scanne le produit. En quelques secondes,
            tu sais exactement ce qu&apos;il contient et s&apos;il te convient.
          </p>
        </AnimateIn>

        {/* Feature badges with icons */}
        <Stagger className="mt-8 flex flex-wrap gap-3">
          {scanModes.map((mode) => (
            <StaggerItem key={mode.label}>
              <Badge variant="outline" className="gap-1.5 border-border text-foreground/80 px-3 py-1.5">
                <mode.icon className="size-3.5" weight="duotone" />
                {mode.label}
              </Badge>
            </StaggerItem>
          ))}
        </Stagger>
      </div>
    </section>
  );
}
