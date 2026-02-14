/**
 * Halal Store Seed — Enterprise-Grade Data Pipeline
 *
 * Sources:
 * - AVS (A Votre Service): Restaurants, Grossistes, Abattoirs
 * - Achahada: Boucheries certifiées, Marques/Fournisseurs
 *
 * Data quality pipeline:
 * 1. Extract: Load raw JSON assets
 * 2. Transform: Normalize, validate, enrich
 * 3. Deduplicate: Fuzzy match on name+coordinates
 * 4. Load: NewStore[] ready for Drizzle upsert
 *
 * Future: Cron scraper will refresh from official AVS/Achahada websites.
 */

import type { NewStore } from "../schema/stores.js";

// ── Source data shapes ──────────────────────────────────────────

interface AVSEntry {
  id: string;
  name: string;
  city: string | null;
  zipCode: string | null;
  address: string | null;
  country: string | null;
  latitude: number;
  longitude: number;
  phone: string | null;
  fax: string | null;
  email: string | null;
  webSite: string | null;
  agreementNumber: string | null;
  veterinaryStamp: string | null;
  comment: string | null;
  active: boolean;
  contact: string | null;
  companyName: string | null;
  specialties: string | null;
  siteTypes: string[];
}

interface AchahadaEntry {
  id: string;
  store: string;
  address: string;
  address2: string;
  city: string;
  zip: string;
  country: string;
  lat: string;
  lng: string;
  phone: string;
  email: string;
  hours: string; // HTML table
  url: string;
  thumb: string; // HTML img tag
  distance: number;
}

// ── Data quality: normalization helpers ──────────────────────────

/** Normalize city names: "SAINTE GENEVIEVE DES BOIS" → "Sainte Geneviève des Bois" */
function normalizeCity(city: string): string {
  if (!city) return "Inconnu";
  return city
    .trim()
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase())
    .replace(/\bDe\b/g, "de")
    .replace(/\bDes\b/g, "des")
    .replace(/\bDu\b/g, "du")
    .replace(/\bLe\b/g, "le")
    .replace(/\bLa\b/g, "la")
    .replace(/\bLes\b/g, "les")
    .replace(/\bEn\b/g, "en")
    .replace(/\bSur\b/g, "sur")
    // Fix edge case: first word should stay capitalized
    .replace(/^./, (c) => c.toUpperCase());
}

/** Normalize phone to E.164-ish: "01 23 45 67 89" → "+33123456789" */
function normalizePhone(phone: string | null): string | null {
  if (!phone?.trim()) return null;
  const digits = phone.replace(/\D/g, "");
  if (digits.length === 10 && digits.startsWith("0")) {
    return `+33${digits.slice(1)}`;
  }
  if (digits.length === 11 && digits.startsWith("33")) {
    return `+${digits}`;
  }
  return phone.trim();
}

/** Normalize postal code: ensure 5 digits, zero-pad */
function normalizePostalCode(zip: string | null | undefined): string | null {
  if (!zip?.trim()) return null;
  const cleaned = zip.replace(/\D/g, "");
  return cleaned.padStart(5, "0");
}

/** Decode HTML entities */
function decodeHtml(html: string): string {
  return html
    .replace(/&rsquo;/g, "\u2019")
    .replace(/&lsquo;/g, "\u2018")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(parseInt(code)))
    .replace(/\\u([0-9a-fA-F]{4})/g, (_, hex) =>
      String.fromCharCode(parseInt(hex, 16))
    )
    .trim();
}

/** Extract image URL from HTML img tag */
function extractImageUrl(html: string | null): string | null {
  if (!html?.trim()) return null;
  const match = html.match(/src="([^"]+)"/);
  if (!match?.[1]) return null;
  // Prefer the highest resolution: strip size suffixes like -150x150
  return match[1].replace(/-\d+x\d+(\.\w+)$/, "$1");
}

/** Parse Achahada HTML opening hours to structured JSON */
function parseOpeningHours(html: string | null): Record<string, string> | null {
  if (!html?.trim()) return null;
  const hours: Record<string, string> = {};
  const rows = html.match(/<tr>.*?<\/tr>/g);
  if (!rows) return null;
  for (const row of rows) {
    const cells = row.match(/<td>(.*?)<\/td>/g);
    if (cells?.length === 2) {
      const day = cells[0].replace(/<[^>]+>/g, "").trim();
      const time = cells[1].replace(/<[^>]+>/g, "").trim();
      if (day) hours[day] = time;
    }
  }
  return Object.keys(hours).length > 0 ? hours : null;
}

// ── Geo validation ──────────────────────────────────────────────

/** France bounding box (metropolitan) */
const FRANCE_BOUNDS = {
  minLat: 41.3, maxLat: 51.1, // Corsica → Dunkirk
  minLng: -5.2, maxLng: 9.6,  // Brittany → Alsace
};

function isValidFranceCoord(lat: number, lng: number): boolean {
  if (isNaN(lat) || isNaN(lng)) return false;
  if (lat === 0 && lng === 0) return false; // null island
  return (
    lat >= FRANCE_BOUNDS.minLat &&
    lat <= FRANCE_BOUNDS.maxLat &&
    lng >= FRANCE_BOUNDS.minLng &&
    lng <= FRANCE_BOUNDS.maxLng
  );
}

// ── Deduplication ───────────────────────────────────────────────

/** Generate a dedup key: normalized name + rounded coords (100m grid) */
function dedupKey(name: string, lat: number, lng: number): string {
  const normalizedName = name
    .toLowerCase()
    .replace(/[^a-z0-9àâäéèêëïîôùûüÿçœæ]/g, "")
    .trim();
  // Round to ~100m precision
  const roundedLat = Math.round(lat * 1000) / 1000;
  const roundedLng = Math.round(lng * 1000) / 1000;
  return `${normalizedName}|${roundedLat}|${roundedLng}`;
}

// ── Transform AVS → NewStore ────────────────────────────────────

function transformAVS(
  entry: AVSEntry,
  storeType: "restaurant" | "wholesaler" | "abattoir",
): NewStore | null {
  if (!entry.active) return null;
  if (!isValidFranceCoord(entry.latitude, entry.longitude)) return null;

  const description = [
    entry.comment,
    entry.agreementNumber ? `N° agrément: ${entry.agreementNumber}` : null,
    entry.veterinaryStamp ? `Estampille vétérinaire: ${entry.veterinaryStamp}` : null,
    entry.specialties,
    entry.companyName && entry.companyName !== entry.name
      ? `Société: ${entry.companyName}`
      : null,
  ]
    .filter(Boolean)
    .join(" · ") || null;

  return {
    name: decodeHtml(entry.name),
    storeType,
    address: entry.address?.trim() ?? "",
    city: normalizeCity(entry.city ?? ""),
    postalCode: normalizePostalCode(entry.zipCode),
    country: "France",
    latitude: entry.latitude,
    longitude: entry.longitude,
    phone: normalizePhone(entry.phone),
    email: entry.email?.trim() || null,
    website: entry.webSite?.trim() || null,
    halalCertified: true,
    certifier: "avs",
    certifierName: "AVS — A Votre Service",
    description,
    sourceId: `avs-${storeType}-${entry.id}`,
    sourceType: `avs_${storeType}`,
    rawData: entry,
    isActive: true,
  };
}

// ── Transform Achahada → NewStore ───────────────────────────────

function transformAchahada(
  entry: AchahadaEntry,
  storeType: "butcher" | "wholesaler",
): NewStore | null {
  const lat = parseFloat(entry.lat?.trim());
  const lng = parseFloat(entry.lng?.trim());

  if (!isValidFranceCoord(lat, lng)) return null;

  const logoUrl = extractImageUrl(entry.thumb);
  const openingHours = parseOpeningHours(entry.hours);

  return {
    name: decodeHtml(entry.store),
    storeType,
    address: [entry.address?.trim(), entry.address2?.trim()]
      .filter(Boolean)
      .join(", "),
    city: normalizeCity(entry.city),
    postalCode: normalizePostalCode(entry.zip),
    country: "France",
    latitude: lat,
    longitude: lng,
    phone: normalizePhone(entry.phone),
    email: entry.email?.trim() || null,
    website: entry.url?.trim() || null,
    logoUrl,
    halalCertified: true,
    certifier: "achahada",
    certifierName: "Achahada — Certification Halal",
    description: openingHours
      ? `Horaires: ${Object.entries(openingHours).map(([d, h]) => `${d}: ${h}`).join(", ")}`
      : null,
    sourceId: `achahada-${storeType}-${entry.id}`,
    sourceType: `achahada_${storeType}`,
    rawData: { ...entry, parsedHours: openingHours },
    isActive: true,
  };
}

// ── Pipeline: Load → Transform → Validate → Deduplicate ────────

export interface SeedStats {
  totalRaw: number;
  filteredInactive: number;
  filteredBadGeo: number;
  deduplicated: number;
  finalCount: number;
  bySource: Record<string, number>;
  byType: Record<string, number>;
}

export async function loadStoreSeedData(): Promise<{
  stores: NewStore[];
  stats: SeedStats;
}> {
  const all: NewStore[] = [];
  const stats: SeedStats = {
    totalRaw: 0,
    filteredInactive: 0,
    filteredBadGeo: 0,
    deduplicated: 0,
    finalCount: 0,
    bySource: {},
    byType: {},
  };

  // ── Load AVS Restaurants ──────────────────────────────
  const avsRestaurants: AVSEntry[] = await import(
    "../../../asset/avs-certified-restaurant.json",
    { with: { type: "json" } }
  ).then((m) => m.default);
  stats.totalRaw += avsRestaurants.length;

  for (const entry of avsRestaurants) {
    const store = transformAVS(entry, "restaurant");
    if (store) all.push(store);
    else if (!entry.active) stats.filteredInactive++;
    else stats.filteredBadGeo++;
  }

  // ── Load AVS Suppliers ────────────────────────────────
  const avsSuppliers: AVSEntry[] = await import(
    "../../../asset/avs-certified-suppliers.json",
    { with: { type: "json" } }
  ).then((m) => m.default);
  stats.totalRaw += avsSuppliers.length;

  for (const entry of avsSuppliers) {
    const store = transformAVS(entry, "wholesaler");
    if (store) all.push(store);
    else if (!entry.active) stats.filteredInactive++;
    else stats.filteredBadGeo++;
  }

  // ── Load AVS Abattoirs ────────────────────────────────
  const avsAbattoirs: AVSEntry[] = await import(
    "../../../asset/avs-certified-abatoirs.json",
    { with: { type: "json" } }
  ).then((m) => m.default);
  stats.totalRaw += avsAbattoirs.length;

  for (const entry of avsAbattoirs) {
    const store = transformAVS(entry, "abattoir");
    if (store) all.push(store);
    else if (!entry.active) stats.filteredInactive++;
    else stats.filteredBadGeo++;
  }

  // ── Load Achahada Boucheries ──────────────────────────
  const achahadaBoucheries: AchahadaEntry[] = await import(
    "../../../asset/achahada-certified-boucheries.json",
    { with: { type: "json" } }
  ).then((m) => m.default);
  stats.totalRaw += achahadaBoucheries.length;

  for (const entry of achahadaBoucheries) {
    const store = transformAchahada(entry, "butcher");
    if (store) all.push(store);
    else stats.filteredBadGeo++;
  }

  // ── Load Achahada Brands/Fournisseurs ─────────────────
  const achahadaBrands: AchahadaEntry[] = await import(
    "../../../asset/achahada-certified-brands.json",
    { with: { type: "json" } }
  ).then((m) => m.default);
  stats.totalRaw += achahadaBrands.length;

  for (const entry of achahadaBrands) {
    const store = transformAchahada(entry, "wholesaler");
    if (store) all.push(store);
    else stats.filteredBadGeo++;
  }

  // ── Deduplicate ───────────────────────────────────────
  const seen = new Map<string, NewStore>();
  for (const store of all) {
    const key = dedupKey(store.name, store.latitude, store.longitude);
    if (seen.has(key)) {
      stats.deduplicated++;
      // Prefer AVS data (more structured) over Achahada
      const existing = seen.get(key)!;
      if (
        existing.sourceType?.startsWith("achahada") &&
        store.sourceType?.startsWith("avs")
      ) {
        seen.set(key, store);
      }
    } else {
      seen.set(key, store);
    }
  }

  const dedupedStores = [...seen.values()];

  // ── Compute stats ─────────────────────────────────────
  for (const store of dedupedStores) {
    const source = store.sourceType?.split("_")[0] ?? "unknown";
    stats.bySource[source] = (stats.bySource[source] ?? 0) + 1;
    const sType = store.storeType ?? "other";
    stats.byType[sType] = (stats.byType[sType] ?? 0) + 1;
  }
  stats.finalCount = dedupedStores.length;

  return { stores: dedupedStores, stats };
}
