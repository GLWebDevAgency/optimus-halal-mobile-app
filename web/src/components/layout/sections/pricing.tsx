"use client";

import { useRef, useEffect } from "react";
import {
  Check,
  Crown,
  Leaf,
  ShieldCheck,
} from "@phosphor-icons/react";
import { useInView } from "motion/react";
import { Badge } from "@/components/ui/badge";
import { SplitText } from "@/components/animations/split-text";
import { AnimateIn, Stagger, StaggerItem } from "@/components/animations/animate-in";
import { TiltCard } from "@/components/animations/tilt-card";
import { CursorGlow } from "@/components/animations/cursor-glow";
import { useTrack } from "@/lib/posthog";
import { EVENTS } from "@/lib/analytics-events";

/* ═══════════════════════════════════════════════
   DATA
   ═══════════════════════════════════════════════ */

const freeFeatures = [
  "Scan & verdict halal",
  "15 scans par jour",
  "NaqiyScore\u2122 confiance certifieur",
  "Verdict madhab (consensus des 4 écoles)",
  "Boucheries & restaurants certifiés de confiance",
  "10 favoris et 10 derniers scans",
];

const plusFeatures = [
  "Tout le gratuit, sans aucune limite :",
  "Scans illimités",
  "Historique complet & favoris synchronisés (cloud)",
  "Ton madhab, ton verdict personnalisé",
  "Alertes allergènes sur mesure pour ta famille",
  "Profil santé — enfants, grossesse (d\u2019autres à venir)",
  "Alertes boycott",
  "Un profil, tous tes appareils synchronisés",
];

/* ═══════════════════════════════════════════════
   COMPONENT
   ═══════════════════════════════════════════════ */

export { PricingSection as Pricing };

export function PricingSection() {
  const track = useTrack();
  const sectionRef = useRef<HTMLElement>(null);
  const isInView = useInView(sectionRef, { once: true });

  useEffect(() => {
    if (isInView) {
      track(EVENTS.PRICING_VIEWED);
    }
  }, [isInView, track]);

  return (
    <section
      ref={sectionRef}
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
            Pas de pub. Pas de revente de données. Projet 100% indépendant.{" "}
            <span className="font-semibold text-foreground">
              Naqiy+ finance le projet — et te donne le contrôle total.
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
                <p className="mt-1 text-xs text-gold font-medium">
                  + 7 jours de Naqiy+ offerts à l&apos;installation
                </p>
                <p className="mt-3 text-sm text-muted-foreground leading-relaxed">
                  Tu télécharges, tu scannes.{" "}
                  <span className="font-medium text-foreground">
                    Pas de compte, pas de carte bancaire.
                  </span>
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
                <p className="mt-3 text-sm text-muted-foreground leading-relaxed">
                  Tu sais ce que ta famille mange.{" "}
                  <span className="font-medium text-foreground">
                    Allergènes, profil santé, madhab — tout est personnalisé.
                  </span>{" "}
                  Et tu nous aides à rester indépendants.
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
              </div>
            </TiltCard>
          </StaggerItem>
        </Stagger>

      </CursorGlow>
    </section>
  );
}
