import { Zap, BookOpen, Heart, FileSearch } from "lucide-react";
import type { LucideIcon } from "lucide-react";

export type Benefit = {
  icon: LucideIcon;
  title: string;
  description: string;
};

export const benefits: Benefit[] = [
  {
    icon: Zap,
    title: "Scanne en 1 seconde",
    description:
      "Pointe ton t\u00e9l\u00e9phone, obtiens un verdict. Pas de compte requis.",
  },
  {
    icon: BookOpen,
    title: "Respecte ton \u00e9cole",
    description:
      "140+ additifs analys\u00e9s selon les 4 \u00e9coles juridiques. E471 peut \u00eatre halal pour certains, haram pour d\u2019autres.",
  },
  {
    icon: Heart,
    title: "Z\u00e9ro compromis \u00e9thique",
    description:
      "L\u2019information halal de base est gratuite. Toujours. Pas de dark patterns, pas de pub intrusive.",
  },
  {
    icon: FileSearch,
    title: "Donn\u00e9es v\u00e9rifiables",
    description:
      "Chaque verdict cite ses sources\u00a0: certifications, \u00e9tudes savantes, analyses de laboratoire.",
  },
];
