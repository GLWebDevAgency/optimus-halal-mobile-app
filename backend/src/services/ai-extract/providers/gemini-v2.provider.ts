/**
 * Gemini V2 Provider — halal-aware semantic extraction with security guards.
 *
 * Differences from V1:
 * - Injects closed substance vocabulary into system prompt
 * - Uses sentinel delimiters (C6) to isolate user text
 * - Post-validates detected_substances (matched_term grounding, confidence threshold, dedup)
 * - Returns GeminiSemanticResult with 4 layers
 */

import { GoogleGenerativeAI, SchemaType } from "@google/generative-ai";
import type { GeminiSemanticResult, DetectedSubstance } from "../types.js";
import { buildV2SystemPrompt, wrapUserText, EXTRACTION_V2_JSON_SCHEMA } from "../prompt-v2.js";
import { logger } from "../../../lib/logger.js";

const CONFIDENCE_THRESHOLD = 0.6;

export class GeminiV2Provider {
  readonly name: string;
  private client: GoogleGenerativeAI;
  private modelId: string;

  constructor(apiKey: string, modelId?: string) {
    this.client = new GoogleGenerativeAI(apiKey);
    this.modelId = modelId ?? process.env.AI_EXTRACT_MODEL ?? "gemini-2.5-flash";
    this.name = `gemini-v2:${this.modelId}`;
  }

  async extract(
    ingredientsText: string,
    vocabularyBlock: string,
    _vocabularySignature: string,
  ): Promise<GeminiSemanticResult> {
    const systemPrompt = buildV2SystemPrompt(vocabularyBlock);
    const userContent = wrapUserText(ingredientsText);

    const model = this.client.getGenerativeModel({
      model: this.modelId,
      systemInstruction: systemPrompt,
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema: buildGeminiSchema(),
        temperature: 0,
        maxOutputTokens: 8192,
        // @ts-expect-error -- thinkingConfig not yet in @google/generative-ai types
        thinkingConfig: { thinkingBudget: 0 },
      },
    });

    const result = await model.generateContent(userContent);
    const raw = JSON.parse(result.response.text()) as GeminiSemanticResult;

    // Post-output validation (C6 security guards)
    const validated = validateSemanticResult(raw, ingredientsText);

    logger.debug(
      `Gemini V2 extracted ${validated.detected_substances.length} substances ` +
        `(${raw.detected_substances.length - validated.detected_substances.length} stripped by guards)`
    );

    return validated;
  }
}

/**
 * Post-output validation guards (C6).
 *
 * Exported for unit testing.
 */
export function validateSemanticResult(
  raw: GeminiSemanticResult,
  sourceText: string,
): GeminiSemanticResult {
  const sourceLower = sourceText.toLowerCase();

  // 1. Filter: matched_term must be case-insensitive substring of source
  // 2. Filter: confidence must be >= threshold
  let substances = (raw.detected_substances ?? []).filter((s) => {
    const termLower = s.matched_term.toLowerCase();
    if (!sourceLower.includes(termLower)) return false;
    if (s.confidence < CONFIDENCE_THRESHOLD) return false;
    return true;
  });

  // 3. Dedup by substance_id — keep highest confidence
  const bestBySubstance = new Map<string, DetectedSubstance>();
  for (const s of substances) {
    const existing = bestBySubstance.get(s.substance_id);
    if (!existing || s.confidence > existing.confidence) {
      bestBySubstance.set(s.substance_id, s);
    }
  }
  substances = Array.from(bestBySubstance.values());

  return {
    ...raw,
    detected_substances: substances,
  };
}

/**
 * Build Gemini SchemaType-based schema from the V2 JSON schema.
 * Maps our plain schema to the SDK's SchemaType enums.
 */
function buildGeminiSchema() {
  return {
    type: SchemaType.OBJECT,
    properties: {
      ingredients: {
        type: SchemaType.ARRAY,
        items: { type: SchemaType.STRING },
      },
      additives: {
        type: SchemaType.ARRAY,
        items: { type: SchemaType.STRING },
      },
      lang: { type: SchemaType.STRING },
      product_category: { type: SchemaType.STRING },
      product_usage: { type: SchemaType.STRING },
      meat_classification: {
        type: SchemaType.OBJECT,
        nullable: true,
        properties: {
          is_meat: { type: SchemaType.BOOLEAN },
          species: { type: SchemaType.STRING },
          product_type: { type: SchemaType.STRING },
          confidence: { type: SchemaType.NUMBER },
        },
      },
      detected_substances: {
        type: SchemaType.ARRAY,
        items: {
          type: SchemaType.OBJECT,
          properties: {
            substance_id: { type: SchemaType.STRING },
            matched_term: { type: SchemaType.STRING },
            match_source: { type: SchemaType.STRING },
            confidence: { type: SchemaType.NUMBER },
            context_note: { type: SchemaType.STRING },
          },
          required: ["substance_id", "matched_term", "match_source", "confidence"],
        },
      },
      animal_source_hints: {
        type: SchemaType.ARRAY,
        items: {
          type: SchemaType.OBJECT,
          properties: {
            term: { type: SchemaType.STRING },
            certainty: { type: SchemaType.STRING },
          },
          required: ["term", "certainty"],
        },
      },
      alcohol_context: {
        type: SchemaType.OBJECT,
        properties: {
          present: { type: SchemaType.BOOLEAN },
          role: { type: SchemaType.STRING },
          substrate: { type: SchemaType.STRING },
        },
        required: ["present", "role"],
      },
      novaEstimate: { type: SchemaType.INTEGER },
      allergenHints: {
        type: SchemaType.ARRAY,
        items: { type: SchemaType.STRING },
      },
      containsAlcohol: { type: SchemaType.BOOLEAN },
      isOrganic: { type: SchemaType.BOOLEAN },
    },
    required: EXTRACTION_V2_JSON_SCHEMA.required,
  };
}
