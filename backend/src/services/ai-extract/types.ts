/**
 * AI Ingredient Extraction — Shared Types
 *
 * Provider-agnostic interface for ingredient text extraction.
 * Any LLM provider (Gemini, GPT, Claude) implements IngredientExtractProvider.
 */

export interface ExtractionResult {
  ingredients: string[];
  additives: string[];
  lang: string;
  // ── V2 enrichment (optional, backward-compatible) ──
  novaEstimate?: 1 | 2 | 3 | 4;
  allergenHints?: string[];
  containsAlcohol?: boolean;
  isOrganic?: boolean;
}

/**
 * Strategy interface — implement this for each AI provider.
 * Each provider handles its own API call and response parsing.
 * The orchestrator handles caching, circuit breaking, and fallback.
 */
export interface IngredientExtractProvider {
  readonly name: string;
  extract(ingredientsText: string): Promise<ExtractionResult>;
}

// ── V2: Halal-aware semantic extraction ──

export interface DetectedSubstance {
  substance_id: string;
  matched_term: string;
  match_source: "canonical_fr" | "canonical_en" | "canonical_ar"
    | "alias" | "descriptor" | "off_tag" | "e_number" | "semantic";
  confidence: number;
  context_note?: string;
}

export interface AnimalSourceHint {
  term: string;
  certainty: "explicit" | "ambiguous" | "likely";
}

export interface AlcoholContext {
  present: boolean;
  role: "none" | "ingredient" | "solvent_flavor" | "trace" | "vinegar_takhallul";
  substrate?: string;
}

export interface MeatClassification {
  is_meat: boolean;
  species: "cattle" | "sheep" | "goat" | "poultry" | "rabbit" | "mixed" | "unknown";
  product_type: "whole_muscle" | "ground" | "processed" | "charcuterie";
  confidence: number;
}

export type ProductCategory =
  | "candy" | "chocolate" | "biscuit" | "bread" | "cheese" | "yogurt"
  | "milk_beverage" | "meat" | "poultry" | "fish" | "spread" | "snack"
  | "beverage_soft" | "beverage_energy" | "tablet_pharma" | "supplement"
  | "cosmetic_topical" | "fresh_fruit" | "prepared_meal" | "sauce" | "other";

export interface GeminiSemanticResult {
  // Layer 1 — Normalization (backward compat with V1)
  ingredients: string[];
  additives: string[];
  lang: string;

  // Layer 2 — Classification
  product_category: ProductCategory;
  product_usage: "ingestion" | "topical" | "medicinal";
  meat_classification: MeatClassification | null;

  // Layer 3 — Halal semantic matching
  detected_substances: DetectedSubstance[];
  animal_source_hints: AnimalSourceHint[];
  alcohol_context: AlcoholContext;

  // Layer 4 — Health (backward compat with V1)
  novaEstimate: 1 | 2 | 3 | 4;
  allergenHints: string[];
  containsAlcohol: boolean;
  isOrganic: boolean;
}
