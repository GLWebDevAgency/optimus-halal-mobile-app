/**
 * Pure evaluation context — ZERO tier/entitlement/user fields.
 * HalalEngineV2 imports ONLY this type. Enforces ethical parity (C1).
 */
export interface HalalEvaluationContext {
  readonly madhab: "general" | "hanafi" | "shafii" | "maliki" | "hanbali";
  readonly strictness: "relaxed" | "moderate" | "strict" | "very_strict";
  readonly species?: "cattle" | "sheep" | "goat" | "poultry" | "rabbit" | "mixed" | "unknown";
  readonly lang: "fr" | "en" | "ar";
}
