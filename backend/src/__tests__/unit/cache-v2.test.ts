import { describe, it, expect } from "vitest";
import { buildCacheKeyV2 } from "../../services/ai-extract/cache-v2.js";

describe("cache-v2", () => {
  it("includes text + category hint + prompt version + vocabulary hash in key", () => {
    const key1 = buildCacheKeyV2("sucre, gomme-laque", "candy", "v2.0", "abc123");
    const key2 = buildCacheKeyV2("sucre, gomme-laque", "bread", "v2.0", "abc123");
    const key3 = buildCacheKeyV2("sucre, gomme-laque", "candy", "v2.1", "abc123");
    const key4 = buildCacheKeyV2("sucre, gomme-laque", "candy", "v2.0", "def456");

    // All different because each component differs
    expect(new Set([key1, key2, key3, key4]).size).toBe(4);
    // Same input → same key
    expect(buildCacheKeyV2("sucre, gomme-laque", "candy", "v2.0", "abc123")).toBe(key1);
    // Keys are prefixed for Redis namespace
    expect(key1.startsWith("ai:extract:v2:")).toBe(true);
  });
});
