import { describe, it, expect } from "vitest";
import {
  buildVocabularyBlock,
  buildVocabularySignature,
  type VocabularyEntry,
} from "../../services/ai-extract/vocabulary.js";

const MOCK_ENTRIES: VocabularyEntry[] = [
  {
    substanceId: "SHELLAC",
    canonicalFr: "gomme-laque",
    canonicalEn: "shellac",
    canonicalAr: "صمغ اللك",
    synonyms: ["gomme laque", "lac resin", "confectioner's glaze", "schellack"],
    eNumbers: ["E904"],
    offTags: ["en:e904", "en:shellac"],
    descriptors: ["natural coating from insect secretion"],
    notConfuseWith: ["beeswax", "carnauba"],
  },
  {
    substanceId: "CARMINE",
    canonicalFr: "carmin",
    canonicalEn: "carmine",
    canonicalAr: "قرمز",
    synonyms: ["cochenille", "cochineal", "e120"],
    eNumbers: ["E120"],
    offTags: ["en:e120"],
    descriptors: ["red dye from insect"],
    notConfuseWith: ["beetroot red"],
  },
];

describe("vocabulary builder", () => {
  it("generates a formatted text block from entries", () => {
    const block = buildVocabularyBlock(MOCK_ENTRIES);
    expect(block).toContain("SHELLAC:");
    expect(block).toContain("canonical: gomme-laque | shellac | صمغ اللك");
    expect(block).toContain("e_numbers: E904");
    expect(block).toContain("not_confuse_with: beeswax, carnauba");
    expect(block).toContain("CARMINE:");
    expect(block).toContain("─────");
  });

  it("generates a signature hash from entries", () => {
    const sig = buildVocabularySignature(MOCK_ENTRIES);
    expect(sig).toMatch(/^[a-f0-9]{64}$/); // sha256 hex
    // Same input → same signature
    expect(buildVocabularySignature(MOCK_ENTRIES)).toBe(sig);
  });

  it("sorts entries by substance ID for deterministic output", () => {
    const reversed = [...MOCK_ENTRIES].reverse();
    const block1 = buildVocabularyBlock(MOCK_ENTRIES);
    const block2 = buildVocabularyBlock(reversed);
    expect(block1).toBe(block2); // order-independent
  });
});
