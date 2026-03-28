import type { MetadataRoute } from "next";

/**
 * Web App Manifest — PWA-ready, Google-optimized.
 *
 * - 192x192 + 512x512 icons (PWA install requirement)
 * - maskable purpose for adaptive icons on Android
 * - Categories for store/search discoverability
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Naqiy — L'information halal, pure et transparente",
    short_name: "Naqiy",
    description:
      "Scanne n'importe quel produit alimentaire et obtiens un verdict halal personnalisé. 817K+ produits, 140+ additifs, 4 écoles. Gratuit.",
    start_url: "/",
    id: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#f5f0e8",
    theme_color: "#D4AF37",
    lang: "fr",
    dir: "ltr",
    categories: ["food", "lifestyle", "health"],
    icons: [
      {
        src: "/icon.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icon.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "maskable",
      },
      {
        src: "/favicon.ico",
        sizes: "16x16 32x32 48x48",
        type: "image/x-icon",
      },
    ],
  };
}
