"use client";

import {
  StaggerContainer,
  StaggerItem,
} from "@/components/ui/extras/scroll-reveal";

const stats = [
  { value: "817K+", label: "Produits analysés" },
  { value: "140+", label: "Additifs référencés" },
  { value: "4", label: "Écoles juridiques" },
  { value: "383", label: "Magasins vérifiés" },
];

export function Stats() {
  return (
    <section className="relative z-20 bg-gold-subtle py-16 md:py-20">
      {/* Top divider */}
      <div className="divider-gold" />

      <div className="container py-12 md:py-16">
        <StaggerContainer
          className="grid grid-cols-2 gap-10 md:grid-cols-4 md:gap-16"
          staggerDelay={0.12}
        >
          {stats.map((stat) => (
            <StaggerItem
              key={stat.label}
              className="flex flex-col items-center gap-2 text-center"
            >
              <span className="text-5xl font-black tracking-tight text-gold-gradient sm:text-6xl">
                {stat.value}
              </span>
              <span className="text-sm font-medium text-muted-foreground md:text-base">
                {stat.label}
              </span>
            </StaggerItem>
          ))}
        </StaggerContainer>
      </div>

      {/* Bottom divider */}
      <div className="divider-gold" />
    </section>
  );
}
