#!/usr/bin/env npx tsx
/**
 * Organize Content — Transforms flat rendered videos into a
 * ready-to-post weekly calendar structure.
 *
 * Usage: npx tsx scripts/organize-content.ts
 *
 * Output structure:
 *   content/
 *   ├── 00-brand/                    ← Assets internes (splash, logo reveal)
 *   ├── semaine-01/
 *   │   ├── lundi-ingredient/
 *   │   │   ├── video.mp4
 *   │   │   └── caption.txt
 *   │   ├── mardi-mythbuster/
 *   │   │   ├── video.mp4
 *   │   │   └── caption.txt
 *   │   ├── mercredi-ayah/
 *   │   │   ├── video.mp4
 *   │   │   └── caption.txt
 *   │   ├── jeudi-madhab/
 *   │   │   ├── video.mp4
 *   │   │   └── caption.txt
 *   │   └── vendredi-certificateur/
 *   │       ├── video.mp4
 *   │       └── caption.txt
 *   └── PLANNING.md                  ← Vue d'ensemble du calendrier
 */

import { copyFileSync, mkdirSync, writeFileSync, existsSync } from "fs";
import path from "path";

// ── Data imports ──
import { PHASE1_INGREDIENTS } from "../src/data/ingredients";
import { MYTHBUSTERS } from "../src/data/mythbusters";
import { AYAHS } from "../src/data/ayahs";
import { CERTIFIERS } from "../src/data/certifiers";
import { MADHAB_COMPARISONS } from "../src/data/madhab-comparisons";

const ROOT = path.resolve(__dirname, "..");
const RENDERED = path.join(ROOT, "out");
const CONTENT = path.join(ROOT, "content");

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

// ── Caption templates ──
// Tone: Naqiy verbal identity — Calme, Factuel, Inclusif, Humble, Constructif, Direct.
// Principle: "Servir, pas juger" — éduquer avec bienveillance, preuves complètes, rien cacher.

const RULING_FR: Record<string, string> = {
  halal: "Halal",
  haram: "Haram",
  doubtful: "Douteux",
  unknown: "Inconnu",
};

const DISCLAIMER = "Naqiy est un outil d'information. Cette publication ne constitue pas un avis religieux. Vérifiez les étiquettes et consultez un savant pour un avis personnalisé.";

function ingredientCaption(item: typeof PHASE1_INGREDIENTS[0]): string {
  const line = (school: string, ruling: string) =>
    `${school} : ${RULING_FR[ruling] ?? ruling}`;

  return `${item.ingredientName}${item.ingredientNameAr ? ` — ${item.ingredientNameAr}` : ""}

Avis des 4 écoles juridiques :

${line("Hanafite", item.rulingHanafi)}
${line("Chafiite", item.rulingShafii)}
${line("Malikite", item.rulingMaliki)}
${line("Hanbalite", item.rulingHanbali)}
${item.sourceText ? `\nSources : ${item.sourceText}` : ""}

La décision vous appartient.

${DISCLAIMER}

#naqiy #halal #${slugify(item.ingredientName)} #fiqh #islam #france`;
}

function mythCaption(item: typeof MYTHBUSTERS[0]): string {
  const verdictFr = item.verdict === "vrai" ? "Confirmé par les sources" : item.verdict === "faux" ? "Infirmé par les sources" : "Position nuancée";

  return `« ${item.statement} »

Ce que disent les sources : ${verdictFr}.

${item.explanation}
${item.madhabs ? `\nAvis par école : ${item.madhabs}` : ""}

Sources : ${item.sourceText}

La décision vous appartient.

${DISCLAIMER}

#naqiy #halal #fiqh #islam #france`;
}

function ayahCaption(item: typeof AYAHS[0]): string {
  return `${item.arabicText}

« ${item.translationFr} »

— ${item.reference}

Qu'Allah nous accorde la compréhension et la guidance.

#naqiy #quran #coran #islam #rappel #france`;
}

function certCaption(item: typeof CERTIFIERS[0]): string {
  const indicator = (label: string, value: boolean) =>
    `${value ? "Oui" : "Non"} — ${label}`;
  const score = item.trustScore;

  return `${item.name} — Analyse des pratiques de contrôle
${item.country}${item.founded ? ` · Fondé en ${item.founded}` : ""}

Score Naqiy : ${score}/100 (Tier ${item.tier})
Le score Naqiy mesure la rigueur des pratiques de contrôle, pas la qualité des produits certifiés.

${indicator("Contrôleurs salariés", item.controllersEmployees)}
${indicator("Présence systématique à chaque production", item.controllersPresentEach)}
${indicator("Sacrificateurs salariés", item.salariedSlaughterers)}
${indicator("Accepte l'abattage mécanique", item.acceptsMechanical)}
${indicator("Accepte l'électronarcose", item.acceptsElectronarcosis)}
${indicator("Accepte l'étourdissement", item.acceptsStunning)}

Ces données sont factuelles et vérifiables. La transparence est un droit.

${DISCLAIMER}

#naqiy #halal #certification #${slugify(item.name)} #transparence #islam #france`;
}

function madhabCaption(item: typeof MADHAB_COMPARISONS[0]): string {
  const block = (
    school: string,
    ruling: string,
    reason: string,
    dalil?: string,
    ref?: string,
  ) => {
    let s = `${school} : ${RULING_FR[ruling] ?? ruling}\n${reason}`;
    if (dalil) s += `\nDalil : ${dalil}`;
    if (ref) s += `\nRéférence : ${ref}`;
    return s;
  };

  return `${item.topic}${item.topicAr ? ` — ${item.topicAr}` : ""}

Avis des 4 écoles juridiques :

${block("Hanafite", item.hanafiRuling, item.hanafiReason, item.hanafiDalil, item.hanafiRef)}

${block("Chafiite", item.shafiiRuling, item.shafiiReason, item.shafiiDalil, item.shafiiRef)}

${block("Malikite", item.malikiRuling, item.malikiReason, item.malikiDalil, item.malikiRef)}

${block("Hanbalite", item.hanbaliRuling, item.hanbaliReason, item.hanbaliDalil, item.hanbaliRef)}
${item.commonEvidence ? `\n« ${item.commonEvidence} »` : ""}

Chaque école a ses preuves. La décision vous appartient.

${DISCLAIMER}

#naqiy #halal #madhab #fiqh #hanafi #shafii #maliki #hanbali #islam #france`;
}

// ── Posting calendar ──
// 5 posts/week: Lun=Ingredient, Mar=MythBuster, Mer=Ayah, Jeu=Madhab, Ven=Certificateur

interface PostSlot {
  day: string;
  type: "ingredient" | "myth" | "ayah" | "madhab" | "cert";
  videoFile: string;
  caption: string;
  title: string;
}

function buildCalendar(): PostSlot[][] {
  // Build per-type queues
  const ingredientQueue: PostSlot[] = PHASE1_INGREDIENTS.map((item) => ({
    day: "lundi-ingredient",
    type: "ingredient",
    videoFile: `ingredient-${slugify(item.ingredientName)}.mp4`,
    caption: ingredientCaption(item),
    title: item.ingredientName,
  }));

  const mythQueue: PostSlot[] = MYTHBUSTERS.map((item, i) => ({
    day: "mardi-mythbuster",
    type: "myth",
    videoFile: `myth-${String(i + 1).padStart(2, "0")}-${slugify(item.statement)}.mp4`,
    caption: mythCaption(item),
    title: item.statement.slice(0, 50),
  }));

  const ayahQueue: PostSlot[] = AYAHS.map((item, i) => ({
    day: "mercredi-ayah",
    type: "ayah",
    videoFile: `ayah-${String(i + 1).padStart(2, "0")}-${slugify(item.reference)}.mp4`,
    caption: ayahCaption(item),
    title: item.reference,
  }));

  const madhabQueue: PostSlot[] = MADHAB_COMPARISONS.map((item, i) => ({
    day: "jeudi-madhab",
    type: "madhab",
    videoFile: `madhab-${String(i + 1).padStart(2, "0")}-${slugify(item.topic)}.mp4`,
    caption: madhabCaption(item),
    title: item.topic,
  }));

  const certQueue: PostSlot[] = CERTIFIERS.map((item) => ({
    day: "vendredi-certificateur",
    type: "cert",
    videoFile: `cert-${slugify(item.name)}.mp4`,
    caption: certCaption(item),
    title: item.name,
  }));

  // Build weeks — round-robin through each queue
  const weeks: PostSlot[][] = [];
  const maxWeeks = Math.max(
    ingredientQueue.length,
    mythQueue.length,
    ayahQueue.length,
    madhabQueue.length,
    certQueue.length,
  );

  for (let w = 0; w < maxWeeks; w++) {
    const week: PostSlot[] = [];
    if (ingredientQueue[w]) week.push(ingredientQueue[w]);
    if (mythQueue[w]) week.push(mythQueue[w]);
    if (ayahQueue[w]) week.push(ayahQueue[w]);
    if (madhabQueue[w]) week.push(madhabQueue[w]);
    if (certQueue[w]) week.push(certQueue[w]);
    if (week.length > 0) weeks.push(week);
  }

  return weeks;
}

function main() {
  // Clean start
  mkdirSync(CONTENT, { recursive: true });

  // ── 1. Brand assets ──
  const brandDir = path.join(CONTENT, "00-brand");
  mkdirSync(brandDir, { recursive: true });

  const brandFiles = [
    "logo-reveal-light.mp4",
    "logo-reveal-dark.mp4",
    "splash-light.mp4",
    "splash-dark.mp4",
  ];

  for (const f of brandFiles) {
    const src = path.join(RENDERED, f);
    const dst = path.join(brandDir, f);
    if (existsSync(src)) {
      copyFileSync(src, dst);
      console.log(`  Brand: ${f}`);
    } else {
      console.log(`  Brand: ${f} (not yet rendered)`);
    }
  }

  // ── 2. Weekly content ──
  const weeks = buildCalendar();
  let totalCopied = 0;
  let totalMissing = 0;
  const planningLines: string[] = [];

  planningLines.push("# Naqiy — Calendrier de Publication Instagram\n");
  planningLines.push("> Généré automatiquement. 5 posts/semaine.\n");
  planningLines.push("| Jour | Type | Description |");
  planningLines.push("|------|------|-------------|");
  planningLines.push("| Lundi | Ingredient Reel | Avis des 4 écoles juridiques sur un ingrédient |");
  planningLines.push("| Mardi | Idée Reçue | Analyse sourcée d'une croyance répandue |");
  planningLines.push("| Mercredi | Ayah Wisdom | Verset coranique — Rappel contemplatif |");
  planningLines.push("| Jeudi | Madhab Compare | Comparaison détaillée des 4 écoles |");
  planningLines.push("| Vendredi | Certificateur | Analyse factuelle des pratiques de contrôle |");
  planningLines.push("\n---\n");

  for (let w = 0; w < weeks.length; w++) {
    const weekNum = String(w + 1).padStart(2, "0");
    const weekDir = path.join(CONTENT, `semaine-${weekNum}`);
    const weekPosts = weeks[w];

    planningLines.push(`## Semaine ${w + 1}\n`);

    for (const post of weekPosts) {
      const dayDir = path.join(weekDir, post.day);
      mkdirSync(dayDir, { recursive: true });

      // Copy video
      const src = path.join(RENDERED, post.videoFile);
      const dst = path.join(dayDir, "video.mp4");

      if (existsSync(src)) {
        copyFileSync(src, dst);
        totalCopied++;
      } else {
        totalMissing++;
        // Create placeholder
        writeFileSync(dst + ".pending", `En attente de rendu: ${post.videoFile}\n`);
      }

      // Write caption
      writeFileSync(path.join(dayDir, "caption.txt"), post.caption, "utf-8");

      const dayLabel = post.day.split("-")[0].charAt(0).toUpperCase() + post.day.split("-")[0].slice(1);
      const status = existsSync(src) ? "OK" : "EN ATTENTE";
      planningLines.push(`- **${dayLabel}** — ${post.title} [${status}]`);
      console.log(`  Semaine ${weekNum} / ${post.day}: ${post.title} [${status}]`);
    }

    planningLines.push("");
  }

  // ── 3. Write planning ──
  planningLines.push("\n---\n");
  planningLines.push(`> ${totalCopied} vidéos prêtes | ${totalMissing} en attente de rendu`);
  planningLines.push(`> Re-exécuter après le rendu : \`npx tsx scripts/organize-content.ts\``);

  writeFileSync(path.join(CONTENT, "PLANNING.md"), planningLines.join("\n"), "utf-8");

  console.log(`\n  ${"─".repeat(46)}`);
  console.log(`  ${totalCopied} videos copiées`);
  console.log(`  ${totalMissing} en attente (re-exécuter après le rendu)`);
  console.log(`  Calendrier: content/PLANNING.md`);
  console.log(`  Output: ${CONTENT}\n`);
}

main();
