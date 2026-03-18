export type FaqItem = {
  question: string;
  answer: string;
};

export const faqItems: FaqItem[] = [
  {
    question: "Comment fonctionne le scanner\u00a0?",
    answer:
      "Pointe la cam\u00e9ra de ton t\u00e9l\u00e9phone vers le code-barres d\u2019un produit. Notre IA analyse instantan\u00e9ment la liste des ingr\u00e9dients, croise les donn\u00e9es avec notre base de 817K+ produits et te donne un verdict halal en moins d\u2019une seconde.",
  },
  {
    question: "Comment sont d\u00e9termin\u00e9s les verdicts halal\u00a0?",
    answer:
      "Nos verdicts reposent sur l\u2019analyse de 140+ additifs selon les 4 \u00e9coles juridiques (Hanafi, Maliki, Shafi\u2019i, Hanbali). Chaque additif est \u00e9valu\u00e9 avec des sources savantes, des certifications reconnues et des analyses de laboratoire. Un m\u00eame produit peut avoir un verdict diff\u00e9rent selon l\u2019\u00e9cole choisie.",
  },
  {
    question: "L\u2019application est-elle gratuite\u00a0?",
    answer:
      "Oui, le scanner de produits, le verdict halal de base et la carte des magasins sont enti\u00e8rement gratuits. Naqiy+ d\u00e9bloque les verdicts par \u00e9cole juridique, le score de confiance d\u00e9taill\u00e9, les sources savantes et bien plus pour 4,99\u00a0\u20ac/mois ou 39,99\u00a0\u20ac/an.",
  },
  {
    question: "Quelles \u00e9coles juridiques sont support\u00e9es\u00a0?",
    answer:
      "Naqiy couvre les 4 grandes \u00e9coles sunnites\u00a0: Hanafi, Maliki, Shafi\u2019i et Hanbali. Chaque \u00e9cole a ses propres crit\u00e8res d\u2019\u00e9valuation des ingr\u00e9dients. Par exemple, la g\u00e9latine bovine non certifi\u00e9e est consid\u00e9r\u00e9e diff\u00e9remment selon les \u00e9coles.",
  },
  {
    question: "D\u2019o\u00f9 viennent vos donn\u00e9es\u00a0?",
    answer:
      "Notre base de donn\u00e9es combine OpenFoodFacts (817K+ produits), les certifications d\u2019organismes reconnus (AVS, Achahada, ARGML, etc.), des \u00e9tudes de fiqh et des analyses de laboratoire. Toutes les sources sont cit\u00e9es et v\u00e9rifiables.",
  },
  {
    question: "Mes donn\u00e9es sont-elles prot\u00e9g\u00e9es\u00a0?",
    answer:
      "Absolument. Naqiy est conforme au RGPD. Nous ne vendons jamais vos donn\u00e9es, les communications sont chiffr\u00e9es, et vous pouvez supprimer votre compte et toutes vos donn\u00e9es \u00e0 tout moment depuis l\u2019application.",
  },
  {
    question: "Puis-je contribuer \u00e0 la base de donn\u00e9es\u00a0?",
    answer:
      "Oui\u00a0! La communaut\u00e9 Naqiy peut signaler des erreurs, sugg\u00e9rer des corrections et partager des informations sur les produits. Chaque contribution est v\u00e9rifi\u00e9e avant d\u2019\u00eatre int\u00e9gr\u00e9e. Ensemble, on construit la r\u00e9f\u00e9rence halal en France.",
  },
  {
    question: "Comment fonctionne l\u2019essai gratuit\u00a0?",
    answer:
      "L\u2019essai gratuit de Naqiy+ dure 7 jours. Tu as acc\u00e8s \u00e0 toutes les fonctionnalit\u00e9s premium sans engagement. Tu peux annuler \u00e0 tout moment avant la fin de l\u2019essai sans \u00eatre d\u00e9bit\u00e9. Aucune surprise, aucun frais cach\u00e9.",
  },
];
