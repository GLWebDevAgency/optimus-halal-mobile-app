/**
 * Gemini Flash Provider — IngredientExtractProvider implementation
 */

import { GoogleGenerativeAI, SchemaType } from "@google/generative-ai";
import type { IngredientExtractProvider, ExtractionResult } from "../types.js";
import { EXTRACTION_SYSTEM_PROMPT } from "../prompt.js";

export class GeminiProvider implements IngredientExtractProvider {
  readonly name: string;
  private client: GoogleGenerativeAI;
  private modelId: string;

  constructor(apiKey: string, modelId?: string) {
    this.client = new GoogleGenerativeAI(apiKey);
    this.modelId = modelId ?? process.env.AI_EXTRACT_MODEL ?? "gemini-2.5-flash";
    this.name = `gemini:${this.modelId}`;
  }

  async extract(ingredientsText: string): Promise<ExtractionResult> {
    const model = this.client.getGenerativeModel({
      model: this.modelId,
      systemInstruction: EXTRACTION_SYSTEM_PROMPT,
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema: {
          type: SchemaType.OBJECT,
          properties: {
            ingredients: {
              type: SchemaType.ARRAY,
              items: { type: SchemaType.STRING },
              description: "Flat list of all ingredients, cleaned and deduplicated.",
            },
            additives: {
              type: SchemaType.ARRAY,
              items: { type: SchemaType.STRING },
              description: "E-codes normalized to lowercase (e.g. 'e471').",
            },
            lang: {
              type: SchemaType.STRING,
              description: "ISO 639-1 language code.",
            },
            // ── V2 enrichment ──
            novaEstimate: {
              type: SchemaType.INTEGER,
              description: "NOVA food processing group estimate (1-4).",
            },
            allergenHints: {
              type: SchemaType.ARRAY,
              items: { type: SchemaType.STRING },
              description: "Allergens detected in text as lowercase English terms.",
            },
            containsAlcohol: {
              type: SchemaType.BOOLEAN,
              description: "True if alcohol is an ingredient (not vinegar/vanilla extract).",
            },
            isOrganic: {
              type: SchemaType.BOOLEAN,
              description: "True if product is labeled organic/bio.",
            },
          },
          required: ["ingredients", "additives", "lang"],
        },
        temperature: 0,
        maxOutputTokens: 8192,
        // Disable thinking tokens to avoid budget being consumed by internal reasoning
        // TODO(sdk-upgrade): Remove @ts-expect-error when @google/generative-ai types include thinkingConfig
        // @ts-expect-error -- thinkingConfig not yet in @google/generative-ai types
        thinkingConfig: { thinkingBudget: 0 },
      },
    });

    const result = await model.generateContent(ingredientsText);
    return JSON.parse(result.response.text()) as ExtractionResult;
  }
}
