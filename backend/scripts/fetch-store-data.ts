/**
 * fetch-store-data.ts — Downloads fresh store data from AVS + Achahada APIs.
 *
 * Usage: pnpm fetch:stores
 *
 * Outputs JSON files to backend/asset/ for the seed pipeline.
 * Safe to re-run: overwrites existing files.
 */

import { writeFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ASSET_DIR = join(__dirname, "../asset");

// ── AVS (equinox.avs.fr) ──────────────────────────────────────────

const AVS_BASE = "https://equinox.avs.fr/v1/website";

async function fetchAVS(): Promise<void> {
  const endpoints = [
    { url: `${AVS_BASE}/sites/br?type=1`, file: "avs-boucheries.json", label: "Boucheries" },
    { url: `${AVS_BASE}/sites/br?type=2`, file: "avs-restaurants.json", label: "Restaurants" },
    { url: `${AVS_BASE}/providers`, file: "avs-fournisseurs.json", label: "Fournisseurs" },
  ];

  for (const ep of endpoints) {
    console.log(`  AVS ${ep.label}...`);
    const res = await fetch(ep.url);
    if (!res.ok) {
      console.error(`    FAILED: HTTP ${res.status}`);
      continue;
    }
    const data = await res.json();
    const path = join(ASSET_DIR, ep.file);
    writeFileSync(path, JSON.stringify(data, null, 2), "utf-8");
    console.log(`    → ${data.length} stores → ${ep.file}`);
  }
}

// ── Achahada (achahada.com) ────────────────────────────────────────

const ACHAHADA_API = "https://achahada.com/api/index.php";
// Centered on France — large radius to get all stores
const ACHAHADA_PARAMS = "lat=46.6034&lng=2.3522";

const ACHAHADA_FILTERS: Record<number, string> = {
  74: "Base (all stores)",
  73: "Boucheries",
  75: "Distributeurs",
  77: "Cash & Carry",
  80: "Partenaires",
  83: "Restaurants certifiés",
  89: "Fabricants",
  90: "Abattoirs",
  91: "Marques certifiées",
};

interface AchahadaRaw {
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
  hours: string;
  url: string;
  thumb: string;
  distance: number;
  fax: string;
  state: string;
}

async function fetchAchahada(): Promise<void> {
  // Step 1: Fetch the base pool (filter=74 = all 262 stores)
  console.log("  Achahada base pool (filter=74)...");
  const baseRes = await fetch(`${ACHAHADA_API}?action=store_search&${ACHAHADA_PARAMS}&filter=74&lang=fr`);
  if (!baseRes.ok) {
    console.error(`    FAILED: HTTP ${baseRes.status}`);
    return;
  }
  const baseStores: AchahadaRaw[] = await baseRes.json();
  console.log(`    → ${baseStores.length} stores in base pool`);

  // Step 2: Fetch each sub-filter for category tagging
  const categoryMap: Record<string, number[]> = {};

  for (const [filterId, label] of Object.entries(ACHAHADA_FILTERS)) {
    const fid = Number(filterId);
    if (fid === 74) continue; // Already fetched as base

    console.log(`  Achahada ${label} (filter=${fid})...`);
    const res = await fetch(`${ACHAHADA_API}?action=store_search&${ACHAHADA_PARAMS}&filter=${fid}&lang=fr`);
    if (!res.ok) {
      console.error(`    FAILED: HTTP ${res.status}`);
      continue;
    }
    const stores: AchahadaRaw[] = await res.json();
    console.log(`    → ${stores.length} stores`);

    for (const s of stores) {
      if (!categoryMap[s.id]) categoryMap[s.id] = [];
      categoryMap[s.id].push(fid);
    }
  }

  // Step 3: Save combined output
  const output = {
    stores: baseStores,
    categoryMap,
    fetchedAt: new Date().toISOString(),
  };

  const path = join(ASSET_DIR, "achahada-all-stores.json");
  writeFileSync(path, JSON.stringify(output, null, 2), "utf-8");
  console.log(`    → Saved ${baseStores.length} stores + ${Object.keys(categoryMap).length} category mappings`);
}

// ── Main ───────────────────────────────────────────────────────────

async function main(): Promise<void> {
  console.log("╔══════════════════════════════════════════╗");
  console.log("║  Fetching fresh store data from APIs     ║");
  console.log("╚══════════════════════════════════════════╝\n");

  console.log("── AVS ──");
  await fetchAVS();

  console.log("\n── Achahada ──");
  await fetchAchahada();

  console.log("\n✓ Done! Fresh data saved to backend/asset/");
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
