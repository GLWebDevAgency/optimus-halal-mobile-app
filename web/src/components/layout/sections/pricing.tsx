"use client";

import {
  Check,
  Crown,
  Leaf,
  ShieldCheck,
} from "@phosphor-icons/react";
import { Badge } from "@/components/ui/badge";
import { SplitText } from "@/components/animations/split-text";
import { AnimateIn, Stagger, StaggerItem } from "@/components/animations/animate-in";
import { TiltCard } from "@/components/animations/tilt-card";
import { CursorGlow } from "@/components/animations/cursor-glow";

/* ═══════════════════════════════════════════════
   DATA
   ═══════════════════════════════════════════════ */

const freeFeatures = [
  "Scan & verdict halal — toujours gratuit",
  "Analyse IA complète de chaque produit",
  "NaqiyScore\u2122 santé & confiance certifieur",
  "Carte des magasins certifiés",
  "Historique 7 jours",
];

const plusFeatures = [
  "Tout le gratuit, plus :",
  "Création de profil & synchronisation",
  "Alertes allergènes automatiques — gluten, lactose, arachides",
  "Profil santé adapté — diabète, grossesse, cholestérol",
  "Ton madhab, ton verdict — Hanafi, Shafi\u2019i, Maliki, Hanbali",
  "Historique illimité & favoris cloud",
  "Tes 100 produits favoris même sans réseau",
];

/* ═══════════════════════════════════════════════
   COMPONENT
   ═══════════════════════════════════════════════ */

export { PricingSection as Pricing };

export function PricingSection() {
  return (
    <section
      id="pricing"
      className="relative flex items-center bg-secondary/30 py-16 lg:min-h-svh lg:py-24 overflow-hidden"
    >
      <CursorGlow className="mx-auto max-w-5xl px-6">
        {/* ── Headline ── */}
        <SplitText
          as="h2"
          ssrVisible
          className="font-display text-3xl font-bold tracking-tight text-center sm:text-4xl md:text-5xl"
        >
          Gratuit. Pour de vrai.
        </SplitText>

        <AnimateIn className="text-center">
          <p className="text-sm text-pretty text-muted-foreground mt-3 max-w-lg mx-auto md:text-base">
            Projet indépendant — aucune pub, aucune revente de données.{" "}
            <span className="font-semibold text-foreground">
              Le scan est gratuit. La protection totale, c&apos;est Naqiy+.
            </span>
          </p>
        </AnimateIn>

        {/* ── Cards ── */}
        <Stagger className="mt-8 grid md:grid-cols-2 gap-5 max-w-3xl mx-auto">
          {/* ─── Free card ─── */}
          <StaggerItem>
            <TiltCard className="h-full">
              <div className="rounded-2xl bg-card p-6 h-full flex flex-col shadow-sm transition-all duration-300 hover:shadow-md hover:-translate-y-0.5">
                <div className="flex items-center gap-2">
                  <Leaf className="size-5 text-leaf" weight="fill" />
                  <p className="text-2xl font-bold text-foreground">Gratuit</p>
                </div>
                <div className="mt-3">
                  <span className="text-4xl font-black text-foreground">
                    0&euro;
                  </span>
                  <span className="text-sm text-muted-foreground ml-1">
                    pour toujours
                  </span>
                </div>
                <p className="mt-3 text-sm text-muted-foreground leading-relaxed">
                  Le verdict halal est toujours là, sans mur payant.
                  L&apos;essentiel reste accessible à tous.
                </p>

                <ul className="mt-4 space-y-2.5 flex-1">
                  {freeFeatures.map((label) => (
                    <li
                      key={label}
                      className="flex items-center gap-3 text-sm text-foreground"
                    >
                      <div className="flex size-5 shrink-0 items-center justify-center rounded-full bg-leaf/10">
                        <Check className="size-3 text-leaf" weight="bold" />
                      </div>
                      {label}
                    </li>
                  ))}
                </ul>
              </div>
            </TiltCard>
          </StaggerItem>

          {/* ─── Naqiy+ card ─── */}
          <StaggerItem>
            <TiltCard className="h-full">
              <div className="rounded-2xl bg-card p-6 relative overflow-hidden h-full flex flex-col shadow-md ring-1 ring-gold/20 transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5">
                {/* Protection badge */}
                <Badge className="absolute top-4 right-4 gap-1 bg-gold text-black border-0 font-bold">
                  <ShieldCheck className="size-3" weight="fill" />
                  Protection complète
                </Badge>

                <div className="flex items-center gap-2">
                  <Crown className="size-5 text-gold" weight="fill" />
                  <p className="text-2xl font-bold text-gold">Naqiy+</p>
                </div>
                <div className="mt-3 flex items-baseline gap-2">
                  <span className="text-4xl font-black text-foreground">
                    2,99&euro;
                  </span>
                  <span className="text-sm text-muted-foreground">/mois</span>
                </div>
                <p className="mt-1 text-xs text-leaf font-medium">Essai 7 jours offert</p>
                <p className="mt-3 text-sm text-muted-foreground leading-relaxed">
                  Profil personnalisé, favoris cloud, historique illimité{" "}
                  <span className="font-medium text-foreground">
                    — le contrôle total sur ce que mange ta famille.
                  </span>
                </p>

                <ul className="mt-4 space-y-2.5 flex-1">
                  {plusFeatures.map((label, i) => (
                    <li
                      key={label}
                      className={`flex items-center gap-3 text-sm ${
                        i === 0
                          ? "text-muted-foreground font-medium"
                          : "text-foreground"
                      }`}
                    >
                      {i === 0 ? (
                        <ShieldCheck
                          className="size-5 shrink-0 text-gold"
                          weight="fill"
                        />
                      ) : (
                        <div className="flex size-5 shrink-0 items-center justify-center rounded-full bg-gold/10">
                          <Check className="size-3 text-gold" weight="bold" />
                        </div>
                      )}
                      {label}
                    </li>
                  ))}
                </ul>
                <p className="mt-4 pt-3 border-t border-border/50 text-xs text-center text-muted-foreground">
                  Pour le prix d&apos;un café par mois
                </p>
              </div>
            </TiltCard>
          </StaggerItem>
        </Stagger>

      </CursorGlow>
    </section>
  );
}
