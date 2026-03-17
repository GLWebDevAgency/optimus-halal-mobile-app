/**
 * Reset Dev History + Re-seed with varied products
 *
 * 1. Clears ALL history for dev user (scans, favorites, notifications)
 * 2. Resets user stats
 * 3. Assigns certifiers to real products already in DB
 * 4. Creates scan history with variety:
 *    - AVS, Achahada, ARGML, SFCVH certified products
 *    - Halal, Haram, Doubtful, Unknown statuses
 *
 * Usage: cd backend && pnpm tsx --env-file=.env src/db/seeds/reset-dev-history.ts
 */

import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import { eq, or, inArray, sql } from "drizzle-orm";
import { products } from "../schema/products.js";
import { scans } from "../schema/scans.js";
import { users } from "../schema/users.js";
import { favorites } from "../schema/favorites.js";
import { notifications } from "../schema/notifications.js";
import { favoriteFolders } from "../schema/favorites.js";

const DEV_EMAILS = ["dev@optimus.fr", "dev@naqiy.fr"];

// ── Certifier IDs matching the certifiers table ─────────
const CERTIFIER_MAP = {
  avs: { id: "avs-a-votre-service", name: "AVS - A Votre Service" },
  achahada: { id: "achahada", name: "Achahada" },
  argml: { id: "argml-mosquee-de-lyon", name: "ARGML - Mosquee de Lyon" },
  sfcvh: { id: "sfcvh-mosquee-de-paris", name: "SFCVH - Mosquee de Paris" },
} as const;

// ── Product assignments: VERIFIED barcodes from DB query ──
// All barcodes confirmed to exist in the 817K OFF import with images
const PRODUCT_ASSIGNMENTS: {
  barcode: string;
  certifier?: keyof typeof CERTIFIER_MAP;
  forceStatus: "halal" | "haram" | "doubtful" | "unknown";
}[] = [
  // ═══ AVS CERTIFIED (A Votre Service) ═════════════════════
  { barcode: "3512690006301", certifier: "avs", forceStatus: "halal" },    // Isla Délice Bouchées poulet mariné
  { barcode: "3353470012002", certifier: "avs", forceStatus: "halal" },    // Cordon bleu de dinde halal
  { barcode: "3021690028072", certifier: "avs", forceStatus: "halal" },    // Dounia Halal Chorba
  { barcode: "3700091900728", certifier: "avs", forceStatus: "halal" },    // Escalope poulet halal AVS
  { barcode: "3512690002860", certifier: "avs", forceStatus: "halal" },    // Isla Délice Filet de poulet

  // ═══ ACHAHADA CERTIFIED ══════════════════════════════════
  { barcode: "3381590007806", certifier: "achahada", forceStatus: "halal" }, // Steak haché pur boeuf
  { barcode: "3560071449551", certifier: "achahada", forceStatus: "halal" }, // Carrefour Allumettes poulet halal
  { barcode: "3560070569878", certifier: "achahada", forceStatus: "halal" }, // Carrefour 6 merguez volailles halal
  { barcode: "3560070503735", certifier: "achahada", forceStatus: "halal" }, // Carrefour Blanc de Dinde Fumé Halal

  // ═══ ARGML CERTIFIED (Mosquée de Lyon) ════════════════════
  { barcode: "3512690002044", certifier: "argml", forceStatus: "halal" },   // Isla Délice Délice de Dinde (ARGML confirmed in DB)
  { barcode: "3512690005731", certifier: "argml", forceStatus: "halal" },   // ARMGL tranchées de dinde
  { barcode: "3512690004048", certifier: "argml", forceStatus: "halal" },   // Isla Délice 12 burgers oignon
  { barcode: "3512690004390", certifier: "argml", forceStatus: "halal" },   // Isla Délice Cachir

  // ═══ SFCVH CERTIFIED (Mosquée de Paris) ═══════════════════
  { barcode: "3276650117109", certifier: "sfcvh", forceStatus: "halal" },   // Bottle Pep's (SFCVH confirmed in DB)
  { barcode: "3512690003379", certifier: "sfcvh", forceStatus: "halal" },   // Isla Délice Lardons Fumés halal
  { barcode: "3512690003812", certifier: "sfcvh", forceStatus: "halal" },   // Isla Délice Burgers Épicé

  // ═══ HARAM (porc, gélatine porcine) ══════════════════════
  { barcode: "3154230802280", forceStatus: "haram" },  // Herta Lardons fumés
  { barcode: "3154230809890", forceStatus: "haram" },  // Herta Le Bon Paris jambon
  { barcode: "3154230040286", forceStatus: "haram" },  // Herta Bacon fumé
  { barcode: "3450970086769", forceStatus: "haram" },  // Saucisson sec €co
  { barcode: "3095754136010", forceStatus: "haram" },  // Fleury Michon Rôti de Porc

  // ═══ DOUBTFUL (gélatine, E471, additifs ambigus) ═════════
  { barcode: "3017620422003", forceStatus: "doubtful" }, // Nutella (E471, lécithine)
  { barcode: "80052760", forceStatus: "doubtful" },      // Kinder Bueno
  { barcode: "3103220046159", forceStatus: "doubtful" }, // Haribo Chamallows (gélatine)
  { barcode: "3046920029759", forceStatus: "doubtful" }, // Lindt Excellence 90%
  { barcode: "4008400260921", forceStatus: "doubtful" }, // Kinder Country

  // ═══ HALAL SANS CERTIFIEUR (composition clean) ═══════════
  { barcode: "5449000054227", forceStatus: "halal" },   // Coca-Cola Original
  { barcode: "3274080005003", forceStatus: "halal" },   // Cristaline eau de source
  { barcode: "3502110006790", forceStatus: "halal" },   // Tropicana oranges pressées

  // ═══ UNKNOWN (données insuffisantes) ═════════════════════
  { barcode: "5053990155354", forceStatus: "unknown" },  // Pringles Sour Cream
  { barcode: "3229820129488", forceStatus: "unknown" },  // Bjorg Muesli fruits
];

function daysAgo(n: number): Date {
  const d = new Date();
  d.setDate(d.getDate() - n);
  d.setHours(Math.floor(Math.random() * 14) + 8); // 8h-22h
  d.setMinutes(Math.floor(Math.random() * 60));
  return d;
}

// ── Main ──────────────────────────────────────────────────
const url = process.env.DATABASE_URL;
if (!url) {
  console.error("DATABASE_URL required");
  process.exit(1);
}

const client = postgres(url, { max: 1 });
const db = drizzle(client);

try {
  console.log("━━━ Naqiy — Reset Dev History ━━━\n");

  // ── 1. Find dev user ──
  const [devUser] = await db.select().from(users).where(
    or(...DEV_EMAILS.map((e) => eq(users.email, e)))
  );
  if (!devUser) throw new Error(`User not found (tried: ${DEV_EMAILS.join(", ")})`);
  console.log(`▶ User: ${devUser.displayName} <${devUser.email}>\n`);

  // ── 2. DELETE ALL user history ──
  console.log("▶ Phase 1: Nettoyage complet");
  const [scanCount] = await db.select({ count: sql<number>`count(*)::int` }).from(scans).where(eq(scans.userId, devUser.id));
  const [favCount] = await db.select({ count: sql<number>`count(*)::int` }).from(favorites).where(eq(favorites.userId, devUser.id));
  const [notifCount] = await db.select({ count: sql<number>`count(*)::int` }).from(notifications).where(eq(notifications.userId, devUser.id));

  await db.delete(scans).where(eq(scans.userId, devUser.id));
  await db.delete(favorites).where(eq(favorites.userId, devUser.id));
  await db.delete(favoriteFolders).where(eq(favoriteFolders.userId, devUser.id));
  await db.delete(notifications).where(eq(notifications.userId, devUser.id));

  console.log(`  ✗ ${scanCount.count} scans supprimés`);
  console.log(`  ✗ ${favCount.count} favoris supprimés`);
  console.log(`  ✗ ${notifCount.count} notifications supprimées`);

  // ── 3. Reset user stats ──
  await db.update(users).set({
    totalScans: 0,
    currentStreak: 0,
    experiencePoints: 0,
    level: 1,
    lastScanDate: null,
    updatedAt: new Date(),
  }).where(eq(users.id, devUser.id));
  console.log(`  ✓ Stats remises à zéro\n`);

  // ── 4. Update products + create scans ──
  console.log("▶ Phase 2: Attribution certifieurs + historique scans");
  let created = 0;
  let notFound = 0;

  for (let i = 0; i < PRODUCT_ASSIGNMENTS.length; i++) {
    const { barcode, certifier, forceStatus } = PRODUCT_ASSIGNMENTS[i];

    // Find product in DB
    const [product] = await db.select().from(products).where(eq(products.barcode, barcode));
    if (!product) {
      console.log(`  ⊘ ${barcode} — pas trouvé en DB, skip`);
      notFound++;
      continue;
    }

    // Update product certifier + status
    const certifierData = certifier ? CERTIFIER_MAP[certifier] : null;
    await db.update(products).set({
      halalStatus: forceStatus,
      certifierId: certifierData?.id ?? product.certifierId,
      certifierName: certifierData?.name ?? product.certifierName,
      confidenceScore: forceStatus === "halal" ? 0.92 : forceStatus === "haram" ? 0.95 : forceStatus === "doubtful" ? 0.6 : 0,
      updatedAt: new Date(),
    }).where(eq(products.id, product.id));

    // Create scan entry with staggered timestamps
    await db.insert(scans).values({
      userId: devUser.id,
      productId: product.id,
      barcode,
      halalStatus: forceStatus,
      confidenceScore: forceStatus === "halal" ? 0.92 : forceStatus === "haram" ? 0.95 : forceStatus === "doubtful" ? 0.6 : 0,
      scannedAt: daysAgo(Math.floor(i * 0.8)),
      latitude: 48.8566 + (Math.random() - 0.5) * 0.03,
      longitude: 2.3522 + (Math.random() - 0.5) * 0.03,
    });

    const tag =
      forceStatus === "halal" ? "✅ HALAL" :
      forceStatus === "haram" ? "🚫 HARAM" :
      forceStatus === "doubtful" ? "⚠️  DOUBT" : "❓ UNKN ";

    const certLabel = certifierData ? ` (${certifier?.toUpperCase()})` : "";
    console.log(`  ${tag}  ${(product.name ?? barcode).substring(0, 45)}${certLabel}`);
    created++;
  }

  // ── 5. Update user stats ──
  await db.update(users).set({
    totalScans: created,
    currentStreak: 3,
    experiencePoints: created * 50,
    level: 2,
    lastScanDate: new Date(),
    updatedAt: new Date(),
  }).where(eq(users.id, devUser.id));

  // ── Summary ──
  console.log("\n━━━ Résultat ━━━");
  console.log(`  Scans créés: ${created}`);
  console.log(`  Non trouvés: ${notFound}`);
  console.log(`  Total en DB: ${created} produits dans l'historique`);

  // Count by status
  const byStatus = { halal: 0, haram: 0, doubtful: 0, unknown: 0 };
  const byCertifier = { avs: 0, achahada: 0, argml: 0, sfcvh: 0, none: 0 };
  for (const p of PRODUCT_ASSIGNMENTS) {
    if (!p.certifier) {
      byCertifier.none++;
    } else {
      byCertifier[p.certifier]++;
    }
    byStatus[p.forceStatus]++;
  }

  console.log(`\n  Par statut:    halal=${byStatus.halal} | haram=${byStatus.haram} | douteux=${byStatus.doubtful} | inconnu=${byStatus.unknown}`);
  console.log(`  Par certifieur: AVS=${byCertifier.avs} | Achahada=${byCertifier.achahada} | ARGML=${byCertifier.argml} | SFCVH=${byCertifier.sfcvh} | sans=${byCertifier.none}`);

} catch (err) {
  console.error("\nFATAL:", err);
  process.exit(1);
} finally {
  await client.end();
}
