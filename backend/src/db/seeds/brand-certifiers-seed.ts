/**
 * Brand-Certifier Seed Data — Curated French Halal Market
 *
 * Maps major halal brands in France to their known certifying bodies.
 * Each mapping has been verified from official sources (brand websites,
 * packaging, industry reports).
 *
 * Brand patterns are stored LOWERCASE — the lookup service normalizes
 * the OFF brands string before querying.
 *
 * Both accented and non-accented variants are seeded to handle OFF
 * data inconsistencies (e.g., "Réghalal" vs "Reghalal").
 *
 * Source types:
 *   brand_website  — stated on the brand's official website
 *   packaging      — observed on product packaging
 *   manual_research — verified via multiple industry sources
 */

import type { NewBrandCertifier } from "../schema/brand-certifiers.js";

export const brandCertifiersSeedData: Omit<NewBrandCertifier, "id" | "createdAt" | "updatedAt">[] = [
  // ── SFCVH (Mosquée de Paris) ─────────────────────────────
  {
    brandPattern: "samia",
    certifierId: "sfcvh-mosquee-de-paris",
    countryCode: "FR",
    source: "brand_website",
    sourceUrl: "https://www.samia.fr",
    verificationStatus: "confirmed",
    confidence: 1.0,
    isActive: true,
    notes: "Samia — marque phare certifiée SFCVH. Gamme complète (épicerie, boissons, confiserie).",
  },
  {
    brandPattern: "réghalal",
    certifierId: "sfcvh-mosquee-de-paris",
    countryCode: "FR",
    source: "brand_website",
    sourceUrl: "https://www.reghalal.com",
    verificationStatus: "confirmed",
    confidence: 1.0,
    isActive: true,
    notes: "Réghalal — viandes et charcuterie halal, certifié SFCVH.",
  },
  {
    brandPattern: "reghalal",
    certifierId: "sfcvh-mosquee-de-paris",
    countryCode: "FR",
    source: "brand_website",
    sourceUrl: "https://www.reghalal.com",
    verificationStatus: "confirmed",
    confidence: 1.0,
    isActive: true,
    notes: "Variante non-accentuée de Réghalal.",
  },
  {
    brandPattern: "medina halal",
    certifierId: "sfcvh-mosquee-de-paris",
    countryCode: "FR",
    source: "manual_research",
    verificationStatus: "confirmed",
    confidence: 0.95,
    isActive: true,
    notes: "Medina Halal — viandes et plats préparés, certifié SFCVH.",
  },
  {
    brandPattern: "fleury michon",
    certifierId: "sfcvh-mosquee-de-paris",
    countryCode: "FR",
    productScope: "halal",
    source: "packaging",
    verificationStatus: "confirmed",
    confidence: 0.85,
    isActive: true,
    notes: "Fleury Michon — gamme halal uniquement, certifiée SFCVH. Attention: la marque a aussi des produits non-halal.",
  },

  // ── ARGML (Mosquée de Lyon) ──────────────────────────────
  {
    brandPattern: "isla délice",
    certifierId: "argml-mosquee-de-lyon",
    countryCode: "FR",
    source: "brand_website",
    sourceUrl: "https://www.isladelice.com",
    verificationStatus: "confirmed",
    confidence: 1.0,
    isActive: true,
    notes: "Isla Délice — leader charcuterie halal France, certifié ARGML.",
  },
  {
    brandPattern: "isla delice",
    certifierId: "argml-mosquee-de-lyon",
    countryCode: "FR",
    source: "brand_website",
    sourceUrl: "https://www.isladelice.com",
    verificationStatus: "confirmed",
    confidence: 1.0,
    isActive: true,
    notes: "Variante non-accentuée d'Isla Délice.",
  },
  {
    brandPattern: "wassila",
    certifierId: "argml-mosquee-de-lyon",
    countryCode: "FR",
    source: "manual_research",
    verificationStatus: "confirmed",
    confidence: 0.95,
    isActive: true,
    notes: "Wassila — viandes halal, certifié ARGML (Mosquée de Lyon).",
  },

  // ── AVS (À Votre Service) ────────────────────────────────
  {
    brandPattern: "zakia",
    certifierId: "avs-a-votre-service",
    countryCode: "FR",
    source: "brand_website",
    sourceUrl: "https://www.zakia.fr",
    verificationStatus: "confirmed",
    confidence: 1.0,
    isActive: true,
    notes: "Zakia — épicerie et plats préparés halal, certifié AVS.",
  },
  {
    brandPattern: "oriental viandes",
    certifierId: "avs-a-votre-service",
    countryCode: "FR",
    source: "manual_research",
    verificationStatus: "confirmed",
    confidence: 0.90,
    isActive: true,
    notes: "Oriental Viandes — viandes halal certifiées AVS.",
  },

  // ── ACMIF (Mosquée d'Évry) ──────────────────────────────
  {
    brandPattern: "herta",
    certifierId: "acmif-mosquee-d-evry",
    countryCode: "FR",
    productScope: "halal",
    source: "packaging",
    verificationStatus: "confirmed",
    confidence: 0.85,
    isActive: true,
    notes: "Herta — gamme halal knacki uniquement, certifiée ACMIF. La marque a aussi des produits non-halal.",
  },
];
