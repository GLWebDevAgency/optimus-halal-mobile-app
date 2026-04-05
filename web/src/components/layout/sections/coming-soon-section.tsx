"use client";

import {
  Storefront,
  Rocket,
  HandHeart,
  Crown,
  Van,
} from "@phosphor-icons/react";
import { InstagramIcon } from "@/components/icons/instagram-icon";
import { FacebookIcon } from "@/components/icons/facebook-icon";
import { AnimateIn, Stagger, StaggerItem } from "@/components/animations/animate-in";
import { SplitText } from "@/components/animations/split-text";
import { Badge } from "@/components/ui/badge";

/* ═══════════════════════════════════════════════
   4 piliers — storytelling concis, pas de feature list.
   Chaque carte = émotion en 1 titre + 1 phrase.
   ═══════════════════════════════════════════════ */

const pillars = [
  {
    icon: Crown,
    accent: "from-gold/20 to-yellow-500/10",
    iconColor: "text-gold",
    title: "La sélection Naqiy",
    description:
      "Des marques et produits ultra fiables, vérifiés halal & tayyib — sélectionnés pour toi, sans compromis.",
  },
  {
    icon: HandHeart,
    accent: "from-amber-500/20 to-orange-500/10",
    iconColor: "text-amber-600 dark:text-amber-400",
    title: "Entrepreneurs de la communauté",
    description:
      "Petits pots bébé, café torréfié à la main, pâtisseries artisanales — on leur donne la vitrine qu'ils méritent.",
  },
  {
    icon: Storefront,
    accent: "from-emerald-500/20 to-teal-500/10",
    iconColor: "text-emerald-600 dark:text-emerald-400",
    title: "Halal & tayyib partout en France",
    description:
      "Même dans les villes les moins fournies — accède aux meilleurs produits sans compromis sur ta pratique.",
  },
  {
    icon: Van,
    accent: "from-blue-500/20 to-indigo-500/10",
    iconColor: "text-blue-600 dark:text-blue-400",
    title: "Livré chez toi",
    description:
      "Commande depuis ton canapé, tout arrive à ta porte. Consommer halal n'a jamais été aussi simple.",
  },
];

export function ComingSoonSection() {
  return (
    <section className="relative flex items-center overflow-hidden bg-gradient-to-b from-background to-secondary/60 py-16 lg:py-24">
      <div className="mx-auto max-w-5xl px-6 relative z-10">
        {/* ── Header ── */}
        <div className="text-center">
          <AnimateIn variant="blur">
            <Badge
              variant="outline"
              className="mb-5 gap-1.5 border-gold/30 bg-gold/5 px-3 py-1 text-gold"
            >
              <Rocket className="size-3" weight="fill" />
              En préparation
            </Badge>
          </AnimateIn>

          <SplitText
            as="h2"
            ssrVisible
            className="font-display text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl"
          >
            Et la suite ?
          </SplitText>

          <AnimateIn variant="fadeUp" delay={0.2}>
            <p className="mt-4 max-w-lg mx-auto text-muted-foreground md:text-lg leading-relaxed">
              On prépare un marketplace qui sélectionne les meilleures marques halal & tayyib
              et met en avant les entrepreneurs de la communauté —{" "}
              <span className="font-semibold text-foreground">
                pour que chaque musulman, même dans les zones les moins fournies,
                puisse consommer en conscience.
              </span>
            </p>
          </AnimateIn>
        </div>

        {/* ── Pillar grid ── */}
        <Stagger className="mt-12 grid gap-3.5 sm:grid-cols-2 lg:grid-cols-4 max-w-5xl mx-auto">
          {pillars.map((pillar) => (
            <StaggerItem key={pillar.title} className="h-full">
              <div className="group relative rounded-2xl bg-card p-5 shadow-sm ring-1 ring-border/50 transition-all duration-300 hover:shadow-lg hover:-translate-y-1 hover:ring-gold/20 h-full overflow-hidden">
                <div
                  className={`absolute -top-6 -right-6 size-24 rounded-full bg-gradient-to-br ${pillar.accent} blur-2xl opacity-0 transition-opacity duration-500 group-hover:opacity-100`}
                />

                <div className="relative">
                  <div
                    className={`inline-flex items-center justify-center size-10 rounded-xl bg-gradient-to-br ${pillar.accent} mb-3`}
                  >
                    <pillar.icon
                      className={`size-[18px] ${pillar.iconColor}`}
                      weight="fill"
                    />
                  </div>
                  <p className="font-bold text-foreground tracking-tight text-[13px]">
                    {pillar.title}
                  </p>
                  <p className="mt-1.5 text-xs text-muted-foreground leading-relaxed">
                    {pillar.description}
                  </p>
                </div>
              </div>
            </StaggerItem>
          ))}
        </Stagger>

        {/* ── Follow CTA ── */}
        <AnimateIn variant="fadeUp" delay={0.5}>
          <div className="mt-10 text-center">
            <p className="text-sm text-muted-foreground mb-4">
              Suis l&apos;avancement du projet.
            </p>
            <div className="flex items-center justify-center gap-3">
              <a
                href="https://instagram.com/naqiy.app"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2.5 rounded-full bg-foreground px-6 py-3 font-display text-sm font-bold text-background transition-all duration-200 hover:scale-[1.03] hover:shadow-lg"
              >
                <InstagramIcon className="size-4" />
                Instagram
              </a>
              <a
                href="https://www.facebook.com/share/1F9U3BTZW3/"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2.5 rounded-full bg-foreground px-6 py-3 font-display text-sm font-bold text-background transition-all duration-200 hover:scale-[1.03] hover:shadow-lg"
              >
                <FacebookIcon className="size-4" />
                Facebook
              </a>
            </div>
          </div>
        </AnimateIn>
      </div>
    </section>
  );
}
