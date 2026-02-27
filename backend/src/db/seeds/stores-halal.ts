/**
 * Halal Store Seed — Enterprise-Grade Data Pipeline v2
 *
 * Sources:
 * - AVS (A Votre Service): Boucheries, Restaurants, Fournisseurs, Abattoirs
 * - Achahada: 262 stores (boucheries, restaurants, supermarchés, grossistes, abattoirs)
 *
 * Data quality pipeline:
 * 1. Extract: Load raw JSON assets (fresh from fetch-store-data.ts)
 * 2. Transform: Normalize, validate, enrich (logos from R2, hours parsed)
 * 3. Deduplicate: Fuzzy match on name+coordinates (100m grid)
 * 4. Load: NewStore[] + ParsedStoreHours[] ready for Drizzle upsert
 *
 * Asset dependencies:
 * - avs-boucheries.json, avs-restaurants.json, avs-fournisseurs.json (from fetch:stores)
 * - avs-certified-abatoirs.json (original dump — no public endpoint)
 * - achahada-all-stores.json + categoryMap (from fetch:stores)
 * - achahada-logo-map.json (from upload:logos)
 */

import type { NewStore } from "../schema/stores.js";

// ── Source data shapes (exported for store-refresh.service.ts) ──

/** AVS Abattoirs (legacy manual dump — equinox.avs.fr, different field set) */
export interface AVSLegacyEntry {
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

/**
 * AVS Sites — shared shape for Boucheries, Restaurants, Fournisseurs
 * (equinox.avs.fr/v1/website/sites/* and /providers endpoints)
 * All 3 endpoints return this common shape with `isActive` (not `active`).
 * Nullable fields: country, phone, fax, email, webSite, specialities
 */
export interface AVSSiteEntry {
  id: string;
  name: string;
  city: string;
  zipCode: string;
  address: string;
  country: string | null;
  lat: number;
  lon: number;
  latitude: number;
  longitude: number;
  phone: string | null;
  fax: string | null;
  email: string | null;
  webSite: string | null;
  specialities: string | null;
  isActive: boolean;
  isActivityMealBag: boolean;
}

/** Achahada store (achahada.com WordPress store locator) */
export interface AchahadaEntry {
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
  hours: string; // HTML table with <time> tags
  url: string;
  thumb: string; // HTML img tag
  distance: number;
}

export interface AchahadaAllStoresData {
  stores: AchahadaEntry[];
  categoryMap: Record<string, number[]>;
  fetchedAt: string;
}

// ── Parsed hours output ─────────────────────────────────────────

export interface ParsedStoreHours {
  sourceId: string;
  dayOfWeek: number; // 0=Sunday, 6=Saturday
  openTime: string | null; // "09:00"
  closeTime: string | null; // "17:00"
  isClosed: boolean;
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

// ── Achahada category → store type resolution ───────────────────

/**
 * Achahada filter IDs → store types (priority order, first match wins):
 *   73 → butcher       (Boucheries)
 *   83 → restaurant    (Restaurants / Fast-food)
 *   90 → abattoir      (Abattoirs)
 *   75 → supermarket   (Grandes Surfaces)
 *   89 → wholesaler    (Grossistes)
 *   91 → wholesaler    (Marques / Fournisseurs)
 *   77 → other         (Autres — catch-all, 142 stores)
 *   80 → other         (Divers)
 */
const ACHAHADA_CATEGORY_PRIORITY: Array<{ filterId: number; storeType: NewStore["storeType"] }> = [
  { filterId: 73, storeType: "butcher" },
  { filterId: 83, storeType: "restaurant" },
  { filterId: 90, storeType: "abattoir" },
  { filterId: 75, storeType: "supermarket" },
  { filterId: 89, storeType: "wholesaler" },
  { filterId: 91, storeType: "wholesaler" },
  { filterId: 77, storeType: "other" },
  { filterId: 80, storeType: "other" },
];

function resolveAchahadaType(categoryIds: number[] | undefined): NewStore["storeType"] {
  if (!categoryIds?.length) return "other";
  for (const { filterId, storeType } of ACHAHADA_CATEGORY_PRIORITY) {
    if (categoryIds.includes(filterId)) return storeType;
  }
  return "other";
}

/**
 * 3 entries in achahada-all-stores.json are notes about other certifiers,
 * not actual stores. Filter them out.
 */
const INCLASSABLE_IDS = new Set(["9058", "9063"]); // AVS note, Mosquée de Lyon note

function isInclassableStore(entry: AchahadaEntry): boolean {
  if (INCLASSABLE_IDS.has(entry.id)) return true;
  const name = entry.store.toLowerCase();
  return name.startsWith("avs ") || name.includes("mosqué");
}

// ── Hours parsing ───────────────────────────────────────────────

const DAY_MAP: Record<string, number> = {
  sunday: 0,
  monday: 1,
  tuesday: 2,
  wednesday: 3,
  thursday: 4,
  friday: 5,
  saturday: 6,
};

/** Convert "9:00 AM" → "09:00", "5:00 PM" → "17:00" */
function to24h(timeStr: string): string | null {
  const match = timeStr.trim().match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  if (!match) return null;
  let hours = parseInt(match[1], 10);
  const minutes = match[2];
  const period = match[3].toUpperCase();
  if (period === "PM" && hours !== 12) hours += 12;
  if (period === "AM" && hours === 12) hours = 0;
  return `${String(hours).padStart(2, "0")}:${minutes}`;
}

/** Parse "9:00 AM - 5:00 PM" → { openTime: "09:00", closeTime: "17:00" } */
function parseTimeRange(rangeStr: string): { openTime: string | null; closeTime: string | null } {
  const parts = rangeStr.split("-").map((s) => s.trim());
  if (parts.length !== 2) return { openTime: null, closeTime: null };
  return {
    openTime: to24h(parts[0]),
    closeTime: to24h(parts[1]),
  };
}

/**
 * Parse Achahada HTML hours table into structured storeHours rows.
 * Input: `<table ...><tr><td>Monday</td><td><time>9:00 AM - 5:00 PM</time></td></tr>...</table>`
 * Output: ParsedStoreHours[] (one per day)
 */
function convertHoursToStoreHours(html: string | null, sourceId: string): ParsedStoreHours[] {
  if (!html?.trim()) return [];
  const results: ParsedStoreHours[] = [];

  const rows = html.match(/<tr>.*?<\/tr>/gs);
  if (!rows) return [];

  for (const row of rows) {
    const cells = row.match(/<td>(.*?)<\/td>/gs);
    if (cells?.length !== 2) continue;

    const dayStr = cells[0].replace(/<[^>]+>/g, "").trim().toLowerCase();
    const dayOfWeek = DAY_MAP[dayStr];
    if (dayOfWeek === undefined) continue;

    const timeCell = cells[1].replace(/<[^>]+>/g, "").trim();

    if (timeCell.toLowerCase() === "closed") {
      results.push({ sourceId, dayOfWeek, openTime: null, closeTime: null, isClosed: true });
    } else {
      const { openTime, closeTime } = parseTimeRange(timeCell);
      if (openTime && closeTime) {
        results.push({ sourceId, dayOfWeek, openTime, closeTime, isClosed: false });
      }
    }
  }

  return results;
}

/** Parse Achahada HTML opening hours to structured JSON (for description/rawData) */
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

// ── Transform AVS Legacy (Abattoirs only) → NewStore ────────────

function transformAVSLegacy(
  entry: AVSLegacyEntry,
  storeType: "abattoir",
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

// ── Transform AVS Sites (Boucheries/Restaurants/Fournisseurs) → NewStore ──

function transformAVSSite(
  entry: AVSSiteEntry,
  storeType: "butcher" | "restaurant" | "wholesaler",
): NewStore | null {
  if (!entry.isActive) return null;
  if (!isValidFranceCoord(entry.latitude, entry.longitude)) return null;

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
    description: entry.specialities ?? null,
    sourceId: `avs-${storeType}-${entry.id}`,
    sourceType: `avs_${storeType}`,
    rawData: entry,
    isActive: true,
  };
}

// ── Transform Achahada → NewStore ───────────────────────────────

function transformAchahada(
  entry: AchahadaEntry,
  storeType: NewStore["storeType"],
  logoMap: Record<string, string>,
): NewStore | null {
  const lat = parseFloat(entry.lat?.trim());
  const lng = parseFloat(entry.lng?.trim());

  if (!isValidFranceCoord(lat, lng)) return null;

  const openingHours = parseOpeningHours(entry.hours);
  const logoUrl = logoMap[entry.id] ?? null;

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
    sourceId: `achahada-${entry.id}`,
    sourceType: "achahada",
    rawData: { ...entry, parsedHours: openingHours },
    isActive: true,
  };
}

// ── Pipeline: Transform → Validate → Deduplicate ────────────────

export interface SeedStats {
  totalRaw: number;
  filteredInactive: number;
  filteredBadGeo: number;
  filteredInclassable: number;
  deduplicated: number;
  finalCount: number;
  bySource: Record<string, number>;
  byType: Record<string, number>;
  hoursCount: number;
}

/**
 * Pure transform/validate/dedup pipeline — zero I/O.
 * Accepts raw data from any source (static JSON files or live API fetch).
 * Used by both:
 *   - loadStoreSeedData() → reads from asset/ JSON files
 *   - store-refresh.service.ts → fetches from live APIs
 */
export function transformAndDedup(
  avsBoucheries: AVSSiteEntry[],
  avsRestaurants: AVSSiteEntry[],
  avsFournisseurs: AVSSiteEntry[],
  avsAbattoirs: AVSLegacyEntry[],
  achahadaData: AchahadaAllStoresData,
  logoMap: Record<string, string>,
): { stores: NewStore[]; hours: ParsedStoreHours[]; stats: SeedStats; droppedSourceIds: string[] } {
  const all: NewStore[] = [];
  const allHours: ParsedStoreHours[] = [];
  const stats: SeedStats = {
    totalRaw: 0,
    filteredInactive: 0,
    filteredBadGeo: 0,
    filteredInclassable: 0,
    deduplicated: 0,
    finalCount: 0,
    bySource: {},
    byType: {},
    hoursCount: 0,
  };

  // ── AVS Boucheries ─────────────────────────────────────
  stats.totalRaw += avsBoucheries.length;
  for (const entry of avsBoucheries) {
    const store = transformAVSSite(entry, "butcher");
    if (store) all.push(store);
    else if (!entry.isActive) stats.filteredInactive++;
    else stats.filteredBadGeo++;
  }

  // ── AVS Restaurants ────────────────────────────────────
  stats.totalRaw += avsRestaurants.length;
  for (const entry of avsRestaurants) {
    const store = transformAVSSite(entry, "restaurant");
    if (store) all.push(store);
    else if (!entry.isActive) stats.filteredInactive++;
    else stats.filteredBadGeo++;
  }

  // ── AVS Fournisseurs ───────────────────────────────────
  stats.totalRaw += avsFournisseurs.length;
  for (const entry of avsFournisseurs) {
    const store = transformAVSSite(entry, "wholesaler");
    if (store) all.push(store);
    else if (!entry.isActive) stats.filteredInactive++;
    else stats.filteredBadGeo++;
  }

  // ── AVS Abattoirs ──────────────────────────────────────
  stats.totalRaw += avsAbattoirs.length;
  for (const entry of avsAbattoirs) {
    const store = transformAVSLegacy(entry, "abattoir");
    if (store) all.push(store);
    else if (!entry.active) stats.filteredInactive++;
    else stats.filteredBadGeo++;
  }

  // ── Achahada ───────────────────────────────────────────
  stats.totalRaw += achahadaData.stores.length;
  for (const entry of achahadaData.stores) {
    if (isInclassableStore(entry)) {
      stats.filteredInclassable++;
      continue;
    }

    const categoryIds = achahadaData.categoryMap[entry.id];
    const storeType = resolveAchahadaType(categoryIds);

    const store = transformAchahada(entry, storeType, logoMap);
    if (store) {
      all.push(store);
      const hours = convertHoursToStoreHours(entry.hours, `achahada-${entry.id}`);
      allHours.push(...hours);
    } else {
      stats.filteredBadGeo++;
    }
  }

  // ── Deduplicate ───────────────────────────────────────
  const seen = new Map<string, NewStore>();
  const allSourceIds = new Set<string>();
  for (const store of all) {
    if (store.sourceId) allSourceIds.add(store.sourceId);
    const key = dedupKey(store.name, store.latitude, store.longitude);
    if (seen.has(key)) {
      stats.deduplicated++;
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

  // Filter hours to only include stores that survived dedup
  const survivingSourceIds = new Set(dedupedStores.map((s) => s.sourceId));

  // Track sourceIds that were dropped during dedup (for DB cleanup)
  const droppedSourceIds = [...allSourceIds].filter((id) => !survivingSourceIds.has(id));
  const dedupedHours = allHours.filter((h) => survivingSourceIds.has(h.sourceId));

  // ── Compute stats ─────────────────────────────────────
  for (const store of dedupedStores) {
    const source = store.sourceType === "achahada" ? "achahada" : store.sourceType?.split("_")[0] ?? "unknown";
    stats.bySource[source] = (stats.bySource[source] ?? 0) + 1;
    const sType = store.storeType ?? "other";
    stats.byType[sType] = (stats.byType[sType] ?? 0) + 1;
  }
  stats.finalCount = dedupedStores.length;
  stats.hoursCount = dedupedHours.length;

  return { stores: dedupedStores, hours: dedupedHours, stats, droppedSourceIds };
}

/**
 * Load store seed data from static asset/ JSON files.
 * Delegates to transformAndDedup() for the actual pipeline.
 */
export async function loadStoreSeedData(): Promise<{
  stores: NewStore[];
  hours: ParsedStoreHours[];
  stats: SeedStats;
  droppedSourceIds: string[];
}> {
  const [avsBoucheries, avsRestaurants, avsFournisseurs, avsAbattoirs, achahadaData, logoMap] =
    await Promise.all([
      import("../../../asset/avs-boucheries.json", { with: { type: "json" } }).then((m) => m.default as AVSSiteEntry[]),
      import("../../../asset/avs-restaurants.json", { with: { type: "json" } }).then((m) => m.default as AVSSiteEntry[]),
      import("../../../asset/avs-fournisseurs.json", { with: { type: "json" } }).then((m) => m.default as AVSSiteEntry[]),
      import("../../../asset/avs-certified-abatoirs.json", { with: { type: "json" } }).then((m) => m.default as AVSLegacyEntry[]),
      import("../../../asset/achahada-all-stores.json", { with: { type: "json" } }).then((m) => m.default as AchahadaAllStoresData),
      import("../../../asset/achahada-logo-map.json", { with: { type: "json" } }).then((m) => m.default as Record<string, string>),
    ]);

  return transformAndDedup(avsBoucheries, avsRestaurants, avsFournisseurs, avsAbattoirs, achahadaData, logoMap);
}
