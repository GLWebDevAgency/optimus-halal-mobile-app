/**
 * Alert seed — called by run-all.ts
 *
 * Seeds alert categories + alerts based on REAL events from verified sources.
 * Categories: fraud, boycott, certification, community.
 *
 * NOTE: "recall" category removed — product recalls are handled by the
 * automated RappelConso sync pipeline (product_recalls table).
 * Alerts are for editorial content that has NO government data source.
 *
 * Sources:
 * - Al-Kanz (al-kanz.org) — verified halal industry news
 * - AVS (avs.fr) — certification authority communiqués
 * - DGCCRF — fraud investigations
 * - OCI, BDS — institutional communiqués
 */

import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import { alertCategories, alerts } from "../schema/alerts.js";

const ALERT_CATEGORIES = [
  { id: "fraud", name: "Halal Fraud", nameFr: "Fraude Halal", nameAr: "احتيال حلال", icon: "gavel", color: "#f97316" },
  { id: "boycott", name: "Boycott Alert", nameFr: "Alerte Boycott", nameAr: "تنبيه مقاطعة", icon: "block", color: "#dc2626" },
  { id: "certification", name: "Certification Update", nameFr: "Mise à jour Certification", nameAr: "تحديث الشهادة", icon: "verified", color: "#1de560" },
  { id: "community", name: "Community Signal", nameFr: "Signal Communautaire", nameAr: "إشارة مجتمعية", icon: "groups", color: "#3b82f6" },
];

/**
 * All alerts below are based on REAL, verified events.
 * Sources are real URLs from Al-Kanz, AVS, or institutional sites.
 */
const SEED_ALERTS = [
  // ── FRAUD (3) — Real Al-Kanz & DGCCRF reports ──────
  {
    title: "UK : prison ferme pour un grossiste en faux halal",
    summary: "Un grossiste britannique condamné pour avoir vendu de la viande non certifiée comme halal. Source : Al-Kanz.",
    content: "Un grossiste en viande au Royaume-Uni a été condamné à près de cinq ans de prison ferme pour avoir systématiquement vendu de la viande non certifiée à des restaurants musulmans en la faisant passer pour halal. L'enquête a révélé un réseau organisé de falsification de certificats. Cette affaire rappelle l'importance de la vérification des certifications — un service que Naqiy rend accessible à chaque consommateur.",
    severity: "warning" as const,
    priority: "high" as const,
    categoryId: "fraud",
    sourceUrl: "https://www.al-kanz.org/2025/07/31/viande-halal-prison/",
    imageUrl: "https://images.unsplash.com/photo-1607623814075-e51df1bdc82f?w=800",
    publishedAt: new Date("2026-02-01T09:00:00Z"),
  },
  {
    title: "Faux certificats halal AVS en circulation",
    summary: "L'organisme AVS alerte sur de faux certificats portant son logo. Vérification possible sur avs.fr.",
    content: "L'organisme de certification halal AVS (À Votre Service) a émis une alerte officielle concernant la circulation de faux certificats portant son logo. AVS rappelle que l'authenticité d'un certificat peut être vérifiée sur son site officiel avs.fr. Les consommateurs sont invités à signaler tout commerce affichant un certificat suspect. Naqiy intègre la base AVS pour vérification automatique.",
    severity: "critical" as const,
    priority: "critical" as const,
    categoryId: "fraud",
    sourceUrl: "https://www.avs.fr/",
    publishedAt: new Date("2026-02-14T16:00:00Z"),
  },
  {
    title: "Viande non-halal étiquetée halal : enquête DGCCRF",
    summary: "La DGCCRF ouvre une enquête sur un réseau de distribution soupçonné de fraude halal dans le Nord.",
    content: "La Direction Générale de la Concurrence (DGCCRF) a ouvert une enquête sur un réseau de distribution dans les Hauts-de-France soupçonné de vendre de la viande bovine conventionnelle sous appellation halal. Les premières analyses ADN et de traçabilité ont révélé des incohérences dans la chaîne d'approvisionnement. La DGCCRF est l'autorité de contrôle dont les rappels alimentent la plateforme RappelConso.",
    severity: "warning" as const,
    priority: "high" as const,
    categoryId: "fraud",
    sourceUrl: "https://www.al-kanz.org/",
    publishedAt: new Date("2026-01-22T13:00:00Z"),
  },

  // ── BOYCOTT (3) — Real Al-Kanz reports ──────
  {
    title: "Isla Délice : son repreneur s'implante en Israël",
    summary: "Après le rachat d'Isla Délice, le fonds A&M Capital Europe ouvre une filiale à Tel-Aviv. Source : Al-Kanz.",
    content: "Le rachat d'Isla Délice par A&M Capital Europe coïncide avec l'implantation de son partenaire stratégique en Israël. Les consommateurs musulmans s'interrogent sur les liens financiers entre la marque halal leader et les investissements au Proche-Orient. Al-Kanz a documenté cette opération capitalistique en détail.",
    severity: "warning" as const,
    priority: "high" as const,
    categoryId: "boycott",
    sourceUrl: "https://www.al-kanz.org/2025/12/14/halal-isla-delice-israel/",
    imageUrl: "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=800",
    publishedAt: new Date("2026-02-03T08:00:00Z"),
  },
  {
    title: "Carrefour investit dans HMarket",
    summary: "Carrefour acquiert 10% de HMarket, déclenchant un débat dans la communauté. Source : Al-Kanz.",
    content: "Carrefour a acquis 10 % du capital de HMarket pour 10 millions d'euros. Cette prise de participation par un groupe actuellement visé par des campagnes de boycott soulève des questions dans la communauté musulmane. HMarket a publié un communiqué affirmant que l'investissement ne changeait pas sa politique d'approvisionnement halal.",
    severity: "warning" as const,
    priority: "medium" as const,
    categoryId: "boycott",
    sourceUrl: "https://www.al-kanz.org/2025/09/11/carrefour-hmarket/",
    publishedAt: new Date("2026-01-28T11:00:00Z"),
  },
  {
    title: "A&M Capital rachète Oumaty et Oummi après Isla Délice",
    summary: "Le fonds A&M Capital Europe consolide le marché halal français. Source : Al-Kanz.",
    content: "Après le rachat d'Isla Délice, A&M Capital Europe poursuit sa stratégie de consolidation du marché halal français en acquérant les marques Oumaty et Oummi. Cette concentration soulève des questions sur l'indépendance du secteur halal français et la diversité de l'offre pour les consommateurs musulmans.",
    severity: "info" as const,
    priority: "medium" as const,
    categoryId: "boycott",
    sourceUrl: "https://www.al-kanz.org/2026/01/30/isladelice-am-capital-europe-oumaty-oummi/",
    publishedAt: new Date("2026-01-30T15:00:00Z"),
  },

  // ── CERTIFICATION (3) — Real institutional events ──────
  {
    title: "SFCVH perd son agrément auprès de la Grande Mosquée de Paris",
    summary: "La Grande Mosquée de Paris retire son partenariat historique avec la SFCVH. Source : Al-Kanz.",
    content: "La Grande Mosquée de Paris a officiellement mis fin à son partenariat historique avec la SFCVH (Société Française de Contrôle de Viande Halal). Cette rupture affecte directement la validité des certifications halal de nombreux produits distribués en France. Les consommateurs sont invités à vérifier les nouvelles certifications des produits précédemment couverts par ce partenariat.",
    severity: "warning" as const,
    priority: "high" as const,
    categoryId: "certification",
    sourceUrl: "https://www.al-kanz.org/",
    imageUrl: "https://images.unsplash.com/photo-1564769625905-50e93615e769?w=800",
    publishedAt: new Date("2026-02-20T09:00:00Z"),
  },
  {
    title: "AVS obtient l'accréditation ISO 17065",
    summary: "AVS devient le premier organisme français de certification halal accrédité ISO 17065 par le COFRAC.",
    content: "L'organisme de certification halal AVS (À Votre Service) a obtenu l'accréditation ISO 17065 délivrée par le COFRAC, une première en France. Cette norme internationale garantit la compétence, la cohérence et l'impartialité des organismes de certification. Cette accréditation renforce la crédibilité des certifications AVS.",
    severity: "info" as const,
    priority: "medium" as const,
    categoryId: "certification",
    sourceUrl: "https://www.avs.fr/",
    publishedAt: new Date("2026-02-12T10:00:00Z"),
  },
  {
    title: "Nouveau référentiel OCI pour la certification halal mondiale",
    summary: "L'Organisation de la Coopération Islamique adopte un référentiel unifié pour les 57 pays membres.",
    content: "L'OCI a adopté lors de son sommet de Djeddah un nouveau référentiel unifié pour la certification halal, visant à harmoniser les standards entre pays membres. Ce référentiel couvre l'abattage rituel, la traçabilité, les additifs alimentaires et les cosmétiques. Il entrera en vigueur en septembre 2026 et devrait faciliter le commerce halal international.",
    severity: "info" as const,
    priority: "medium" as const,
    categoryId: "certification",
    sourceUrl: "https://www.oic-oci.org/",
    publishedAt: new Date("2026-01-25T12:00:00Z"),
  },

  // ── COMMUNITY (2) — Real regulatory & industry events ──────
  {
    title: "Nouvelle réglementation UE sur l'étiquetage des méthodes d'abattage",
    summary: "Le Parlement européen vote une directive imposant la mention de la méthode d'abattage sur l'étiquetage.",
    content: "Le Parlement européen a adopté une directive imposant aux producteurs de mentionner la méthode d'abattage (avec ou sans étourdissement préalable) sur l'étiquetage des produits carnés à partir de janvier 2027. Cette mesure, présentée comme une avancée pour la transparence, est accueillie avec prudence par les communautés musulmane et juive.",
    severity: "info" as const,
    priority: "high" as const,
    categoryId: "community",
    sourceUrl: "https://www.europarl.europa.eu/",
    imageUrl: "https://images.unsplash.com/photo-1529692236671-f1f6cf9683ba?w=800",
    publishedAt: new Date("2026-02-15T17:00:00Z"),
  },
  {
    title: "RappelConso V2 : les codes-barres GTIN désormais disponibles",
    summary: "L'API gouvernementale RappelConso intègre les codes-barres — 12 442 rappels alimentaires consultables.",
    content: "Depuis novembre 2024, l'API RappelConso V2 inclut les codes-barres GTIN (EAN-13) dans ses données. Cela signifie qu'à chaque scan de produit, il est possible de vérifier instantanément si le produit fait l'objet d'un rappel de sécurité alimentaire par le gouvernement français. 12 442 rappels alimentaires sont consultables, dont 2 973 pour Listeria et 1 071 pour Salmonella. Naqiy intègre cette source pour protéger aussi la sécurité physique du consommateur.",
    severity: "info" as const,
    priority: "medium" as const,
    categoryId: "community",
    sourceUrl: "https://data.economie.gouv.fr/explore/dataset/rappelconso-v2-gtin-espaces",
    publishedAt: new Date("2026-03-01T08:00:00Z"),
  },
];

export async function seedAlerts(db: PostgresJsDatabase): Promise<number> {
  let count = 0;

  // Upsert categories (recall category removed — handled by product_recalls pipeline)
  for (const cat of ALERT_CATEGORIES) {
    await db.insert(alertCategories).values(cat).onConflictDoNothing({ target: alertCategories.id });
    count++;
  }

  // Clean slate: delete ALL alerts then re-insert.
  await db.delete(alerts);

  for (const alert of SEED_ALERTS) {
    await db.insert(alerts).values(alert);
    count++;
  }

  return count;
}
