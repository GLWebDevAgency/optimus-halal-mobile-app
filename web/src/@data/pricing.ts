export type PricingPlan = {
  title: string;
  monthlyPrice: number;
  yearlyPrice: number;
  description: string;
  features: string[];
  isPopular?: boolean;
  cta: string;
};

export const pricingPlans: PricingPlan[] = [
  {
    title: "Gratuit",
    monthlyPrice: 0,
    yearlyPrice: 0,
    description: "L\u2019essentiel pour manger halal en confiance.",
    features: [
      "Scanner de produits illimit\u00e9",
      "Verdict halal de base",
      "Carte des magasins",
      "Alertes \u00e9thiques",
    ],
    cta: "Commencer gratuitement",
  },
  {
    title: "Naqiy+",
    monthlyPrice: 4.99,
    yearlyPrice: 39.99,
    description: "L\u2019exp\u00e9rience halal compl\u00e8te, sans limites.",
    features: [
      "Tout le plan Gratuit",
      "Verdicts par \u00e9cole juridique",
      "Score de confiance d\u00e9taill\u00e9",
      "Sources savantes & fiqh",
      "Alternatives halal sugg\u00e9r\u00e9es",
      "Historique illimit\u00e9",
      "Z\u00e9ro publicit\u00e9",
      "Support prioritaire",
    ],
    isPopular: true,
    cta: "Essai gratuit 7 jours",
  },
  {
    title: "Famille",
    monthlyPrice: 7.99,
    yearlyPrice: 59.99,
    description: "Naqiy+ pour toute la famille, jusqu\u2019\u00e0 5 membres.",
    features: [
      "Tout Naqiy+",
      "Jusqu\u2019\u00e0 5 profils",
      "Pr\u00e9f\u00e9rences par membre",
      "Tableau de bord famille",
      "Partage de favoris",
    ],
    cta: "Essai gratuit 7 jours",
  },
];
