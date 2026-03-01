/**
 * AI Ingredient Extraction — Orchestrator
 *
 * Provider-agnostic service with:
 *   - L2 cache (hash of ingredients_text → extracted result, TTL 7d)
 *   - Circuit breaker (3 failures in 5min → regex fallback for 10min)
 *   - Strategy pattern: swap provider via AI_EXTRACT_PROVIDER env var
 *
 * Usage:
 *   import { aiExtractIngredients } from "./ai-extract/index.js";
 *   const result = await aiExtractIngredients(ingredientsText);
 *   // null → fallback to regex
 */

import crypto from "node:crypto";
import { redis } from "../../lib/redis.js";
import { logger } from "../../lib/logger.js";
import type { IngredientExtractProvider, ExtractionResult } from "./types.js";

export type { ExtractionResult } from "./types.js";

// ── Provider Registry ────────────────────────────────────────

let activeProvider: IngredientExtractProvider | null | undefined;

/**
 * Lazy-init the active provider from env vars.
 * Supports: "gemini" (default), "openai", "anthropic"
 *
 * Env vars checked:
 *   AI_EXTRACT_PROVIDER  — provider name (default: "gemini")
 *   GEMINI_API_KEY       — for Gemini Flash
 *   OPENAI_API_KEY       — for GPT-4o-mini
 *   ANTHROPIC_API_KEY    — for Claude Haiku
 */
async function resolveProvider(): Promise<IngredientExtractProvider | null> {
  if (activeProvider !== undefined) return activeProvider;

  const providerName = process.env.AI_EXTRACT_PROVIDER ?? "gemini";

  switch (providerName) {
    case "gemini": {
      const key = process.env.GEMINI_API_KEY;
      if (!key) {
        logger.warn("GEMINI_API_KEY not set — AI extraction disabled");
        activeProvider = null;
        return null;
      }
      const { GeminiProvider } = await import("./providers/gemini.provider.js");
      activeProvider = new GeminiProvider(key);
      break;
    }
    case "openai": {
      const key = process.env.OPENAI_API_KEY;
      if (!key) {
        logger.warn("OPENAI_API_KEY not set — AI extraction disabled");
        activeProvider = null;
        return null;
      }
      const { OpenAIProvider } = await import("./providers/openai.provider.js");
      activeProvider = new OpenAIProvider(key, process.env.OPENAI_MODEL ?? "gpt-4o-mini");
      break;
    }
    case "anthropic": {
      const key = process.env.ANTHROPIC_API_KEY;
      if (!key) {
        logger.warn("ANTHROPIC_API_KEY not set — AI extraction disabled");
        activeProvider = null;
        return null;
      }
      const { AnthropicProvider } = await import("./providers/anthropic.provider.js");
      activeProvider = new AnthropicProvider(key, process.env.ANTHROPIC_MODEL ?? "claude-haiku-4-5-20251001");
      break;
    }
    default: {
      logger.warn(`Unknown AI_EXTRACT_PROVIDER: ${providerName} — AI extraction disabled`);
      activeProvider = null;
      return null;
    }
  }

  logger.info(`AI extraction provider: ${activeProvider!.name}`);
  return activeProvider;
}

// ── Circuit Breaker ──────────────────────────────────────────

const circuit = {
  failures: 0,
  lastFailure: 0,
  openUntil: 0,
  THRESHOLD: 3,
  WINDOW_MS: 5 * 60_000,
  COOLDOWN_MS: 10 * 60_000,
};

function isCircuitOpen(): boolean {
  const now = Date.now();
  if (circuit.openUntil > now) return true;
  if (circuit.openUntil > 0 && circuit.openUntil <= now) {
    circuit.failures = 0;
    circuit.openUntil = 0;
  }
  return false;
}

function recordFailure(): void {
  const now = Date.now();
  if (now - circuit.lastFailure > circuit.WINDOW_MS) circuit.failures = 0;
  circuit.failures++;
  circuit.lastFailure = now;
  if (circuit.failures >= circuit.THRESHOLD) {
    circuit.openUntil = now + circuit.COOLDOWN_MS;
    logger.error("AI extract circuit breaker OPEN — regex fallback for 10min", {
      failures: circuit.failures,
    });
  }
}

function recordSuccess(): void {
  circuit.failures = 0;
  circuit.openUntil = 0;
}

// ── Cache (L2) ───────────────────────────────────────────────

const CACHE_TTL = 7 * 24 * 3600; // 7 days
const CACHE_PREFIX = "ai:extract:v3:";

function cacheKey(text: string): string {
  const hash = crypto.createHash("sha256").update(text).digest("hex").slice(0, 16);
  return `${CACHE_PREFIX}${hash}`;
}

async function getCached(text: string): Promise<ExtractionResult | null> {
  try {
    const raw = await redis.get(cacheKey(text));
    if (raw) return JSON.parse(raw) as ExtractionResult;
  } catch { /* Redis down — non-fatal */ }
  return null;
}

async function setCache(text: string, result: ExtractionResult): Promise<void> {
  try {
    const jitter = Math.floor(Math.random() * 3600);
    await redis.setex(cacheKey(text), CACHE_TTL + jitter, JSON.stringify(result));
  } catch { /* non-fatal */ }
}

// ── Post-processing ──────────────────────────────────────────

/** @internal — exported for unit testing only */
export function cleanResult(raw: ExtractionResult): ExtractionResult {
  const result: ExtractionResult = {
    ingredients: [...new Set(
      raw.ingredients.map((i) => i.trim().toLowerCase()).filter((i) => i.length > 0),
    )],
    additives: [...new Set(
      raw.additives.map((a) => a.trim().toLowerCase()).filter((a) => a.length > 0),
    )],
    lang: raw.lang ?? "unknown",
  };

  // V2 enrichment fields — preserve if present
  if (raw.novaEstimate != null && raw.novaEstimate >= 1 && raw.novaEstimate <= 4) {
    result.novaEstimate = raw.novaEstimate as 1 | 2 | 3 | 4;
  }
  if (Array.isArray(raw.allergenHints) && raw.allergenHints.length > 0) {
    result.allergenHints = [...new Set(
      raw.allergenHints.map((a) => a.trim().toLowerCase()).filter((a) => a.length > 0),
    )];
  }
  if (typeof raw.containsAlcohol === "boolean") {
    result.containsAlcohol = raw.containsAlcohol;
  }
  if (typeof raw.isOrganic === "boolean") {
    result.isOrganic = raw.isOrganic;
  }

  return result;
}

// ── Public API ───────────────────────────────────────────────

/**
 * Extract structured ingredients from raw text using the configured AI provider.
 * Returns null if AI is unavailable — caller falls back to regex.
 */
export async function aiExtractIngredients(
  ingredientsText: string,
): Promise<ExtractionResult | null> {
  if (!ingredientsText || ingredientsText.trim().length < 5) return null;

  // L2 cache check
  const cached = await getCached(ingredientsText);
  if (cached) {
    logger.debug("AI extraction cache hit");
    return cached;
  }

  // Circuit breaker check
  if (isCircuitOpen()) {
    logger.debug("AI circuit breaker open — skip");
    return null;
  }

  // Resolve provider (lazy init from env)
  const provider = await resolveProvider();
  if (!provider) return null;

  try {
    const raw = await provider.extract(ingredientsText);

    // Validate
    if (!Array.isArray(raw.ingredients) || raw.ingredients.length === 0) {
      logger.warn("AI extraction returned empty ingredients", {
        provider: provider.name,
        text: ingredientsText.slice(0, 80),
      });
      recordFailure();
      return null;
    }

    const result = cleanResult(raw);
    recordSuccess();
    await setCache(ingredientsText, result);

    logger.info("AI extraction success", {
      provider: provider.name,
      count: result.ingredients.length,
      additives: result.additives.length,
      lang: result.lang,
      nova: result.novaEstimate ?? null,
      allergens: result.allergenHints?.length ?? 0,
    });

    return result;
  } catch (err) {
    recordFailure();
    logger.warn("AI extraction failed", {
      provider: provider.name,
      error: (err as Error).message,
      circuitFailures: circuit.failures,
    });
    return null;
  }
}
