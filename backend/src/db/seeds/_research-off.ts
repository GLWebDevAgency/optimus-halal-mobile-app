/**
 * OFF Ingredient Text Research — Catalog real-world noise patterns
 * Fetches products known to contain tricky halal ingredients
 * Usage: pnpm tsx src/db/seeds/_research-off.ts
 */

const QUERIES = [
  "gélatine", "gelatine", "gelatin",
  "e471", "mono-et-diglycérides", "monoglycerides",
  "e120", "carmine", "cochenille",
  "présure", "rennet",
  "lactosérum", "whey",
  "graisse animale", "animal fat",
  "saindoux", "lard",
  "alcool", "alcohol", "ethanol",
  "shortening", "suif", "tallow",
];

interface SearchResult {
  query: string;
  texts: string[];
}

async function main() {
  const results: SearchResult[] = [];

  for (const q of QUERIES) {
    try {
      const url = `https://world.openfoodfacts.org/cgi/search.pl?search_terms=${encodeURIComponent(q)}&search_simple=1&action=process&json=1&page_size=5&fields=ingredients_text`;
      const res = await fetch(url);
      const data = (await res.json()) as { products?: { ingredients_text?: string }[] };
      const texts = (data.products ?? [])
        .map((p) => p.ingredients_text)
        .filter((t): t is string => !!t)
        .slice(0, 3);
      if (texts.length > 0) results.push({ query: q, texts });
    } catch {
      // skip failed queries
    }
  }

  // Extract unique ingredient snippets around our target words
  const patterns = new Map<string, Set<string>>();
  for (const { query, texts } of results) {
    for (const text of texts) {
      const lower = text.toLowerCase();
      const idx = lower.indexOf(query.toLowerCase());
      if (idx !== -1) {
        const start = Math.max(0, idx - 30);
        const end = Math.min(text.length, idx + query.length + 40);
        const snippet = text.substring(start, end).trim();
        if (!patterns.has(query)) patterns.set(query, new Set());
        patterns.get(query)!.add(snippet);
      }
    }
  }

  console.log("=== OFF Ingredient Text Variants ===\n");
  for (const [query, snippets] of patterns) {
    console.log(`[${query}]`);
    for (const s of snippets) console.log(`  → "${s}"`);
    console.log();
  }

  // Also print full texts for a few interesting products
  console.log("\n=== Full Ingredient Texts (samples) ===\n");
  for (const r of results.slice(0, 6)) {
    console.log(`--- Query: ${r.query} ---`);
    console.log(r.texts[0]?.substring(0, 300));
    console.log();
  }
}

main().catch(console.error);
