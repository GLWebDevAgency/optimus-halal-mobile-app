/**
 * Articles seed adapter — called by run-all.ts
 *
 * Seeds editorial content: Al-Kanz partner news + Optimus educational articles.
 */

import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import { articles } from "../schema/articles.js";

const SEED_ARTICLES = [
  { title: "Quick : 188 restaurants 100 % halal, objectif 300 en 2028", slug: "quick-188-restaurants-halal-2028", coverImage: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=600&h=400&fit=crop", excerpt: "La chaîne Quick a converti l'intégralité de ses 188 restaurants au halal certifié ARGML et vise 300 établissements d'ici 2028.", author: "Al-Kanz", type: "partner_news" as const, tags: ["quick", "certification", "ARGML", "restauration"], readTimeMinutes: 4, externalLink: "https://www.al-kanz.org/2025/09/26/187-quick-restaurants-certification-halal/", isPublished: true, publishedAt: new Date("2026-02-12T09:00:00Z") },
  { title: "Isla Délice double sa production dans l'Ain en 4 ans", slug: "isla-delice-double-production-ain", coverImage: "https://images.unsplash.com/photo-1607623814075-e51df1bdc82f?w=600&h=400&fit=crop", excerpt: "L'usine Isla Délice dans l'Ain est passée de 2 500 à 5 000 tonnes entre 2022 et 2025.", author: "Al-Kanz", type: "partner_news" as const, tags: ["isla-delice", "production", "industrie", "halal"], readTimeMinutes: 3, externalLink: "https://www.al-kanz.org/2026/02/02/isla-delice-production/", isPublished: true, publishedAt: new Date("2026-02-10T10:00:00Z") },
  { title: "Tawakkoul : ces clients qui vérifient la certification halal au restaurant", slug: "tawakkoul-verification-certification-restaurant", coverImage: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=600&h=400&fit=crop", excerpt: "De plus en plus de consommateurs demandent à voir le certificat halal avant de commander.", author: "Al-Kanz", type: "partner_news" as const, tags: ["tawakkoul", "certification", "restaurant", "consommateur"], readTimeMinutes: 5, externalLink: "https://www.al-kanz.org/2025/02/10/tawakkoul-restaurant-halal/", isPublished: true, publishedAt: new Date("2026-02-08T14:00:00Z") },
  { title: "Le (presque) calendrier des catalogues halal de Carrefour", slug: "calendrier-catalogues-halal-carrefour", coverImage: "https://images.unsplash.com/photo-1604719312566-8912e9227c6a?w=600&h=400&fit=crop", excerpt: "Carrefour publie des catalogues halal au rythme irrégulier pour capter la clientèle musulmane.", author: "Al-Kanz", type: "partner_news" as const, tags: ["carrefour", "catalogue", "grande-distribution", "ramadan"], readTimeMinutes: 4, externalLink: "https://www.al-kanz.org/2026/01/16/catalogue-halal-carrefour/", isPublished: true, publishedAt: new Date("2026-02-05T11:00:00Z") },
  { title: "Calendrier ramadan 2026 : ce que vous devez savoir", slug: "calendrier-ramadan-2026-lunaire", coverImage: "https://images.unsplash.com/photo-1564121211835-e88c852648ab?w=600&h=400&fit=crop", excerpt: "Dates, observation du croissant lunaire, calcul astronomique : tout comprendre sur le calendrier du ramadan 2026.", content: "# Calendrier Ramadan 2026\n\nLes mois du calendrier islamique sont lunaires, pas solaires.\n\n## Dates clés\n- Début probable : 18 ou 19 février 2026\n- Nuit du Destin : autour du 27e jour\n- Aïd el-Fitr : vers le 20 mars 2026", author: "Optimus Team", type: "educational" as const, tags: ["ramadan", "calendrier-lunaire", "2026"], readTimeMinutes: 4, isPublished: true, publishedAt: new Date("2026-02-14T08:00:00Z") },
  { title: "Guide : Comment vérifier un certificat halal en 3 étapes", slug: "guide-verifier-certificat-halal", coverImage: "https://images.unsplash.com/photo-1450101499163-c8848c66ca85?w=600&h=400&fit=crop", excerpt: "Ne vous fiez jamais à un simple autocollant. Voici les 3 vérifications à faire.", content: "# Comment vérifier un certificat halal\n\n## 1. Identifiez l'organisme\n## 2. Vérifiez sur le site officiel\n## 3. Scannez avec Optimus Halal", author: "Optimus Team", type: "educational" as const, tags: ["guide", "certification", "sécurité"], readTimeMinutes: 4, isPublished: true, publishedAt: new Date("2026-02-06T09:00:00Z") },
  { title: "Comprendre les labels halal en France : AVS, Achahada, ARGML", slug: "comprendre-labels-halal-france", coverImage: "https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=600&h=400&fit=crop", excerpt: "Tous les labels halal ne se valent pas. Décryptage des principaux organismes de certification en France.", content: "# Les labels halal en France\n\n## AVS\nFondé en 1991, AVS est l'un des organismes les plus stricts.\n\n## Achahada\nOrganisme reconnu en Île-de-France.\n\n## ARGML\nRassemblement des Grandes Mosquées de Lyon.", author: "Optimus Team", type: "educational" as const, tags: ["labels", "AVS", "ARGML", "certification"], readTimeMinutes: 6, isPublished: true, publishedAt: new Date("2026-02-02T10:00:00Z") },
  { title: "Audit halal 2026 : 23 % d'incohérences en grande surface", slug: "audit-halal-2026-resultats", coverImage: "https://images.unsplash.com/photo-1563013544-824ae1b704d3?w=600&h=400&fit=crop", excerpt: "Un audit indépendant sur 500 produits estampillés halal en grande surface révèle des résultats préoccupants.", content: "# Audit Halal 2026\n\nUn audit mené sur 500 produits a révélé que 23 % présentent au moins une incohérence.", author: "Optimus Team", type: "blog" as const, tags: ["audit", "transparence", "grande-surface"], readTimeMinutes: 5, isPublished: true, publishedAt: new Date("2026-01-25T08:00:00Z") },
];

export async function seedArticles(db: PostgresJsDatabase): Promise<number> {
  let count = 0;

  for (const article of SEED_ARTICLES) {
    await db.insert(articles).values(article).onConflictDoNothing({ target: articles.slug });
    count++;
  }

  return count;
}
