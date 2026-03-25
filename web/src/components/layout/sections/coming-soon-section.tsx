"use client";

import { useState } from "react";
import {
  Storefront,
  Bell,
  Rocket,
  HandHeart,
  Crown,
  Van,
  CheckCircle,
} from "@phosphor-icons/react";
import { AnimateIn, Stagger, StaggerItem } from "@/components/animations/animate-in";
import { SplitText } from "@/components/animations/split-text";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useTrack } from "@/lib/posthog";
import { EVENTS } from "@/lib/analytics-events";

const STORAGE_KEY = "naqiy.waitlist_emails";

type FormState = "idle" | "success" | "already";

/* ═══════════════════════════════════════════════
   4 piliers — storytelling concis, pas de feature list.
   Chaque carte = émotion en 1 titre + 1 phrase.
   ═══════════════════════════════════════════════ */

const pillars = [
  {
    icon: HandHeart,
    accent: "from-amber-500/20 to-orange-500/10",
    iconColor: "text-amber-600 dark:text-amber-400",
    title: "Ceux qui font les choses bien",
    description:
      "Petits pots bébé faits maison, café torréfié à la main, pâtisseries artisanales — on leur donne la vitrine qu'ils méritent.",
  },
  {
    icon: Storefront,
    accent: "from-emerald-500/20 to-teal-500/10",
    iconColor: "text-emerald-600 dark:text-emerald-400",
    title: "Des adresses de confiance",
    description:
      "Épiceries, boucheries, commerces vérifiés — tu sais où tu achètes, tu sais ce que tu manges.",
  },
  {
    icon: Crown,
    accent: "from-gold/20 to-yellow-500/10",
    iconColor: "text-gold",
    title: "La sélection Naqiy",
    description:
      "Notre propre gamme halal & tayyib. Sourcée, tracée, irréprochable — l'exigence que ta famille mérite.",
  },
  {
    icon: Van,
    accent: "from-blue-500/20 to-indigo-500/10",
    iconColor: "text-blue-600 dark:text-blue-400",
    title: "Livré chez toi",
    description:
      "Commande depuis ton canapé, tout arrive à ta porte. Les courses en toute tranquillité.",
  },
];

export function ComingSoonSection() {
  const [email, setEmail] = useState("");
  const [formState, setFormState] = useState<FormState>("idle");
  const track = useTrack();

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const normalized = email.trim().toLowerCase();
    if (!normalized) return;

    const stored = localStorage.getItem(STORAGE_KEY);
    const emails: string[] = stored ? (JSON.parse(stored) as string[]) : [];

    if (emails.includes(normalized)) {
      setFormState("already");
      return;
    }

    emails.push(normalized);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(emails));
    setFormState("success");
    setEmail("");
    track(EVENTS.WAITLIST_SUBMITTED, { source: "marketplace" });
  }

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
              Bientôt disponible
            </Badge>
          </AnimateIn>

          <SplitText
            as="h2"
            className="font-display text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl"
          >
            Halal par conviction. Tayyib par exigence.
          </SplitText>

          <AnimateIn variant="fadeUp" delay={0.2}>
            <p className="mt-4 max-w-lg mx-auto text-muted-foreground md:text-lg leading-relaxed">
              Un marketplace qui réunit artisans, commerçants de confiance et nos sélections certifiées —{" "}
              <span className="font-semibold text-foreground">
                parce que ta famille mérite mieux qu&apos;un doute.
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

        {/* ── Newsletter CTA ── */}
        <AnimateIn variant="fadeUp" delay={0.5}>
          <div className="mt-10 text-center">
            {formState === "idle" && (
              <>
                <p className="text-sm text-muted-foreground mb-3">
                  Sois le premier informé du lancement.
                </p>
                <form
                  onSubmit={handleSubmit}
                  className="flex flex-col sm:flex-row items-center justify-center gap-3 max-w-md mx-auto"
                >
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    onFocus={() => track(EVENTS.MARKETPLACE_TEASER_CLICKED)}
                    placeholder="ton@email.com"
                    required
                    className="w-full sm:flex-1 h-11 rounded-xl border border-border bg-card px-4 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-gold/30 focus:border-gold/40 transition-all"
                  />
                  <Button
                    type="submit"
                    className="h-11 px-5 gold-glow-intense shrink-0 w-full sm:w-auto gap-2"
                  >
                    <Bell className="size-4" weight="fill" />
                    Me prévenir
                  </Button>
                </form>
              </>
            )}

            {formState === "success" && (
              <div className="flex items-center justify-center gap-2 text-sm text-emerald-600 dark:text-emerald-400">
                <CheckCircle className="size-4" weight="fill" />
                <span>C&apos;est noté ! On te prévient dès le lancement.</span>
              </div>
            )}

            {formState === "already" && (
              <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                <CheckCircle className="size-4" weight="fill" />
                <span>Tu es déjà sur la liste — on ne t&apos;oublie pas.</span>
              </div>
            )}
          </div>
        </AnimateIn>
      </div>
    </section>
  );
}
