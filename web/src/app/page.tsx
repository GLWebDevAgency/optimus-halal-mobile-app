import { Navbar } from "@/components/layout/navbar";
import { ScrollProgress } from "@/components/layout/scroll-progress";
import { MobileCTABar } from "@/components/layout/mobile-cta-bar";
import { SmoothScroll } from "@/components/animations/smooth-scroll";
import { GrainOverlay } from "@/components/animations/grain-overlay";
import { LandingPhoneOrchestrator } from "@/components/phone/landing-phone-orchestrator";

export default function HomePage() {
  return (
    <SmoothScroll>
      <ScrollProgress />
      <MobileCTABar />
      <a href="#main-content" className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-[100] focus:rounded-lg focus:bg-foreground focus:px-4 focus:py-2 focus:text-background focus:shadow-lg">
        Aller au contenu principal
      </a>
      <Navbar />
      <GrainOverlay />
      <main id="main-content">
        <LandingPhoneOrchestrator />
      </main>
    </SmoothScroll>
  );
}
