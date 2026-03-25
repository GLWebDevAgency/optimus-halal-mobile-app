import type { Metadata, Viewport } from "next";
import { Nunito, Nunito_Sans, JetBrains_Mono } from "next/font/google";
import { ThemeProvider } from "@/components/layout/theme-provider";
import { TooltipProvider } from "@/components/ui/tooltip";
import { PostHogProvider } from "@/lib/posthog";
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
  ],
  authors: [{ name: "Naqiy", url: "https://naqiy.app" }],
  creator: "Naqiy",
  publisher: "Naqiy",
  metadataBase: new URL("https://naqiy.app"),
  alternates: {
    canonical: "https://naqiy.app",
  },
  openGraph: {
    type: "website",
    locale: "fr_FR",
    url: "https://naqiy.app",
    title: "Naqiy — Scanne. Comprends. Choisis.",
    description:
      "Un scan, un verdict halal. 817K+ produits analysés, 140+ additifs vérifiés, 12 certifieurs évalués. L'app qui protège ce que ta famille mange. Gratuit.",
    siteName: "Naqiy",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Naqiy — L'information halal, pure et transparente",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Naqiy — Scanne. Comprends. Choisis.",
    description:
      "Un scan, un verdict halal. 817K+ produits, 12 certifieurs évalués. Gratuit.",
    creator: "@naqiyapp",
    site: "@naqiyapp",
    images: ["/og-image.png"],
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

const jsonLd = {
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
  author: {
    "@type": "Organization",
    name: "Naqiy",
    url: "https://naqiy.app",
    logo: "https://naqiy.app/images/logo_naqiy_full.png",
    sameAs: [
      "https://twitter.com/naqiyapp",
      "https://instagram.com/naqiyapp",
    ],
  },
  inLanguage: ["fr", "en", "ar"],
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
          // Safe: jsonLd is a static constant, no user input
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
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
              {children}
            </PostHogProvider>
          </TooltipProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
