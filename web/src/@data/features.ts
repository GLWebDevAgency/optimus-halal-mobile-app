import {
  Barcode,
  Scales,
  MapPin,
  ShieldCheck,
  Database,
  Users,
} from "@phosphor-icons/react";
import type { IconProps } from "@phosphor-icons/react";

export type Feature = {
  icon: React.ComponentType<IconProps>;
  title: string;
  description: string;
};

export const features: Feature[] = [
  {
    icon: Barcode,
    title: "Scanner IA",
    description:
      "Scanne n\u2019importe quel produit. Notre IA analyse les ingr\u00e9dients et te donne un verdict halal instantan\u00e9.",
  },
  {
    icon: Scales,
    title: "Verdicts par \u00e9cole",
    description:
      "Hanafi, Maliki, Shafi\u2019i, Hanbali \u2014 chaque \u00e9cole a son avis. Choisis celle qui te correspond.",
  },
  {
    icon: MapPin,
    title: "Carte des magasins",
    description:
      "Trouve les boucheries, \u00e9piceries et restaurants halal autour de toi avec avis et horaires.",
  },
  {
    icon: ShieldCheck,
    title: "Score de confiance",
    description:
      "Un score transparent bas\u00e9 sur les certifications, les ingr\u00e9dients et les sources savantes.",
  },
  {
    icon: Database,
    title: "817K+ Produits",
    description:
      "La plus grande base de donn\u00e9es halal de France, enrichie quotidiennement depuis OpenFoodFacts.",
  },
  {
    icon: Users,
    title: "Communaut\u00e9",
    description:
      "Signale, corrige, partage. Ensemble, on construit la r\u00e9f\u00e9rence halal.",
  },
];
