import { Navbar } from "@/components/layout/navbar";
import { Hero } from "@/components/layout/sections/hero";
import { Stats } from "@/components/layout/sections/stats";
import { Features } from "@/components/layout/sections/features";
import { HowItWorks } from "@/components/layout/sections/how-it-works";
import { NaqiyGradeSection } from "@/components/layout/sections/naqiy-grade";
import { Testimonials } from "@/components/layout/sections/testimonials";
import { Pricing } from "@/components/layout/sections/pricing";
import { Faq } from "@/components/layout/sections/faq";
import { Contact } from "@/components/layout/sections/contact";
import { Community } from "@/components/layout/sections/community";
import { Newsletter } from "@/components/layout/sections/newsletter";
import { Footer } from "@/components/layout/sections/footer";

export default function HomePage() {
  return (
    <>
      <Navbar />
      <main>
        <Hero />
        <Stats />
        <Features />
        <HowItWorks />
        <NaqiyGradeSection />
        <Testimonials />
        <Pricing />
        <Faq />
        <Contact />
        <Community />
        <Newsletter />
      </main>
      <Footer />
    </>
  );
}
