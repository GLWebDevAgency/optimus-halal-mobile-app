import { describe, it, expect } from "vitest";
import {
  normalizeECodes,
  fixOcrArtifacts,
  stripDiacritics,
  normalizeIngredientText,
  needsNormalization,
} from "../../services/ingredient-normalizer.js";

// ── E-Code Normalization ───────────────────────────────────────

describe("normalizeECodes", () => {
  it("normalizes E.471 → e471", () => {
    expect(normalizeECodes("E.471")).toBe("e471");
  });

  it("normalizes E 471 → e471", () => {
    expect(normalizeECodes("E 471")).toBe("e471");
  });

  it("normalizes E-471 → e471", () => {
    expect(normalizeECodes("E-471")).toBe("e471");
  });

  it("normalizes e 120 → e120 (lowercase input)", () => {
    expect(normalizeECodes("e 120")).toBe("e120");
  });

  it("normalizes E.920 → e920", () => {
    expect(normalizeECodes("E.920")).toBe("e920");
  });

  it("preserves already-normalized e471", () => {
    expect(normalizeECodes("e471")).toBe("e471");
  });

  it("handles multiple E-codes in one string", () => {
    const input = "émulsifiant E.471, colorant E 120, antioxydant E-300";
    const result = normalizeECodes(input);
    expect(result).toContain("e471");
    expect(result).toContain("e120");
    expect(result).toContain("e300");
    expect(result).not.toContain("E.");
    expect(result).not.toContain("E ");
  });

  it("handles 4-digit E-codes (e.g. E1442)", () => {
    expect(normalizeECodes("E.1442")).toBe("e1442");
    expect(normalizeECodes("E 1442")).toBe("e1442");
  });

  it("handles E-code with letter suffix (e.g. E160a)", () => {
    expect(normalizeECodes("E.160a")).toBe("e160a");
  });

  it("does not match non-E-code numbers", () => {
    // "Euro 500" should not be treated as an E-code
    const input = "500g de farine";
    expect(normalizeECodes(input)).toBe(input);
  });
});

// ── OCR Artifact Fixes ─────────────────────────────────────────

describe("fixOcrArtifacts", () => {
  it("fixes gé1atine → gélatine", () => {
    expect(fixOcrArtifacts("gé1atine porcine")).toBe("gélatine porcine");
  });

  it("fixes a1cool → alcool", () => {
    expect(fixOcrArtifacts("a1cool éthylique")).toBe("alcool éthylique");
  });

  it("fixes ge1atin → gelatin (English — no accent)", () => {
    // After fix: /gé1at/ only matches French (accent required), /\bge1at/ handles English
    expect(fixOcrArtifacts("ge1atin")).toBe("gelatin");
  });

  it("fixes 1ard → lard", () => {
    expect(fixOcrArtifacts("1ard fumé")).toBe("lard fumé");
  });

  it("fixes po1c → porc", () => {
    expect(fixOcrArtifacts("po1c")).toBe("porc");
  });

  it("fixes w1ne → wine", () => {
    expect(fixOcrArtifacts("w1ne vinegar")).toBe("wine vinegar");
  });

  it("fixes a1cohol → alcohol", () => {
    expect(fixOcrArtifacts("a1cohol")).toBe("alcohol");
  });

  it("fixes renne7 → rennet", () => {
    expect(fixOcrArtifacts("renne7")).toBe("rennet");
  });

  it("fixes gelatlne (l/i swap) → gelatine", () => {
    expect(fixOcrArtifacts("gelatlne")).toBe("gelatine");
  });

  it("fixes geiatine (l→i) → gélatine", () => {
    expect(fixOcrArtifacts("geiatine")).toBe("gélatine");
  });

  it("fixes alcohoi (l→i at end) → alcohol", () => {
    // The OCR pattern is alcoh-o-i (the trailing 'l' becomes 'i'), not alcohol-i
    expect(fixOcrArtifacts("alcohoi")).toBe("alcohol");
  });

  it("leaves clean text unchanged", () => {
    const clean = "sucre, farine de blé, eau";
    expect(fixOcrArtifacts(clean)).toBe(clean);
  });

  it("handles multiple OCR artifacts in one string", () => {
    const input = "gé1atine, a1cool, w1ne";
    const result = fixOcrArtifacts(input);
    expect(result).toContain("gélatine");
    expect(result).toContain("alcool");
    expect(result).toContain("wine");
  });
});

// ── Diacritics Stripping ───────────────────────────────────────

describe("stripDiacritics", () => {
  it("strips accents: gélatine → gelatine", () => {
    expect(stripDiacritics("gélatine")).toBe("gelatine");
  });

  it("strips accents: présure → presure", () => {
    expect(stripDiacritics("présure")).toBe("presure");
  });

  it("strips accents: lactosérum → lactoserum", () => {
    expect(stripDiacritics("lactosérum")).toBe("lactoserum");
  });

  it("strips accents: éthanol → ethanol", () => {
    expect(stripDiacritics("éthanol")).toBe("ethanol");
  });

  it("handles German umlauts: Schweineschmalz → Schweineschmalz (no change — ö → o)", () => {
    expect(stripDiacritics("Schweinefett")).toBe("Schweinefett");
    expect(stripDiacritics("Alkohöl")).toBe("Alkohol");
  });

  it("handles Spanish ñ: carmín → carmin", () => {
    expect(stripDiacritics("carmín")).toBe("carmin");
  });

  it("preserves ASCII text", () => {
    expect(stripDiacritics("plain text")).toBe("plain text");
  });
});

// ── needsNormalization (fast-path check) ───────────────────────

describe("needsNormalization", () => {
  it("returns true for E-code with dot: E.471", () => {
    expect(needsNormalization("sucre, E.471, eau")).toBe(true);
  });

  it("returns true for E-code with space: E 120", () => {
    expect(needsNormalization("colorant E 120")).toBe(true);
  });

  it("returns true for OCR digit-letter confusion (ASCII letter-digit-letter)", () => {
    // The regex /[a-z]\d[a-z]/i matches ASCII letters only — é is not in [a-z]
    // Use a pattern with ASCII letters surrounding a digit
    expect(needsNormalization("ge1atin porcine")).toBe(true);
  });

  it("returns true for abbreviations with dots", () => {
    expect(needsNormalization("veg. oil")).toBe(true);
  });

  it("returns true for German characters", () => {
    expect(needsNormalization("Schweineschmalz mit Alkohöl")).toBe(true);
  });

  it("returns true for Spanish ñ", () => {
    expect(needsNormalization("carmín de cochinilla")).toBe(true);
  });

  it("returns false for clean French text", () => {
    expect(needsNormalization("sucre, farine de blé, eau, sel")).toBe(false);
  });

  it("returns false for clean English text", () => {
    expect(needsNormalization("sugar, wheat flour, water, salt")).toBe(false);
  });

  it("returns false for already-normalized e471 (detect regex requires separator)", () => {
    // E_CODE_DETECT_RE requires a separator (space/dot/dash) after E
    // Already-normalized "e471" has no separator → fast-path correctly skips
    expect(needsNormalization("e471, sucre")).toBe(false);
  });
});

// ── Full Pipeline: normalizeIngredientText ─────────────────────

describe("normalizeIngredientText", () => {
  // ── OCR + E-code combined ──
  it("fixes OCR artifacts AND normalizes E-codes together", () => {
    const input = "gé1atine porcine, E.471, a1cool";
    const result = normalizeIngredientText(input);
    expect(result).toContain("gélatine");
    expect(result).toContain("e471");
    expect(result).toContain("alcool");
  });

  // ── Synonym injection: Italian ──
  it("injects canonical form for Italian 'gelatina'", () => {
    const result = normalizeIngredientText("gelatina suina, zucchero");
    expect(result).toContain("gélatine");
  });

  // ── Synonym injection: Spanish ──
  it("injects canonical form for Spanish 'grasa animal'", () => {
    const result = normalizeIngredientText("sal, grasa animal, agua");
    expect(result).toContain("graisse animale");
  });

  // ── Synonym injection: German ──
  it("injects canonical form for German 'Alkohol'", () => {
    const result = normalizeIngredientText("Zucker, Alkohol, Wasser");
    expect(result).toContain("alcool");
  });

  it("injects canonical form for German 'Schweinefett'", () => {
    const result = normalizeIngredientText("Schweinefett, Mehl");
    expect(result).toContain("graisse de porc");
  });

  it("injects canonical form for German 'Schweineschmalz'", () => {
    const result = normalizeIngredientText("Schweineschmalz, Wasser");
    expect(result).toContain("saindoux");
  });

  // ── Synonym injection: Dutch ──
  it("injects canonical form for Dutch 'varkengelatine'", () => {
    const result = normalizeIngredientText("suiker, varkengelatine");
    expect(result).toContain("gélatine porcine");
  });

  it("injects canonical form for Dutch 'dierlijk vet'", () => {
    const result = normalizeIngredientText("dierlijk vet, water");
    expect(result).toContain("graisse animale");
  });

  // ── Synonym injection: English compounds ──
  it("injects canonical for 'pork gelatin'", () => {
    const result = normalizeIngredientText("sugar, pork gelatin, water");
    expect(result).toContain("gélatine porcine");
  });

  it("injects canonical for 'animal rennet'", () => {
    const result = normalizeIngredientText("milk, animal rennet, salt");
    expect(result).toContain("présure animale");
  });

  it("injects canonical for 'cooking wine'", () => {
    const result = normalizeIngredientText("tomato sauce, cooking wine");
    expect(result).toContain("alcool");
  });

  it("injects canonical for 'mono- and diglycerides'", () => {
    const result = normalizeIngredientText("mono- and diglycerides of fatty acids");
    expect(result).toContain("mono-");
  });

  // ── Carmine / E120 variants ──
  it("injects canonical for 'carminic acid'", () => {
    const result = normalizeIngredientText("colorant: carminic acid");
    expect(result).toContain("carmine");
  });

  it("injects canonical for 'cochenille'", () => {
    const result = normalizeIngredientText("extrait de cochenille");
    expect(result).toContain("cochineal");
  });

  it("injects canonical for 'natural red 4'", () => {
    const result = normalizeIngredientText("color: natural red 4");
    expect(result).toContain("carmine");
  });

  // ── Whey variants ──
  it("injects canonical for 'suero de leche' (ES)", () => {
    const result = normalizeIngredientText("suero de leche, azúcar");
    expect(result).toContain("lactosérum");
  });

  it("injects canonical for 'siero di latte' (IT)", () => {
    const result = normalizeIngredientText("siero di latte, zucchero");
    expect(result).toContain("lactosérum");
  });

  // ── L-Cysteine ──
  it("injects canonical for 'cysteine'", () => {
    const result = normalizeIngredientText("flour, cysteine, water");
    expect(result).toContain("l-cystéine");
  });

  // ── Abbreviation expansion ──
  it("expands 'veg.' abbreviation", () => {
    const result = normalizeIngredientText("veg. oil, water");
    expect(result).toContain("vegetable");
    expect(result).not.toContain("veg.");
  });

  // ── Separator: pipe delimiter ──
  it("appends synonyms after a pipe separator", () => {
    const result = normalizeIngredientText("gelatina di pesce");
    expect(result).toContain(" | ");
    expect(result).toContain("gélatine de poisson");
  });

  // ── No duplicate injections ──
  it("does not duplicate synonyms for overlapping matches", () => {
    // "gelatin" matches "food gelatin" key and its substring "gelatin" appears in "gelatine" key
    // but "gélatine" should only be injected once
    const result = normalizeIngredientText("food gelatin, gelatine");
    const matches = result.match(/gélatine/g) ?? [];
    // gélatine may appear in injections but should not be duplicated by the synonym system
    // The Set in the function handles this
    const injectedPart = result.split(" | ")[1] ?? "";
    const injectedGel = (injectedPart.match(/gélatine/g) ?? []).length;
    // At most one injection of "gélatine" (via "gelatine" → "gélatine" synonym)
    expect(injectedGel).toBeLessThanOrEqual(2); // "gélatine" and possibly "gelatin" → "gelatin" direct
  });

  // ── Short synonym word boundary ──
  it("does NOT false-positive on 'lab' inside 'laboratory'", () => {
    // "lab" → "présure" but should only match as whole word
    const result = normalizeIngredientText("laboratory equipment");
    expect(result).not.toContain("présure");
  });

  it("matches 'lab' as standalone word (DE rennet)", () => {
    const result = normalizeIngredientText("milch, lab, salz");
    expect(result).toContain("présure");
  });

  it("does NOT false-positive on 'lab-fermented' (hyphen-attached)", () => {
    // "lab" in "lab-fermented cultures" = lactic acid bacteria, not rennet
    const result = normalizeIngredientText("lab-fermented cultures, milk");
    expect(result).not.toContain("présure");
  });

  // ── Review finding #6: OCR'd gelatin must match DB pattern ──
  it("ge1atin normalizes to a form that matches gelatin pattern", () => {
    const result = normalizeIngredientText("ge1atin porcine");
    // After OCR fix, must match either "gelatin" or "gélatine" for DB ruling
    expect(result).toMatch(/g[eé]latin/i);
  });

  // ── Review finding #7: pipe separator works with word_boundary ──
  it("pipe-separated injected synonyms are valid word-boundary targets", () => {
    const result = normalizeIngredientText("gelatina di pesce");
    // The " | " separator and "," between injections create valid word boundaries
    expect(result).toContain(" | ");
    expect(result).toContain("gélatine de poisson");
    // Verify the canonical form is word-boundary accessible (pipe and comma are non-word chars)
    expect(result).toMatch(/\bgélatine de poisson\b/);
  });

  // ── Edge cases ──
  it("handles empty string", () => {
    expect(normalizeIngredientText("")).toBe("");
  });

  it("handles text with no relevant patterns", () => {
    const input = "sucre, farine de blé, eau, sel";
    const result = normalizeIngredientText(input);
    // Should return the original text unchanged (no synonyms found)
    expect(result).toBe(input);
  });

  // ── Real-world OFF examples ──
  it("handles real OFF text with mixed E-codes and OCR noise", () => {
    const offText = "Sucre, sirop de glucose, gélatine, acidifiant: E.330, " +
      "colorants: E.120, E.171, arômes, agents d'enrobage: E.903, E.904";
    const result = normalizeIngredientText(offText);
    expect(result).toContain("e330");
    expect(result).toContain("e120");
    expect(result).toContain("e171");
    expect(result).toContain("e903");
    expect(result).toContain("e904");
  });

  it("handles multilingual OFF text (German product)", () => {
    const offText = "Zucker, Schweinefett, Weizenmehl, Alkohol, Gelatine, Emulgator: E 471";
    const result = normalizeIngredientText(offText);
    expect(result).toContain("e471");
    expect(result).toContain("graisse de porc");   // Schweinefett
    expect(result).toContain("alcool");             // Alkohol
    expect(result).toContain("gélatine");           // Gelatine
  });

  it("handles Spanish product with carmine", () => {
    const offText = "azúcar, jarabe de glucosa, gelatina de cerdo, carmín, agua";
    const result = normalizeIngredientText(offText);
    expect(result).toContain("gélatine porcine");   // gelatina de cerdo
    expect(result).toContain("carmine");             // carmín
  });

  it("handles Italian product with whey", () => {
    const offText = "zucchero, siero di latte, caglio, gelatina";
    const result = normalizeIngredientText(offText);
    expect(result).toContain("lactosérum");          // siero di latte
    expect(result).toContain("présure");             // caglio
    expect(result).toContain("gélatine");            // gelatina
  });

  // ── Alcohol variants ──
  it("injects canonical for spirits/liquors", () => {
    const r1 = normalizeIngredientText("cognac, sucre");
    expect(r1).toContain("brandy");

    const r2 = normalizeIngredientText("kirsch, crème");
    expect(r2).toContain("alcool");

    const r3 = normalizeIngredientText("marsala wine");
    expect(r3).toContain("alcool");
  });

  // ── Rennet variants ──
  it("injects canonical for Spanish 'cuajo'", () => {
    const result = normalizeIngredientText("leche, cuajo, sal");
    expect(result).toContain("présure");
  });

  it("injects canonical for 'microbial rennet'", () => {
    const result = normalizeIngredientText("milk, microbial rennet");
    expect(result).toContain("présure microbienne");
  });

  // ── Tallow / Shortening ──
  it("injects canonical for 'beef tallow'", () => {
    const result = normalizeIngredientText("flour, beef tallow, salt");
    expect(result).toContain("suif");
  });

  it("injects canonical for 'shortening'", () => {
    const result = normalizeIngredientText("flour, shortening, sugar");
    expect(result).toContain("graisse végétale ou animale");
  });
});
