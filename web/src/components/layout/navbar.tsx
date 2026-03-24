"use client";

import { useState } from "react";
import Link from "next/link";
import { List, AppleLogo, GooglePlayLogo } from "@phosphor-icons/react";
import { motion, useScroll, useTransform } from "motion/react";
import { NaqiyLogo } from "@/components/brand/naqiy-logo";

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

const navRoutes = [
  { href: "#features", label: "Fonctionnalités" },
  { href: "#pricing", label: "Tarifs" },
];

export function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const { scrollY } = useScroll();

  // Scroll-reactive transforms: transparent → frosted glass
  const bgOpacity = useTransform(scrollY, [0, 200], [0, 0.9]);
  const blurAmount = useTransform(scrollY, [0, 200], [0, 20]);
  const borderOpacity = useTransform(scrollY, [0, 200], [0, 0.08]);
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
        {/* Left — Logo */}
        <Link href="/" className="flex items-center">
          <NaqiyLogo size="sm" variant="brand" />
        </Link>

        {/* Center — Desktop nav links */}
        <div className="hidden items-center gap-1 md:flex">
          {navRoutes.map((route) => (
            <a
              key={route.href}
              href={route.href}
              className="link-underline rounded-lg px-3 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              {route.label}
            </a>
          ))}
        </div>

        {/* Right — CTA + Mobile hamburger */}
        <div className="flex items-center gap-2">
          {/* Desktop CTA */}
          <a
            href="#"
            className="hidden md:inline-flex items-center gap-2 rounded-full bg-foreground px-5 py-2 font-display font-bold text-sm text-background transition-all duration-200 hover:scale-[1.03] hover:shadow-[0_0_20px_oklch(0.76_0.14_88/15%)]"
          >
            <AppleLogo className="size-4" weight="fill" />
            <GooglePlayLogo className="size-4" weight="fill" />
            <span>Download</span>
          </a>

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
                  <a
                    key={route.href}
                    href={route.href}
                    onClick={() => setIsOpen(false)}
                    className="rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                  >
                    {route.label}
                  </a>
                ))}
                <div className="my-3 h-px bg-border" />
                <a
                  href="#"
                  onClick={() => setIsOpen(false)}
                  className="flex items-center justify-center gap-2 rounded-full bg-foreground px-5 py-2.5 font-display font-bold text-sm text-background transition-all duration-200 hover:scale-[1.02]"
                >
                  <AppleLogo className="size-4" weight="fill" />
                  <GooglePlayLogo className="size-4" weight="fill" />
                  <span>Download</span>
                </a>
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </motion.nav>
  );
}
