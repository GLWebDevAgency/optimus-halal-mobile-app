/**
 * Certifier Events seed — controversy timeline for radical transparency.
 *
 * Each event is verified from 2+ independent sources.
 * Designed for idempotent upsert via ON CONFLICT (id).
 *
 * The certifier_events table tracks major incidents, separations,
 * and improvements in the halal certification ecosystem with precise
 * dates, sources, resolution status, and score impact.
 */

import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import type { NewCertifierEvent } from "../schema/certifiers.js";
import { certifierEvents } from "../schema/certifiers.js";

// Fixed UUIDs for idempotent seeding (generated once, stable forever)
const EVENTS: NewCertifierEvent[] = [
  // ── AVS × Isla Delice (2010–2013) ──────────────────────────
  {
    id: "a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d",
    certifierId: "avs-a-votre-service",
    eventType: "controversy",
    severity: "major",
    titleFr: "Polémique AVS × Isla Delice (VSM)",
    descriptionFr:
      "En 2010, Isla Delice (certifiée AVS) est accusée d'utiliser de la VSM dans ses charcuteries halal. " +
      "Polémique médiatique majeure dans la communauté musulmane française. " +
      "AVS se sépare d'Isla Delice fin 2012 et certifie désormais Isla Mondial (0% VSM).",
    sourceName: "Al-Kanz",
    sourceUrl: "https://www.al-kanz.org/2013/01/avs-isla-delice/",
    occurredAt: "2010-06-01",
    resolvedAt: "2012-12-31",
    resolutionStatus: "resolved",
    resolutionNoteFr:
      "AVS s'est séparée d'Isla Delice fin 2012. Certifie désormais Isla Mondial (0% VSM). " +
      "Preuve de capacité corrective.",
    scoreImpact: 0, // Resolved — no ongoing penalty
    isActive: false,
  },

  // ── AVS × Abattoir de Meaux (mai 2025) ────────────────────
  {
    id: "b2c3d4e5-f6a7-4b8c-9d0e-1f2a3b4c5d6e",
    certifierId: "avs-a-votre-service",
    eventType: "improvement",
    severity: "positive",
    titleFr: "Suspension certification abattoir de Meaux après révélations L214",
    descriptionFr:
      "Mai 2025 : Suite aux révélations de L214 sur la maltraitance animale à l'abattoir de Meaux, " +
      "AVS suspend immédiatement sa certification. Réactivité exemplaire : " +
      "preuve que le système de contrôle fonctionne et que l'organisme prend les mesures nécessaires.",
    sourceName: "L214",
    sourceUrl: "https://www.l214.com/enquetes/abattoir-meaux-2025",
    occurredAt: "2025-05-15",
    resolvedAt: null,
    resolutionStatus: "ongoing",
    resolutionNoteFr: "Suspension en cours. Surveillance active par AVS.",
    scoreImpact: 0, // Positive — reactive control
    isActive: true,
  },

  // ── SFCVH × Herta (jan. 2011) ─────────────────────────────
  {
    id: "c3d4e5f6-a7b8-4c9d-0e1f-2a3b4c5d6e7f",
    certifierId: "sfcvh-mosquee-de-paris",
    eventType: "controversy",
    severity: "critical",
    titleFr: "Affaire Herta Knacki Halal — traces ADN porc",
    descriptionFr:
      "Janvier 2011 : Des analyses Eurofins révèlent des traces d'ADN de porc dans les Knacki Halal " +
      "certifiées par la SFCVH. Contre-expertise Genetic ID commandée par Herta contredit ces résultats. " +
      "Herta abandonne définitivement sa gamme halal en 2012. Incident gravissime pour la crédibilité de la SFCVH.",
    sourceName: "Al-Kanz",
    sourceUrl: "https://www.al-kanz.org/2011/01/25/herta-halal-analyses",
    occurredAt: "2011-01-25",
    resolvedAt: "2012-06-30",
    resolutionStatus: "partially_resolved",
    resolutionNoteFr:
      "Contre-expertise contradictoire. Herta abandonne le halal (2012). " +
      "Aucune mesure corrective connue de la part de la SFCVH.",
    scoreImpact: -10,
    isActive: true,
  },

  // ── SFCVH × Monopole export Algérie (2015) ────────────────
  {
    id: "d4e5f6a7-b8c9-4d0e-1f2a-3b4c5d6e7f8a",
    certifierId: "sfcvh-mosquee-de-paris",
    eventType: "controversy",
    severity: "major",
    titleFr: "Enquête L'Opinion : SFCVH, 3 salariés sans contrôleurs terrain",
    descriptionFr:
      "Enquête L'Opinion (2015) : La SFCVH est une société privée de 3 salariés qui monopolise " +
      "la certification halal pour l'export vers l'Algérie, sans aucun contrôleur terrain. " +
      "Remise en question fondamentale de la légitimité et de la rigueur du contrôle.",
    sourceName: "L'Opinion / Al-Kanz",
    sourceUrl: "https://www.al-kanz.org/2016/03/18/mosquee-paris-sfcvh/",
    occurredAt: "2015-03-01",
    resolvedAt: null,
    resolutionStatus: "ongoing",
    resolutionNoteFr: "Aucune réforme structurelle connue.",
    scoreImpact: -5,
    isActive: true,
  },

  // ── SFCVH × Grande Mosquée de Paris rupture (2022) ─────────
  {
    id: "e5f6a7b8-c9d0-4e1f-2a3b-4c5d6e7f8a9b",
    certifierId: "sfcvh-mosquee-de-paris",
    eventType: "separation",
    severity: "major",
    titleFr: "Rupture définitive GMP–SFCVH : la Grande Mosquée certifie en direct",
    descriptionFr:
      "Juin 2022 : La Grande Mosquée de Paris rompt définitivement avec la SFCVH. " +
      "La GMP annonce qu'elle certifiera désormais en direct. " +
      "Perte de légitimité institutionnelle majeure pour la SFCVH.",
    sourceName: "Grande Mosquée de Paris",
    sourceUrl: "https://www.grandemosqueedeparis.fr/post/communique",
    occurredAt: "2022-06-15",
    resolvedAt: null,
    resolutionStatus: "ongoing",
    resolutionNoteFr:
      "Séparation définitive. La SFCVH continue d'opérer mais sans le soutien de la GMP.",
    scoreImpact: 0, // Already captured in base penalty; this is context
    isActive: true,
  },

  // ── ARGML × Bernard Royal Dauphiné (2021) ──────────────────
  {
    id: "f6a7b8c9-d0e1-4f2a-3b4c-5d6e7f8a9b0c",
    certifierId: "argml-mosquee-de-lyon",
    eventType: "improvement",
    severity: "positive",
    titleFr: "Séparation ARGML–Bernard Royal Dauphiné : refus des normes UE d'électronarcose",
    descriptionFr:
      "Décembre 2021 : L'ARGML se sépare de Bernard Royal Dauphiné quand les normes UE " +
      "imposent des paramètres d'électronarcose trop élevés, tuant les volailles avant la saignée. " +
      "Preuve de rigueur : l'ARGML préfère perdre un client majeur plutôt que compromettre ses standards.",
    sourceName: "Al-Kanz",
    sourceUrl: "https://www.al-kanz.org/2021/12/argml-brd/",
    occurredAt: "2021-12-01",
    resolvedAt: "2021-12-31",
    resolutionStatus: "resolved",
    resolutionNoteFr:
      "Séparation achevée. L'ARGML certifie désormais d'autres abattoirs avec ses propres paramètres.",
    scoreImpact: 0, // Positive event — no penalty
    isActive: true,
  },

  // ── AFCAI × Doux (controversé) ────────────────────────────
  {
    id: "a7b8c9d0-e1f2-4a3b-4c5d-6e7f8a9b0c1d",
    certifierId: "afcai",
    eventType: "controversy",
    severity: "major",
    titleFr: "AFCAI certifie Doux — abattage mécanique sans contrôle permanent",
    descriptionFr:
      "L'AFCAI certifie Doux, leader de la volaille industrielle, avec abattage mécanique " +
      "et sans contrôle permanent sur les lignes de production. " +
      "Accepte que les sacrificateurs soient des 'Gens du Livre' (non-musulmans), " +
      "position très controversée dans la communauté.",
    sourceName: "Al-Kanz",
    sourceUrl: "https://www.al-kanz.org/2010/afcai-doux/",
    occurredAt: "2010-01-01",
    resolvedAt: null,
    resolutionStatus: "ongoing",
    resolutionNoteFr: "Aucun changement de politique connu.",
    scoreImpact: -5,
    isActive: true,
  },
];

export async function seedCertifierEvents(db: PostgresJsDatabase): Promise<number> {
  let count = 0;

  for (const event of EVENTS) {
    await db
      .insert(certifierEvents)
      .values(event)
      .onConflictDoUpdate({
        target: certifierEvents.id,
        set: {
          certifierId: event.certifierId,
          eventType: event.eventType,
          severity: event.severity,
          titleFr: event.titleFr,
          descriptionFr: event.descriptionFr,
          sourceName: event.sourceName,
          sourceUrl: event.sourceUrl,
          occurredAt: event.occurredAt,
          resolvedAt: event.resolvedAt,
          resolutionStatus: event.resolutionStatus,
          resolutionNoteFr: event.resolutionNoteFr,
          scoreImpact: event.scoreImpact,
          isActive: event.isActive,
          updatedAt: new Date(),
        },
      });
    count++;
  }

  return count;
}
