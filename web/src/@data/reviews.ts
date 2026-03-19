export type Review = {
  name: string;
  role: string;
  rating: number;
  quote: string;
  initials: string;
};

export const reviews: Review[] = [
  {
    name: "Fatima Benali",
    role: "M\u00e8re de famille, Lyon",
    rating: 5,
    quote:
      "Je fais mes courses en 2 fois moins de temps. Je scanne, je vois le verdict, c\u2019est clair. Plus besoin de chercher les E-trucs sur Google.",
    initials: "FB",
  },
  {
    name: "Youssef Khaldi",
    role: "\u00c9tudiant, Paris",
    rating: 5,
    quote:
      "Le fait de pouvoir choisir son \u00e9cole juridique, c\u2019est exactement ce qui manquait. E471 halal chez les Hanafi, haram chez les Shafi\u2019i\u2026 Enfin une app qui respecte \u00e7a.",
    initials: "YK",
  },
  {
    name: "Amina Diouf",
    role: "Di\u00e9t\u00e9ticienne, Marseille",
    rating: 4,
    quote:
      "Je recommande Naqiy \u00e0 tous mes patients musulmans. Le score de confiance et les sources cit\u00e9es, c\u2019est du s\u00e9rieux. On est loin des apps approximatives.",
    initials: "AD",
  },
  {
    name: "Karim Mansouri",
    role: "Restaurateur, Toulouse",
    rating: 5,
    quote:
      "La carte des magasins m\u2019a fait d\u00e9couvrir un grossiste halal \u00e0 10 minutes de mon restaurant. Les avis et horaires sont \u00e0 jour, c\u2019est pratique.",
    initials: "KM",
  },
  {
    name: "Nadia El Amrani",
    role: "Enseignante, Lille",
    rating: 5,
    quote:
      "Mes enfants scannent tout au supermarch\u00e9 maintenant\u00a0! \u00c7a les \u00e9duque sur ce qu\u2019ils mangent. L\u2019interface est simple, m\u00eame ma m\u00e8re de 65 ans l\u2019utilise.",
    initials: "NA",
  },
  {
    name: "Ibrahim Sylla",
    role: "Ing\u00e9nieur, Bordeaux",
    rating: 4,
    quote:
      "En tant que d\u00e9veloppeur, j\u2019appr\u00e9cie la transparence. Les sources sont cit\u00e9es, les donn\u00e9es viennent d\u2019OpenFoodFacts. Pas de bo\u00eete noire, pas de marketing vide.",
    initials: "IS",
  },
];
