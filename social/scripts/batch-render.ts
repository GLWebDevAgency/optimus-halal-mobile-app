/**
 * Batch render — generates ALL Phase 1 social content videos.
 *
 * Usage:
 *   pnpm render:batch                  # All types
 *   pnpm render:batch -- --type=myth   # Only MythBusters
 *   pnpm render:batch -- --type=cert   # Only Certifiers
 *   pnpm render:batch -- --type=ayah   # Only AyahWisdom
 *   pnpm render:batch -- --type=madhab # Only MadhabCompare
 *   pnpm render:batch -- --type=ingr   # Only Ingredients
 *   pnpm render:batch -- --type=logo   # Only Logo variants
 *
 * Bundles once, then renders all videos sequentially.
 * Skips already-rendered files (delete to re-render).
 */
import { bundle } from "@remotion/bundler";
import { renderMedia, selectComposition } from "@remotion/renderer";
import { existsSync, mkdirSync } from "fs";
import path from "path";

// ── Data imports ──
import { PHASE1_INGREDIENTS } from "../src/data/ingredients";
import { MYTHBUSTERS } from "../src/data/mythbusters";
import { AYAHS } from "../src/data/ayahs";
import { CERTIFIERS } from "../src/data/certifiers";
import { MADHAB_COMPARISONS } from "../src/data/madhab-comparisons";

const ROOT = path.resolve(__dirname, "..");
const OUTPUT_DIR = path.resolve(ROOT, "out");

const args = process.argv.slice(2);
const typeFilter = args.find((a) => a.startsWith("--type="))?.split("=")[1];

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[àâä]/g, "a")
    .replace(/[éèêë]/g, "e")
    .replace(/[îï]/g, "i")
    .replace(/[ôö]/g, "o")
    .replace(/[ùûü]/g, "u")
    .replace(/[ç]/g, "c")
    .replace(/['—–]/g, "-")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 50);
}

interface RenderJob {
  compositionId: string;
  outputFile: string;
  props: Record<string, unknown>;
  label: string;
}

function buildJobs(): RenderJob[] {
  const jobs: RenderJob[] = [];

  // Logo variants
  if (!typeFilter || typeFilter === "logo") {
    jobs.push(
      { compositionId: "LogoReveal", outputFile: "logo-reveal-dark.mp4", props: { mode: "dark", showCta: true }, label: "LogoReveal Dark" },
      { compositionId: "LogoRevealLight", outputFile: "logo-reveal-light.mp4", props: { mode: "light", showCta: true }, label: "LogoReveal Light" },
      { compositionId: "SplashDark", outputFile: "splash-dark.mp4", props: { mode: "dark", showCta: false }, label: "Splash Dark" },
      { compositionId: "SplashLight", outputFile: "splash-light.mp4", props: { mode: "light", showCta: false }, label: "Splash Light" },
    );
  }

  // Ingredient Reels (13 FR)
  if (!typeFilter || typeFilter === "ingr") {
    for (const item of PHASE1_INGREDIENTS) {
      jobs.push({
        compositionId: "IngredientReel",
        outputFile: `ingredient-${slugify(item.ingredientName)}.mp4`,
        props: item,
        label: `Ingredient: ${item.ingredientName}`,
      });
    }
  }

  // MythBusters (10)
  if (!typeFilter || typeFilter === "myth") {
    MYTHBUSTERS.forEach((item, i) => {
      jobs.push({
        compositionId: "MythBuster",
        outputFile: `myth-${String(i + 1).padStart(2, "0")}-${slugify(item.statement)}.mp4`,
        props: item,
        label: `Myth #${i + 1}: ${item.statement.slice(0, 40)}...`,
      });
    });
  }

  // AyahWisdom (6)
  if (!typeFilter || typeFilter === "ayah") {
    AYAHS.forEach((item, i) => {
      jobs.push({
        compositionId: "AyahWisdom",
        outputFile: `ayah-${String(i + 1).padStart(2, "0")}-${slugify(item.reference)}.mp4`,
        props: item,
        label: `Ayah #${i + 1}: ${item.reference}`,
      });
    });
  }

  // Certifiers (6)
  if (!typeFilter || typeFilter === "cert") {
    for (const item of CERTIFIERS) {
      jobs.push({
        compositionId: "CertificateurSpotlight",
        outputFile: `cert-${slugify(item.name)}.mp4`,
        props: item,
        label: `Certifier: ${item.name}`,
      });
    }
  }

  // MadhabCompare (8)
  if (!typeFilter || typeFilter === "madhab") {
    MADHAB_COMPARISONS.forEach((item, i) => {
      jobs.push({
        compositionId: "MadhabCompare",
        outputFile: `madhab-${String(i + 1).padStart(2, "0")}-${slugify(item.topic)}.mp4`,
        props: item,
        label: `Madhab #${i + 1}: ${item.topic}`,
      });
    });
  }

  return jobs;
}

async function main() {
  mkdirSync(OUTPUT_DIR, { recursive: true });

  const jobs = buildJobs();
  console.log(`\n  Naqiy Batch Render — ${jobs.length} videos`);
  console.log(`  Filter: ${typeFilter ?? "all"}`);
  console.log(`  Output: ${OUTPUT_DIR}\n`);

  // Bundle once
  console.log("  Bundling Remotion project...");
  const bundleLocation = await bundle({
    entryPoint: path.resolve(ROOT, "src/index.ts"),
    webpackOverride: (config) => config,
  });
  console.log("  Bundle ready.\n");

  let success = 0;
  let skipped = 0;
  let failed = 0;
  const startTime = Date.now();

  for (let i = 0; i < jobs.length; i++) {
    const job = jobs[i];
    const outPath = path.join(OUTPUT_DIR, job.outputFile);
    const progress = `[${i + 1}/${jobs.length}]`;

    // Skip already-rendered files
    if (existsSync(outPath)) {
      console.log(`  ${progress} SKIP: ${job.outputFile}`);
      skipped++;
      continue;
    }

    console.log(`  ${progress} ${job.label}...`);

    try {
      const composition = await selectComposition({
        serveUrl: bundleLocation,
        id: job.compositionId,
        inputProps: job.props,
      });

      await renderMedia({
        composition,
        serveUrl: bundleLocation,
        codec: "h264",
        outputLocation: outPath,
        inputProps: job.props,
        jpegQuality: 90,
      });

      console.log(`         -> ${job.outputFile}`);
      success++;
    } catch (err: any) {
      console.error(`         FAILED: ${err.message?.slice(0, 200)}`);
      failed++;
    }
  }

  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
  console.log(`\n  ${"─".repeat(46)}`);
  console.log(`  Done in ${elapsed}s`);
  console.log(`  ${success} rendered | ${skipped} skipped | ${failed} failed`);
  console.log(`  Output: ${OUTPUT_DIR}\n`);
}

main().catch((err) => {
  console.error("Batch render failed:", err);
  process.exit(1);
});
