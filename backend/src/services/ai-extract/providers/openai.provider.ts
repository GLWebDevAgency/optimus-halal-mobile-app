/**
 * OpenAI Provider — IngredientExtractProvider implementation
 *
 * Supports GPT-4o-mini and GPT-4o. Ready to use when needed.
 * Install: pnpm add openai
 * Env: OPENAI_API_KEY
 */

import type { IngredientExtractProvider, ExtractionResult } from "../types.js";
import { EXTRACTION_SYSTEM_PROMPT, EXTRACTION_JSON_SCHEMA } from "../prompt.js";

export class OpenAIProvider implements IngredientExtractProvider {
  readonly name = "openai";
  private apiKey: string;
  private model: string;

  constructor(apiKey: string, model = "gpt-4o-mini") {
    this.apiKey = apiKey;
    this.model = model;
  }

  async extract(ingredientsText: string): Promise<ExtractionResult> {
    // Dynamic import — SDK only loaded when this provider is active
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { default: OpenAI } = (await import("openai" as string)) as { default: new (opts: { apiKey: string }) => any };
    const client = new OpenAI({ apiKey: this.apiKey });

    const response = await client.chat.completions.create({
      model: this.model,
      messages: [
        { role: "system", content: EXTRACTION_SYSTEM_PROMPT },
        { role: "user", content: ingredientsText },
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "ingredient_extraction",
          schema: EXTRACTION_JSON_SCHEMA,
          strict: true,
        },
      },
      temperature: 0,
      max_tokens: 2048,
    });

    const text = response.choices[0]?.message?.content;
    if (!text) throw new Error("OpenAI returned empty response");
    return JSON.parse(text) as ExtractionResult;
  }
}
