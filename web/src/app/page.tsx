import { Navbar } from "@/components/layout/navbar";
import { ScrollProgress } from "@/components/layout/scroll-progress";
import { SmoothScroll } from "@/components/animations/smooth-scroll";
import { GrainOverlay } from "@/components/animations/grain-overlay";
import { LandingPhoneOrchestrator } from "@/components/phone/landing-phone-orchestrator";

export default function HomePage() {
  return (
    <SmoothScroll>
      <ScrollProgress />
      <Navbar />
      <GrainOverlay />
      <LandingPhoneOrchestrator />
    </SmoothScroll>
  );
}
