import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Naqiy — L'information halal, pure et transparente",
    short_name: "Naqiy",
    description:
      "Scanne n'importe quel produit alimentaire et obtiens un verdict halal personnalisé. 817K+ produits, 140+ additifs, 4 écoles. Gratuit.",
    start_url: "/",
    display: "standalone",
    background_color: "#f5f0e8",
    theme_color: "#D4AF37",
    icons: [
      {
        src: "/icon.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "/favicon.ico",
        sizes: "48x48",
        type: "image/x-icon",
      },
    ],
  };
}
