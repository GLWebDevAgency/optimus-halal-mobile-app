import { Navbar } from "@/components/layout/navbar";
import { SmoothScroll } from "@/components/animations/smooth-scroll";
import { GrainOverlay } from "@/components/animations/grain-overlay";
import { LandingPhoneOrchestrator } from "@/components/phone/landing-phone-orchestrator";
import { SocialProofSection } from "@/components/layout/sections/social-proof";
import { CtaDownload } from "@/components/layout/sections/cta-download";
import { Footer } from "@/components/layout/sections/footer";

export default function HomePage() {
  return (
    <SmoothScroll>
      <Navbar />
      <GrainOverlay />
      <LandingPhoneOrchestrator />
      <SocialProofSection />
      <CtaDownload />
      <Footer />
    </SmoothScroll>
  );
}
