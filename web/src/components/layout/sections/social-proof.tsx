"use client";

import {
  Scales,
  Warning,
  Heartbeat,
  Bell,
  ShieldCheck,
  ArrowDown,
  MapPin,
} from "@phosphor-icons/react";
import { SplitText } from "@/components/animations/split-text";
import { AnimateIn, Stagger, StaggerItem } from "@/components/animations/animate-in";
import { AnimatedCounter } from "@/components/animations/animated-counter";
import { Badge } from "@/components/ui/badge";

const personalizationFeatures = [
  {
    icon: Scales,
    title: "Ton madhab, ton verdict",
    description:
      "Hanafi, Shafi'i, Maliki, Hanbali — chaque analyse respecte ta pratique. Pas un avis unique pour tout le monde.",
    accent: "gold" as const,
  },
  {
    icon: Warning,
    title: "Tes allergènes, signalés automatiquement",
    description:
      "Gluten, lactose, arachides, fruits à coque… Configure une fois, Naqiy t'alerte à chaque scan.",
    accent: "gold" as const,
  },
  {
    icon: Heartbeat,
    title: "Ton profil santé, intégré",
    description:
      "Enfants, grossesse — Naqiy filtre ce qui compte pour toi et ta famille. Et bientôt, d'autres profils personnalisés (vegan, éthique…).",
    accent: "leaf" as const,
  },
  {
    icon: Bell,
    title: "Alertes en temps réel",
    description:
      "Rappels produits, changement de composition, nouvelles certifications — tu es averti avant tout le monde.",
    accent: "gold" as const,
  },
];

export function SocialProofSection() {
  return (
    <section className="relative flex items-center overflow-hidden bg-secondary/50 py-16 lg:min-h-svh lg:py-24">
      {/* Subtle background mesh */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 80% 50% at 50% 0%, oklch(0.76 0.14 88 / 3%) 0%, transparent 60%)",
        }}
        aria-hidden="true"
      />

      <div className="container max-w-xl relative z-10">
        {/* ── Headline ── */}
        <SplitText
          as="h2"
          ssrVisible
          className="font-display text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl"
        >
          Indépendant. Transparent. Pour toi.
        </SplitText>

        <AnimateIn variant="fadeUp" delay={0.15}>
          <p className="mt-4 max-w-lg text-base leading-relaxed text-pretty text-muted-foreground md:text-lg">
            Aucune pub, aucune revente de données, aucune marque derrière.
            Naqiy n&apos;est financé par aucun organisme.{" "}
            <span className="font-semibold text-foreground">
              C&apos;est toi qui décides
            </span>{" "}
            — ton école juridique, ta santé, tes valeurs.
          </p>
        </AnimateIn>

        {/* ── Personalization cards ── */}
        <Stagger className="mt-8 space-y-2.5">
          {personalizationFeatures.map((feature) => {
            const isLeaf = feature.accent === "leaf";
            return (
              <StaggerItem key={feature.title}>
                <div className="group rounded-2xl bg-card p-5 shadow-sm transition-all duration-300 hover:shadow-md hover:-translate-y-0.5">
                  <div className="flex items-start gap-4">
                    <feature.icon
                      className={`size-5 shrink-0 mt-0.5 ${isLeaf ? "text-leaf" : "text-gold"}`}
                      weight="duotone"
                    />
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
            );
          })}
        </Stagger>

        {/* ── Data + AI trust bar ── */}
        <AnimateIn variant="fadeUp" delay={0.4}>
          <div className="mt-8 rounded-2xl bg-card p-5 shadow-sm">
            {/* Stats strip */}
            <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 text-sm">
              <span>
                <AnimatedCounter
                  value={817000}
                  suffix="+"
                  className="font-bold text-foreground"
                />{" "}
                <span className="text-muted-foreground">produits</span>
              </span>
              <span className="text-border hidden sm:inline">·</span>
              <span>
                <AnimatedCounter
                  value={383}
                  className="font-bold text-foreground"
                />{" "}
                <span className="text-muted-foreground">magasins</span>
              </span>
              <span className="text-border hidden sm:inline">·</span>
              <span className="font-bold text-leaf">100% gratuit</span>
            </div>

            {/* Badges */}
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <Badge
                variant="outline"
                className="gap-1.5 border-leaf/30 bg-leaf/5 px-2.5 py-0.5 text-leaf text-xs"
              >
                <ShieldCheck className="size-3" weight="fill" />
                Données mises à jour quotidiennement
              </Badge>
              <Badge
                variant="outline"
                className="gap-1.5 border-gold/30 bg-gold/5 px-2.5 py-0.5 text-gold text-xs"
              >
                <ShieldCheck className="size-3" weight="fill" />
                12 certifieurs évalués
              </Badge>
            </div>
          </div>
        </AnimateIn>

        {/* ── Map teaser — open loop ── */}
        <AnimateIn variant="fadeUp" delay={0.5}>
          <div className="mt-10 flex flex-col items-center gap-2 text-center">
            <p className="text-base font-semibold text-foreground">
              Et quand tu sors de chez toi ?
            </p>
            <p className="text-sm text-muted-foreground max-w-sm">
              Naqiy t&apos;accompagne aussi dehors — boucheries, restaurants,
              épiceries certifiées près de chez toi.
            </p>
            <div className="mt-2 flex items-center gap-1.5 text-gold">
              <MapPin className="size-4" weight="fill" />
              <ArrowDown className="size-3.5 animate-bounce" />
            </div>
          </div>
        </AnimateIn>
      </div>
    </section>
  );
}
