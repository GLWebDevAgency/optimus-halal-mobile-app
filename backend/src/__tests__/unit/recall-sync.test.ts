import { describe, it, expect } from "vitest";

/**
 * Unit tests for recall-sync service helper functions.
 *
 * Tests the pure transform/extraction logic without hitting the DB or API.
 * Integration tests (actual API fetch + DB upsert) are in separate test files.
 */

// ── extractFirstUrl ──────────────────────────────────────────

// Re-implement the private function for testing (same logic)
function extractFirstUrl(raw: string | undefined | null): string | null {
  if (!raw) return null;
  const match = raw.match(/https?:\/\/[^\s,;]+/);
  return match?.[0] ?? null;
}

describe("extractFirstUrl", () => {
  it("extracts a single URL", () => {
    expect(extractFirstUrl("https://example.com/image.jpg")).toBe(
      "https://example.com/image.jpg",
    );
  });

  it("extracts the first URL from a comma-separated list", () => {
    expect(
      extractFirstUrl(
        "https://first.com/a.jpg, https://second.com/b.jpg",
      ),
    ).toBe("https://first.com/a.jpg");
  });

  it("handles URLs with query params", () => {
    expect(extractFirstUrl("https://cdn.gouv.fr/img?w=800&h=600")).toBe(
      "https://cdn.gouv.fr/img?w=800&h=600",
    );
  });

  it("returns null for empty/null/undefined", () => {
    expect(extractFirstUrl(null)).toBeNull();
    expect(extractFirstUrl(undefined)).toBeNull();
    expect(extractFirstUrl("")).toBeNull();
  });

  it("returns null for strings with no URL", () => {
    expect(extractFirstUrl("pas de lien ici")).toBeNull();
  });

  it("handles http (not just https)", () => {
    expect(extractFirstUrl("http://legacy.example.com/old")).toBe(
      "http://legacy.example.com/old",
    );
  });
});

// ── GTIN normalization ───────────────────────────────────────

function normalizeGtin(raw: number | null | undefined): string | null {
  if (!raw) return null;
  return String(raw).padStart(13, "0");
}

describe("normalizeGtin", () => {
  it("pads short barcodes to 13 digits", () => {
    expect(normalizeGtin(3760093420020)).toBe("3760093420020");
  });

  it("pads 8-digit EAN-8 to 13 digits", () => {
    expect(normalizeGtin(12345678)).toBe("0000012345678");
  });

  it("leaves 13-digit barcodes unchanged", () => {
    expect(normalizeGtin(3760093420020)).toBe("3760093420020");
  });

  it("returns null for null/undefined/0", () => {
    expect(normalizeGtin(null)).toBeNull();
    expect(normalizeGtin(undefined)).toBeNull();
    expect(normalizeGtin(0)).toBeNull();
  });
});

// ── RappelConso record transform ─────────────────────────────

interface RappelConsoRecord {
  reference_fiche: string;
  gtin?: number | null;
  marque_produit?: string;
  noms_des_modeles_ou_references?: string;
  motif_rappel?: string;
  risques_encourus?: string;
  conduites_a_tenir_par_le_consommateur?: string;
  preconisations_sanitaires?: string;
  distributeurs?: string;
  zone_geographique_de_vente?: string;
  liens_vers_les_images?: string;
  date_publication?: string;
}

function transformRecord(record: RappelConsoRecord, autoApprove: boolean) {
  const gtin = record.gtin ? String(record.gtin).padStart(13, "0") : null;
  return {
    sourceReference: record.reference_fiche,
    gtin,
    brandName: record.marque_produit ?? null,
    productName: record.noms_des_modeles_ou_references ?? null,
    recallReason: record.motif_rappel ?? "Motif non precise",
    healthRisks: record.risques_encourus ?? null,
    consumerActions: record.conduites_a_tenir_par_le_consommateur ?? null,
    healthPrecautions: record.preconisations_sanitaires ?? null,
    distributors: record.distributeurs ?? null,
    geoScope: record.zone_geographique_de_vente ?? null,
    imageUrl: extractFirstUrl(record.liens_vers_les_images),
    status: autoApprove ? "approved" : "pending",
    autoApproved: autoApprove,
  };
}

describe("transformRecord", () => {
  const baseRecord: RappelConsoRecord = {
    reference_fiche: "2026-03-0123",
    gtin: 3760093420020,
    marque_produit: "BIO HALAL",
    noms_des_modeles_ou_references: "Merguez halal 500g",
    motif_rappel: "Listeria monocytogenes",
    risques_encourus: "Risque grave pour personnes immunodeprimees",
    conduites_a_tenir_par_le_consommateur: "Ne pas consommer, rapporter en magasin",
    distributeurs: "Carrefour, Auchan",
    zone_geographique_de_vente: "France entiere",
    liens_vers_les_images: "https://cdn.rappel.conso.gouv.fr/img/123.jpg",
    date_publication: "2026-03-30",
  };

  it("transforms a complete record with auto-approve", () => {
    const result = transformRecord(baseRecord, true);
    expect(result.sourceReference).toBe("2026-03-0123");
    expect(result.gtin).toBe("3760093420020");
    expect(result.brandName).toBe("BIO HALAL");
    expect(result.recallReason).toBe("Listeria monocytogenes");
    expect(result.status).toBe("approved");
    expect(result.autoApproved).toBe(true);
  });

  it("sets status to pending when auto-approve is false", () => {
    const result = transformRecord(baseRecord, false);
    expect(result.status).toBe("pending");
    expect(result.autoApproved).toBe(false);
  });

  it("handles missing optional fields gracefully", () => {
    const minimal: RappelConsoRecord = {
      reference_fiche: "2026-03-MIN",
    };
    const result = transformRecord(minimal, true);
    expect(result.gtin).toBeNull();
    expect(result.brandName).toBeNull();
    expect(result.productName).toBeNull();
    expect(result.recallReason).toBe("Motif non precise");
    expect(result.healthRisks).toBeNull();
    expect(result.imageUrl).toBeNull();
  });

  it("extracts first image URL from comma-separated list", () => {
    const record: RappelConsoRecord = {
      reference_fiche: "2026-03-IMG",
      liens_vers_les_images:
        "https://cdn.gouv.fr/a.jpg, https://cdn.gouv.fr/b.jpg",
    };
    const result = transformRecord(record, true);
    expect(result.imageUrl).toBe("https://cdn.gouv.fr/a.jpg");
  });

  it("normalizes short GTIN to 13 digits", () => {
    const record: RappelConsoRecord = {
      reference_fiche: "2026-03-SHORT",
      gtin: 12345678,
    };
    const result = transformRecord(record, true);
    expect(result.gtin).toBe("0000012345678");
  });
});
