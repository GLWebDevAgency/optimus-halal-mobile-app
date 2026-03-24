"use client";

import {
  Storefront,
  Bell,
  Rocket,
  ShoppingBag,
  HandHeart,
  Leaf,
} from "@phosphor-icons/react";
import { AnimateIn, Stagger, StaggerItem } from "@/components/animations/animate-in";
import { SplitText } from "@/components/animations/split-text";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const upcomingFeatures = [
  {
    icon: Storefront,
    title: "Marketplace Halal",
    description:
      "Achète directement des produits certifiés halal depuis l'app.",
  },
  {
    icon: ShoppingBag,
    title: "Panier intelligent",
    description:
      "Ajoute des produits vérifiés et commande en quelques taps.",
  },
  {
    icon: HandHeart,
    title: "Programme de fidélité",
    description:
      "Gagne des récompenses à chaque achat via le marketplace.",
  },
  {
    icon: Leaf,
    title: "Labels bio & éthiques",
    description:
      "Filtre par labels bio, vegan, sans gluten — en plus du halal.",
  },
];

export function ComingSoonSection() {
  return (
    <section className="relative flex items-center overflow-hidden bg-gradient-to-b from-background to-secondary/60 py-20 lg:py-32">
      {/* Subtle grid pattern background */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage:
            "linear-gradient(to right, currentColor 1px, transparent 1px), linear-gradient(to bottom, currentColor 1px, transparent 1px)",
          backgroundSize: "60px 60px",
        }}
        aria-hidden="true"
      />

      <div className="mx-auto max-w-5xl px-6 relative z-10">
        {/* Header */}
        <div className="text-center">
          <AnimateIn variant="blur">
            <Badge
              variant="outline"
              className="mb-6 gap-1.5 border-gold/30 bg-gold/5 px-3 py-1 text-gold"
            >
              <Rocket className="size-3" weight="fill" />
              Coming soon
            </Badge>
          </AnimateIn>

          <SplitText
            as="h2"
            className="font-display text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl"
          >
            Le marketplace halal arrive
          </SplitText>

          <AnimateIn variant="fadeUp" delay={0.2}>
            <p className="mt-6 max-w-lg mx-auto text-lg leading-relaxed text-muted-foreground">
              Un espace où chaque produit listé a été vérifié.
              Pour consommer sans compromis.
            </p>
          </AnimateIn>
        </div>

        {/* Feature grid */}
        <Stagger className="mt-14 grid sm:grid-cols-2 gap-5 max-w-3xl mx-auto">
          {upcomingFeatures.map((feature) => (
            <StaggerItem key={feature.title}>
              <div className="group relative rounded-2xl border border-border/60 bg-card/30 p-6 backdrop-blur-sm transition-all duration-300 hover:border-gold/20 hover:bg-card/60">
                <div className="flex items-start gap-4">
                  <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-gold/8 transition-colors group-hover:bg-gold/15">
                    <feature.icon
                      className="size-5 text-gold/70 transition-colors group-hover:text-gold"
                      weight="duotone"
                    />
                  </div>
                  <div>
                    <p className="font-semibold text-foreground">
                      {feature.title}
                    </p>
                    <p className="mt-1 text-sm text-muted-foreground leading-relaxed">
                      {feature.description}
                    </p>
                  </div>
                </div>
              </div>
            </StaggerItem>
          ))}
        </Stagger>

        {/* Newsletter CTA */}
        <AnimateIn variant="fadeUp" delay={0.5}>
          <div className="mt-14 text-center">
            <p className="text-sm text-muted-foreground mb-4">
              Sois le premier informé du lancement.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 max-w-md mx-auto">
              <input
                type="email"
                placeholder="ton@email.com"
                className="w-full sm:flex-1 h-12 rounded-xl border border-border bg-card/50 px-4 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-gold/30 focus:border-gold/40 transition-all"
              />
              <Button className="h-12 px-6 gold-glow-intense shrink-0 w-full sm:w-auto gap-2">
                <Bell className="size-4" weight="fill" />
                Me prévenir
              </Button>
            </div>
          </div>
        </AnimateIn>
      </div>
    </section>
  );
}
