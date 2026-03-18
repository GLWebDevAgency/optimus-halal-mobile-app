/**
 * Dev-only scan history seeder.
 *
 * - Guest users → seeds useLocalScanHistoryStore (MMKV)
 * - Authenticated users → calls scan.scanBarcode tRPC mutation
 *   to create real scan records in the DB
 *
 * Uses a persistent MMKV flag to avoid re-seeding on every app restart.
 * Remove after testing or gate behind __DEV__.
 */

import { useEffect, useRef } from "react";
import { useLocalScanHistoryStore } from "@/store";
import { mmkvStorage } from "@/lib/storage";
import { useScanBarcode } from "@/hooks/useScan";
import { trpc } from "@/lib/trpc";
import { logger } from "@/lib/logger";

const DEV_SEED_KEY = "naqiy.dev-scans-seeded-v2";

/** Barcodes to seed — must exist in OFF or local products DB */
const TEST_BARCODES = [
  "3353470012002", // Cordon bleu de dinde halal (AVS)
  "5060212650900", // Mutton Biryani (Achahada)
  "3154230802280", // Lardons fumés (Herta)
  "3046920029759", // Excellence 90% Cacao (Lindt)
  "80052760",      // Kinder Bueno (Ferrero)
];

/** Static product data for guest/local seeding */
const TEST_PRODUCTS_LOCAL = [
  {
    barcode: "3353470012002",
    productId: "dev-avs-cordon-bleu",
    name: "Cordon bleu de dinde halal",
    brand: "Le Gaulois",
    imageUrl: "https://images.openfoodfacts.org/images/products/335/347/001/2002/front_fr.32.400.jpg",
    halalStatus: "halal" as const,
    confidenceScore: 92,
    certifierId: "avs-a-votre-service",
    certifierName: "AVS - A Votre Service",
  },
  {
    barcode: "5060212650900",
    productId: "dev-achahada-biryani",
    name: "Mutton Biryani",
    brand: "Elakkia",
    imageUrl: "https://images.openfoodfacts.org/images/products/506/021/265/0900/front_en.5.400.jpg",
    halalStatus: "halal" as const,
    confidenceScore: 88,
    certifierId: "achahada",
    certifierName: "Achahada",
  },
  {
    barcode: "3154230802280",
    productId: "dev-herta-lardons",
    name: "Lardons fumés",
    brand: "Herta",
    imageUrl: "https://images.openfoodfacts.org/images/products/315/423/080/2280/front_fr.79.400.jpg",
    halalStatus: "haram" as const,
    confidenceScore: 99,
    certifierId: null,
    certifierName: null,
  },
  {
    barcode: "3046920029759",
    productId: "dev-lindt-90",
    name: "Excellence 90% Cacao",
    brand: "Lindt",
    imageUrl: "https://images.openfoodfacts.org/images/products/304/692/002/9759/front_fr.57.400.jpg",
    halalStatus: "doubtful" as const,
    confidenceScore: 45,
    certifierId: null,
    certifierName: null,
  },
  {
    barcode: "80052760",
    productId: "dev-kinder-bueno",
    name: "Kinder Bueno",
    brand: "Ferrero",
    imageUrl: "https://images.openfoodfacts.org/images/products/800/527/60/front_fr.26.400.jpg",
    halalStatus: "doubtful" as const,
    confidenceScore: 35,
    certifierId: null,
    certifierName: null,
  },
] as const;

/** Seed the local MMKV store (guest mode only) */
function seedLocalStore() {
  const store = useLocalScanHistoryStore.getState();
  if (store.scans.length >= 3) return;

  for (const product of TEST_PRODUCTS_LOCAL) {
    store.addScan({
      barcode: product.barcode,
      productId: product.productId,
      name: product.name,
      brand: product.brand,
      imageUrl: product.imageUrl,
      halalStatus: product.halalStatus,
      confidenceScore: product.confidenceScore,
      certifierId: product.certifierId,
      certifierName: product.certifierName,
      certifierTrustScore: null,
    });
  }
}

// ── DevScanSeeder Component ──────────────────────────────────────
// Renderless component — must be rendered inside trpc.Provider.
// Handles both guest (local MMKV) and authenticated (tRPC mutation) seeding.

interface DevScanSeederProps {
  isAuthenticated: boolean;
}

export function DevScanSeeder({ isAuthenticated }: DevScanSeederProps) {
  const scanMutation = useScanBarcode();
  const utils = trpc.useUtils();
  const seeding = useRef(false);

  useEffect(() => {
    if (seeding.current) return;
    if (mmkvStorage.getItem(DEV_SEED_KEY)) return;
    seeding.current = true;

    if (isAuthenticated) {
      // Authenticated: call real scanBarcode mutations → creates DB records
      (async () => {
        let count = 0;
        for (const barcode of TEST_BARCODES) {
          try {
            await scanMutation.mutateAsync({ barcode });
            count++;
          } catch (e) {
            logger.warn("DevSeed", `Scan failed: ${barcode}`, String(e));
          }
        }
        if (count > 0) {
          utils.scan.getHistory.invalidate();
        }
        mmkvStorage.setItem(DEV_SEED_KEY, "true");
        logger.info("DevSeed", `Seeded ${count}/${TEST_BARCODES.length} scans (server)`);
      })();
    } else {
      // Guest: seed MMKV local store
      seedLocalStore();
      mmkvStorage.setItem(DEV_SEED_KEY, "true");
      logger.info("DevSeed", "Seeded local scan history (guest)");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated]);

  return null;
}
