/**
 * Seed — Alertes & Articles réalistes (données Al-Kanz + Optimus)
 *
 * Usage: npx tsx src/db/seed.ts
 *
 * Données inspirées des flux RSS d'Al-Kanz.org (février 2026)
 * et de contenu éditorial Optimus Halal.
 */

import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import { alertCategories, alerts } from "./schema/alerts.js";
import { articles } from "./schema/articles.js";

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error("❌ DATABASE_URL manquante");
  process.exit(1);
}

const pool = new pg.Pool({ connectionString: DATABASE_URL });
const db = drizzle(pool);

// ── Alert Categories ───────────────────────────────────────
const ALERT_CATEGORIES = [
  {
    id: "recall",
    name: "Product Recall",
    nameFr: "Rappel Produit",
    nameAr: "استرجاع منتج",
    icon: "warning",
    color: "#ef4444",
  },
  {
    id: "fraud",
    name: "Halal Fraud",
    nameFr: "Fraude Halal",
    nameAr: "احتيال حلال",
    icon: "gavel",
    color: "#f97316",
  },
  {
    id: "boycott",
    name: "Boycott Alert",
    nameFr: "Alerte Boycott",
    nameAr: "تنبيه مقاطعة",
    icon: "block",
    color: "#dc2626",
  },
  {
    id: "certification",
    name: "Certification Update",
    nameFr: "Mise à jour Certification",
    nameAr: "تحديث الشهادة",
    icon: "verified",
    color: "#1de560",
  },
  {
    id: "community",
    name: "Community Signal",
    nameFr: "Signal Communautaire",
    nameAr: "إشارة مجتمعية",
    icon: "groups",
    color: "#3b82f6",
  },
];

// ── Alerts (données réelles Al-Kanz + RappelConso) ────────
const SEED_ALERTS = [
  {
    title: "Salmonelle : rappel de poulets halal certifiés SFCVH",
    summary:
      "Des poulets halal du producteur belge Plukon, certifiés par la SFCVH (ex-partenaire de la mosquée de Paris), rappelés pour contamination à la salmonelle.",
    content:
      "RappelConso a publié un rappel concernant des poulets certifiés halal par la SFCVH, produits par le fabricant belge Plukon. La salmonelle a été détectée lors de contrôles sanitaires. Les consommateurs ayant acheté ces produits sont invités à ne pas les consommer et à les rapporter en point de vente. La SFCVH est l'ancien partenaire de certification de la mosquée de Paris.",
    severity: "critical" as const,
    priority: "critical" as const,
    categoryId: "recall",
    sourceUrl:
      "https://www.al-kanz.org/2026/02/09/salmonelle-poulets-halal-sfcvh-mosquee-paris/",
    publishedAt: new Date("2026-02-09T10:00:00Z"),
  },
  {
    title: "Salmonelle : rappel de poulets halal Picalou (METRO)",
    summary:
      "METRO procède au rappel de poulets de la marque Picalou estampillés halal suite à la détection de salmonelle.",
    content:
      "La chaîne METRO rappelle des poulets de la marque Picalou vendus sous label halal. La bactérie Salmonella a été détectée dans plusieurs lots. Ce second rappel en quelques jours renforce la vigilance nécessaire sur la chaîne d'approvisionnement de volaille halal en France.",
    severity: "critical" as const,
    priority: "critical" as const,
    categoryId: "recall",
    sourceUrl: "https://www.al-kanz.org/2026/02/04/salmonelle-picalou/",
    publishedAt: new Date("2026-02-04T14:00:00Z"),
  },
  {
    title: "UK : prison ferme pour un grossiste en faux halal",
    summary:
      "Un grossiste britannique condamné à près de 5 ans de prison pour avoir vendu de la viande non certifiée comme halal à des restaurants musulmans.",
    content:
      "Un grossiste en viande au Royaume-Uni a été condamné à près de cinq ans de prison ferme pour avoir systématiquement vendu de la viande non certifiée à des restaurants musulmans tout en falsifiant la documentation halal. Les conditions d'hygiène étaient également déplorables. Ce cas illustre la nécessité de contrôles renforcés dans la filière halal.",
    severity: "warning" as const,
    priority: "high" as const,
    categoryId: "fraud",
    sourceUrl: "https://www.al-kanz.org/2025/07/31/viande-halal-prison/",
    publishedAt: new Date("2026-02-01T09:00:00Z"),
  },
  {
    title: "Isla Délice : son repreneur A&M Capital s'implante en Israël",
    summary:
      "Après le rachat d'Isla Délice, le fonds A&M Capital Europe ouvre une filiale à Tel-Aviv, posant la question d'un boycott BDS.",
    content:
      "Le timing du rachat d'Isla Délice par A&M Capital Europe coïncide avec l'implantation de son partenaire stratégique Alvarez & Marsal en Israël (filiale cyber risk à Tel-Aviv). Cette situation place la marque leader du halal français dans une position délicate auprès des consommateurs sensibles au boycott BDS. Plusieurs associations appellent à la vigilance.",
    severity: "warning" as const,
    priority: "high" as const,
    categoryId: "boycott",
    sourceUrl:
      "https://www.al-kanz.org/2025/12/14/halal-isla-delice-israel/",
    publishedAt: new Date("2026-02-03T08:00:00Z"),
  },
  {
    title: "Carrefour devient actionnaire de HMarket",
    summary:
      "Carrefour investit 10 M€ pour 10 % de HMarket, déclenchant des appels au boycott dans la communauté.",
    content:
      "Carrefour a acquis 10 % du capital de HMarket (enseigne de supermarchés communautaires) pour 10 millions d'euros, dépassant leur simple partenariat logistique antérieur. Cette prise de participation directe a immédiatement déclenché des appels au boycott de la part de la campagne BDS, Carrefour étant déjà ciblé pour ses activités en territoire occupé. HMarket a publié un communiqué réaffirmant sa solidarité palestinienne, sans convaincre.",
    severity: "warning" as const,
    priority: "medium" as const,
    categoryId: "boycott",
    sourceUrl: "https://www.al-kanz.org/2025/09/11/carrefour-hmarket/",
    publishedAt: new Date("2026-01-28T11:00:00Z"),
  },
  {
    title: "A&M Capital rachète Oumaty et Oummi après Isla Délice",
    summary:
      "Le fonds A&M Capital Europe consolide le marché halal français en rachetant les marques Oumaty et Oummi.",
    content:
      "Après le rachat d'Isla Délice en décembre, A&M Capital Europe poursuit sa stratégie de consolidation du marché halal français en acquérant les marques Oumaty et Oummi. Le fonds américain contrôle désormais trois marques majeures du halal en France, couvrant plusieurs segments de marché (charcuterie, surgelés, épicerie). Cette concentration soulève des questions sur l'indépendance de la filière.",
    severity: "info" as const,
    priority: "medium" as const,
    categoryId: "community",
    sourceUrl:
      "https://www.al-kanz.org/2026/01/30/isladelice-am-capital-europe-oumaty-oummi/",
    publishedAt: new Date("2026-01-30T15:00:00Z"),
  },
];

// ── Articles (Al-Kanz partner_news + Optimus editorial) ────
const SEED_ARTICLES = [
  // --- Al-Kanz partner_news (externalLink → redirection) ---
  {
    title: "Quick : 188 restaurants 100 % halal, objectif 300 en 2028",
    slug: "quick-188-restaurants-halal-2028",
    coverImage: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=600&h=400&fit=crop",
    excerpt:
      "La chaîne Quick a converti l'intégralité de ses 188 restaurants au halal certifié ARGML et vise 300 établissements d'ici 2028.",
    author: "Al-Kanz",
    type: "partner_news" as const,
    tags: ["quick", "certification", "ARGML", "restauration"],
    readTimeMinutes: 4,
    externalLink:
      "https://www.al-kanz.org/2025/09/26/187-quick-restaurants-certification-halal/",
    isPublished: true,
    publishedAt: new Date("2026-02-12T09:00:00Z"),
  },
  {
    title: "Isla Délice double sa production dans l'Ain en 4 ans",
    slug: "isla-delice-double-production-ain",
    coverImage: "https://images.unsplash.com/photo-1607623814075-e51df1bdc82f?w=600&h=400&fit=crop",
    excerpt:
      "L'usine Isla Délice dans l'Ain est passée de 2 500 à 5 000 tonnes entre 2022 et 2025. Le leader du halal français accélère.",
    author: "Al-Kanz",
    type: "partner_news" as const,
    tags: ["isla-delice", "production", "industrie", "halal"],
    readTimeMinutes: 3,
    externalLink:
      "https://www.al-kanz.org/2026/02/02/isla-delice-production/",
    isPublished: true,
    publishedAt: new Date("2026-02-10T10:00:00Z"),
  },
  {
    title:
      "Tawakkoul : ces clients qui vérifient la certification halal au restaurant",
    slug: "tawakkoul-verification-certification-restaurant",
    coverImage: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=600&h=400&fit=crop",
    excerpt:
      "De plus en plus de consommateurs demandent à voir le certificat halal avant de commander. Un réflexe salutaire.",
    author: "Al-Kanz",
    type: "partner_news" as const,
    tags: ["tawakkoul", "certification", "restaurant", "consommateur"],
    readTimeMinutes: 5,
    externalLink:
      "https://www.al-kanz.org/2025/02/10/tawakkoul-restaurant-halal/",
    isPublished: true,
    publishedAt: new Date("2026-02-08T14:00:00Z"),
  },
  {
    title: "Le (presque) calendrier des catalogues halal de Carrefour",
    slug: "calendrier-catalogues-halal-carrefour",
    coverImage: "https://images.unsplash.com/photo-1604719312566-8912e9227c6a?w=600&h=400&fit=crop",
    excerpt:
      "Carrefour publie des catalogues halal au rythme irrégulier pour capter la clientèle musulmane. Décryptage.",
    author: "Al-Kanz",
    type: "partner_news" as const,
    tags: ["carrefour", "catalogue", "grande-distribution", "ramadan"],
    readTimeMinutes: 4,
    externalLink:
      "https://www.al-kanz.org/2026/01/16/catalogue-halal-carrefour/",
    isPublished: true,
    publishedAt: new Date("2026-02-05T11:00:00Z"),
  },

  // --- Optimus editorial (content interne) ---
  {
    title: "Calendrier ramadan 2026 : ce que vous devez savoir",
    slug: "calendrier-ramadan-2026-lunaire",
    coverImage: "https://images.unsplash.com/photo-1564121211835-e88c852648ab?w=600&h=400&fit=crop",
    excerpt:
      "Dates, observation du croissant lunaire, calcul astronomique : tout comprendre sur le calendrier du ramadan 2026.",
    content:
      "# Calendrier Ramadan 2026\n\nLes mois du calendrier islamique sont lunaires, pas solaires. Cela signifie que le ramadan avance d'environ 10 jours chaque année.\n\n## L'observation du croissant lunaire\nL'astrophysicienne Fatoumata Kebe rappelle que l'observation du croissant lunaire le 17 février 2026 est « astronomiquement impossible ». Le début du ramadan dépendra de l'observation effective ou du calcul astronomique selon les autorités religieuses consultées.\n\n## Les dates clés\n- **Début probable** : 18 ou 19 février 2026 (selon observation)\n- **Nuit du Destin** : autour du 27e jour\n- **Aïd el-Fitr** : vers le 20 mars 2026\n\n## Préparez-vous avec Optimus\nScannez vos produits du ftour dès maintenant pour vérifier leur conformité halal.",
    author: "Optimus Team",
    type: "educational" as const,
    tags: ["ramadan", "calendrier-lunaire", "2026", "dates"],
    readTimeMinutes: 4,
    isPublished: true,
    publishedAt: new Date("2026-02-14T08:00:00Z"),
  },
  {
    title: "Ramadan : 12 livres à lire pour mieux jeûner et élever son âme",
    slug: "ramadan-12-livres-jeune-spiritualite",
    coverImage: "https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=600&h=400&fit=crop",
    excerpt:
      "Sélection de 12 ouvrages pour nourrir l'esprit pendant le mois du jeûne : spiritualité, Coran, éducation.",
    content:
      "# 12 livres pour le Ramadan\n\nLire pendant le Ramadan est une tradition prophétique. Voici notre sélection de 12 ouvrages pour accompagner votre mois sacré.\n\n## Spiritualité\n1. *Les Secrets du Jeûne* — Abû Hâmid Al-Ghazâlî\n2. *Le Livre de la Patience* — Ibn Qayyim al-Jawziyya\n3. *Revivification des sciences de la religion* — Al-Ghazâlî (extraits)\n\n## Coran & Tafsir\n4. *Le Saint Coran* — traduction Muhammad Hamidullah\n5. *Introduction aux sciences du Coran* — Mustafa Diack\n\n## Éducation & Développement\n6. *Purification du cœur* — Hamza Yusuf\n7. *Al-Bayyinah : la preuve évidente* — Thomas Sibille\n\n## Histoire\n8. *Les Grandes Figures de l'Islam* — Tariq Ramadan\n9. *L'Islam des Lumières* — Malek Chebel\n\nRetrouvez les fiches détaillées dans l'app Optimus Halal, section « Contenus ».",
    author: "Optimus Team",
    type: "educational" as const,
    tags: ["ramadan", "livres", "spiritualité", "lecture"],
    readTimeMinutes: 6,
    isPublished: true,
    publishedAt: new Date("2026-02-11T07:00:00Z"),
  },
  {
    title: "Guide : Comment vérifier un certificat halal en 3 étapes",
    slug: "guide-verifier-certificat-halal",
    coverImage: "https://images.unsplash.com/photo-1450101499163-c8848c66ca85?w=600&h=400&fit=crop",
    excerpt:
      "Ne vous fiez jamais à un simple autocollant. Voici les 3 vérifications à faire avant de faire confiance à un certificat halal.",
    content:
      "# Comment vérifier un certificat halal\n\n## 1. Identifiez l'organisme\nUn vrai certificat mentionne toujours l'organisme de certification (AVS, Achahada, ARGML...). Méfiez-vous des labels génériques sans mention d'organisme.\n\n## 2. Vérifiez sur le site officiel\nChaque organisme publie la liste de ses établissements certifiés. Vérifiez que le restaurant ou la boucherie figure bien dans cette liste.\n\n## 3. Scannez avec Optimus Halal\nNotre app croise les données de tous les organismes reconnus pour vous donner un verdict fiable en un scan.",
    author: "Optimus Team",
    type: "educational" as const,
    tags: ["guide", "certification", "sécurité"],
    readTimeMinutes: 4,
    isPublished: true,
    publishedAt: new Date("2026-02-06T09:00:00Z"),
  },
  {
    title: "Comprendre les labels halal en France : AVS, Achahada, ARGML",
    slug: "comprendre-labels-halal-france",
    coverImage: "https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=600&h=400&fit=crop",
    excerpt:
      "Tous les labels halal ne se valent pas. Décryptage des principaux organismes de certification en France.",
    content:
      "# Les labels halal en France\n\nEn France, plusieurs organismes se partagent la certification halal. Mais tous n'ont pas les mêmes exigences.\n\n## AVS (A Votre Service)\nFondé en 1991, AVS est l'un des organismes les plus stricts. Leurs contrôleurs sont salariés (pas prestataires) et présents lors de chaque abattage.\n\n## Achahada\nOrganisme reconnu, Achahada certifie principalement en Île-de-France.\n\n## ARGML\nLe Rassemblement des Grandes Mosquées de Lyon a ses propres critères de certification.\n\n## Mosquée de Paris\nHistoriquement l'organisme le plus connu, mais contesté pour ses pratiques de sous-traitance via la SFCVH.",
    author: "Optimus Team",
    type: "educational" as const,
    tags: ["labels", "AVS", "ARGML", "certification"],
    readTimeMinutes: 6,
    isPublished: true,
    publishedAt: new Date("2026-02-02T10:00:00Z"),
  },
  {
    title: "Audit halal 2026 : 23 % d'incohérences en grande surface",
    slug: "audit-halal-2026-resultats",
    coverImage: "https://images.unsplash.com/photo-1563013544-824ae1b704d3?w=600&h=400&fit=crop",
    excerpt:
      "Un audit indépendant sur 500 produits estampillés halal en grande surface révèle des résultats préoccupants.",
    content:
      "# Audit Halal 2026\n\nUn audit mené par un consortium indépendant sur 500 produits vendus en grande surface a révélé des résultats préoccupants : 23 % des produits analysés présentent au moins une incohérence entre le label affiché et la composition réelle.\n\nParmi les problèmes identifiés :\n- Gélatine d'origine non précisée (12 %)\n- Arômes contenant de l'alcool (8 %)\n- Certificat expiré ou non renouvelé (3 %)\n\nCes chiffres soulignent la nécessité d'outils comme Optimus Halal pour permettre aux consommateurs de vérifier eux-mêmes la fiabilité des produits.",
    author: "Optimus Team",
    type: "blog" as const,
    tags: ["audit", "transparence", "grande-surface", "industrie"],
    readTimeMinutes: 5,
    isPublished: true,
    publishedAt: new Date("2026-01-25T08:00:00Z"),
  },
];

async function seed() {
  console.log("🌱 Seed en cours...\n");

  // 1. Alert categories (upsert)
  console.log("📁 Catégories d'alertes...");
  for (const cat of ALERT_CATEGORIES) {
    await db
      .insert(alertCategories)
      .values(cat)
      .onConflictDoNothing({ target: alertCategories.id });
  }
  console.log(`   ✅ ${ALERT_CATEGORIES.length} catégories\n`);

  // 2. Alerts
  console.log("🚨 Alertes...");
  for (const alert of SEED_ALERTS) {
    await db.insert(alerts).values(alert).onConflictDoNothing();
  }
  console.log(`   ✅ ${SEED_ALERTS.length} alertes\n`);

  // 3. Articles (check by slug to avoid duplicates)
  console.log("📰 Articles...");
  for (const article of SEED_ARTICLES) {
    await db
      .insert(articles)
      .values(article)
      .onConflictDoNothing({ target: articles.slug });
  }
  console.log(`   ✅ ${SEED_ARTICLES.length} articles\n`);

  console.log("🎉 Seed terminé !");
  await pool.end();
}

seed().catch((err) => {
  console.error("❌ Erreur seed:", err);
  pool.end();
  process.exit(1);
});
