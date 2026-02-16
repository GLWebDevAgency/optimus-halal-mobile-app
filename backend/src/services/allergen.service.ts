/**
 * Allergen Normalization Service
 *
 * Maps user-entered allergen names (FR/EN) to OpenFoodFacts tag format.
 * Cross-matches user profile allergens against product allergens.
 */

export interface AllergenMatch {
  userAllergen: string;
  offTag: string;
  matchType: "allergen" | "trace";
  severity: "high" | "medium";
}

// French/English allergen names → OFF tag format
const ALLERGEN_NORMALIZATION: Record<string, string> = {
  // Milk/Lactose
  lactose: "en:milk",
  lait: "en:milk",
  milk: "en:milk",
  "produits laitiers": "en:milk",
  dairy: "en:milk",

  // Peanuts
  arachides: "en:peanuts",
  "cacahuètes": "en:peanuts",
  peanuts: "en:peanuts",

  // Gluten
  gluten: "en:gluten",
  "blé": "en:gluten",
  wheat: "en:gluten",
  seigle: "en:gluten",
  orge: "en:gluten",
  avoine: "en:gluten",

  // Eggs
  oeufs: "en:eggs",
  "\u0153ufs": "en:eggs",
  eggs: "en:eggs",

  // Soy
  soja: "en:soybeans",
  soy: "en:soybeans",
  soybeans: "en:soybeans",

  // Nuts
  "fruits \u00e0 coque": "en:nuts",
  noix: "en:nuts",
  noisettes: "en:nuts",
  amandes: "en:nuts",
  nuts: "en:nuts",
  almonds: "en:nuts",
  hazelnuts: "en:nuts",
  pistaches: "en:nuts",
  cajou: "en:nuts",
  "noix de cajou": "en:nuts",

  // Fish
  poisson: "en:fish",
  fish: "en:fish",

  // Crustaceans
  "crustac\u00e9s": "en:crustaceans",
  crustaceans: "en:crustaceans",
  crevettes: "en:crustaceans",
  shrimp: "en:crustaceans",

  // Molluscs
  mollusques: "en:molluscs",
  molluscs: "en:molluscs",

  // Celery
  "c\u00e9leri": "en:celery",
  celery: "en:celery",

  // Mustard
  moutarde: "en:mustard",
  mustard: "en:mustard",

  // Sesame
  "s\u00e9same": "en:sesame-seeds",
  sesame: "en:sesame-seeds",

  // Lupin
  lupin: "en:lupin",

  // Sulfites
  sulfites: "en:sulphur-dioxide-and-sulphites",
  "dioxyde de soufre": "en:sulphur-dioxide-and-sulphites",
  "sulphur dioxide": "en:sulphur-dioxide-and-sulphites",
};

/**
 * Cross-match user allergens against product allergens + traces from OpenFoodFacts.
 */
export function matchAllergens(
  userAllergens: string[],
  productAllergenTags: string[],
  productTracesTags: string[]
): AllergenMatch[] {
  const matches: AllergenMatch[] = [];

  for (const userAllergen of userAllergens) {
    const normalized = ALLERGEN_NORMALIZATION[userAllergen.toLowerCase()];
    if (!normalized) continue;

    if (productAllergenTags.some((tag) => tag.toLowerCase() === normalized)) {
      matches.push({
        userAllergen,
        offTag: normalized,
        matchType: "allergen",
        severity: "high",
      });
    }

    if (productTracesTags.some((tag) => tag.toLowerCase() === normalized)) {
      matches.push({
        userAllergen,
        offTag: normalized,
        matchType: "trace",
        severity: "medium",
      });
    }
  }

  return matches;
}
