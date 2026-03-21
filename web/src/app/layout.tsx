import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans, JetBrains_Mono, Sora } from "next/font/google";
import { ThemeProvider } from "@/components/layout/theme-provider";
import { TooltipProvider } from "@/components/ui/tooltip";
import "./globals.css";

const plusJakarta = Plus_Jakarta_Sans({
  variable: "--font-plus-jakarta",
  subsets: ["latin"],
  display: "swap",
  weight: ["300", "400", "500", "600", "700", "800"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
  display: "swap",
});

const sora = Sora({
  variable: "--font-sora",
  subsets: ["latin"],
  display: "swap",
  weight: ["400", "500", "600", "700", "800"],
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
  ],
  authors: [{ name: "Naqiy", url: "https://naqiy.app" }],
  creator: "Naqiy",
  metadataBase: new URL("https://naqiy.app"),
  openGraph: {
    type: "website",
    locale: "fr_FR",
    url: "https://naqiy.app",
    title: "Naqiy — L'information halal, pure et transparente",
    description:
      "Scanne n'importe quel produit alimentaire et obtiens un verdict halal personnalisé selon ton école juridique. Gratuit.",
    siteName: "Naqiy",
  },
  twitter: {
    card: "summary_large_image",
    title: "Naqiy — L'information halal, pure et transparente",
    description:
      "Scanne n'importe quel produit et obtiens un verdict halal personnalisé. 817K+ produits. Gratuit.",
    creator: "@naqiyapp",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f5f0e8" },
    { media: "(prefers-color-scheme: dark)", color: "#1a1710" },
  ],
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <body
        className={`${plusJakarta.variable} ${jetbrainsMono.variable} ${sora.variable} antialiased`}
        suppressHydrationWarning
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <TooltipProvider>
            {children}
          </TooltipProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
