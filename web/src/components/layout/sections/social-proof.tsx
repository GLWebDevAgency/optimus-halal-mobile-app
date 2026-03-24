"use client";

import {
  Star,
  Barcode,
  Storefront,
  Scales,
  Leaf,
  UserPlus,
  ChatCircleDots,
  Trophy,
  ShieldCheck,
} from "@phosphor-icons/react";
import { SplitText } from "@/components/animations/split-text";
import { AnimateIn, Stagger, StaggerItem } from "@/components/animations/animate-in";
import { AnimatedCounter } from "@/components/animations/animated-counter";
import { Badge } from "@/components/ui/badge";

/* ═══════════════════════════════════════════════
   DATA
   ═══════════════════════════════════════════════ */

const stats = [
  { rawValue: 817000, suffix: "+", label: "Produits analysés", icon: Barcode, accent: "gold" as const },
  { rawValue: 383, suffix: "", label: "Magasins référencés", icon: Storefront, accent: "gold" as const },
  { rawValue: 5, suffix: "", label: "Écoles juridiques", icon: Scales, accent: "gold" as const },
  { rawValue: 100, suffix: "%", label: "Gratuit", icon: Leaf, accent: "leaf" as const },
];

const pioneerCards = [
  {
    icon: Star,
    cta: "Sois le premier à noter Naqiy",
    description: "Ton avis façonnera l'app pour des milliers de familles.",
    accent: "gold" as const,
    ctaLabel: "Donner mon avis",
  },
  {
    icon: ChatCircleDots,
    cta: "Partage ton expérience",
    description: "Dis-nous ce qui compte pour toi. On construit Naqiy avec toi, pas sans toi.",
    accent: "leaf" as const,
    ctaLabel: "Partager",
  },
  {
    icon: Trophy,
    cta: "Deviens membre fondateur",
    description: "Les premiers utilisateurs auront une place spéciale dans l'histoire de Naqiy.",
    accent: "gold" as const,
    ctaLabel: "Rejoindre",
  },
];

/* ═══════════════════════════════════════════════
   COMPONENT
   ═══════════════════════════════════════════════ */

export function SocialProofSection() {
  return (
    <section className="relative flex items-center overflow-hidden bg-secondary/50 py-20 lg:min-h-screen lg:py-32">
      {/* Subtle background mesh */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 80% 50% at 50% 0%, oklch(0.76 0.14 88 / 4%) 0%, transparent 60%)",
        }}
        aria-hidden="true"
      />

      <div className="mx-auto max-w-5xl px-6 relative z-10">
        <SplitText
          as="h2"
          className="font-display text-3xl font-bold tracking-tight text-center sm:text-4xl md:text-5xl"
        >
          Les chiffres parlent déjà
        </SplitText>

        <AnimateIn className="text-center">
          <p className="text-lg text-muted-foreground mt-4 max-w-lg mx-auto">
            817 000 produits analysés, 383 magasins référencés. La base est solide.
            Il ne manque que <span className="font-semibold text-foreground">toi</span>.
          </p>
        </AnimateIn>

        {/* Trust badge */}
        <AnimateIn variant="blur" delay={0.2}>
          <div className="flex justify-center mt-6">
            <Badge variant="outline" className="gap-1.5 border-leaf/30 bg-leaf/5 px-3 py-1 text-leaf">
              <ShieldCheck className="size-3" weight="fill" />
              Données réelles — mises à jour quotidiennement
            </Badge>
          </div>
        </AnimateIn>

        {/* ─── Stats counters — données réelles ─── */}
        <Stagger className="mt-12 grid grid-cols-2 md:grid-cols-4 gap-6 max-w-3xl mx-auto">
          {stats.map((stat) => {
            const isLeaf = stat.accent === "leaf";
            return (
              <StaggerItem key={stat.label}>
                <div className={`text-center group rounded-2xl border border-border/50 bg-card/30 p-5 backdrop-blur-sm transition-all duration-300 ${isLeaf ? "hover:border-leaf/20" : "hover:border-gold/20"} hover:bg-card/60`}>
                  <stat.icon className={`size-5 mx-auto mb-2 transition-colors ${isLeaf ? "text-leaf/60 group-hover:text-leaf" : "text-gold/60 group-hover:text-gold"}`} weight="duotone" />
                  <p className="text-3xl font-black text-foreground md:text-4xl">
                    <AnimatedCounter value={stat.rawValue} suffix={stat.suffix} />
                  </p>
                  <p className="text-xs text-muted-foreground mt-1 font-medium">{stat.label}</p>
                </div>
              </StaggerItem>
            );
          })}
        </Stagger>

        {/* ─── Pioneer cards — appel aux premiers utilisateurs ─── */}
        <AnimateIn variant="fadeUp" delay={0.3}>
          <div className="mt-16 text-center">
            <p className="inline-flex items-center gap-2 text-sm font-semibold text-leaf tracking-wide uppercase">
              <UserPlus className="size-4" weight="bold" />
              Pionniers recherchés
            </p>
          </div>
        </AnimateIn>

        <Stagger className="mt-6 grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {pioneerCards.map((card) => {
            const isLeaf = card.accent === "leaf";
            return (
              <StaggerItem key={card.cta}>
                <div className={`group rounded-2xl border p-6 h-full flex flex-col items-center text-center backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg ${isLeaf ? "border-leaf/15 bg-gradient-to-b from-leaf/[4%] to-leaf/[1%] hover:border-leaf/25" : "border-gold/15 bg-gradient-to-b from-gold/[4%] to-gold/[1%] hover:border-gold/25"}`}>
                  <div className={`flex size-12 items-center justify-center rounded-xl transition-colors ${isLeaf ? "bg-leaf/10 group-hover:bg-leaf/15" : "bg-gold/10 group-hover:bg-gold/15"}`}>
                    <card.icon className={`size-6 ${isLeaf ? "text-leaf" : "text-gold"}`} weight="duotone" />
                  </div>

                  <p className="mt-4 font-bold text-foreground">
                    {card.cta}
                  </p>
                  <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                    {card.description}
                  </p>

                  <button className={`mt-4 rounded-full px-4 py-1.5 text-xs font-semibold transition-all duration-200 hover:scale-[1.03] ${isLeaf ? "border border-leaf/20 text-leaf hover:bg-leaf/5" : "border border-gold/20 text-gold hover:bg-gold/5"}`}>
                    {card.ctaLabel}
                  </button>
                </div>
              </StaggerItem>
            );
          })}
        </Stagger>
      </div>
    </section>
  );
}
