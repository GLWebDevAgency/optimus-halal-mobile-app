/**
 * Anthropic Provider — IngredientExtractProvider implementation
 *
 * Supports Claude Haiku 4.5 and Sonnet. Ready to use when needed.
 * Install: pnpm add @anthropic-ai/sdk
 * Env: ANTHROPIC_API_KEY
 */

import type { IngredientExtractProvider, ExtractionResult } from "../types.js";
import { EXTRACTION_SYSTEM_PROMPT } from "../prompt.js";

export class AnthropicProvider implements IngredientExtractProvider {
  readonly name = "anthropic";
  private apiKey: string;
  private model: string;

  constructor(apiKey: string, model = "claude-haiku-4-5-20251001") {
    this.apiKey = apiKey;
    this.model = model;
  }

  async extract(ingredientsText: string): Promise<ExtractionResult> {
    // Dynamic import — SDK only loaded when this provider is active
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { default: Anthropic } = (await import("@anthropic-ai/sdk" as string)) as { default: new (opts: { apiKey: string }) => any };
    const client = new Anthropic({ apiKey: this.apiKey });

    const response = await client.messages.create({
      model: this.model,
      max_tokens: 2048,
      system: EXTRACTION_SYSTEM_PROMPT,
      messages: [{ role: "user", content: ingredientsText }],
    });

    const text = response.content[0]?.type === "text" ? response.content[0].text : null;
    if (!text) throw new Error("Anthropic returned empty response");

    // Claude may wrap JSON in ```json ... ``` — strip it
    const cleaned = text.replace(/^```json\n?/, "").replace(/\n?```$/, "").trim();
    return JSON.parse(cleaned) as ExtractionResult;
  }
}
