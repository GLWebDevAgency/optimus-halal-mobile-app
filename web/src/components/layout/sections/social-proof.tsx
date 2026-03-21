"use client";

import { SplitText } from "@/components/animations/split-text";
import { Stagger, StaggerItem } from "@/components/animations/animate-in";

/* ═══════════════════════════════════════════════
   DATA
   ═══════════════════════════════════════════════ */

const stats = [
  { value: "817K+", label: "Produits analysés" },
  { value: "383", label: "Magasins certifiés" },
  { value: "5", label: "Écoles juridiques" },
  { value: "100%", label: "Gratuit" },
] as const;

const testimonials = [
  {
    quote:
      "Enfin une app qui respecte mon madhab. Le score Naqiy me donne confiance pour chaque achat.",
    author: "Fatima R.",
    initials: "FR",
  },
  {
    quote:
      "J'utilise Naqiy tous les jours au supermarché. C'est devenu indispensable.",
    author: "Ahmed K.",
    initials: "AK",
  },
  {
    quote:
      "La carte des magasins certifiés m'a fait découvrir des endroits que je ne connaissais pas.",
    author: "Leila M.",
    initials: "LM",
  },
] as const;

/* ═══════════════════════════════════════════════
   COMPONENT
   ═══════════════════════════════════════════════ */

export function SocialProofSection() {
  return (
    <section className="py-32">
      <div className="mx-auto max-w-5xl px-6">
        <SplitText
          as="h2"
          className="font-display text-4xl md:text-5xl font-bold tracking-tight text-foreground text-center"
        >
          La confiance de milliers d'utilisateurs
        </SplitText>

        {/* ─── Stats counters ─── */}
        <Stagger className="mt-12 grid grid-cols-2 md:grid-cols-4 gap-8 max-w-3xl mx-auto text-center">
          {stats.map((stat) => (
            <StaggerItem key={stat.label}>
              <p className="text-4xl font-black text-foreground">{stat.value}</p>
              <p className="text-sm text-muted-foreground mt-1">{stat.label}</p>
            </StaggerItem>
          ))}
        </Stagger>

        {/* ─── Testimonial cards ─── */}
        <Stagger className="mt-16 grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {testimonials.map((t) => (
            <StaggerItem key={t.author}>
              <div className="rounded-2xl border border-border bg-card p-6 h-full flex flex-col">
                <p className="text-gold text-lg tracking-wide">&#9733;&#9733;&#9733;&#9733;&#9733;</p>
                <p className="mt-3 text-sm leading-relaxed text-foreground italic flex-1">
                  &ldquo;{t.quote}&rdquo;
                </p>
                <div className="mt-4 flex items-center gap-3">
                  <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-gold/60 to-gold/30 text-xs font-bold text-foreground">
                    {t.initials}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">{t.author}</p>
                    <p className="text-xs text-muted-foreground">Utilisateur Naqiy</p>
                  </div>
                </div>
              </div>
            </StaggerItem>
          ))}
        </Stagger>
      </div>
    </section>
  );
}
