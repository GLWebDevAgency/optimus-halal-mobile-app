"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu, Moon, Sun } from "lucide-react";
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
  { href: "#contact", label: "Contact" },
];

export function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const { theme, setTheme } = useTheme();

  return (
    <header className="sticky top-0 z-50 w-full">
      <div className="mx-auto mt-2 flex max-w-5xl items-center justify-between rounded-2xl border border-border/50 bg-background/80 px-4 py-2.5 shadow-sm backdrop-blur-xl lg:mt-4">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5">
          <div className="flex size-8 items-center justify-center rounded-lg bg-primary">
            <span className="text-sm font-bold text-primary-foreground">
              ن
            </span>
          </div>
          <span className="text-lg font-bold tracking-tight">Naqiy</span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden items-center gap-1 lg:flex">
          {navRoutes.map((route) => (
            <Link
              key={route.href}
              href={route.href}
              className="rounded-lg px-3 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
            >
              {route.label}
            </Link>
          ))}
        </nav>

        {/* Right side */}
        <div className="flex items-center gap-2">
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
            className="hidden rounded-lg bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 lg:inline-flex"
          >
            Dashboard
          </Link>

          {/* Mobile Menu */}
          <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger
              className="inline-flex size-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground lg:hidden"
              aria-label="Ouvrir le menu"
            >
              <Menu className="size-4" />
            </SheetTrigger>
            <SheetContent side="right" className="w-72 border-border/50">
              <SheetHeader className="text-left">
                <SheetTitle className="flex items-center gap-2.5">
                  <div className="flex size-7 items-center justify-center rounded-lg bg-primary">
                    <span className="text-xs font-bold text-primary-foreground">
                      ن
                    </span>
                  </div>
                  Naqiy
                </SheetTitle>
              </SheetHeader>
              <nav className="mt-6 flex flex-col gap-1">
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
                  className="flex h-9 items-center justify-center rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
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
