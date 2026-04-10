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
import type { IngredientExtractProvider, ExtractionResult, GeminiSemanticResult } from "./types.js";
import { db } from "../../db/index.js";
import { featureFlags } from "../../db/schema/feature-flags.js";
import { eq } from "drizzle-orm";
import { loadVocabularyFromDB } from "./vocabulary.js";
import { GeminiV2Provider } from "./providers/gemini-v2.provider.js";
import { buildCacheKeyV2, getCachedV2, setCacheV2, singleflight } from "./cache-v2.js";
import { runShadowExtraction, type ShadowResult } from "./shadow.js";

export type { ExtractionResult } from "./types.js";
export type { GeminiSemanticResult } from "./types.js";

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

// ── V2 Orchestrator ─────────────────────────────────────────

const V2_PROMPT_VERSION = "v2.0";

let _geminiV2Provider: GeminiV2Provider | null | undefined;

function resolveV2Provider(): GeminiV2Provider | null {
  if (_geminiV2Provider !== undefined) return _geminiV2Provider;

  const key = process.env.GEMINI_API_KEY;
  if (!key) {
    logger.warn("GEMINI_API_KEY not set — V2 extraction disabled");
    _geminiV2Provider = null;
    return null;
  }
  _geminiV2Provider = new GeminiV2Provider(key);
  logger.info(`V2 extraction provider: ${_geminiV2Provider.name}`);
  return _geminiV2Provider;
}

async function resolveGeminiV2Flag(): Promise<"off" | "shadow" | "on"> {
  try {
    const rows = await db
      .select({ enabled: featureFlags.enabled, defaultValue: featureFlags.defaultValue })
      .from(featureFlags)
      .where(eq(featureFlags.key, "gemini_v2"))
      .limit(1);

    if (rows.length === 0) return "off";
    const flag = rows[0];
    if (!flag.enabled) return "off";

    const val = flag.defaultValue;
    if (val === "shadow") return "shadow";
    if (val === "on" || val === true) return "on";
    return "off";
  } catch (err) {
    logger.warn("Failed to resolve gemini_v2 flag, defaulting to off", {
      error: (err as Error).message,
    });
    return "off";
  }
}

/**
 * V2 AI Ingredient Extraction — feature-flag gated.
 *
 * Returns the extraction result + which version produced it.
 * When flag is "off", delegates to V1. When "shadow", runs both.
 * When "on", uses V2 exclusively.
 */
export async function aiExtractIngredientsV2(
  ingredientsText: string,
  productHint?: { name?: string; brand?: string; categories?: string[] },
): Promise<{ result: GeminiSemanticResult | ExtractionResult | null; source: "v1" | "v2" }> {
  const mode = await resolveGeminiV2Flag();

  if (mode === "off") {
    const result = await aiExtractIngredients(ingredientsText);
    return { result, source: "v1" };
  }

  // V2 path — need vocabulary + provider
  const v2Provider = resolveV2Provider();
  if (!v2Provider) {
    // No API key → fall back to V1
    const result = await aiExtractIngredients(ingredientsText);
    return { result, source: "v1" };
  }

  let vocabulary: Awaited<ReturnType<typeof loadVocabularyFromDB>>;
  try {
    vocabulary = await loadVocabularyFromDB();
  } catch (err) {
    logger.warn("Failed to load vocabulary, falling back to V1", {
      error: (err as Error).message,
    });
    const result = await aiExtractIngredients(ingredientsText);
    return { result, source: "v1" };
  }

  const categoryHint = productHint?.categories?.[0] ?? "other";
  const cacheKey = buildCacheKeyV2(
    ingredientsText,
    categoryHint,
    V2_PROMPT_VERSION,
    vocabulary.signature,
  );

  // V2 extraction function (with cache + singleflight)
  const v2Extract = async (): Promise<GeminiSemanticResult | null> => {
    // Check V2 cache
    const cached = await getCachedV2(cacheKey);
    if (cached) {
      logger.debug("V2 extraction cache hit");
      return cached;
    }

    return singleflight(cacheKey, async () => {
      try {
        const result = await v2Provider.extract(
          ingredientsText,
          vocabulary.block,
          vocabulary.signature,
        );
        await setCacheV2(cacheKey, result);
        return result;
      } catch (err) {
        logger.warn("V2 extraction failed", {
          provider: v2Provider.name,
          error: (err as Error).message,
        });
        return null;
      }
    });
  };

  const shadowResult = await runShadowExtraction(
    ingredientsText,
    () => aiExtractIngredients(ingredientsText),
    v2Extract,
    mode,
  );

  return { result: shadowResult.primary, source: shadowResult.source };
}
