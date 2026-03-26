"use client";

import { useState } from "react";
import { List, Bell } from "@phosphor-icons/react";
import { motion, useScroll, useTransform } from "motion/react";
import { NaqiyLogo } from "@/components/brand/naqiy-logo";
import { useTrack } from "@/lib/posthog";
import { EVENTS } from "@/lib/analytics-events";

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

const navRoutes = [
  { id: "features", label: "Fonctionnalités" },
  { id: "pricing", label: "Tarifs" },
];

function scrollTo(id: string) {
  document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
}

export function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const track = useTrack();
  const { scrollY } = useScroll();

  // Scroll-reactive transforms: transparent → frosted glass
  const bgOpacity = useTransform(scrollY, [0, 200], [0, 0.9]);
  const blurAmount = useTransform(scrollY, [0, 200], [0, 20]);
  const borderOpacity = useTransform(scrollY, [0, 200], [0, 0.08]);

  // Logo: hidden at top, fades in as hero logo fades out
  const logoOpacity = useTransform(scrollY, [100, 350], [0, 1]);
  const logoScale = useTransform(scrollY, [100, 350], [0.8, 1]);

  return (
    <motion.nav
      className="fixed inset-x-0 top-0 z-50"
      style={{
        backgroundColor: useTransform(
          bgOpacity,
          (v) => `rgba(250,250,248,${v})`
        ),
        backdropFilter: useTransform(blurAmount, (v) => `blur(${v}px)`),
        WebkitBackdropFilter: useTransform(blurAmount, (v) => `blur(${v}px)`),
        borderBottom: useTransform(
          borderOpacity,
          (v) => `1px solid rgba(0,0,0,${v})`
        ),
      }}
    >
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
        {/* Left — Logo (fades in on scroll) */}
        <motion.div style={{ opacity: logoOpacity, scale: logoScale }}>
          <a
            href="#hero"
            onClick={(e) => {
              e.preventDefault();
              window.scrollTo({ top: 0, behavior: "smooth" });
            }}
            className="flex items-center"
          >
            <NaqiyLogo size="sm" variant="brand" />
          </a>
        </motion.div>

        {/* Center — Desktop nav links */}
        <div className="hidden items-center gap-1 md:flex">
          {navRoutes.map((route) => (
            <button
              key={route.id}
              onClick={() => scrollTo(route.id)}
              className="link-underline rounded-lg px-3 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              {route.label}
            </button>
          ))}
        </div>

        {/* Right — CTA + Mobile hamburger */}
        <div className="flex items-center gap-2">
          {/* Desktop CTA */}
          <button
            onClick={() => { track(EVENTS.NAVBAR_CTA_CLICKED); scrollTo("waitlist"); }}
            className="hidden md:inline-flex items-center gap-2 rounded-full bg-foreground px-5 py-2 font-display font-bold text-sm text-background transition-all duration-200 hover:scale-[1.03] hover:shadow-[0_0_20px_oklch(0.76_0.14_88/15%)]"
          >
            <Bell className="size-4" weight="fill" />
            <span>Rejoindre la liste</span>
          </button>

          {/* Mobile hamburger */}
          <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger
              className="inline-flex size-8 items-center justify-center rounded-lg text-muted-foreground hover:text-foreground md:hidden"
              aria-label="Ouvrir le menu"
            >
              <List className="size-5" />
            </SheetTrigger>
            <SheetContent side="right" className="w-72">
              <SheetHeader className="text-left">
                <SheetTitle className="flex items-center gap-2.5">
                  <NaqiyLogo size="sm" />
                </SheetTitle>
              </SheetHeader>
              <nav className="mt-6 flex flex-col gap-1 px-4">
                {navRoutes.map((route) => (
                  <button
                    key={route.id}
                    onClick={() => { scrollTo(route.id); setIsOpen(false); }}
                    className="rounded-lg px-3 py-2.5 text-left text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                  >
                    {route.label}
                  </button>
                ))}
                <div className="my-3 h-px bg-border" />
                <button
                  onClick={() => { scrollTo("waitlist"); setIsOpen(false); track(EVENTS.NAVBAR_CTA_CLICKED); }}
                  className="flex items-center justify-center gap-2 rounded-full bg-foreground px-5 py-2.5 font-display font-bold text-sm text-background transition-all duration-200 hover:scale-[1.02]"
                >
                  <Bell className="size-4" weight="fill" />
                  <span>Rejoindre la liste</span>
                </button>
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </motion.nav>
  );
}
