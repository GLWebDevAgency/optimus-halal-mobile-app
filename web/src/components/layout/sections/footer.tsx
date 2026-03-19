import Image from "next/image";
import Link from "next/link";
import { InstagramIcon } from "@/components/icons/instagram-icon";
import { XIcon } from "@/components/icons/x-icon";
import { LinkedinIcon } from "@/components/icons/linkedin-icon";

/* ═══════════════════════════════════════════════
   DATA
   ═══════════════════════════════════════════════ */

const footerLinks = {
  produit: [
    { label: "Scanner", href: "#fonctionnalites" },
    { label: "Carte", href: "#fonctionnalites" },
    { label: "Verdicts", href: "#fonctionnalites" },
    { label: "Tarifs", href: "#tarifs" },
  ],
  ressources: [
    { label: "Blog", href: "/blog" },
    { label: "FAQ", href: "#faq" },
    { label: "Contact", href: "#contact" },
    { label: "API", href: "/api" },
  ],
  legal: [
    { label: "CGU", href: "/cgu" },
    { label: "Confidentialité", href: "/confidentialite" },
    { label: "Mentions légales", href: "/mentions-legales" },
    { label: "RGPD", href: "/rgpd" },
  ],
};

const socialLinks = [
  {
    label: "Instagram",
    href: "https://instagram.com/naqiyapp",
    icon: InstagramIcon,
  },
  {
    label: "X",
    href: "https://x.com/naqiyapp",
    icon: XIcon,
  },
  {
    label: "LinkedIn",
    href: "https://linkedin.com/company/naqiy",
    icon: LinkedinIcon,
  },
];

/* ═══════════════════════════════════════════════
   COMPONENT
   ═══════════════════════════════════════════════ */

export function Footer() {
  return (
    <footer className="border-t border-border/50 bg-card/30">
      <div className="container py-16 md:py-20">
        <div className="grid gap-12 sm:grid-cols-2 lg:grid-cols-5">
          {/* ─── Brand column (wider) ─── */}
          <div className="flex flex-col gap-5 lg:col-span-2">
            <Link href="/" className="flex items-center gap-3 w-fit">
              <Image
                src="/images/logo_naqiy.webp"
                alt="Naqiy"
                width={40}
                height={40}
                className="size-10 rounded-lg"
              />
              <span className="text-xl font-bold text-gold-gradient">
                Naqiy
              </span>
            </Link>
            <p className="max-w-xs text-sm leading-relaxed text-muted-foreground">
              L&apos;information halal, pure et transparente.
            </p>
          </div>

          {/* ─── Produit ─── */}
          <div className="flex flex-col gap-4">
            <h3 className="text-sm font-semibold tracking-wide uppercase text-foreground/80">
              Produit
            </h3>
            <ul className="flex flex-col gap-2.5">
              {footerLinks.produit.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* ─── Ressources ─── */}
          <div className="flex flex-col gap-4">
            <h3 className="text-sm font-semibold tracking-wide uppercase text-foreground/80">
              Ressources
            </h3>
            <ul className="flex flex-col gap-2.5">
              {footerLinks.ressources.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* ─── Légal ─── */}
          <div className="flex flex-col gap-4">
            <h3 className="text-sm font-semibold tracking-wide uppercase text-foreground/80">
              Légal
            </h3>
            <ul className="flex flex-col gap-2.5">
              {footerLinks.legal.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* ─── Divider ─── */}
        <div className="divider-gold my-10" />

        {/* ─── Bottom bar ─── */}
        <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
          <p className="text-sm text-muted-foreground">
            &copy; 2026 Naqiy. Tous droits réservés.
          </p>

          <div className="flex items-center gap-5">
            {socialLinks.map((social) => {
              const Icon = social.icon;
              return (
                <a
                  key={social.label}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-muted-foreground transition-colors hover:text-gold"
                  aria-label={social.label}
                >
                  <Icon className="size-5" />
                </a>
              );
            })}
          </div>
        </div>
      </div>
    </footer>
  );
}
