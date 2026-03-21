"use client";

import { useState } from "react";
import Link from "next/link";
import { List } from "@phosphor-icons/react";
import { motion, useScroll, useTransform } from "motion/react";
import { NaqiyLogo } from "@/components/brand/naqiy-logo";
import { Button } from "@/components/ui/button";
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

  // Scroll-reactive transforms: transparent dark → frosted light
  const bgOpacity = useTransform(scrollY, [0, 300], [0, 0.85]);
  const blurAmount = useTransform(scrollY, [0, 300], [0, 20]);
  const borderOpacity = useTransform(scrollY, [0, 300], [0, 0.06]);

  // Text color transitions: white → dark
  const textColor = useTransform(
    scrollY,
    [0, 300],
    ["rgba(255,255,255,0.7)", "rgba(23,23,23,0.7)"]
  );
  const textColorHover = useTransform(
    scrollY,
    [0, 300],
    ["rgba(255,255,255,1)", "rgba(23,23,23,1)"]
  );
  const logoColor = useTransform(
    scrollY,
    [0, 300],
    ["rgba(255,255,255,1)", "rgba(23,23,23,1)"]
  );

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
        <Link href="/" className="flex items-center gap-2.5">
          <motion.span style={{ color: logoColor }} className="text-lg font-bold tracking-tight">
            Naqiy
          </motion.span>
        </Link>

        {/* Center — Desktop nav links */}
        <div className="hidden items-center gap-1 md:flex">
          {navRoutes.map((route) => (
            <motion.a
              key={route.href}
              href={route.href}
              className="rounded-lg px-3 py-1.5 text-sm font-medium transition-colors"
              style={{ color: textColor }}
              whileHover={{ color: textColorHover.get() }}
            >
              {route.label}
            </motion.a>
          ))}
        </div>

        {/* Right — CTA + Mobile hamburger */}
        <div className="flex items-center gap-2">
          {/* Desktop CTA */}
          <Button size="sm" className="hidden md:inline-flex">
            Télécharger
          </Button>

          {/* Mobile hamburger */}
          <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger
              className="inline-flex size-8 items-center justify-center rounded-lg md:hidden"
              aria-label="Ouvrir le menu"
            >
              <motion.span style={{ color: textColor }}>
                <List className="size-5" />
              </motion.span>
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
                <Button
                  size="sm"
                  className="w-full"
                  onClick={() => setIsOpen(false)}
                >
                  Télécharger
                </Button>
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </motion.nav>
  );
}
