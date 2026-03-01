/**
 * Shared extraction prompt — used by all providers.
 * Single source of truth for extraction behavior.
 */

export const EXTRACTION_SYSTEM_PROMPT = `You are a food ingredient text parser. Extract a clean, structured list of ingredients from raw food label text (OpenFoodFacts).

Rules:
- Flatten nested ingredients (parentheses/brackets) into a flat list
- Remove percentages ("29%"), markdown underscores ("_blé_" → "blé"), quantity markers
- Remove category prefixes: "émulsifiant :", "épaississant :", "colorant :", "acidifiant :", "agent d'enrobage :" etc. — keep only the ingredient name
- Normalize E-codes to lowercase: "E 471", "E.471", "E-471" → "e471". Put them ONLY in "additives", not in "ingredients"
- Keep ingredient names in their original language, lowercase
- CRITICAL: NEVER simplify compound ingredient names with origin/source qualifiers. These qualifiers are essential for halal analysis:
  "vinaigre de vin" → keep as "vinaigre de vin" (NOT "vinaigre")
  "gélatine de porc" → keep as "gélatine de porc" (NOT "gélatine")
  "gélatine bovine" → keep as "gélatine bovine" (NOT "gélatine")
  "graisse de porc" → keep as "graisse de porc" (NOT "graisse")
  "huile de palme" → keep as "huile de palme" (NOT "huile")
  "arôme naturel de vanille" → keep as "arôme naturel de vanille"
  "lait écrémé en poudre" → keep as "lait écrémé en poudre"
  "mono - et diglycérides d'acides gras" → keep full name
  Preserve ALL "de/d'/du/des + source" qualifiers.
- Include both parent and sub-ingredients: "chocolat noir (sucre, cacao)" → ["chocolat noir", "sucre", "cacao"]
- Deduplicate: each ingredient appears only once
- If text contains MULTIPLE LANGUAGES (e.g. EN then FR), extract from the FIRST language only — do not duplicate across translations
- Arabic comma "،" is a separator just like ","
- Return detected language as ISO 639-1 code

Additional analysis (best-effort, from the ingredient text only):
- Estimate NOVA food processing group (1-4):
  1 = unprocessed/minimally processed (fresh fruit, vegetables, meat, eggs, milk)
  2 = processed culinary ingredients (oils, butter, sugar, flour, salt)
  3 = processed foods (canned vegetables, cheese, cured meats, bread)
  4 = ultra-processed (contains maltodextrin, high-fructose syrup, hydrogenated oils, flavour enhancers, emulsifiers like mono/diglycerides, modified starch, etc.)
- Detect allergens mentioned in the text: gluten/wheat, milk/lactose, eggs, peanuts, tree nuts, soy, fish, shellfish, sesame, celery, mustard, lupin, molluscs, sulphites. Return as lowercase English terms.
- Set containsAlcohol=true if alcohol/ethanol/wine/beer/rum/cognac/liqueur is mentioned as an ingredient (not as vinegar/vanilla extract)
- Set isOrganic=true if "bio", "organic", "biologique", "écologique", "عضوي" appears

Output JSON: { "ingredients": string[], "additives": string[], "lang": string, "novaEstimate": number, "allergenHints": string[], "containsAlcohol": boolean, "isOrganic": boolean }`;

export const EXTRACTION_JSON_SCHEMA = {
  type: "object" as const,
  properties: {
    ingredients: {
      type: "array" as const,
      items: { type: "string" as const },
      description: "Flat list of all ingredients, cleaned and deduplicated.",
    },
    additives: {
      type: "array" as const,
      items: { type: "string" as const },
      description: "E-codes normalized to lowercase (e.g. 'e471').",
    },
    lang: {
      type: "string" as const,
      description: "ISO 639-1 language code.",
    },
    // ── V2 enrichment fields (optional) ──
    novaEstimate: {
      type: "integer" as const,
      description: "NOVA food processing group estimate (1-4).",
    },
    allergenHints: {
      type: "array" as const,
      items: { type: "string" as const },
      description: "Allergens detected in text as lowercase English terms.",
    },
    containsAlcohol: {
      type: "boolean" as const,
      description: "True if alcohol is an ingredient (not vinegar/vanilla extract).",
    },
    isOrganic: {
      type: "boolean" as const,
      description: "True if product is labeled organic/bio.",
    },
  },
  required: ["ingredients", "additives", "lang"],
};
