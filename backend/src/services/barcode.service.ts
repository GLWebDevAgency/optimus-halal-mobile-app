import { env } from "../lib/env.js";
import { redis } from "../lib/redis.js";

interface OpenFoodFactsProduct {
  code: string;
  product_name?: string;
  brands?: string;
  categories?: string;
  ingredients_text?: string;
  image_url?: string;
  image_front_url?: string;
  nutriments?: Record<string, number | string>;
  nutriscore_grade?: string;
  nova_group?: number;
  ecoscore_grade?: string;
  labels?: string;
  countries?: string;
  allergens?: string;
  traces?: string;
}

interface BarcodeResult {
  found: boolean;
  product?: OpenFoodFactsProduct;
}

const CACHE_TTL = 86400; // 24 hours

export async function lookupBarcode(barcode: string): Promise<BarcodeResult> {
  // Check Redis cache first
  const cacheKey = `off:${barcode}`;
  const cached = await redis.get(cacheKey);
  if (cached) {
    return JSON.parse(cached);
  }

  try {
    const url = `${env.OPENFOODFACTS_API_URL}/product/${barcode}.json`;
    const response = await fetch(url, {
      headers: {
        "User-Agent": "OptimusHalal/1.0 (contact@optimus-sila.com)",
      },
    });

    if (!response.ok) {
      return { found: false };
    }

    const data = (await response.json()) as { status: number; product?: Record<string, unknown> };

    if (data.status !== 1 || !data.product) {
      const result: BarcodeResult = { found: false };
      await redis.setex(cacheKey, CACHE_TTL, JSON.stringify(result));
      return result;
    }

    const p = data.product;
    const product: OpenFoodFactsProduct = {
      code: (p.code as string) ?? barcode,
      product_name: p.product_name as string | undefined,
      brands: p.brands as string | undefined,
      categories: p.categories as string | undefined,
      ingredients_text: p.ingredients_text as string | undefined,
      image_url: p.image_url as string | undefined,
      image_front_url: p.image_front_url as string | undefined,
      nutriments: p.nutriments as Record<string, number | string> | undefined,
      nutriscore_grade: p.nutriscore_grade as string | undefined,
      nova_group: p.nova_group as number | undefined,
      ecoscore_grade: p.ecoscore_grade as string | undefined,
      labels: p.labels as string | undefined,
      countries: p.countries as string | undefined,
      allergens: p.allergens as string | undefined,
      traces: p.traces as string | undefined,
    };

    const result: BarcodeResult = { found: true, product };
    await redis.setex(cacheKey, CACHE_TTL, JSON.stringify(result));
    return result;
  } catch (error) {
    console.error("[barcode] OpenFoodFacts lookup failed:", error);
    return { found: false };
  }
}

// Analyze ingredients for halal status heuristic
const HARAM_INGREDIENTS = [
  "porc", "pork", "gelatin", "gélatine", "lard", "saindoux",
  "alcool", "alcohol", "ethanol", "éthanol", "wine", "vin",
  "bière", "beer", "rhum", "rum", "whisky", "vodka", "brandy",
  "carmine", "cochineal", "e120", "e441", "e542",
];

const DOUBTFUL_INGREDIENTS = [
  "e471", "e472", "e473", "e474", "e475",
  "mono-", "diglycerides", "monoglycérides",
  "whey", "lactosérum",
  "rennet", "présure",
];

export function analyzeHalalStatus(
  ingredients: string | undefined
): { status: "halal" | "haram" | "doubtful" | "unknown"; confidence: number } {
  if (!ingredients) {
    return { status: "unknown", confidence: 0 };
  }

  const lower = ingredients.toLowerCase();

  for (const haram of HARAM_INGREDIENTS) {
    if (lower.includes(haram)) {
      return { status: "haram", confidence: 0.85 };
    }
  }

  for (const doubtful of DOUBTFUL_INGREDIENTS) {
    if (lower.includes(doubtful)) {
      return { status: "doubtful", confidence: 0.6 };
    }
  }

  return { status: "halal", confidence: 0.7 };
}
