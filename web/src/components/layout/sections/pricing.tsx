"use client";

import { Check, X, Crown } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { SplitText } from "@/components/animations/split-text";
import { AnimateIn, Stagger, StaggerItem } from "@/components/animations/animate-in";

/* ═══════════════════════════════════════════════
   DATA
   ═══════════════════════════════════════════════ */

interface Feature {
  label: string;
  included: boolean;
}

const freeFeatures: Feature[] = [
  { label: "Scan illimité", included: true },
  { label: "Verdict halal de base", included: true },
  { label: "Carte des magasins", included: true },
  { label: "1 école juridique", included: true },
  { label: "NaqiyScore™ détaillé", included: false },
  { label: "Analyse des ingrédients", included: false },
  { label: "Historique complet", included: false },
];

const plusFeatures: Feature[] = [
  { label: "Scan illimité", included: true },
  { label: "Verdict halal personnalisé", included: true },
  { label: "Carte des magasins", included: true },
  { label: "5 écoles juridiques", included: true },
  { label: "NaqiyScore™ détaillé", included: true },
  { label: "Analyse complète des ingrédients", included: true },
  { label: "Historique illimité", included: true },
];

/* ═══════════════════════════════════════════════
   COMPONENT
   ═══════════════════════════════════════════════ */

function FeatureRow({ feature }: { feature: Feature }) {
  if (feature.included) {
    return (
      <li className="flex items-center gap-3 text-sm text-foreground">
        <div className="flex size-5 shrink-0 items-center justify-center rounded-full bg-leaf/10">
          <Check className="size-3 text-leaf" weight="bold" />
        </div>
        {feature.label}
      </li>
    );
  }

  return (
    <li className="flex items-center gap-3 text-sm text-muted-foreground/50 line-through">
      <div className="flex size-5 shrink-0 items-center justify-center rounded-full bg-muted/50">
        <X className="size-3 text-muted-foreground/40" weight="bold" />
      </div>
      {feature.label}
    </li>
  );
}

export { PricingSection as Pricing };

export function PricingSection() {
  return (
    <section id="pricing" className="relative flex items-center bg-secondary/30 py-20 lg:min-h-screen lg:py-32 overflow-hidden">
      <div className="mx-auto max-w-5xl px-6">
        <SplitText
          as="h2"
          className="font-display text-3xl font-bold tracking-tight text-center sm:text-4xl md:text-5xl"
        >
          Simple et transparent
        </SplitText>

        <AnimateIn className="text-center">
          <p className="text-lg text-muted-foreground mt-4">
            Tout est gratuit. Naqiy+ pour les passionnés.
          </p>
        </AnimateIn>

        <Stagger className="mt-12 grid md:grid-cols-2 gap-6 max-w-3xl mx-auto">
          {/* ─── Free card ─── */}
          <StaggerItem>
            <div className="rounded-2xl border border-border bg-card p-8 h-full flex flex-col transition-all duration-300 hover:border-border/80 hover:-translate-y-0.5">
              <p className="text-2xl font-bold text-foreground">Free</p>
              <div className="mt-2">
                <span className="text-4xl font-black text-foreground">0&euro;</span>
                <span className="text-sm text-muted-foreground ml-1">/mois</span>
              </div>

              <ul className="mt-6 space-y-3 flex-1">
                {freeFeatures.map((f) => (
                  <FeatureRow key={f.label} feature={f} />
                ))}
              </ul>

              <Button variant="outline" className="mt-8 w-full">
                Commencer gratuitement
              </Button>
            </div>
          </StaggerItem>

          {/* ─── Naqiy+ card ─── */}
          <StaggerItem>
            <div className="rounded-2xl border-2 border-gold/30 bg-card p-8 relative overflow-hidden h-full flex flex-col transition-all duration-300 hover:border-gold/50 hover:-translate-y-0.5 hover:shadow-[0_0_40px_oklch(0.78_0.17_82_/_8%)]">
              {/* Recommended badge */}
              <Badge className="absolute top-4 right-4 gap-1 bg-gold text-black border-0 font-bold">
                <Crown className="size-3" weight="fill" />
                Recommandé
              </Badge>

              <p className="text-2xl font-bold text-gold">Naqiy+</p>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-4xl font-black text-foreground">4,99&euro;</span>
                <span className="text-sm text-muted-foreground">/mois</span>
                <span className="text-xs font-semibold text-gold bg-gold/10 px-2 py-0.5 rounded-full">
                  &minus;40% annuel
                </span>
              </div>

              <ul className="mt-6 space-y-3 flex-1">
                {plusFeatures.map((f) => (
                  <FeatureRow key={f.label} feature={f} />
                ))}
              </ul>

              <Button className="mt-8 w-full gold-glow-intense">
                Passer à Naqiy+
              </Button>
            </div>
          </StaggerItem>
        </Stagger>
      </div>
    </section>
  );
}
