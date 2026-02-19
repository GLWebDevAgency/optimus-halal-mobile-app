/**
 * Alert seed adapter — called by run-all.ts
 *
 * Seeds alert categories + alerts from Al-Kanz / RappelConso data.
 */

import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import { alertCategories, alerts } from "../schema/alerts.js";

const ALERT_CATEGORIES = [
  { id: "recall", name: "Product Recall", nameFr: "Rappel Produit", nameAr: "استرجاع منتج", icon: "warning", color: "#ef4444" },
  { id: "fraud", name: "Halal Fraud", nameFr: "Fraude Halal", nameAr: "احتيال حلال", icon: "gavel", color: "#f97316" },
  { id: "boycott", name: "Boycott Alert", nameFr: "Alerte Boycott", nameAr: "تنبيه مقاطعة", icon: "block", color: "#dc2626" },
  { id: "certification", name: "Certification Update", nameFr: "Mise à jour Certification", nameAr: "تحديث الشهادة", icon: "verified", color: "#1de560" },
  { id: "community", name: "Community Signal", nameFr: "Signal Communautaire", nameAr: "إشارة مجتمعية", icon: "groups", color: "#3b82f6" },
];

const SEED_ALERTS = [
  { title: "Salmonelle : rappel de poulets halal certifiés SFCVH", summary: "Des poulets halal du producteur belge Plukon, certifiés par la SFCVH (ex-partenaire de la mosquée de Paris), rappelés pour contamination à la salmonelle.", content: "RappelConso a publié un rappel concernant des poulets certifiés halal par la SFCVH, produits par le fabricant belge Plukon. La salmonelle a été détectée lors de contrôles sanitaires. Les consommateurs ayant acheté ces produits sont invités à ne pas les consommer et à les rapporter en point de vente.", severity: "critical" as const, priority: "critical" as const, categoryId: "recall", sourceUrl: "https://www.al-kanz.org/2026/02/09/salmonelle-poulets-halal-sfcvh-mosquee-paris/", publishedAt: new Date("2026-02-09T10:00:00Z") },
  { title: "Salmonelle : rappel de poulets halal Picalou (METRO)", summary: "METRO procède au rappel de poulets de la marque Picalou estampillés halal suite à la détection de salmonelle.", content: "La chaîne METRO rappelle des poulets de la marque Picalou vendus sous label halal. La bactérie Salmonella a été détectée dans plusieurs lots.", severity: "critical" as const, priority: "critical" as const, categoryId: "recall", sourceUrl: "https://www.al-kanz.org/2026/02/04/salmonelle-picalou/", publishedAt: new Date("2026-02-04T14:00:00Z") },
  { title: "UK : prison ferme pour un grossiste en faux halal", summary: "Un grossiste britannique condamné à près de 5 ans de prison pour avoir vendu de la viande non certifiée comme halal.", content: "Un grossiste en viande au Royaume-Uni a été condamné à près de cinq ans de prison ferme pour avoir systématiquement vendu de la viande non certifiée à des restaurants musulmans.", severity: "warning" as const, priority: "high" as const, categoryId: "fraud", sourceUrl: "https://www.al-kanz.org/2025/07/31/viande-halal-prison/", publishedAt: new Date("2026-02-01T09:00:00Z") },
  { title: "Isla Délice : son repreneur A&M Capital s'implante en Israël", summary: "Après le rachat d'Isla Délice, le fonds A&M Capital Europe ouvre une filiale à Tel-Aviv, posant la question d'un boycott BDS.", content: "Le timing du rachat d'Isla Délice par A&M Capital Europe coïncide avec l'implantation de son partenaire stratégique en Israël.", severity: "warning" as const, priority: "high" as const, categoryId: "boycott", sourceUrl: "https://www.al-kanz.org/2025/12/14/halal-isla-delice-israel/", publishedAt: new Date("2026-02-03T08:00:00Z") },
  { title: "Carrefour devient actionnaire de HMarket", summary: "Carrefour investit 10 M€ pour 10 % de HMarket, déclenchant des appels au boycott dans la communauté.", content: "Carrefour a acquis 10 % du capital de HMarket pour 10 millions d'euros.", severity: "warning" as const, priority: "medium" as const, categoryId: "boycott", sourceUrl: "https://www.al-kanz.org/2025/09/11/carrefour-hmarket/", publishedAt: new Date("2026-01-28T11:00:00Z") },
  { title: "A&M Capital rachète Oumaty et Oummi après Isla Délice", summary: "Le fonds A&M Capital Europe consolide le marché halal français en rachetant les marques Oumaty et Oummi.", content: "Après le rachat d'Isla Délice, A&M Capital Europe poursuit sa stratégie de consolidation du marché halal français.", severity: "info" as const, priority: "medium" as const, categoryId: "community", sourceUrl: "https://www.al-kanz.org/2026/01/30/isladelice-am-capital-europe-oumaty-oummi/", publishedAt: new Date("2026-01-30T15:00:00Z") },
];

export async function seedAlerts(db: PostgresJsDatabase): Promise<number> {
  let count = 0;

  for (const cat of ALERT_CATEGORIES) {
    await db.insert(alertCategories).values(cat).onConflictDoNothing({ target: alertCategories.id });
    count++;
  }

  for (const alert of SEED_ALERTS) {
    await db.insert(alerts).values(alert).onConflictDoNothing();
    count++;
  }

  return count;
}
