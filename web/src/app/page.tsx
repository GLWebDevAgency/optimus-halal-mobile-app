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
      <Navbar />
      <GrainOverlay />
      <LandingPhoneOrchestrator />
    </SmoothScroll>
  );
}
