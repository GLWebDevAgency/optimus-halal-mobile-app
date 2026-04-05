import { Envelope, Leaf } from "@phosphor-icons/react";
import { NaqiyLogo } from "@/components/brand/naqiy-logo";
import { InstagramIcon } from "@/components/icons/instagram-icon";
import { FacebookIcon } from "@/components/icons/facebook-icon";
import { XIcon } from "@/components/icons/x-icon";
import { LinkedinIcon } from "@/components/icons/linkedin-icon";

const socialLinks = [
  {
    label: "Instagram",
    href: "https://instagram.com/naqiy.app",
    icon: InstagramIcon,
    active: true,
  },
  {
    label: "Facebook",
    href: "https://www.facebook.com/share/1F9U3BTZW3/",
    icon: FacebookIcon,
    active: true,
  },
  {
    label: "X",
    href: "https://x.com/naqiy.app",
    icon: XIcon,
    active: false,
  },
  {
    label: "LinkedIn",
    href: "https://linkedin.com/company/naqiy",
    icon: LinkedinIcon,
    active: false,
  },
];

export function Footer() {
  return (
    <footer className="relative bg-foreground pt-16 pb-8 overflow-hidden">
      <div className="mx-auto max-w-6xl px-6 relative z-10">
        <div className="grid gap-12 md:grid-cols-4">
          {/* Col 1 — Brand */}
          <div>
            <NaqiyLogo size="sm" className="text-white" />
            <p className="mt-3 text-sm text-white/50">
              Scanne. Comprends. Choisis.
            </p>
            <div className="mt-5 flex gap-3">
              {socialLinks.filter((s) => s.active).map((social) => {
                const Icon = social.icon;
                return (
                  <a
                    key={social.label}
                    href={social.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex size-9 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-white/60 transition-all duration-300 hover:text-white hover:border-gold/30 hover:bg-gold/10"
                    aria-label={social.label}
                  >
                    <Icon className="size-4" />
                  </a>
                );
              })}
            </div>
          </div>

          {/* Col 2 — Produit */}
          <div>
            <h3 className="mb-4 text-xs font-semibold text-white/70 uppercase tracking-wider">Produit</h3>
            <ul className="flex flex-col gap-2.5">
              <li>
                <a
                  href="#features"
                  className="link-underline text-sm text-white/50 transition-colors duration-200 hover:text-white"
                >
                  Fonctionnalités
                </a>
              </li>
              <li>
                <a
                  href="#pricing"
                  className="link-underline text-sm text-white/50 transition-colors duration-200 hover:text-white"
                >
                  Tarifs
                </a>
              </li>
              <li>
                <a
                  href="#waitlist"
                  className="link-underline text-sm text-white/50 transition-colors duration-200 hover:text-white"
                >
                  Liste d&apos;attente
                </a>
              </li>
            </ul>
          </div>

          {/* Col 3 — Légal */}
          <div>
            <h3 className="mb-4 text-xs font-semibold text-white/70 uppercase tracking-wider">Légal</h3>
            <ul className="flex flex-col gap-2.5">
              <li>
                <a
                  href="/cgu"
                  className="link-underline text-sm text-white/50 transition-colors duration-200 hover:text-white"
                >
                  Conditions d&apos;utilisation
                </a>
              </li>
              <li>
                <a
                  href="/confidentialite"
                  className="link-underline text-sm text-white/50 transition-colors duration-200 hover:text-white"
                >
                  Politique de confidentialité
                </a>
              </li>
              <li>
                <a
                  href="/mentions-legales"
                  className="link-underline text-sm text-white/50 transition-colors duration-200 hover:text-white"
                >
                  Mentions légales
                </a>
              </li>
            </ul>
          </div>

          {/* Col 4 — Contact */}
          <div>
            <h3 className="mb-4 text-xs font-semibold text-white/70 uppercase tracking-wider">Contact</h3>
            <ul className="flex flex-col gap-2.5">
              <li>
                <a
                  href="mailto:contact@naqiy.app"
                  className="inline-flex items-center gap-2 text-sm text-white/50 transition-colors duration-200 hover:text-white/90"
                >
                  <Envelope className="size-3.5" weight="duotone" />
                  contact@naqiy.app
                </a>
              </li>
              <li>
                <a
                  href="mailto:support@naqiy.app"
                  className="inline-flex items-center gap-2 text-sm text-white/50 transition-colors duration-200 hover:text-white/90"
                >
                  <Envelope className="size-3.5" weight="duotone" />
                  support@naqiy.app
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-12 pt-6">
          <div className="h-px divider-gold mb-6" />
          <div className="flex flex-col items-center justify-between gap-3 sm:flex-row">
            <p className="text-xs text-white/30">
              &copy; 2026 Naqiy&reg;. Tous droits réservés.
            </p>
            <p className="inline-flex items-center gap-1 text-xs text-white/30">
              Réalisation web & mobile <Leaf className="size-3 text-leaf" weight="fill" />{" "}
              <a
                href="https://www.linkedin.com/in/ghassene-limame-8a2793ba"
                target="_blank"
                rel="noopener noreferrer"
                className="font-semibold transition-opacity hover:opacity-80"
              >
                <span className="text-gold-gradient">LIMAME Ghassen</span><span className="text-leaf">e</span>
              </a>
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
