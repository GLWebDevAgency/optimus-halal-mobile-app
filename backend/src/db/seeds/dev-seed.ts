/**
 * Dev Seed — Fake data for local visual development
 *
 * Usage: pnpm tsx --env-file=.env src/db/seeds/dev-seed.ts
 *
 * Creates:
 * - 1 dev user (dev@naqiy.fr / password123)
 * - 10 product categories
 * - 20 halal products (mixed statuses)
 * - 5 alert categories + 8 alerts
 * - 6 articles (blog, educational, partner_news)
 * - 3 favorite folders + 6 favorites
 * - 10 scans history
 * - 5 notifications
 *
 * Idempotent: uses ON CONFLICT upserts, safe to re-run.
 */

import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import { sql } from "drizzle-orm";
import { hash } from "argon2";
import * as schema from "../schema/index.js";

const {
  users,
  products,
  categories,
  alerts,
  alertCategories,
  articles,
  favorites,
  favoriteFolders,
  scans,
  notifications,
  notificationSettings,
  admins,
  waitlistLeads,
  devices,
} = schema;

// ── Stable UUIDs for dev (deterministic, no collisions) ─────
const DEV_USER_ID = "00000000-0000-4000-a000-000000000001";
const PRODUCT_IDS = Array.from({ length: 20 }, (_, i) =>
  `00000000-0000-4000-b000-${String(i + 1).padStart(12, "0")}`
);
const FOLDER_IDS = Array.from({ length: 3 }, (_, i) =>
  `00000000-0000-4000-c000-${String(i + 1).padStart(12, "0")}`
);
const ALERT_IDS = Array.from({ length: 8 }, (_, i) =>
  `00000000-0000-4000-d000-${String(i + 1).padStart(12, "0")}`
);
const ARTICLE_IDS = Array.from({ length: 6 }, (_, i) =>
  `00000000-0000-4000-e000-${String(i + 1).padStart(12, "0")}`
);

function daysAgo(n: number): Date {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d;
}

async function main() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.error("DATABASE_URL is required");
    process.exit(1);
  }

  const client = new pg.Client({ connectionString: databaseUrl });
  await client.connect();
  const db = drizzle(client, { schema });

  console.log("━━━ Naqiy — Dev Seed ━━━\n");

  // ── 1. Dev User ───────────────────────────────────────────
  console.log("▶ Phase 1: Dev User");
  const passwordHash = await hash("password123");

  await db
    .insert(users)
    .values({
      id: DEV_USER_ID,
      email: "dev@naqiy.fr",
      passwordHash,
      displayName: "Mehdi Dev",
      phoneNumber: "+33612345678",
      city: "Paris",
      bio: "Compte de test pour le développement",
      preferredLanguage: "fr",
      halalStrictness: "strict",
      madhab: "hanafi",
      isPregnant: false,
      hasChildren: true,
      dietaryRestrictions: ["sans-gluten"],
      allergens: ["arachides", "lait"],
      level: 5,
      experiencePoints: 2450,
      totalScans: 42,
      currentStreak: 7,
      longestStreak: 14,
      lastScanDate: daysAgo(0),
      notificationEnabled: true,
      darkMode: false,
      isActive: true,
    })
    .onConflictDoUpdate({
      target: users.id,
      set: {
        email: "dev@naqiy.fr",
        passwordHash,
        displayName: "Mehdi Dev",
        level: 5,
        experiencePoints: 2450,
        totalScans: 42,
        currentStreak: 7,
        madhab: "hanafi",
        isPregnant: false,
        hasChildren: true,
        updatedAt: new Date(),
      },
    });
  console.log("  ✓ dev@naqiy.fr / password123");

  // ── 2. Categories ─────────────────────────────────────────
  console.log("\n▶ Phase 2: Product Categories");
  const CATEGORIES = [
    { id: "viandes", name: "Meats", nameFr: "Viandes", icon: "🥩", sortOrder: 1 },
    { id: "volailles", name: "Poultry", nameFr: "Volailles", icon: "🍗", sortOrder: 2 },
    { id: "epicerie", name: "Groceries", nameFr: "Épicerie", icon: "🛒", sortOrder: 3 },
    { id: "boissons", name: "Beverages", nameFr: "Boissons", icon: "🥤", sortOrder: 4 },
    { id: "confiserie", name: "Confectionery", nameFr: "Confiserie", icon: "🍬", sortOrder: 5 },
    { id: "produits-laitiers", name: "Dairy", nameFr: "Produits laitiers", icon: "🧀", sortOrder: 6 },
    { id: "boulangerie", name: "Bakery", nameFr: "Boulangerie", icon: "🍞", sortOrder: 7 },
    { id: "surgeles", name: "Frozen", nameFr: "Surgelés", icon: "🧊", sortOrder: 8 },
    { id: "sauces", name: "Sauces", nameFr: "Sauces & Condiments", icon: "🫙", sortOrder: 9 },
    { id: "plats-prepares", name: "Ready Meals", nameFr: "Plats préparés", icon: "🍱", sortOrder: 10 },
  ];

  for (const cat of CATEGORIES) {
    await db
      .insert(categories)
      .values(cat)
      .onConflictDoUpdate({ target: categories.id, set: { nameFr: cat.nameFr, icon: cat.icon } });
  }
  console.log(`  ✓ ${CATEGORIES.length} categories`);

  // ── 3. Products ───────────────────────────────────────────
  console.log("\n▶ Phase 3: Products");
  const PRODUCTS = [
    { idx: 0, barcode: "3700009290001", name: "Poulet fermier halal", brand: "Isla Délice", category: "volailles", halalStatus: "halal" as const, certifierName: "AVS", price: 8.99, confidenceScore: 0.95 },
    { idx: 1, barcode: "3700009290002", name: "Merguez halal boeuf", brand: "Isla Délice", category: "viandes", halalStatus: "halal" as const, certifierName: "AVS", price: 5.49, confidenceScore: 0.92 },
    { idx: 2, barcode: "3700009290003", name: "Steak haché 100% boeuf halal", brand: "Reghalal", category: "viandes", halalStatus: "halal" as const, certifierName: "Achahada", price: 6.99, confidenceScore: 0.90 },
    { idx: 3, barcode: "3700009290004", name: "Nuggets de poulet halal", brand: "Isla Délice", category: "surgeles", halalStatus: "halal" as const, certifierName: "AVS", price: 4.29, confidenceScore: 0.88 },
    { idx: 4, barcode: "3700009290005", name: "Saucisse de Strasbourg halal", brand: "Fleury Michon", category: "viandes", halalStatus: "halal" as const, certifierName: "SFCVH", price: 3.79, confidenceScore: 0.85 },
    { idx: 5, barcode: "3017620422003", name: "Nutella", brand: "Ferrero", category: "epicerie", halalStatus: "doubtful" as const, certifierName: null, price: 4.59, confidenceScore: 0.60 },
    { idx: 6, barcode: "5449000000996", name: "Coca-Cola 1.5L", brand: "Coca-Cola", category: "boissons", halalStatus: "halal" as const, certifierName: null, price: 1.89, confidenceScore: 0.99 },
    { idx: 7, barcode: "7622300489434", name: "Oreo Original", brand: "Mondelez", category: "confiserie", halalStatus: "doubtful" as const, certifierName: null, price: 2.19, confidenceScore: 0.55 },
    { idx: 8, barcode: "3700009290009", name: "Cordon bleu halal", brand: "Reghalal", category: "surgeles", halalStatus: "halal" as const, certifierName: "AVS", price: 3.99, confidenceScore: 0.91 },
    { idx: 9, barcode: "3700009290010", name: "Escalope de dinde halal", brand: "Isla Délice", category: "volailles", halalStatus: "halal" as const, certifierName: "AVS", price: 7.49, confidenceScore: 0.93 },
    { idx: 10, barcode: "3700009290011", name: "Bonbons Haribo Ours d'Or", brand: "Haribo", category: "confiserie", halalStatus: "haram" as const, certifierName: null, price: 1.99, confidenceScore: 0.95 },
    { idx: 11, barcode: "3700009290012", name: "Bonbons halal assortis", brand: "Samia", category: "confiserie", halalStatus: "halal" as const, certifierName: "AVS", price: 2.49, confidenceScore: 0.88 },
    { idx: 12, barcode: "3700009290013", name: "Sauce Sriracha", brand: "Huy Fong", category: "sauces", halalStatus: "halal" as const, certifierName: null, price: 3.29, confidenceScore: 0.80 },
    { idx: 13, barcode: "3700009290014", name: "Ketchup Heinz", brand: "Heinz", category: "sauces", halalStatus: "halal" as const, certifierName: null, price: 2.69, confidenceScore: 0.85 },
    { idx: 14, barcode: "3700009290015", name: "Yaourt nature", brand: "Danone", category: "produits-laitiers", halalStatus: "halal" as const, certifierName: null, price: 1.29, confidenceScore: 0.90 },
    { idx: 15, barcode: "3700009290016", name: "Pain de mie complet", brand: "Harry's", category: "boulangerie", halalStatus: "halal" as const, certifierName: null, price: 1.99, confidenceScore: 0.75 },
    { idx: 16, barcode: "3700009290017", name: "Lasagnes halal boeuf", brand: "Isla Délice", category: "plats-prepares", halalStatus: "halal" as const, certifierName: "AVS", price: 5.99, confidenceScore: 0.89 },
    { idx: 17, barcode: "3700009290018", name: "Crème dessert vanille", brand: "Danette", category: "produits-laitiers", halalStatus: "doubtful" as const, certifierName: null, price: 1.49, confidenceScore: 0.50 },
    { idx: 18, barcode: "3700009290019", name: "Chips saveur barbecue", brand: "Lay's", category: "epicerie", halalStatus: "unknown" as const, certifierName: null, price: 2.39, confidenceScore: 0.30 },
    { idx: 19, barcode: "3700009290020", name: "Kebab surgelé halal", brand: "Oriental Viandes", category: "plats-prepares", halalStatus: "halal" as const, certifierName: "Achahada", price: 4.99, confidenceScore: 0.87 },
  ];

  for (const p of PRODUCTS) {
    await db
      .insert(products)
      .values({
        id: PRODUCT_IDS[p.idx],
        barcode: p.barcode,
        name: p.name,
        brand: p.brand,
        category: p.category,
        halalStatus: p.halalStatus,
        certifierName: p.certifierName,
        price: p.price,
        confidenceScore: p.confidenceScore,
        currency: "EUR",
        inStock: true,
        ingredients: [],
      })
      .onConflictDoUpdate({
        target: products.barcode,
        set: {
          name: p.name,
          brand: p.brand,
          halalStatus: p.halalStatus,
          price: p.price,
          updatedAt: new Date(),
        },
      });
  }
  console.log(`  ✓ ${PRODUCTS.length} products`);

  // ── 4. Alert Categories ───────────────────────────────────
  console.log("\n▶ Phase 4: Alert Categories");
  const ALERT_CATS = [
    { id: "rappel-produit", name: "Product Recall", nameFr: "Rappel produit", icon: "🚨", color: "#FF3B30" },
    { id: "fraude-halal", name: "Halal Fraud", nameFr: "Fraude halal", icon: "⚠️", color: "#FF9500" },
    { id: "certification", name: "Certification Update", nameFr: "Mise à jour certification", icon: "📋", color: "#007AFF" },
    { id: "ethique", name: "Ethical Alert", nameFr: "Alerte éthique", icon: "🌍", color: "#34C759" },
    { id: "reglementation", name: "Regulation", nameFr: "Réglementation", icon: "📜", color: "#5856D6" },
  ];

  for (const cat of ALERT_CATS) {
    await db
      .insert(alertCategories)
      .values(cat)
      .onConflictDoUpdate({ target: alertCategories.id, set: { nameFr: cat.nameFr, icon: cat.icon } });
  }
  console.log(`  ✓ ${ALERT_CATS.length} alert categories`);

  // ── 5. Alerts ─────────────────────────────────────────────
  console.log("\n▶ Phase 5: Alerts");
  const ALERTS = [
    {
      id: ALERT_IDS[0], title: "Rappel : Lot de poulet contaminé", summary: "Un lot de poulet surgelé halal a été rappelé par la DGCCRF pour risque de salmonelle.",
      content: "La Direction générale de la concurrence, de la consommation et de la répression des fraudes (DGCCRF) a procédé au rappel d'un lot de poulet surgelé halal de la marque XYZ. Les consommateurs ayant acheté ce produit sont invités à le rapporter en magasin.",
      severity: "critical" as const, priority: "critical" as const, categoryId: "rappel-produit", publishedAt: daysAgo(1),
    },
    {
      id: ALERT_IDS[1], title: "Fraude : Faux certificat halal détecté", summary: "Un restaurant à Lyon utilisait un faux certificat de conformité halal AVS.",
      content: "L'association AVS a signalé qu'un restaurant lyonnais affichait un certificat halal contrefait. Une plainte a été déposée. Vérifiez toujours les certificats sur le site officiel de l'organisme.",
      severity: "warning" as const, priority: "high" as const, categoryId: "fraude-halal", publishedAt: daysAgo(3),
    },
    {
      id: ALERT_IDS[2], title: "Nouvelle certification : Samia obtient le label AVS", summary: "La marque Samia a obtenu la certification AVS pour sa gamme de confiseries.",
      content: "Bonne nouvelle pour les consommateurs : la marque Samia a fait certifier l'ensemble de sa gamme de confiseries par l'organisme AVS. Les produits portant le nouveau logo sont disponibles en rayon.",
      severity: "info" as const, priority: "medium" as const, categoryId: "certification", publishedAt: daysAgo(5),
    },
    {
      id: ALERT_IDS[3], title: "Boycott : Mise à jour liste BDS", summary: "La liste BDS a été mise à jour avec 3 nouvelles entreprises ajoutées.",
      content: "Le mouvement BDS a ajouté trois nouvelles entreprises à sa liste de boycott suite à leur investissement dans des colonies illégales. Consultez la section Boycott de l'application pour voir la liste complète.",
      severity: "info" as const, priority: "low" as const, categoryId: "ethique", publishedAt: daysAgo(7),
    },
    {
      id: ALERT_IDS[4], title: "Réglementation : Nouvel étiquetage obligatoire", summary: "À partir du 1er mars 2026, les produits halal devront afficher le nom de l'organisme certificateur.",
      content: "Le décret n°2026-XXX impose un nouvel étiquetage pour les produits halal en France. Le nom de l'organisme certificateur, son numéro d'agrément et la date de certification devront figurer sur l'emballage.",
      severity: "info" as const, priority: "medium" as const, categoryId: "reglementation", publishedAt: daysAgo(10),
    },
    {
      id: ALERT_IDS[5], title: "Rappel : Merguez avec allergène non déclaré", summary: "Présence de lait non déclaré dans un lot de merguez halal.",
      content: "La marque ABC rappelle un lot de merguez halal (DLC 15/03/2026) pour présence de lait non déclaré dans la liste des ingrédients. Les personnes allergiques au lait ne doivent pas consommer ce produit.",
      severity: "warning" as const, priority: "high" as const, categoryId: "rappel-produit", publishedAt: daysAgo(2),
    },
    {
      id: ALERT_IDS[6], title: "Certification : SFCVH retire son label à 2 boucheries", summary: "Deux boucheries en Île-de-France perdent leur certification SFCVH.",
      content: "Suite à un contrôle inopiné, la SFCVH a retiré sa certification à deux boucheries de Seine-Saint-Denis pour non-respect du cahier des charges. Les établissements concernés ne sont plus autorisés à utiliser le label.",
      severity: "warning" as const, priority: "medium" as const, categoryId: "certification", publishedAt: daysAgo(4),
    },
    {
      id: ALERT_IDS[7], title: "Éthique : Campagne contre l'abattage sans étourdissement", summary: "Nouvelle campagne de sensibilisation sur les méthodes d'abattage rituel.",
      content: "Une coalition d'ONG lance une campagne d'information sur les différentes méthodes d'abattage rituel. L'objectif est d'informer les consommateurs sur les pratiques des différents organismes de certification.",
      severity: "info" as const, priority: "low" as const, categoryId: "ethique", publishedAt: daysAgo(12),
    },
  ];

  for (const a of ALERTS) {
    await db
      .insert(alerts)
      .values({ ...a, isActive: true })
      .onConflictDoUpdate({ target: alerts.id, set: { title: a.title, summary: a.summary, isActive: true } });
  }
  console.log(`  ✓ ${ALERTS.length} alerts`);

  // ── 6. Articles ───────────────────────────────────────────
  console.log("\n▶ Phase 6: Articles");
  const ARTICLES = [
    {
      id: ARTICLE_IDS[0], title: "Guide : Comment vérifier un certificat halal ?", slug: "guide-verifier-certificat-halal",
      excerpt: "Apprenez à distinguer un vrai certificat halal d'un faux en 5 étapes simples.",
      content: "La certification halal est un processus rigoureux qui garantit la conformité d'un produit aux règles islamiques. Voici les 5 étapes pour vérifier l'authenticité d'un certificat...\n\n## 1. Vérifiez l'organisme\nAssurez-vous que l'organisme est reconnu par les autorités compétentes.\n\n## 2. Consultez le site officiel\nChaque organisme maintient une base de données en ligne de ses certifications.\n\n## 3. Vérifiez la date de validité\nLes certificats ont une durée limitée, généralement 1 an.\n\n## 4. Contrôlez le numéro d'agrément\nChaque certificat possède un numéro unique vérifiable.\n\n## 5. En cas de doute, contactez l'organisme\nLes organismes sérieux répondent aux demandes de vérification.",
      author: "Équipe Naqiy", type: "educational" as const, tags: ["guide", "certification", "halal"],
      readTimeMinutes: 5, isPublished: true, publishedAt: daysAgo(2),
    },
    {
      id: ARTICLE_IDS[1], title: "Les 10 marques halal les plus fiables en France", slug: "top-10-marques-halal-france",
      excerpt: "Classement des marques halal les mieux certifiées disponibles en grande surface.",
      content: "Nous avons analysé les pratiques de certification de dizaines de marques pour vous proposer un classement objectif basé sur la rigueur du contrôle...\n\n## Notre méthodologie\nChaque marque est évaluée sur 5 critères : traçabilité, fréquence des contrôles, transparence, organisme certificateur, et retours consommateurs.\n\n## Le classement\n1. **Isla Délice** — Certifiée AVS, contrôles quotidiens\n2. **Reghalal** — Double certification\n3. **Oriental Viandes** — Label Achahada\n...",
      author: "Équipe Naqiy", type: "blog" as const, tags: ["classement", "marques", "confiance"],
      readTimeMinutes: 8, isPublished: true, publishedAt: daysAgo(5),
    },
    {
      id: ARTICLE_IDS[2], title: "Partenariat Naqiy x AVS : Vérification instantanée", slug: "partenariat-naqiy-avs",
      excerpt: "Naqiy s'associe à AVS pour offrir la vérification de certification en temps réel.",
      content: "Nous sommes fiers d'annoncer notre partenariat avec l'Association de Valorisation des Standards (AVS), le premier organisme de certification halal en France...\n\nGrâce à cette collaboration, les utilisateurs de Naqiy peuvent désormais vérifier instantanément si un produit est certifié AVS en scannant simplement son code-barres.",
      author: "Équipe Naqiy", type: "partner_news" as const, tags: ["partenariat", "AVS", "certification"],
      readTimeMinutes: 3, isPublished: true, publishedAt: daysAgo(8),
    },
    {
      id: ARTICLE_IDS[3], title: "Comprendre les additifs alimentaires : E-numbers et halal", slug: "additifs-alimentaires-halal",
      excerpt: "Quels additifs E sont halal, haram ou douteux ? Guide complet des E-numbers.",
      content: "Les additifs alimentaires identifiés par un code E (E100 à E1500) sont omniprésents dans nos aliments transformés. Certains sont d'origine animale et posent question pour les consommateurs musulmans...\n\n## Additifs clairement haram\n- **E120** (Cochenille) — colorant d'origine animale\n- **E441** (Gélatine) — souvent porcine\n- **E542** (Phosphate d'os) — d'origine animale\n\n## Additifs douteux\n- **E471** (Mono et diglycérides) — peuvent être d'origine animale ou végétale\n- **E472** — même problème que E471\n\n## Additifs halal\n- **E100** (Curcumine) — végétal\n- **E300** (Acide ascorbique) — vitamine C\n- **E330** (Acide citrique) — synthétique",
      author: "Dr. Amina Benali", type: "educational" as const, tags: ["additifs", "E-numbers", "guide"],
      readTimeMinutes: 10, isPublished: true, publishedAt: daysAgo(15),
    },
    {
      id: ARTICLE_IDS[4], title: "Ramadan 2026 : Préparez vos courses halal", slug: "ramadan-2026-courses-halal",
      excerpt: "Anticipez le Ramadan avec notre guide d'achat halal : promotions, produits essentiels et bons plans.",
      content: "Le Ramadan approche ! Voici notre guide complet pour préparer vos courses halal et profiter des meilleures offres en grande surface et en épicerie halal...\n\n## Les indispensables\n- Dattes Medjool\n- Lait fermenté (lben)\n- Brick et feuilles de filo\n- Viande hachée halal\n- Épices (ras-el-hanout, cumin, paprika)\n\n## Où trouver les meilleures offres ?\nConsultez la section Magasins de l'application pour trouver les boucheries et épiceries halal près de chez vous.",
      author: "Équipe Naqiy", type: "community" as const, tags: ["ramadan", "courses", "guide"],
      readTimeMinutes: 6, isPublished: true, publishedAt: daysAgo(1),
    },
    {
      id: ARTICLE_IDS[5], title: "La traçabilité halal : de l'abattoir à votre assiette", slug: "tracabilite-halal-abattoir-assiette",
      excerpt: "Découvrez le parcours complet d'un produit halal, de l'abattoir certifié jusqu'à votre table.",
      content: "La traçabilité est un enjeu majeur pour garantir l'authenticité halal d'un produit tout au long de la chaîne de production...\n\n## L'abattoir\nLe sacrificateur doit être un musulman pratiquant, formé et habilité par l'organisme de certification.\n\n## Le transport\nLes carcasses halal doivent être transportées séparément des carcasses non-halal.\n\n## La transformation\nLes ateliers de découpe doivent respecter les protocoles de non-contamination croisée.\n\n## La distribution\nL'étiquetage doit mentionner l'organisme certificateur et le numéro de lot.",
      author: "Mohammed Kacimi", type: "educational" as const, tags: ["traçabilité", "abattoir", "certification"],
      readTimeMinutes: 7, isPublished: true, publishedAt: daysAgo(20),
    },
  ];

  for (const a of ARTICLES) {
    await db
      .insert(articles)
      .values(a)
      .onConflictDoUpdate({
        target: articles.id,
        set: { title: a.title, excerpt: a.excerpt, isPublished: a.isPublished, updatedAt: new Date() },
      });
  }
  console.log(`  ✓ ${ARTICLES.length} articles`);

  // ── 7. Favorite Folders + Favorites ───────────────────────
  console.log("\n▶ Phase 7: Favorites");
  const FOLDERS = [
    { id: FOLDER_IDS[0], userId: DEV_USER_ID, name: "Mes essentiels", color: "#FF6B6B", icon: "❤️", sortOrder: 1 },
    { id: FOLDER_IDS[1], userId: DEV_USER_ID, name: "Courses Ramadan", color: "#4ECDC4", icon: "🌙", sortOrder: 2 },
    { id: FOLDER_IDS[2], userId: DEV_USER_ID, name: "Snacks enfants", color: "#FFE66D", icon: "👶", sortOrder: 3 },
  ];

  for (const f of FOLDERS) {
    await db
      .insert(favoriteFolders)
      .values(f)
      .onConflictDoUpdate({ target: favoriteFolders.id, set: { name: f.name, color: f.color } });
  }

  // Map some products to favorites
  const FAVS = [
    { userId: DEV_USER_ID, productId: PRODUCT_IDS[0], folderId: FOLDER_IDS[0], notes: "Le meilleur poulet" },
    { userId: DEV_USER_ID, productId: PRODUCT_IDS[1], folderId: FOLDER_IDS[0] },
    { userId: DEV_USER_ID, productId: PRODUCT_IDS[2], folderId: FOLDER_IDS[1] },
    { userId: DEV_USER_ID, productId: PRODUCT_IDS[9], folderId: FOLDER_IDS[1] },
    { userId: DEV_USER_ID, productId: PRODUCT_IDS[11], folderId: FOLDER_IDS[2], notes: "Les enfants adorent" },
    { userId: DEV_USER_ID, productId: PRODUCT_IDS[3], folderId: FOLDER_IDS[2] },
  ];

  for (const fav of FAVS) {
    await db
      .insert(favorites)
      .values(fav)
      .onConflictDoNothing();
  }
  console.log(`  ✓ ${FOLDERS.length} folders, ${FAVS.length} favorites`);

  // ── 8. Scan History ───────────────────────────────────────
  console.log("\n▶ Phase 8: Scan History");
  const SCANS = PRODUCTS.slice(0, 10).map((p, i) => ({
    userId: DEV_USER_ID,
    productId: PRODUCT_IDS[p.idx],
    barcode: p.barcode,
    halalStatus: p.halalStatus,
    confidenceScore: p.confidenceScore,
    latitude: 48.8566 + (Math.random() - 0.5) * 0.02,
    longitude: 2.3522 + (Math.random() - 0.5) * 0.02,
    scannedAt: daysAgo(i),
  }));

  for (const s of SCANS) {
    await db.insert(scans).values(s).onConflictDoNothing();
  }
  console.log(`  ✓ ${SCANS.length} scans`);

  // ── 9. Notifications ──────────────────────────────────────
  console.log("\n▶ Phase 9: Notifications");
  const NOTIFS = [
    { userId: DEV_USER_ID, type: "alert" as const, title: "Rappel produit", body: "Un produit que vous avez scanné fait l'objet d'un rappel. Consultez l'alerte.", isRead: false, sentAt: daysAgo(0) },
    { userId: DEV_USER_ID, type: "reward" as const, title: "Bravo ! Niveau 5 atteint 🎉", body: "Vous avez atteint le niveau 5. Continuez à scanner pour débloquer de nouvelles récompenses.", isRead: false, sentAt: daysAgo(1) },
    { userId: DEV_USER_ID, type: "scan_result" as const, title: "Résultat de scan", body: "Le produit Nutella a un statut halal « douteux ». Consultez les détails.", isRead: true, readAt: daysAgo(2), sentAt: daysAgo(2) },
    { userId: DEV_USER_ID, type: "community" as const, title: "Nouveau article", body: "Guide Ramadan 2026 : Préparez vos courses halal est maintenant disponible.", isRead: false, sentAt: daysAgo(1) },
    { userId: DEV_USER_ID, type: "system" as const, title: "Mise à jour de l'application", body: "La version 2.0 est disponible avec le nouveau scanner amélioré.", isRead: true, readAt: daysAgo(5), sentAt: daysAgo(5) },
  ];

  for (const n of NOTIFS) {
    await db.insert(notifications).values(n).onConflictDoNothing();
  }
  console.log(`  ✓ ${NOTIFS.length} notifications`);

  // ── 10. Notification Settings ─────────────────────────────
  console.log("\n▶ Phase 10: Notification Settings");
  await db
    .insert(notificationSettings)
    .values({
      userId: DEV_USER_ID,
      alertsEnabled: true,
      promotionsEnabled: false,
      scanResultsEnabled: true,
      rewardsEnabled: true,
      communityEnabled: true,
      quietHoursStart: "22:00",
      quietHoursEnd: "08:00",
    })
    .onConflictDoNothing();
  console.log("  ✓ notification settings");

  // ── 11. Admin Record ─────────────────────────────────────
  console.log("\n▶ Phase 11: Admin (super_admin)");
  await db
    .insert(admins)
    .values({
      userId: DEV_USER_ID,
      role: "super_admin",
    })
    .onConflictDoUpdate({
      target: admins.userId,
      set: { role: "super_admin" },
    });
  console.log("  ✓ dev@naqiy.fr → super_admin");

  // ── 12. Extra Users (for admin users page) ──────────────
  console.log("\n▶ Phase 12: Extra Users");
  const EXTRA_USERS = [
    { id: "00000000-0000-4000-a000-000000000002", email: "fatima@naqiy.fr", displayName: "Fatima Benali", city: "Lyon", madhab: "maliki" as const, tier: "premium" as const, totalScans: 156, streak: 12, days: 15 },
    { id: "00000000-0000-4000-a000-000000000003", email: "youssef@naqiy.fr", displayName: "Youssef Kaddouri", city: "Marseille", madhab: "shafii" as const, tier: "free" as const, totalScans: 23, streak: 3, days: 30 },
    { id: "00000000-0000-4000-a000-000000000004", email: "amina@naqiy.fr", displayName: "Amina Cherif", city: "Toulouse", madhab: "hanafi" as const, tier: "premium" as const, totalScans: 89, streak: 21, days: 7 },
    { id: "00000000-0000-4000-a000-000000000005", email: "omar@naqiy.fr", displayName: "Omar Diallo", city: "Paris", madhab: "general" as const, tier: "free" as const, totalScans: 5, streak: 1, days: 2 },
    { id: "00000000-0000-4000-a000-000000000006", email: "sarah@naqiy.fr", displayName: "Sarah Mansouri", city: "Bordeaux", madhab: "hanbali" as const, tier: "free" as const, totalScans: 45, streak: 7, days: 20 },
    { id: "00000000-0000-4000-a000-000000000007", email: "ibrahim@naqiy.fr", displayName: "Ibrahim Touré", city: "Lille", madhab: "maliki" as const, tier: "free" as const, totalScans: 12, streak: 0, days: 45 },
    { id: "00000000-0000-4000-a000-000000000008", email: "khadija@naqiy.fr", displayName: "Khadija El Amrani", city: "Strasbourg", madhab: "hanafi" as const, tier: "premium" as const, totalScans: 201, streak: 30, days: 3 },
    { id: "00000000-0000-4000-a000-000000000009", email: "bilal@naqiy.fr", displayName: "Bilal Hamidi", city: "Nantes", madhab: "shafii" as const, tier: "free" as const, totalScans: 0, streak: 0, days: 1 },
    { id: "00000000-0000-4000-a000-00000000000a", email: "meryem@naqiy.fr", displayName: "Meryem Bouzid", city: "Nice", madhab: "general" as const, tier: "free" as const, totalScans: 67, streak: 5, days: 12, banned: true },
    { id: "00000000-0000-4000-a000-00000000000b", email: "rachid@naqiy.fr", displayName: "Rachid Benslimane", city: "Montpellier", madhab: "maliki" as const, tier: "free" as const, totalScans: 34, streak: 2, days: 25 },
  ];

  for (const u of EXTRA_USERS) {
    await db
      .insert(users)
      .values({
        id: u.id,
        email: u.email,
        passwordHash,
        displayName: u.displayName,
        city: u.city,
        madhab: u.madhab,
        subscriptionTier: u.tier,
        totalScans: u.totalScans,
        currentStreak: u.streak,
        longestStreak: Math.max(u.streak, 5),
        lastScanDate: daysAgo(u.days),
        createdAt: daysAgo(u.days + Math.floor(Math.random() * 30)),
        isActive: !u.banned,
      })
      .onConflictDoUpdate({
        target: users.id,
        set: {
          displayName: u.displayName,
          totalScans: u.totalScans,
          subscriptionTier: u.tier,
          isActive: !u.banned,
          updatedAt: new Date(),
        },
      });
  }
  console.log(`  ✓ ${EXTRA_USERS.length} extra users (all pwd: password123)`);

  // ── 13. Extra scans for charts (spread over 30 days) ────
  console.log("\n▶ Phase 13: Extra Scans (30-day spread)");
  const allUserIds = [DEV_USER_ID, ...EXTRA_USERS.map(u => u.id)];
  let extraScanCount = 0;
  for (let day = 0; day < 30; day++) {
    const numScans = Math.floor(Math.random() * 4) + 1; // 1-4 scans per day
    for (let s = 0; s < numScans; s++) {
      const userId = allUserIds[Math.floor(Math.random() * allUserIds.length)];
      const productIdx = Math.floor(Math.random() * PRODUCTS.length);
      const p = PRODUCTS[productIdx];
      await db.insert(scans).values({
        userId,
        productId: PRODUCT_IDS[p.idx],
        barcode: p.barcode,
        halalStatus: p.halalStatus,
        confidenceScore: p.confidenceScore,
        scannedAt: new Date(daysAgo(day).getTime() + Math.random() * 86400000),
      }).onConflictDoNothing();
      extraScanCount++;
    }
  }
  console.log(`  ✓ ${extraScanCount} extra scans over 30 days`);

  // ── 14. Devices ─────────────────────────────────────────
  console.log("\n▶ Phase 14: Devices");
  const DEV_DEVICES = [
    { deviceId: "dev-iphone-001", userId: DEV_USER_ID, platform: "ios" as const, appVersion: "2.1.0", totalScans: 30 },
    { deviceId: "dev-android-001", userId: DEV_USER_ID, platform: "android" as const, appVersion: "2.0.5", totalScans: 12 },
    { deviceId: "dev-android-002", userId: EXTRA_USERS[0].id, platform: "android" as const, appVersion: "2.1.0", totalScans: 100 },
    { deviceId: "dev-iphone-002", userId: EXTRA_USERS[2].id, platform: "ios" as const, appVersion: "2.1.0", totalScans: 89 },
  ];
  for (const d of DEV_DEVICES) {
    await db
      .insert(devices)
      .values(d)
      .onConflictDoUpdate({
        target: devices.deviceId,
        set: { totalScans: d.totalScans, appVersion: d.appVersion },
      });
  }
  console.log(`  ✓ ${DEV_DEVICES.length} devices`);

  // ── 15. Waitlist Leads ──────────────────────────────────
  console.log("\n▶ Phase 15: Waitlist Leads");
  const WAITLIST = [
    { email: "ahmed@gmail.com", source: "landing", utmSource: "google", utmMedium: "cpc", utmCampaign: "halal-app-fr", days: 1 },
    { email: "nour@outlook.fr", source: "landing", utmSource: "instagram", utmMedium: "social", utmCampaign: "launch-teaser", days: 2 },
    { email: "leila@yahoo.fr", source: "cta", days: 3 },
    { email: "karim@hotmail.com", source: "navbar", utmSource: "twitter", utmMedium: "social", utmCampaign: "launch-teaser", days: 4 },
    { email: "samira@gmail.com", source: "landing", utmSource: "google", utmMedium: "organic", days: 5 },
    { email: "hassan@proton.me", source: "marketplace", utmSource: "tiktok", utmMedium: "social", utmCampaign: "halal-scanner", days: 6 },
    { email: "yasmine@gmail.com", source: "landing", utmSource: "facebook", utmMedium: "social", utmCampaign: "ramadan-2026", days: 7 },
    { email: "mourad@free.fr", source: "cta", days: 8 },
    { email: "ines@gmail.com", source: "landing", utmSource: "google", utmMedium: "cpc", utmCampaign: "halal-app-fr", days: 9 },
    { email: "rachid.test@gmail.com", source: "navbar", days: 10 },
    { email: "hana@icloud.com", source: "landing", utmSource: "instagram", utmMedium: "social", utmCampaign: "launch-teaser", days: 11 },
    { email: "ali.dev@outlook.com", source: "marketplace", utmSource: "youtube", utmMedium: "video", utmCampaign: "demo-video", days: 12 },
    { email: "mariam@gmail.com", source: "landing", utmSource: "google", utmMedium: "organic", days: 14 },
    { email: "sofiane@gmail.com", source: "cta", utmSource: "snapchat", utmMedium: "social", utmCampaign: "halal-scanner", days: 16 },
    { email: "aisha@yahoo.com", source: "landing", days: 18 },
    { email: "yassine.b@gmail.com", source: "navbar", utmSource: "google", utmMedium: "cpc", utmCampaign: "ramadan-2026", days: 20 },
    { email: "malika@orange.fr", source: "landing", utmSource: "facebook", utmMedium: "social", utmCampaign: "launch-teaser", days: 22 },
    { email: "samir@gmail.com", source: "marketplace", days: 24 },
    { email: "karima@hotmail.fr", source: "landing", utmSource: "tiktok", utmMedium: "social", utmCampaign: "halal-scanner", days: 26 },
    { email: "zineb@gmail.com", source: "cta", days: 28 },
    { email: "tarek@proton.me", source: "landing", utmSource: "google", utmMedium: "organic", days: 1 },
    { email: "dounia@gmail.com", source: "navbar", utmSource: "instagram", utmMedium: "social", utmCampaign: "ramadan-2026", days: 2 },
    { email: "ayoub@outlook.fr", source: "landing", utmSource: "google", utmMedium: "cpc", utmCampaign: "halal-app-fr", days: 3 },
    { email: "salma@gmail.com", source: "marketplace", utmSource: "youtube", utmMedium: "video", utmCampaign: "demo-video", days: 5 },
    { email: "hamza@free.fr", source: "landing", days: 7 },
  ];

  for (const w of WAITLIST) {
    await db
      .insert(waitlistLeads)
      .values({
        email: w.email,
        source: w.source,
        locale: "fr",
        utmSource: w.utmSource ?? null,
        utmMedium: w.utmMedium ?? null,
        utmCampaign: w.utmCampaign ?? null,
        createdAt: daysAgo(w.days),
        updatedAt: daysAgo(w.days),
      })
      .onConflictDoUpdate({
        target: waitlistLeads.email,
        set: { source: w.source, updatedAt: new Date() },
      });
  }
  console.log(`  ✓ ${WAITLIST.length} waitlist leads`);

  // ── Summary ───────────────────────────────────────────────
  const counts = await Promise.all([
    db.select({ count: sql<number>`count(*)::int` }).from(users),
    db.select({ count: sql<number>`count(*)::int` }).from(products),
    db.select({ count: sql<number>`count(*)::int` }).from(categories),
    db.select({ count: sql<number>`count(*)::int` }).from(alerts),
    db.select({ count: sql<number>`count(*)::int` }).from(articles),
    db.select({ count: sql<number>`count(*)::int` }).from(favorites),
    db.select({ count: sql<number>`count(*)::int` }).from(scans),
    db.select({ count: sql<number>`count(*)::int` }).from(notifications),
  ]);

  const extraCounts = await Promise.all([
    db.select({ count: sql<number>`count(*)::int` }).from(admins),
    db.select({ count: sql<number>`count(*)::int` }).from(waitlistLeads),
    db.select({ count: sql<number>`count(*)::int` }).from(devices),
  ]);

  console.log("\n━━━ Dev Seed Complete ━━━");
  console.log(`  Users:         ${counts[0][0].count}`);
  console.log(`  Products:      ${counts[1][0].count}`);
  console.log(`  Categories:    ${counts[2][0].count}`);
  console.log(`  Alerts:        ${counts[3][0].count}`);
  console.log(`  Articles:      ${counts[4][0].count}`);
  console.log(`  Favorites:     ${counts[5][0].count}`);
  console.log(`  Scans:         ${counts[6][0].count}`);
  console.log(`  Notifications: ${counts[7][0].count}`);
  console.log(`  Admins:        ${extraCounts[0][0].count}`);
  console.log(`  Waitlist:      ${extraCounts[1][0].count}`);
  console.log(`  Devices:       ${extraCounts[2][0].count}`);
  console.log("\n  🔑 Admin login: dev@naqiy.fr / password123 (super_admin)");
  console.log("  🔑 All extra users: password123");
  console.log("  📍 Stores are seeded by entrypoint.ts (real AVS/Achahada data)");

  await client.end();
}

main().catch((err) => {
  console.error("Dev seed failed:", err);
  process.exit(1);
});
