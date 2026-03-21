import { NaqiyLogo } from "@/components/brand/naqiy-logo";
import { InstagramIcon } from "@/components/icons/instagram-icon";
import { XIcon } from "@/components/icons/x-icon";
import { LinkedinIcon } from "@/components/icons/linkedin-icon";

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
    <footer className="border-t border-white/10 bg-[#0a0a0a] py-16">
      <div className="mx-auto max-w-6xl px-6">
        <div className="grid gap-12 md:grid-cols-4">
          {/* Col 1 — Brand */}
          <div>
            <NaqiyLogo size="sm" />
            <p className="mt-3 text-sm text-white/40">
              Scanne. Comprends. Choisis.
            </p>
            <div className="mt-4 flex gap-3">
              {socialLinks.map((social) => {
                const Icon = social.icon;
                return (
                  <a
                    key={social.label}
                    href={social.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-white/40 transition-colors hover:text-white"
                    aria-label={social.label}
                  >
                    <Icon className="size-5" />
                  </a>
                );
              })}
            </div>
          </div>

          {/* Col 2 — Produit */}
          <div>
            <h3 className="mb-4 text-sm font-semibold text-white">Produit</h3>
            <ul className="flex flex-col gap-2.5">
              <li>
                <a
                  href="#features"
                  className="text-sm text-white/50 transition hover:text-white"
                >
                  Fonctionnalités
                </a>
              </li>
              <li>
                <a
                  href="#pricing"
                  className="text-sm text-white/50 transition hover:text-white"
                >
                  Tarifs
                </a>
              </li>
            </ul>
          </div>

          {/* Col 3 — Légal */}
          <div>
            <h3 className="mb-4 text-sm font-semibold text-white">Légal</h3>
            <ul className="flex flex-col gap-2.5">
              <li>
                <a
                  href="/cgu"
                  className="text-sm text-white/50 transition hover:text-white"
                >
                  Conditions d&apos;utilisation
                </a>
              </li>
              <li>
                <a
                  href="/confidentialite"
                  className="text-sm text-white/50 transition hover:text-white"
                >
                  Politique de confidentialité
                </a>
              </li>
              <li>
                <a
                  href="/mentions-legales"
                  className="text-sm text-white/50 transition hover:text-white"
                >
                  Mentions légales
                </a>
              </li>
            </ul>
          </div>

          {/* Col 4 — Contact */}
          <div>
            <h3 className="mb-4 text-sm font-semibold text-white">Contact</h3>
            <ul className="flex flex-col gap-2.5">
              <li>
                <span className="text-sm text-white/50">
                  contact@naqiy.app
                </span>
              </li>
              <li>
                <span className="text-sm text-white/50">
                  support@naqiy.app
                </span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-12 border-t border-white/10 pt-8">
          <p className="text-center text-xs text-white/30">
            &copy; 2026 Naqiy. Tous droits réservés.
          </p>
        </div>
      </div>
    </footer>
  );
}
