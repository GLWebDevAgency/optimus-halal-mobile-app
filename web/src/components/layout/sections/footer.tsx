import Link from "next/link";
import { Separator } from "@/components/ui/separator";
import { InstagramIcon } from "@/components/icons/instagram-icon";
import { XIcon } from "@/components/icons/x-icon";
import { LinkedinIcon } from "@/components/icons/linkedin-icon";

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

export function Footer() {
  return (
    <footer className="border-t border-border bg-card/50">
      <div className="container py-12 md:py-16">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
          {/* Brand */}
          <div className="flex flex-col gap-4">
            <Link
              href="/"
              className="text-xl font-bold text-gold-gradient inline-block w-fit"
            >
              Naqiy
            </Link>
            <p className="text-sm text-muted-foreground leading-relaxed">
              L&apos;information halal, pure et transparente. Scanne.
              Comprends. Choisis.
            </p>
          </div>

          {/* Produit */}
          <div className="flex flex-col gap-3">
            <h3 className="text-sm font-semibold">Produit</h3>
            <ul className="flex flex-col gap-2">
              {footerLinks.produit.map((link) => (
                <li key={link.label}>
                  <a
                    href={link.href}
                    className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Ressources */}
          <div className="flex flex-col gap-3">
            <h3 className="text-sm font-semibold">Ressources</h3>
            <ul className="flex flex-col gap-2">
              {footerLinks.ressources.map((link) => (
                <li key={link.label}>
                  <a
                    href={link.href}
                    className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Légal */}
          <div className="flex flex-col gap-3">
            <h3 className="text-sm font-semibold">Légal</h3>
            <ul className="flex flex-col gap-2">
              {footerLinks.legal.map((link) => (
                <li key={link.label}>
                  <a
                    href={link.href}
                    className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <Separator className="my-8" />

        {/* Bottom row */}
        <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
          <p className="text-sm text-muted-foreground">
            &copy; {new Date().getFullYear()} Naqiy. Tous droits réservés.
          </p>

          <div className="flex items-center gap-4">
            {socialLinks.map((social) => {
              const Icon = social.icon;
              return (
                <a
                  key={social.label}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-muted-foreground transition-colors hover:text-primary"
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
