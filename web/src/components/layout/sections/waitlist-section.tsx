"use client";

import {
  Bell,
  AppleLogo,
  GooglePlayLogo,
  CheckCircle,
  EnvelopeSimple,
  CircleNotch,
} from "@phosphor-icons/react";
import { SplitText } from "@/components/animations/split-text";
import { AnimateIn } from "@/components/animations/animate-in";
import { Badge } from "@/components/ui/badge";
import { EVENTS } from "@/lib/analytics-events";
import { useWaitlistJoin } from "@/hooks/use-waitlist-join";

export function WaitlistSection() {
  const { state, email, setEmail, submit, track } = useWaitlistJoin({ source: "landing" });

  return (
    <section
      id="waitlist"
      className="relative overflow-hidden bg-gradient-to-b from-background via-secondary/40 to-background py-24 lg:py-32"
    >
      {/* Ambient glow */}
      <div
        className="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[700px] w-[700px] rounded-full"
        style={{
          background:
            "radial-gradient(circle, oklch(0.76 0.14 88 / 10%) 0%, oklch(0.76 0.14 88 / 3%) 40%, transparent 70%)",
        }}
        aria-hidden="true"
      />

      <div className="relative z-10 mx-auto max-w-2xl px-6 text-center">
        {/* Badge */}
        <AnimateIn variant="blur" ssrVisible>
          <div className="mb-6 flex justify-center">
            <Badge variant="secondary" className="gap-1.5 px-3 py-1 text-xs">
              <EnvelopeSimple className="size-3.5 text-gold" weight="fill" />
              Lancement imminent
            </Badge>
          </div>
        </AnimateIn>

        {/* Headline */}
        <SplitText
          as="h2"
          className="font-display text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl text-glow-gold"
          ssrVisible
        >
          Sois parmi les premiers
        </SplitText>

        {/* Subtitle */}
        <AnimateIn variant="fadeUp" delay={0.15} ssrVisible>
          <p className="mt-4 text-lg text-pretty text-muted-foreground max-w-lg mx-auto leading-relaxed">
            L&apos;app arrive bient&ocirc;t sur iOS et Android. Laisse ton
            email et sois pr&eacute;venu d&egrave;s le lancement.
          </p>
        </AnimateIn>

        {/* Form */}
        <AnimateIn variant="fadeUp" delay={0.25}>
          <div className="mx-auto mt-10 max-w-lg">
            {state === "idle" || state === "loading" || state === "error" ? (
              <form
                onSubmit={submit}
                className="flex flex-col sm:flex-row items-stretch gap-3"
              >
                <label htmlFor="waitlist-email" className="sr-only">
                  Adresse email
                </label>
                <input
                  id="waitlist-email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onFocus={() => track(EVENTS.WAITLIST_STARTED)}
                  placeholder="ton@email.com"
                  disabled={state === "loading"}
                  className="flex-1 rounded-xl border border-border/60 bg-background/80 px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground/60 shadow-sm backdrop-blur-sm transition-colors focus:border-gold/60 focus:outline-none focus:ring-2 focus:ring-gold/20 disabled:opacity-50"
                />
                <button
                  type="submit"
                  disabled={state === "loading"}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-gold px-6 py-3 text-sm font-semibold text-background shadow-lg shadow-gold/20 transition-all duration-300 hover:bg-gold/90 hover:shadow-xl hover:shadow-gold/30 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none"
                >
                  {state === "loading" ? (
                    <CircleNotch className="size-4 animate-spin" />
                  ) : (
                    <Bell className="size-4" weight="fill" />
                  )}
                  Me pr&eacute;venir
                </button>
                {state === "error" && (
                  <p className="text-xs text-destructive mt-1 sm:col-span-2">
                    Une erreur est survenue. R&eacute;essaie.
                  </p>
                )}
              </form>
            ) : (
              <div className="flex flex-col items-center gap-3 rounded-2xl border border-gold/20 bg-gold/5 px-6 py-6 backdrop-blur-sm">
                <CheckCircle
                  className="size-10 text-gold"
                  weight="fill"
                />
                <p className="text-base font-semibold text-foreground">
                  {state === "success"
                    ? "Tu es sur la liste ! On te pr\u00E9vient tr\u00E8s bient\u00F4t."
                    : "Tu es d\u00E9j\u00E0 inscrit ! On ne t\u2019oublie pas."}
                </p>
              </div>
            )}
          </div>
        </AnimateIn>

        {/* Muted store badges (visual only) */}
        <AnimateIn variant="fadeUp" delay={0.35}>
          <div className="mt-10 flex flex-col items-center gap-3">
            <p className="text-xs text-muted-foreground/50 tracking-wide uppercase">
              Bient&ocirc;t sur
            </p>
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2 text-muted-foreground/40">
                <AppleLogo className="size-5" weight="fill" />
                <span className="text-sm font-medium">App Store</span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground/40">
                <GooglePlayLogo className="size-5" weight="fill" />
                <span className="text-sm font-medium">Google Play</span>
              </div>
            </div>
          </div>
        </AnimateIn>

        {/* Trust line */}
        <AnimateIn variant="fadeUp" delay={0.45}>
          <p className="mt-8 text-xs text-muted-foreground/50">
            Pas de spam. Juste un email le jour du lancement.
          </p>
        </AnimateIn>
      </div>
    </section>
  );
}
