import type { Metadata, Viewport } from "next";
import { Nunito, Nunito_Sans, JetBrains_Mono } from "next/font/google";
import { ThemeProvider } from "@/components/layout/theme-provider";
import { TooltipProvider } from "@/components/ui/tooltip";
import { PostHogProvider } from "@/lib/posthog";
import { TRPCProvider } from "@/lib/trpc-provider";
import { Toaster } from "@/components/ui/sonner";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/next";
import "./globals.css";

const nunito = Nunito({
  variable: "--font-nunito",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800", "900"],
  display: "swap",
});

const nunitoSans = Nunito_Sans({
  variable: "--font-nunito-sans",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800", "900"],
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Naqiy — L'information halal, pure et transparente",
    template: "%s | Naqiy",
  },
  description:
    "Scanne n'importe quel produit alimentaire et obtiens un verdict halal personnalisé selon ton école juridique. 817K+ produits, 140+ additifs, 4 écoles. Gratuit.",
  keywords: [
    "halal",
    "scanner halal",
    "naqiy",
    "produits halal",
    "additifs halal",
    "application halal",
    "halal france",
    "école juridique",
    "madhab",
    "naqiy score",
    "certifieur halal",
    "scanner code barre halal",
    "application musulmane",
    "e471 halal",
    "gélatine halal",
    "additif halal ou haram",
    "est-ce que c'est halal",
    "c'est vraiment halal",
    "boucherie halal près de chez moi",
    "restaurant halal certifié",
    "hanafi halal",
    "lécithine halal",
    "arôme naturel halal",
    "livraison halal",
    "marketplace halal",
    "produit tayyib",
    "halal ou haram",
    "vérifier halal",
  ],
  authors: [{ name: "Naqiy", url: "https://naqiy.app" }],
  creator: "Naqiy",
  publisher: "Naqiy",
  metadataBase: new URL("https://naqiy.app"),
  alternates: {
    canonical: "https://naqiy.app",
    languages: {
      "fr-FR": "https://naqiy.app",
      "x-default": "https://naqiy.app",
    },
  },
  openGraph: {
    type: "website",
    locale: "fr_FR",
    url: "https://naqiy.app",
    title: "Naqiy — Scanne. Comprends. Choisis.",
    description:
      "Un scan, un verdict halal. 817K+ produits analysés, 140+ additifs vérifiés, 12 certifieurs évalués. L'app qui protège ce que ta famille mange. Gratuit.",
    siteName: "Naqiy",
    /* OG image handled via app/opengraph-image.png file convention */
  },
  twitter: {
    card: "summary_large_image",
    title: "Naqiy — Scanne. Comprends. Choisis.",
    description:
      "Un scan, un verdict halal. 817K+ produits, 12 certifieurs évalués. Gratuit.",
    creator: "@naqiy.app",
    site: "@naqiy.app",
    /* Twitter image handled via app/opengraph-image.png file convention */
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  /* Icons handled via Next.js App Router file conventions:
     app/favicon.ico, app/icon.png, app/apple-icon.png */
  category: "technology",
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f5f0e8" },
    { media: "(prefers-color-scheme: dark)", color: "#1a1710" },
  ],
  width: "device-width",
  initialScale: 1,
};

/* ── JSON-LD structured data (static, no user input — safe) ── */

const jsonLdApp = {
  "@context": "https://schema.org",
  "@type": "MobileApplication",
  name: "Naqiy",
  alternateName: "\u0646\u0642\u064A\u0651",
  description:
    "Application de scan halal avec verdict personnalis\u00E9 selon ton \u00E9cole juridique. 817K+ produits, 140+ additifs, 12 certifieurs \u00E9valu\u00E9s.",
  url: "https://naqiy.app",
  applicationCategory: "LifestyleApplication",
  operatingSystem: "iOS, Android",
  offers: {
    "@type": "Offer",
    price: "0",
    priceCurrency: "EUR",
    description: "Gratuit \u2014 scan et verdict halal toujours accessibles",
  },
  author: { "@id": "https://naqiy.app/#organization" },
  inLanguage: ["fr", "en", "ar"],
} as const;

const jsonLdOrg = {
  "@context": "https://schema.org",
  "@type": "Organization",
  "@id": "https://naqiy.app/#organization",
  name: "Naqiy",
  alternateName: "\u0646\u0642\u064A\u0651",
  url: "https://naqiy.app",
  logo: "https://naqiy.app/images/logo_naqiy.webp",
  description:
    "Naqiy d\u00E9crypte chaque produit alimentaire pour que tu puisses nourrir ta famille en confiance.",
  foundingDate: "2025",
  sameAs: [
    "https://instagram.com/naqiy.app",
    "https://x.com/naqiy.app",
    "https://linkedin.com/company/naqiy",
  ],
  contactPoint: {
    "@type": "ContactPoint",
    contactType: "Customer Support",
    email: "support@naqiy.app",
    availableLanguage: ["French", "English", "Arabic"],
  },
} as const;

const jsonLdWebSite = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  "@id": "https://naqiy.app/#website",
  name: "Naqiy",
  alternateName: ["\u0646\u0642\u064A\u0651", "Naqiy App"],
  url: "https://naqiy.app",
  description:
    "Scanne n\u2019importe quel produit alimentaire et obtiens un verdict halal personnalis\u00E9 selon ton \u00E9cole juridique.",
  publisher: { "@id": "https://naqiy.app/#organization" },
  inLanguage: "fr-FR",
  potentialAction: {
    "@type": "SearchAction",
    target: {
      "@type": "EntryPoint",
      urlTemplate: "https://naqiy.app/?q={search_term_string}",
    },
    "query-input": "required name=search_term_string",
  },
} as const;

const jsonLdFaq = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: [
    {
      "@type": "Question",
      name: "Comment savoir si un produit est halal ?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Avec Naqiy, scanne le code-barres du produit. L\u2019app analyse chaque ingr\u00E9dient (E471, g\u00E9latine, l\u00E9cithine\u2026) et te donne un verdict personnalis\u00E9 selon ton \u00E9cole juridique (Hanafi, Maliki, Shafi\u2019i, Hanbali), avec les sources et dalils.",
      },
    },
    {
      "@type": "Question",
      name: "E471 est-il halal ou haram ?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Le E471 (mono- et diglyc\u00E9rides d\u2019acides gras) peut \u00EAtre d\u2019origine animale ou v\u00E9g\u00E9tale. Naqiy v\u00E9rifie la source pour chaque produit et te donne un statut clair adapt\u00E9 \u00E0 ton madhab.",
      },
    },
    {
      "@type": "Question",
      name: "O\u00F9 trouver un restaurant halal certifi\u00E9 pr\u00E8s de chez moi ?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Naqiy r\u00E9f\u00E9rence plus de 383 commerces v\u00E9rifi\u00E9s (boucheries, restaurants, \u00E9piceries) avec certification, horaires en temps r\u00E9el et avis Google int\u00E9gr\u00E9s.",
      },
    },
    {
      "@type": "Question",
      name: "Naqiy est-il gratuit ?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Oui. Le scan et le verdict halal sont gratuits pour toujours. Naqiy est ind\u00E9pendant : aucune pub, aucune revente de donn\u00E9es, aucune marque derri\u00E8re.",
      },
    },
    {
      "@type": "Question",
      name: "Quelle diff\u00E9rence entre halal et tayyib ?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Halal signifie licite selon la loi islamique. Tayyib signifie pur et bon \u2014 cela inclut la qualit\u00E9 nutritionnelle (NutriScore, additifs \u00E0 risque, indice NOVA). Naqiy \u00E9value les deux pour que tu puisses nourrir ta famille en confiance.",
      },
    },
  ],
} as const;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <head>
        <script
          type="application/ld+json"
          // Safe: static constants, no user input — no XSS risk
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdWebSite) }}
        />
        <script
          type="application/ld+json"
          // Safe: static constants, no user input
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdApp) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdOrg) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdFaq) }}
        />
      </head>
      <body
        className={`${nunitoSans.className} ${nunito.variable} ${nunitoSans.variable} ${jetbrainsMono.variable} antialiased`}
        suppressHydrationWarning
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          forcedTheme="light"
          disableTransitionOnChange
        >
          <TooltipProvider>
            <PostHogProvider>
              <TRPCProvider>
                {children}
                <Toaster />
              </TRPCProvider>
            </PostHogProvider>
          </TooltipProvider>
        </ThemeProvider>
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
