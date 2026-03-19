"use client";

import { useState } from "react";
import { SectionContainer } from "@/components/layout/section-container";
import { SectionHeader } from "@/components/layout/section-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  ScrollReveal,
  StaggerContainer,
  StaggerItem,
} from "@/components/ui/extras/scroll-reveal";
import { cn } from "@/lib/utils";
import { Check } from "@phosphor-icons/react";

/* ═══════════════════════════════════════════════
   DATA
   ═══════════════════════════════════════════════ */

const plans = [
  {
    name: "Naqiy",
    label: "Gratuit",
    monthlyPrice: 0,
    annualPrice: 0,
    description: "L'essentiel pour scanner en confiance.",
    features: [
      "5 scans / jour",
      "Verdict de base",
      "Carte des magasins",
      "Score Naqiy",
    ],
    cta: "Commencer gratuitement",
    variant: "outline" as const,
    popular: false,
  },
  {
    name: "Naqiy+",
    label: "Naqiy+",
    monthlyPrice: 4.99,
    annualPrice: 49.99,
    annualSaving: "2 mois offerts",
    description: "L'expérience halal sans compromis.",
    features: [
      "Scans illimités",
      "Verdict personnalisé par madhab",
      "Alertes temps réel",
      "Détail ingrédients & additifs",
      "Zéro publicité",
      "Support prioritaire",
    ],
    cta: "Essayer Naqiy+",
    variant: "default" as const,
    popular: true,
  },
] as const;

/* ═══════════════════════════════════════════════
   COMPONENT
   ═══════════════════════════════════════════════ */

export function Pricing() {
  const [isAnnual, setIsAnnual] = useState(false);

  return (
    <SectionContainer id="tarifs">
      <ScrollReveal>
        <SectionHeader
          title="Simple et transparent"
          description="Commence gratuitement. Passe à Naqiy+ quand tu veux."
        />
      </ScrollReveal>

      {/* ─── Billing toggle ─── */}
      <ScrollReveal delay={0.1}>
        <div className="mt-10 flex justify-center">
          <div className="inline-flex items-center gap-1 rounded-full border border-border bg-card p-1">
            <button
              type="button"
              onClick={() => setIsAnnual(false)}
              className={cn(
                "relative rounded-full px-5 py-2 text-sm font-medium transition-all",
                !isAnnual
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              Mensuel
            </button>
            <button
              type="button"
              onClick={() => setIsAnnual(true)}
              className={cn(
                "relative flex items-center gap-2 rounded-full px-5 py-2 text-sm font-medium transition-all",
                isAnnual
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              Annuel
              <Badge className="bg-gold/15 text-gold text-[10px] border-gold/30">
                -17%
              </Badge>
            </button>
          </div>
        </div>
      </ScrollReveal>

      {/* ─── Cards ─── */}
      <StaggerContainer
        className="mt-14 mx-auto grid max-w-4xl gap-8 md:grid-cols-2"
        staggerDelay={0.15}
      >
        {plans.map((plan) => {
          const price = isAnnual ? plan.annualPrice : plan.monthlyPrice;
          const period = isAnnual ? "/an" : "/mois";

          return (
            <StaggerItem key={plan.name}>
              <Card
                className={cn(
                  "relative h-full transition-all duration-300",
                  plan.popular
                    ? "border-gold shadow-lg shadow-gold/10 gold-glow"
                    : "hover:border-gold/20 hover:shadow-md"
                )}
              >
                {/* ─── Popular badge ─── */}
                {plan.popular && (
                  <div className="absolute -top-3 right-6 z-10">
                    <Badge className="bg-primary text-primary-foreground px-3 py-0.5 shadow-md">
                      Populaire
                    </Badge>
                  </div>
                )}

                <CardHeader className="text-center pb-0">
                  <p className="text-lg font-semibold tracking-tight">
                    {plan.label}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {plan.description}
                  </p>

                  {/* Price */}
                  <div className="mt-6 flex items-baseline justify-center gap-1">
                    {price === 0 ? (
                      <span className="text-5xl font-bold tracking-tight">
                        0
                        <span className="text-3xl">€</span>
                      </span>
                    ) : (
                      <span className="text-5xl font-bold tracking-tight">
                        {isAnnual ? "49,99" : "4,99"}
                        <span className="text-3xl">€</span>
                      </span>
                    )}
                    <span className="text-sm text-muted-foreground">
                      {period}
                    </span>
                  </div>

                  {/* Annual saving note */}
                  {plan.popular && isAnnual && plan.annualSaving && (
                    <p className="mt-2 text-xs font-medium text-gold">
                      {plan.annualSaving}
                    </p>
                  )}
                </CardHeader>

                <CardContent className="flex flex-col gap-6 pt-6">
                  {/* Feature list */}
                  <ul className="flex flex-col gap-3">
                    {plan.features.map((feature) => (
                      <li
                        key={feature}
                        className="flex items-start gap-3 text-sm"
                      >
                        <div
                          className={cn(
                            "mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full",
                            plan.popular
                              ? "bg-gold/15 text-gold"
                              : "bg-primary/10 text-primary"
                          )}
                        >
                          <Check className="size-3" weight="bold" />
                        </div>
                        <span className="text-muted-foreground">{feature}</span>
                      </li>
                    ))}
                  </ul>

                  {/* CTA */}
                  <Button
                    variant={plan.variant}
                    size="lg"
                    className={cn(
                      "mt-auto w-full h-11 text-sm font-semibold",
                      plan.popular && "gold-glow-intense"
                    )}
                  >
                    {plan.cta}
                  </Button>
                </CardContent>
              </Card>
            </StaggerItem>
          );
        })}
      </StaggerContainer>
    </SectionContainer>
  );
}
