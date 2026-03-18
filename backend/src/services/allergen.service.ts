/**
 * Allergen Matching Service
 *
 * Cross-matches user dietary exclusions against structured OFF tags.
 * Two layers: allergens_tags (high) and traces_tags (medium).
 * No ingredient text parsing — OFF structured data is the source of truth.
 */

export interface AllergenMatch {
  userAllergen: string;
  /** Human-readable label (FR) for display in alerts */
  displayName: string;
  offTag: string;
  matchType: "allergen" | "trace";
  severity: "high" | "medium";
}

// ── User input → canonical allergen ID ──────────────────────────

const ALLERGEN_NORMALIZATION: Record<string, string> = {
  // Milk/Lactose
  lactose: "milk", lait: "milk", milk: "milk",
  "produits laitiers": "milk", dairy: "milk",

  // Peanuts
  arachides: "peanuts", "cacahuètes": "peanuts", peanuts: "peanuts",

  // Gluten
  gluten: "gluten", "blé": "gluten", wheat: "gluten",
  seigle: "gluten", orge: "gluten", avoine: "gluten",

  // Eggs
  oeufs: "eggs", "\u0153ufs": "eggs", eggs: "eggs",

  // Soy
  soja: "soybeans", soy: "soybeans", soybeans: "soybeans",

  // Nuts
  "fruits \u00e0 coque": "nuts", noix: "nuts", noisettes: "nuts",
  amandes: "nuts", nuts: "nuts", almonds: "nuts", hazelnuts: "nuts",
  pistaches: "nuts", cajou: "nuts", "noix de cajou": "nuts",

  // Fish
  poisson: "fish", fish: "fish",

  // Crustaceans
  shellfish: "crustaceans", "crustac\u00e9s": "crustaceans",
  crustaceans: "crustaceans", crevettes: "crustaceans", shrimp: "crustaceans",

  // Molluscs
  mollusques: "molluscs", molluscs: "molluscs",

  // Celery
  "c\u00e9leri": "celery", celery: "celery",

  // Mustard
  moutarde: "mustard", mustard: "mustard",

  // Sesame
  "s\u00e9same": "sesame", sesame: "sesame",

  // Lupin
  lupin: "lupin",

  // Sulfites
  sulfites: "sulfites",
  "dioxyde de soufre": "sulfites",
  "sulphur dioxide": "sulfites",
};

// ── Display names (FR) per canonical ID ─────────────────────────

const ALLERGEN_DISPLAY_FR: Record<string, string> = {
  milk: "Lait",
  gluten: "Gluten",
  eggs: "Œufs",
  peanuts: "Arachides",
  soybeans: "Soja",
  nuts: "Fruits à coque",
  fish: "Poisson",
  crustaceans: "Crustacés",
  molluscs: "Mollusques",
  celery: "Céleri",
  mustard: "Moutarde",
  sesame: "Sésame",
  lupin: "Lupin",
  sulfites: "Sulfites",
};

// ── Tag patterns per canonical allergen ──────────────────────────

const ALLERGEN_TAG_PATTERNS: Record<string, string[]> = {
  milk: ["milk", "dairy", "lactose", "whey", "casein"],
  gluten: ["gluten", "wheat", "barley", "rye", "oats", "spelt", "kamut", "cereals-containing-gluten"],
  eggs: ["eggs", "egg"],
  peanuts: ["peanuts", "peanut"],
  soybeans: ["soybeans", "soy", "soya"],
  nuts: ["nuts", "almonds", "hazelnuts", "walnuts", "cashews", "pistachios", "pecans", "macadamia"],
  fish: ["fish"],
  crustaceans: ["crustaceans", "shrimp", "crab", "lobster", "prawns"],
  molluscs: ["molluscs", "squid", "octopus", "mussel", "oyster", "clam", "snail"],
  celery: ["celery"],
  mustard: ["mustard"],
  sesame: ["sesame-seeds", "sesame"],
  lupin: ["lupin"],
  sulfites: ["sulphur-dioxide-and-sulphites", "sulfites", "sulphites"],
};

// ── Matching engine ─────────────────────────────────────────────

/** Strip language prefix from OFF tag: "en:gluten" → "gluten" */
function stripPrefix(tag: string): string {
  const idx = tag.indexOf(":");
  return idx >= 0 ? tag.substring(idx + 1) : tag;
}

/** Check if any OFF tag matches any pattern for this allergen. */
function matchesAnyTag(tags: string[], patterns: string[]): string | null {
  for (const tag of tags) {
    const bare = stripPrefix(tag).toLowerCase();
    for (const pattern of patterns) {
      if (bare === pattern || bare.includes(pattern) || pattern.includes(bare)) {
        return tag;
      }
    }
  }
  return null;
}

/**
 * Cross-match user allergens against product OFF structured tags.
 *
 * Layer 1: allergens_tags → severity high ("Contient")
 * Layer 2: traces_tags   → severity medium ("Traces possibles")
 */
export function matchAllergens(
  userAllergens: string[],
  productAllergenTags: string[],
  productTracesTags: string[],
): AllergenMatch[] {
  const matches: AllergenMatch[] = [];
  const matched = new Set<string>();

  for (const userAllergen of userAllergens) {
    const canonical = ALLERGEN_NORMALIZATION[userAllergen.toLowerCase()];
    if (!canonical) continue;

    const patterns = ALLERGEN_TAG_PATTERNS[canonical];
    if (!patterns) continue;

    if (matched.has(canonical)) continue;

    const displayName = ALLERGEN_DISPLAY_FR[canonical] ?? userAllergen;

    // Layer 1: Structured allergen tags (high severity)
    const allergenTag = matchesAnyTag(productAllergenTags, patterns);
    if (allergenTag) {
      matches.push({ userAllergen, displayName, offTag: allergenTag, matchType: "allergen", severity: "high" });
      matched.add(canonical);
      continue;
    }

    // Layer 2: Structured trace tags (medium severity)
    const traceTag = matchesAnyTag(productTracesTags, patterns);
    if (traceTag) {
      matches.push({ userAllergen, displayName, offTag: traceTag, matchType: "trace", severity: "medium" });
      matched.add(canonical);
    }
  }

  return matches;
}
