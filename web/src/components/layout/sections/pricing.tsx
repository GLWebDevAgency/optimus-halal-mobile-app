"use client";

import { Button } from "@/components/ui/button";
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
  { label: "Score Naqiy détaillé", included: false },
  { label: "Analyse des ingrédients", included: false },
  { label: "Historique complet", included: false },
];

const plusFeatures: Feature[] = [
  { label: "Scan illimité", included: true },
  { label: "Verdict halal personnalisé", included: true },
  { label: "Carte des magasins", included: true },
  { label: "5 écoles juridiques", included: true },
  { label: "Score Naqiy détaillé", included: true },
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
        <span className="text-emerald-500">&#10003;</span>
        {feature.label}
      </li>
    );
  }

  return (
    <li className="flex items-center gap-3 text-sm text-muted-foreground line-through">
      <span>&#10007;</span>
      {feature.label}
    </li>
  );
}

export { PricingSection as Pricing };

export function PricingSection() {
  return (
    <section id="tarifs" className="py-32">
      <div className="mx-auto max-w-5xl px-6">
        <SplitText
          as="h2"
          className="font-display text-4xl md:text-5xl font-bold tracking-tight text-foreground text-center"
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
            <div className="rounded-2xl border border-border bg-card p-8 h-full flex flex-col">
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
            <div className="rounded-2xl border-2 border-gold/30 bg-card p-8 relative overflow-hidden h-full flex flex-col">
              <span className="absolute top-0 right-0 bg-gold text-black text-xs font-bold px-3 py-1 rounded-bl-xl">
                Recommandé
              </span>

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
