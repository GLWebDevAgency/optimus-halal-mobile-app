/**
 * Ingredient Text Normalizer — Data-grade text preprocessing
 *
 * Handles real-world noise from OpenFoodFacts ingredient texts:
 *   - OCR artifacts (gé1atine → gélatine, a1cool → alcool)
 *   - E-code format variants (E.471, E 471, E-471 → e471)
 *   - Diacritics normalization for fuzzy comparison
 *   - Synonym expansion (animal fat → graisse animale)
 *   - Abbreviation expansion (veg. → vegetable)
 *
 * Architecture:
 *   normalizeIngredientText()  → cleans the full text for better pattern matching
 *   expandSynonyms()           → maps known multilingual synonyms to canonical forms
 *   normalizeECode()           → standardizes E-number formats
 *
 * All functions are pure, stateless, and O(n) in text length.
 * No external dependencies — regex + Map lookups only.
 */

// ── E-Code Normalizer ─────────────────────────────────────────
// OFF data contains: "E.471", "E 471", "E-471", "e 471", "E.120"
// Our patterns expect: "e471", "e120", "e441", "e542", "e920"
//
// Two separate regexes: one for replacement (/g flag, used by normalizeECodes)
// and one for detection (no /g, used by needsNormalization) to avoid shared
// stateful regex bugs. The detection regex requires a separator (space/dot/dash)
// to avoid false-positives on already-normalized "e471".
const E_CODE_REPLACE_RE = /\bE[\s.\-]?(\d{3,4}[a-z]?)\b/gi;
const E_CODE_DETECT_RE = /\bE[\s.\-](\d{3,4}[a-z]?)\b/i;

export function normalizeECodes(text: string): string {
  return text.replace(E_CODE_REPLACE_RE, (_match, digits: string) => `e${digits.toLowerCase()}`);
}

// ── OCR Artifact Fixer ────────────────────────────────────────
// Common OCR misreads from food packaging scans & OFF crowdsourced data.
// Key insight: these are deterministic substitutions, not fuzzy — they're
// specific character confusions that OCR engines make on food labels.
const OCR_FIXES: [RegExp, string][] = [
  // Digit/letter confusion (OCR engines confuse 1/l/i, 0/O, 5/S)
  [/gé1at/gi, "gélat"],             // gé1atine → gélatine (French only — accent required)
  [/a1coo/gi, "alcoo"],              // a1cool → alcool
  [/\bge1at/gi, "gelat"],            // ge1atin → gelatin (English — no accent)
  [/\b1ard\b/gi, "lard"],            // 1ard → lard
  [/\bsa1nd/gi, "saind"],            // sa1ndoux → saindoux
  [/\bpo[r1]c\b/gi, "porc"],        // po1c → porc
  [/\bw1ne\b/gi, "wine"],           // w1ne → wine
  [/\ba1coho/gi, "alcoho"],          // a1cohol → alcohol
  [/\brenne[t7]\b/gi, "rennet"],     // rennet/renne7 → rennet
  // Common letter swaps
  [/\bgelatlne\b/gi, "gelatine"],    // gelatlne (l/i swap)
  [/\bgeiatine\b/gi, "gélatine"],    // geiatine (l→i)
  [/\balcohoi\b/gi, "alcohol"],      // alcoholi (l→i at end)
];

export function fixOcrArtifacts(text: string): string {
  let result = text;
  for (const [pattern, replacement] of OCR_FIXES) {
    result = result.replace(pattern, replacement);
  }
  return result;
}

// ── Diacritics Normalizer ─────────────────────────────────────
// Strips diacritics for comparison while preserving the original text structure.
// "gélatine" → "gelatine", "présure" → "presure", "lactosérum" → "lactoserum"
// Uses Unicode NFD decomposition + combining marks removal.
const COMBINING_MARKS_RE = /[\u0300-\u036f]/g;

export function stripDiacritics(text: string): string {
  return text.normalize("NFD").replace(COMBINING_MARKS_RE, "");
}

// ── Synonym Dictionary ────────────────────────────────────────
// Maps multilingual ingredient names to their canonical form that matches
// our ingredient_rulings compoundPattern values.
//
// Sources:
//   - OFF taxonomy: https://world.openfoodfacts.org/data/taxonomies/ingredients.json
//   - EU food additive names (Regulation EC 1333/2008)
//   - Common packaging abbreviations (FR/EN/DE/ES/IT/NL)
//
// Key: normalized lowercase form → canonical pattern(s) to inject
// When a synonym is found, the canonical form is appended to the text
// so our existing pattern matching can catch it.
const SYNONYM_MAP = new Map<string, string>([
  // ── Gelatin variants ──
  ["gelatina", "gélatine"],           // IT/ES
  ["gelatine", "gélatine"],           // EN/DE
  ["gelantine", "gélatine"],          // Common misspelling
  ["food gelatin", "gelatin"],        // OFF specific
  ["bovine gelatin", "gélatine bovine halal"], // Specific compound
  ["porcine gelatin", "gélatine porcine"],
  ["pork gelatin", "gélatine porcine"],
  ["pig gelatin", "gélatine porcine"],
  ["schweine gelatine", "gélatine porcine"],  // DE
  ["varkengelatine", "gélatine porcine"],     // NL
  ["gelatina de cerdo", "gélatine porcine"],  // ES
  ["fish gelatin", "gélatine de poisson"],
  ["gelatina di pesce", "gélatine de poisson"], // IT

  // ── Fats & Lard ──
  ["animal fat", "graisse animale"],
  ["grasa animal", "graisse animale"],         // ES
  ["tierisches fett", "graisse animale"],      // DE
  ["dierlijk vet", "graisse animale"],         // NL
  ["pork fat", "graisse de porc"],
  ["pig fat", "graisse de porc"],
  ["schweinefett", "graisse de porc"],         // DE
  ["grasa de cerdo", "graisse de porc"],       // ES
  ["manteca de cerdo", "saindoux"],            // ES lard
  ["strutto", "saindoux"],                     // IT lard
  ["reuzel", "saindoux"],                      // NL lard
  ["schweineschmalz", "saindoux"],             // DE lard
  ["schmaltz", "saindoux"],                    // Yiddish/EN
  ["tallow", "suif"],
  ["beef tallow", "suif"],
  ["shortening", "graisse végétale ou animale"],
  ["duck fat", "graisse de canard"],
  ["goose fat", "graisse d'oie"],

  // ── Pork ──
  ["cerdo", "porc"],       // ES
  ["maiale", "porc"],      // IT
  ["schwein", "porc"],     // DE
  ["varken", "porc"],      // NL
  ["suino", "porc"],       // IT (adj)

  // ── Alcohol ──
  ["alkohol", "alcool"],                // DE
  ["etanolo", "éthanol"],               // IT
  ["etanol", "éthanol"],                // ES
  ["spirits", "alcool"],
  ["liqueur", "alcool"],
  ["liquor", "alcool"],
  ["cognac", "brandy"],
  ["armagnac", "brandy"],
  ["grappa", "brandy"],
  ["marc", "brandy"],
  ["kirsch", "alcool"],
  ["calvados", "alcool"],
  ["amaretto", "alcool"],
  ["kahlua", "alcool"],
  ["marsala", "alcool"],
  ["sherry", "alcool"],
  ["porto", "alcool"],
  ["port wine", "alcool"],
  ["cooking wine", "alcool"],
  ["vin de cuisine", "alcool"],

  // ── Rennet ──
  ["lab", "présure"],                   // DE
  ["stremsel", "présure"],              // NL
  ["cuajo", "présure"],                 // ES
  ["caglio", "présure"],                // IT
  ["animal rennet", "présure animale"],
  ["vegetable rennet", "présure microbienne"],
  ["microbial rennet", "présure microbienne"],

  // ── Whey ──
  ["molke", "lactosérum"],              // DE
  ["wei", "lactosérum"],                // NL
  ["suero de leche", "lactosérum"],     // ES
  ["siero di latte", "lactosérum"],     // IT
  ["whey powder", "whey"],
  ["whey protein", "whey"],
  ["whey permeate", "whey"],
  ["sweet whey", "whey"],

  // ── Carmine / E120 ──
  ["karmin", "carmine"],                // DE
  ["karmijn", "carmine"],               // NL
  ["carmín", "carmine"],                // ES
  ["cochiniglia", "cochineal"],         // IT
  ["carmines", "carmine"],
  ["carminic acid", "carmine"],
  ["acide carminique", "carmine"],
  ["cochenille", "cochineal"],
  ["natural red 4", "carmine"],
  ["c.i. 75470", "carmine"],

  // ── E471 / Mono-diglycerides ──
  ["mono- and diglycerides", "mono-"],
  ["mono and diglycerides", "mono-"],
  ["mono- et diglycérides", "mono-"],
  ["mono et diglycerides", "mono-"],
  ["mono-und diglyceride", "mono-"],     // DE
  ["mono en diglyceriden", "mono-"],     // NL
  ["emulsifier e471", "e471"],
  ["emulsifiant e471", "e471"],
  ["émulsifiant e471", "e471"],
  ["emulgator e471", "e471"],            // DE

  // ── L-Cysteine / E920 ──
  ["l-cystein", "l-cystéine"],           // DE
  ["l-cisteina", "l-cystéine"],          // ES/IT
  ["cysteine", "l-cystéine"],
]);

// ── Abbreviation Expander ─────────────────────────────────────
const ABBREVIATIONS: [RegExp, string][] = [
  [/\bveg\.\s*/gi, "vegetable "],
  [/\bingr\.\s*/gi, "ingrédients "],
  [/\borig\.\s*/gi, "origine "],
  [/\bconc\.\s*/gi, "concentré "],
  [/\bpast\.\s*/gi, "pasteurisé "],
];

function expandAbbreviations(text: string): string {
  let result = text;
  for (const [pattern, replacement] of ABBREVIATIONS) {
    result = result.replace(pattern, replacement);
  }
  return result;
}

// ── Main Normalizer Pipeline ──────────────────────────────────

/**
 * Normalizes ingredient text for optimal pattern matching.
 * Pipeline order matters:
 *   1. OCR fixes (character-level)
 *   2. E-code normalization (format-level)
 *   3. Abbreviation expansion (token-level)
 *   4. Synonym injection (semantic-level)
 *
 * Returns the cleaned text with synonyms appended as invisible markers.
 * The original text structure is preserved — only noise is removed.
 */
export function normalizeIngredientText(raw: string): string {
  // Step 0: Normalize typographic quotes/apostrophes to ASCII
  // OFF data may contain ' (U+2019), ' (U+2018), ʼ (U+02BC) — standardize to '
  let text = raw.replace(/[\u2018\u2019\u02BC]/g, "'");

  // Step 1: OCR artifact repair
  text = fixOcrArtifacts(text);

  // Step 2: Normalize E-codes (E.471 → e471)
  text = normalizeECodes(text);

  // Step 2b: Collapse spaces around hyphens in emulsifier contexts
  // OFF text often has "mono - et diglycérides" → normalize to "mono- et diglycérides"
  // so our "mono-" contains pattern matches correctly.
  text = text.replace(/\bmono\s*-\s*et\b/gi, "mono- et");

  // Step 3: Expand abbreviations (veg. → vegetable)
  text = expandAbbreviations(text);

  // Step 4: Synonym injection
  // We check both the original text and the diacritics-stripped version
  const lower = text.toLowerCase();
  const stripped = stripDiacritics(lower);
  const injected = new Set<string>();

  for (const [synonym, canonical] of SYNONYM_MAP) {
    const synonymLower = synonym.toLowerCase();
    // Check if synonym appears in text (word boundary aware for short synonyms)
    if (synonymLower.length <= 3) {
      // Short synonyms: Unicode-aware word boundary to avoid false positives.
      // Also excludes hyphen-attached contexts (e.g. "lab-fermented" ≠ "lab" rennet)
      const escaped = synonymLower.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const re = new RegExp(`(?<![a-zA-Z\\u00C0-\\u024F\\d-])${escaped}(?![a-zA-Z\\u00C0-\\u024F\\d-])`);
      if (!re.test(lower) && !re.test(stripped)) continue;
    } else {
      if (!lower.includes(synonymLower) && !stripped.includes(synonymLower)) continue;
    }
    // Avoid duplicate injections
    if (!injected.has(canonical)) {
      injected.add(canonical);
    }
  }

  // Append canonical forms so pattern matching catches them
  if (injected.size > 0) {
    text = text + " | " + [...injected].join(", ");
  }

  return text;
}

/**
 * Quick check: does this text likely need normalization?
 * Used to skip the normalizer for clean texts (performance optimization).
 */
export function needsNormalization(text: string): boolean {
  // Has E-code format variants (requires separator — already-normalized "e471" won't match)
  if (E_CODE_DETECT_RE.test(text)) return true;
  // Has common OCR digit-letter confusion
  if (/[a-z]\d[a-z]/i.test(text)) return true;
  // Has known abbreviations with dots (scoped to actual abbreviation stems)
  if (/\b(?:veg|ingr|orig|conc|past)\.\s/i.test(text)) return true;
  // Has non-French/English characters suggesting multilingual text
  if (/[äöüß]|ñ|[àòùèìíóú]/i.test(text)) return true;

  return false;
}
