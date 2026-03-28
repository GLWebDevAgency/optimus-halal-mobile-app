"use client";

import { useRef, useMemo, useEffect, useState, useCallback } from "react";
import { useInView, useScroll, motion, AnimatePresence } from "motion/react";
import { CaretLeft, CaretRight } from "@phosphor-icons/react";
import { useTrack } from "@/lib/posthog";
import { EVENTS } from "@/lib/analytics-events";

import { PhoneFrame } from "@/components/phone/phone-frame";
import {
  PhoneScreenManager,
  type ScreenConfig,
} from "@/components/phone/phone-screen-manager";
import { StickyPhone } from "@/components/phone/sticky-phone";
import { NaqiyScrollProvider } from "@/components/phone/naqiy-scroll-context";

import { HomeScreen } from "@/components/phone/screens/home-screen";
import { ScanScreen } from "@/components/phone/screens/scan-screen";
import { ScanLoadingScreen } from "@/components/phone/screens/scan-loading-screen";
import { ScanResultScreen } from "@/components/phone/screens/scan-result-screen";
import { MapScreen } from "@/components/phone/screens/map-screen";
import { RestaurantScreen } from "@/components/phone/screens/restaurant-screen";
import { ProfileScreen } from "@/components/phone/screens/profile-screen";

import { Hero } from "@/components/layout/sections/hero";
import { ScanSection } from "@/components/layout/sections/scan-section";
import { AnalysisSection } from "@/components/layout/sections/analysis-section";
import { MapSection } from "@/components/layout/sections/map-section";
import { RestaurantDetailSection } from "@/components/layout/sections/restaurant-detail-section";
import { PricingSection } from "@/components/layout/sections/pricing";
import { NaqiyScoreSection } from "@/components/layout/sections/naqiy-score-section";
import { SocialProofSection } from "@/components/layout/sections/social-proof";
import { ComingSoonSection } from "@/components/layout/sections/coming-soon-section";
import { CtaDownload } from "@/components/layout/sections/cta-download";
import { WaitlistSection } from "@/components/layout/sections/waitlist-section";
import { Footer } from "@/components/layout/sections/footer";

/* ═══════════════════════════════════════════════════════════
   ORCHESTRATOR — ties sections, phone, and transitions together

   AIDA funnel order:
   Grid (phone paired):
     1. Hero          → home
     2. Scan          → scan
     3. ScanResult    → scanLoading
     4. Analysis      → scanResult
     5. NaqiyScore    → scanResult
     6. SocialProof   → home
     7. Map           → map
     8. Restaurant    → restaurant

   Full-width (no phone):
     9. Pricing
    10. Waitlist
    11. ComingSoon (marketplace teaser)
    12. CTA
    13. Footer
   ═══════════════════════════════════════════════════════════ */

/* ═══════════════════════════════════════════════════════════
   MOBILE PHONE CAROUSEL — swipe-style navigation between screens
   ═══════════════════════════════════════════════════════════ */

const CAROUSEL_SCREENS = [
  { key: "home", label: "Accueil" },
  { key: "scan", label: "Scanner" },
  { key: "scanLoading", label: "Analyse" },
  { key: "scanResult", label: "Résultat" },
  { key: "map", label: "Carte" },
  { key: "restaurant", label: "Restaurant" },
  { key: "profile", label: "Profil" },
] as const;

function MobilePhoneCarousel({ screens }: { screens: ScreenConfig[] }) {
  const [currentIndex, setCurrentIndex] = useState(0);

  const goTo = useCallback(
    (index: number) => {
      setCurrentIndex(index);
    },
    []
  );

  const prev = useCallback(() => {
    if (currentIndex > 0) goTo(currentIndex - 1);
  }, [currentIndex, goTo]);

  const next = useCallback(() => {
    if (currentIndex < CAROUSEL_SCREENS.length - 1) goTo(currentIndex + 1);
  }, [currentIndex, goTo]);

  const activeKey = CAROUSEL_SCREENS[currentIndex].key;

  return (
    <div className="py-12 lg:hidden" role="group" aria-roledescription="carrousel" aria-label="Aperçu des écrans de l'application">
      {/* Phone + navigation wrapper */}
      <div className="relative flex items-center justify-center gap-3">
        {/* Left arrow */}
        <button
          onClick={prev}
          disabled={currentIndex === 0}
          aria-label="Écran précédent"
          className="flex size-10 shrink-0 items-center justify-center rounded-full bg-card shadow-sm ring-1 ring-border/50 transition-all duration-200 hover:shadow-md hover:ring-gold/20 disabled:opacity-30 disabled:hover:shadow-sm"
        >
          <CaretLeft className="size-4 text-foreground" weight="bold" />
        </button>

        {/* Phone */}
        <div className="scale-[0.85] sm:scale-100 origin-top">
          <PhoneFrame>
            <PhoneScreenManager
              screens={screens}
              activeScreen={activeKey}
            />
          </PhoneFrame>
        </div>

        {/* Right arrow */}
        <button
          onClick={next}
          disabled={currentIndex === CAROUSEL_SCREENS.length - 1}
          aria-label="Écran suivant"
          className="flex size-10 shrink-0 items-center justify-center rounded-full bg-card shadow-sm ring-1 ring-border/50 transition-all duration-200 hover:shadow-md hover:ring-gold/20 disabled:opacity-30 disabled:hover:shadow-sm"
        >
          <CaretRight className="size-4 text-foreground" weight="bold" />
        </button>
      </div>

      {/* Screen label */}
      <AnimatePresence mode="wait">
        <motion.p
          key={activeKey}
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -4 }}
          transition={{ duration: 0.2 }}
          className="mt-4 text-center text-sm font-medium text-muted-foreground"
        >
          {CAROUSEL_SCREENS[currentIndex].label}
        </motion.p>
      </AnimatePresence>

      {/* Dot indicators */}
      <div className="mt-3 flex items-center justify-center gap-1.5">
        {CAROUSEL_SCREENS.map((screen, i) => (
          <button
            key={screen.key}
            onClick={() => goTo(i)}
            aria-label={screen.label}
            className={`h-1.5 rounded-full transition-all duration-300 ${
              i === currentIndex
                ? "w-6 bg-gold"
                : "w-1.5 bg-border hover:bg-muted-foreground/30"
            }`}
          />
        ))}
      </div>
    </div>
  );
}

export function LandingPhoneOrchestrator() {
  const track = useTrack();
  const { scrollYProgress } = useScroll();
  const firedMilestones = useRef<Set<number>>(new Set());

  useEffect(() => {
    const milestones = [25, 50, 75, 100];
    return scrollYProgress.on("change", (v) => {
      for (const milestone of milestones) {
        if (v * 100 >= milestone && !firedMilestones.current.has(milestone)) {
          firedMilestones.current.add(milestone);
          track(EVENTS.SCROLL_DEPTH, { percent: milestone });
        }
      }
    });
  }, [scrollYProgress, track]);

  /* ── Section refs (grid sections only — phone paired) ── */
  const scanRef = useRef<HTMLDivElement>(null);
  const scanResultRef = useRef<HTMLDivElement>(null);
  const naqiyScoreRef = useRef<HTMLDivElement>(null);
  const socialProofRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<HTMLDivElement>(null);
  const restaurantRef = useRef<HTMLDivElement>(null);

  /* ── NaqiyScore scroll progress — passed to ScanResultScreen for tab sync ── */
  const { scrollYProgress: naqiyScrollProgress } = useScroll({
    target: naqiyScoreRef,
    offset: ["start start", "end end"],
  });
  const naqiyScrollValue = { scrollYProgress: naqiyScrollProgress };

  /* ── Screen configs inside component so JSX has access to React tree context ── */
  const screens: ScreenConfig[] = [
    { key: "home", component: <HomeScreen />, category: "home" },
    { key: "scan", component: <ScanScreen />, category: "scan" },
    { key: "scanLoading", component: <ScanLoadingScreen />, category: "scan" },
    {
      key: "scanResult",
      component: (
        <NaqiyScrollProvider value={naqiyScrollValue}>
          <ScanResultScreen />
        </NaqiyScrollProvider>
      ),
      category: "scan",
    },
    { key: "map", component: <MapScreen />, category: "map" },
    { key: "restaurant", component: <RestaurantScreen />, category: "map" },
    { key: "profile", component: <ProfileScreen />, category: "profile" },
  ];

  /* ── Section visibility ── */
  const scanInView = useInView(scanRef, { amount: 0.4 });
  const scanResultInView = useInView(scanResultRef, { amount: 0.4 });
  /* amount: 0.1 — NaqiyScoreSection fait 250vh, max 40% de visibilité = dépasse le viewport */
  const naqiyScoreInView = useInView(naqiyScoreRef, { amount: 0.1 });
  const socialProofInView = useInView(socialProofRef, { amount: 0.3 });
  const mapInView = useInView(mapRef, { amount: 0.4 });
  const restaurantInView = useInView(restaurantRef, { amount: 0.4 });

  /* ── Derive active screen from section visibility ──
     Priority: bottom-most visible section wins.
     Each section maps 1:1 to a phone screen. */
  const activeScreen = useMemo(() => {
    if (restaurantInView) return "restaurant";
    if (mapInView) return "map";
    if (socialProofInView) return "profile";
    if (naqiyScoreInView) return "scanResult";
    if (scanResultInView) return "scanLoading";
    if (scanInView) return "scan";
    return "home";
  }, [
    restaurantInView,
    mapInView,
    socialProofInView,
    naqiyScoreInView,
    scanResultInView,
    scanInView,
  ]);

  return (
    <div className="bg-background text-foreground">
      {/* ── Two-column grid: Content left, Phone right ── */}
      <div className="mx-auto max-w-7xl px-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* ─── LEFT COLUMN — Content sections ─── */}
          <div>
            <div>
              <Hero />
            </div>

            <div className="divider-gold mx-auto max-w-5xl" />

            {/* ─── MOBILE PHONE CAROUSEL — visible below lg ─── */}
            <MobilePhoneCarousel screens={screens} />

            <div ref={scanRef}>
              <ScanSection />
            </div>

            <div ref={scanResultRef}>
              <AnalysisSection />
            </div>

            <div ref={naqiyScoreRef}>
              <NaqiyScoreSection />
            </div>

            <div ref={socialProofRef}>
              <SocialProofSection />
            </div>

            <div ref={mapRef}>
              <MapSection />
            </div>

            <div ref={restaurantRef}>
              <RestaurantDetailSection />
            </div>
          </div>

          {/* ─── RIGHT COLUMN — Sticky phone ─── */}
          <div className="hidden lg:block">
            <StickyPhone>
              <PhoneFrame>
                <PhoneScreenManager
                  screens={screens}
                  activeScreen={activeScreen}
                />
              </PhoneFrame>
            </StickyPhone>
          </div>
        </div>
      </div>

      <div className="divider-gold mx-auto max-w-5xl" />

      {/* ── Full-width sections (phone scrolls away naturally) ── */}
      <div>
        <PricingSection />
      </div>

      <div>
        <WaitlistSection />
      </div>

      <div className="divider-gold mx-auto max-w-5xl" />

      <div>
        <ComingSoonSection />
      </div>

      <div>
        <CtaDownload />
      </div>

      <Footer />
    </div>
  );
}
