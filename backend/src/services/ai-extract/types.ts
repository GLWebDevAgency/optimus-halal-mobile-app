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
