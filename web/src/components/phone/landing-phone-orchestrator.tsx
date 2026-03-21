"use client";

import { useRef, useMemo } from "react";
import { motion, useScroll, useTransform, useInView } from "motion/react";

import { PhoneFrame } from "@/components/phone/phone-frame";
import {
  PhoneScreenManager,
  type ScreenConfig,
} from "@/components/phone/phone-screen-manager";
import { StickyPhone } from "@/components/phone/sticky-phone";

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
import { PricingSection } from "@/components/layout/sections/pricing";
import { SocialProofSection } from "@/components/layout/sections/social-proof";
import { CtaDownload } from "@/components/layout/sections/cta-download";
import { Footer } from "@/components/layout/sections/footer";

/* ═══════════════════════════════════════════════════════════
   SCREEN CONFIGS — static so PhoneScreenManager can memoize
   ═══════════════════════════════════════════════════════════ */

const screens: ScreenConfig[] = [
  { key: "home", component: <HomeScreen />, category: "home" },
  { key: "scan", component: <ScanScreen />, category: "scan" },
  { key: "scanLoading", component: <ScanLoadingScreen />, category: "scan" },
  { key: "scanResult", component: <ScanResultScreen />, category: "scan" },
  { key: "map", component: <MapScreen />, category: "map" },
  { key: "restaurant", component: <RestaurantScreen />, category: "map" },
  { key: "profile", component: <ProfileScreen />, category: "profile" },
];

/* ═══════════════════════════════════════════════════════════
   ORCHESTRATOR — ties sections, phone, and transitions together
   ═══════════════════════════════════════════════════════════ */

export function LandingPhoneOrchestrator() {
  /* ── Section refs ── */
  const heroRef = useRef<HTMLDivElement>(null);
  const scanRef = useRef<HTMLDivElement>(null);
  const analysisRef = useRef<HTMLDivElement>(null);
  const analysisBottomRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<HTMLDivElement>(null);
  const mapBottomRef = useRef<HTMLDivElement>(null);
  const pricingRef = useRef<HTMLDivElement>(null);
  const socialProofRef = useRef<HTMLDivElement>(null);
  const ctaRef = useRef<HTMLDivElement>(null);

  /* ── Section visibility ── */
  const heroInView = useInView(heroRef, { amount: 0.4 });
  const scanInView = useInView(scanRef, { amount: 0.4 });
  const analysisInView = useInView(analysisRef, { amount: 0.4 });
  const analysisBottomInView = useInView(analysisBottomRef, { amount: 0.1 });
  const mapInView = useInView(mapRef, { amount: 0.4 });
  const mapBottomInView = useInView(mapBottomRef, { amount: 0.1 });
  const pricingInView = useInView(pricingRef, { amount: 0.4 });
  const socialProofInView = useInView(socialProofRef, { amount: 0.3 });
  const ctaInView = useInView(ctaRef, { amount: 0.3 });

  /* ── Derive active screen from section visibility ──
     Priority: bottom-most visible section wins.
     CTA returns to HomeScreen. SocialProof keeps last screen. */
  const activeScreen = useMemo(() => {
    if (ctaInView) return "home";
    if (pricingInView) return "profile";
    if (mapBottomInView) return "restaurant";
    if (mapInView) return "map";
    if (analysisBottomInView) return "scanResult";
    if (analysisInView) return "scanLoading";
    if (scanInView) return "scan";
    return "home";
  }, [
    ctaInView,
    pricingInView,
    mapBottomInView,
    mapInView,
    analysisBottomInView,
    analysisInView,
    scanInView,
    heroInView,
  ]);

  /* ── Phone fade: out at SocialProof, back in at CTA ── */
  const phoneVisible = !socialProofInView || ctaInView;

  /* ── Dark-to-light background transition ── */
  const { scrollYProgress } = useScroll();

  const backgroundColor = useTransform(
    scrollYProgress,
    [0, 0.3, 0.5, 1],
    ["#0a0a0a", "#0a0a0a", "#fafaf8", "#fafaf8"]
  );

  const textColor = useTransform(
    scrollYProgress,
    [0, 0.3, 0.5, 1],
    ["#ffffff", "#ffffff", "#1a1a1a", "#1a1a1a"]
  );

  return (
    <motion.div style={{ backgroundColor, color: textColor }}>
      {/* ── Two-column grid: Content left, Phone right ── */}
      <div className="mx-auto max-w-7xl px-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* ─── LEFT COLUMN — Content sections ─── */}
          <div>
            <div ref={heroRef}>
              <Hero />
            </div>

            <div ref={scanRef}>
              <ScanSection />
            </div>

            {/* Analysis — two-phase: scanLoading → scanResult */}
            <div ref={analysisRef}>
              <AnalysisSection />
              <div ref={analysisBottomRef} className="h-[30vh]" />
            </div>

            {/* Map — two-phase: map → restaurant */}
            <div ref={mapRef}>
              <MapSection />
              <div ref={mapBottomRef} className="h-[30vh]" />
            </div>

            <div ref={pricingRef}>
              <PricingSection />
            </div>
          </div>

          {/* ─── RIGHT COLUMN — Sticky phone with fade ─── */}
          <motion.div
            animate={{
              opacity: phoneVisible ? 1 : 0,
              scale: phoneVisible ? 1 : 0.95,
            }}
            transition={{ duration: 0.5, ease: "easeInOut" }}
          >
            <StickyPhone>
              <PhoneFrame>
                <PhoneScreenManager
                  screens={screens}
                  activeScreen={activeScreen}
                />
              </PhoneFrame>
            </StickyPhone>
          </motion.div>
        </div>
      </div>

      {/* ── Full-width sections (phone fades out/in) ── */}
      <div ref={socialProofRef}>
        <SocialProofSection />
      </div>

      {/* CTA — phone fades back in, returns to HomeScreen */}
      <div ref={ctaRef}>
        <CtaDownload />
      </div>

      <Footer />
    </motion.div>
  );
}
