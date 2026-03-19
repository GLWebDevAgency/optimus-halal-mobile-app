"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { List, Moon, Sun } from "@phosphor-icons/react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

const navRoutes = [
  { href: "#fonctionnalites", label: "Fonctionnalités" },
  { href: "#comment-ca-marche", label: "Comment ça marche" },
  { href: "#tarifs", label: "Tarifs" },
  { href: "#faq", label: "FAQ" },
];

export function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const { theme, setTheme } = useTheme();

  return (
    <header className="fixed top-0 z-50 w-full">
      <div className="mx-auto mt-3 flex max-w-4xl items-center justify-between rounded-2xl border border-border/40 bg-background/70 px-4 py-2 shadow-sm backdrop-blur-2xl lg:mt-5">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5">
          <Image
            src="/images/logo_naqiy.webp"
            alt="Naqiy"
            width={30}
            height={30}
            className="rounded-lg"
          />
          <span className="text-lg font-bold tracking-tight">Naqiy</span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden items-center gap-0.5 lg:flex">
          {navRoutes.map((route) => (
            <Link
              key={route.href}
              href={route.href}
              className="rounded-lg px-3 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              {route.label}
            </Link>
          ))}
        </nav>

        {/* Right side */}
        <div className="flex items-center gap-1.5">
          {/* Theme toggle */}
          <Button
            variant="ghost"
            size="icon"
            className="size-8 rounded-lg"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            aria-label="Changer le thème"
          >
            <Sun className="size-4 rotate-0 scale-100 transition-transform dark:-rotate-90 dark:scale-0" />
            <Moon className="absolute size-4 rotate-90 scale-0 transition-transform dark:rotate-0 dark:scale-100" />
          </Button>

          {/* Desktop CTA */}
          <Link
            href="/admin"
            className="hidden rounded-lg bg-primary px-3.5 py-1.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 lg:inline-flex"
          >
            Dashboard
          </Link>

          {/* Mobile Menu */}
          <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger
              className="inline-flex size-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:text-foreground lg:hidden"
              aria-label="Ouvrir le menu"
            >
              <List className="size-4" />
            </SheetTrigger>
            <SheetContent side="right" className="w-72 border-border/40">
              <SheetHeader className="text-left">
                <SheetTitle className="flex items-center gap-2.5">
                  <Image
                    src="/images/logo_naqiy.webp"
                    alt="Naqiy"
                    width={24}
                    height={24}
                    className="rounded-md"
                  />
                  Naqiy
                </SheetTitle>
              </SheetHeader>
              <nav className="mt-6 flex flex-col gap-0.5">
                {navRoutes.map((route) => (
                  <Link
                    key={route.href}
                    href={route.href}
                    onClick={() => setIsOpen(false)}
                    className={cn(
                      "rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground",
                      "transition-colors hover:bg-accent hover:text-foreground"
                    )}
                  >
                    {route.label}
                  </Link>
                ))}
                <div className="my-3 h-px bg-border" />
                <Link
                  href="/admin"
                  onClick={() => setIsOpen(false)}
                  className="flex h-9 items-center justify-center rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
                >
                  Dashboard
                </Link>
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
