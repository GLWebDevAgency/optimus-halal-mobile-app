# Sprint 11: Additives Intelligence Engine + Madhab — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Replace the hardcoded 50-entry additives map with a 300+ entry PostgreSQL table including toxicity data, EFSA status, and per-madhab scholarly rulings. Add madhab personalization to halal analysis. Add health profile fields for personalized warnings.

**Architecture:** New Drizzle schemas (`additives`, `additive_madhab_rulings`) + new enums. Enhance `analyzeHalalStatus()` to query the DB and factor in user's madhab + strictness. New `additives` tRPC router. Update `users` table with `madhab`, `is_pregnant`, `has_children`. Comprehensive seed data. Mobile UI for madhab selector + health profile + enhanced scan result.

**Tech Stack:** Drizzle ORM, PostgreSQL, tRPC v11, Zod, Expo Router, React Native

**Key Design Doc:** `docs/plans/2026-02-16-world-class-killer-design.md`

---

## Task 1: Additives Schema + Enums

**Files:**
- Create: `backend/src/db/schema/additives.ts`
- Modify: `backend/src/db/schema/index.ts` (add export)

**Step 1: Create the additives schema**

Create `backend/src/db/schema/additives.ts`:

```typescript
import { pgTable, pgEnum } from "drizzle-orm/pg-core";
import * as t from "drizzle-orm/pg-core";
import { halalStatusEnum } from "./products.js";

export const additiveCategoryEnum = pgEnum("additive_category", [
  "colorant",
  "preservative",
  "antioxidant",
  "emulsifier",
  "stabilizer",
  "thickener",
  "flavor_enhancer",
  "sweetener",
  "acid",
  "anti_caking",
  "glazing_agent",
  "humectant",
  "raising_agent",
  "sequestrant",
  "other",
]);

export const additiveOriginEnum = pgEnum("additive_origin", [
  "plant",
  "animal",
  "synthetic",
  "mineral",
  "insect",
  "mixed",
]);

export const toxicityLevelEnum = pgEnum("toxicity_level", [
  "safe",
  "low_concern",
  "moderate_concern",
  "high_concern",
]);

export const efsaStatusEnum = pgEnum("efsa_status", [
  "approved",
  "under_review",
  "restricted",
  "banned",
]);

export const additives = pgTable("additives", {
  code: t.varchar({ length: 10 }).primaryKey(), // "E471"
  nameFr: t.varchar("name_fr", { length: 255 }).notNull(),
  nameEn: t.varchar("name_en", { length: 255 }),
  nameAr: t.varchar("name_ar", { length: 255 }),
  category: additiveCategoryEnum().notNull(),
  halalStatusDefault: halalStatusEnum("halal_status_default").notNull(),
  halalExplanationFr: t.text("halal_explanation_fr"),
  halalExplanationEn: t.text("halal_explanation_en"),
  origin: additiveOriginEnum().notNull(),
  originDetails: t.text("origin_details"),
  toxicityLevel: toxicityLevelEnum("toxicity_level").default("safe").notNull(),
  adiMgPerKg: t.doublePrecision("adi_mg_per_kg"),
  riskPregnant: t.boolean("risk_pregnant").default(false).notNull(),
  riskChildren: t.boolean("risk_children").default(false).notNull(),
  riskAllergic: t.boolean("risk_allergic").default(false).notNull(),
  healthEffectsFr: t.text("health_effects_fr"),
  healthEffectsEn: t.text("health_effects_en"),
  efsaStatus: efsaStatusEnum("efsa_status").default("approved").notNull(),
  bannedCountries: t.text("banned_countries").array(),
  isActive: t.boolean("is_active").default(true).notNull(),
  createdAt: t
    .timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: t
    .timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export type Additive = typeof additives.$inferSelect;
export type NewAdditive = typeof additives.$inferInsert;
```

**Step 2: Add export to barrel file**

In `backend/src/db/schema/index.ts`, add:
```typescript
export * from "./additives.js";
```

**Step 3: Push schema to database**

Run: `cd backend && pnpm drizzle-kit push --force`
Expected: Tables created, no errors.

**Step 4: Verify with TypeScript**

Run: `cd backend && npx tsc --noEmit`
Expected: 0 errors

**Step 5: Commit**

```bash
git add backend/src/db/schema/additives.ts backend/src/db/schema/index.ts
git commit -m "feat(schema): add additives table with toxicity + origin + EFSA enums"
```

---

## Task 2: Madhab Enum + Rulings Schema

**Files:**
- Modify: `backend/src/db/schema/users.ts` (add madhab enum)
- Modify: `backend/src/db/schema/additives.ts` (add additive_madhab_rulings table)
- Modify: `backend/src/db/schema/index.ts` (if needed)

**Step 1: Add madhab enum to users.ts**

In `backend/src/db/schema/users.ts`, add after the `languageEnum`:

```typescript
export const madhabEnum = pgEnum("madhab", [
  "hanafi",
  "shafii",
  "maliki",
  "hanbali",
  "general",
]);
```

**Step 2: Add madhab + health fields to users table**

In the `users` table definition, add after `allergens`:

```typescript
    madhab: madhabEnum().default("general").notNull(),
    isPregnant: t.boolean("is_pregnant").default(false).notNull(),
    hasChildren: t.boolean("has_children").default(false).notNull(),
```

**Step 3: Add additive_madhab_rulings table to additives.ts**

Append to `backend/src/db/schema/additives.ts`:

```typescript
import { madhabEnum } from "./users.js";

export const additiveMadhabRulings = pgTable(
  "additive_madhab_rulings",
  {
    id: t.uuid().defaultRandom().primaryKey(),
    additiveCode: t
      .varchar("additive_code", { length: 10 })
      .references(() => additives.code, { onDelete: "cascade" })
      .notNull(),
    madhab: madhabEnum().notNull(),
    ruling: halalStatusEnum("ruling").notNull(),
    explanationFr: t.text("explanation_fr").notNull(),
    explanationEn: t.text("explanation_en"),
    scholarlyReference: t.text("scholarly_reference"),
    createdAt: t
      .timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    t.uniqueIndex("madhab_ruling_unique_idx").on(
      table.additiveCode,
      table.madhab
    ),
  ]
);

export type AdditiveMadhabRuling = typeof additiveMadhabRulings.$inferSelect;
export type NewAdditiveMadhabRuling = typeof additiveMadhabRulings.$inferInsert;
```

**Important:** The import of `madhabEnum` from `users.js` may cause a circular dependency with the existing `halalStatusEnum` import from `products.js`. If so, extract shared enums to a separate `backend/src/db/schema/enums.ts` file.

**Step 4: Push schema changes**

Run: `cd backend && pnpm drizzle-kit push --force`
Expected: New columns + table created.

**Step 5: Verify TypeScript**

Run: `cd backend && npx tsc --noEmit`
Expected: 0 errors

**Step 6: Commit**

```bash
git add backend/src/db/schema/users.ts backend/src/db/schema/additives.ts
git commit -m "feat(schema): add madhab enum, health fields, additive_madhab_rulings table"
```

---

## Task 3: Additives Seed Data (300+ entries)

**Files:**
- Create: `backend/src/db/seeds/additives-seed.ts`
- Modify: `backend/package.json` (add seed script)

**Step 1: Create the additives seed file**

Create `backend/src/db/seeds/additives-seed.ts` with all 300+ additives. The structure for each entry:

```typescript
import { db } from "../index.js";
import { additives, additiveMadhabRulings } from "../schema/index.js";

async function seedAdditives() {
  console.log("🧪 Seeding additives database...");

  const ADDITIVES_DATA: (typeof additives.$inferInsert)[] = [
    // ── COLORANTS (E100-E199) ────────────────────────────
    {
      code: "E100",
      nameFr: "Curcumine",
      nameEn: "Curcumin",
      category: "colorant",
      halalStatusDefault: "halal",
      halalExplanationFr: "Colorant naturel extrait du curcuma (origine végétale)",
      origin: "plant",
      originDetails: "Extrait du rhizome de curcuma",
      toxicityLevel: "safe",
      adiMgPerKg: 3,
      riskPregnant: false,
      riskChildren: false,
      riskAllergic: false,
      efsaStatus: "approved",
    },
    // ... (see full list below)
  ];

  // Upsert all additives
  for (const additive of ADDITIVES_DATA) {
    await db
      .insert(additives)
      .values(additive)
      .onConflictDoUpdate({
        target: additives.code,
        set: {
          nameFr: additive.nameFr,
          nameEn: additive.nameEn,
          category: additive.category,
          halalStatusDefault: additive.halalStatusDefault,
          halalExplanationFr: additive.halalExplanationFr,
          origin: additive.origin,
          toxicityLevel: additive.toxicityLevel,
          riskPregnant: additive.riskPregnant,
          riskChildren: additive.riskChildren,
          riskAllergic: additive.riskAllergic,
          efsaStatus: additive.efsaStatus,
        },
      });
  }

  console.log(`✅ ${ADDITIVES_DATA.length} additives seeded`);
}
```

**The full additives list must include AT MINIMUM these categories:**

**Colorants (E100-E199) — ~40 entries:**
- E100 Curcumine (halal, plant, safe)
- E101 Riboflavine (halal, synthetic, safe)
- E102 Tartrazine (halal, synthetic, moderate_concern — children ADHD "Southampton Six")
- E104 Jaune de quinoléine (halal, synthetic, moderate_concern — children)
- E110 Jaune orangé S (halal, synthetic, moderate_concern — children)
- E120 Carmine/Cochenille (haram, insect, low_concern — allergic)
- E122 Azorubine (halal, synthetic, moderate_concern — children)
- E124 Ponceau 4R (halal, synthetic, moderate_concern — children)
- E129 Rouge allura AC (halal, synthetic, moderate_concern — children)
- E131 Bleu patenté V (halal, synthetic, low_concern)
- E132 Indigotine (halal, synthetic, safe)
- E133 Bleu brillant FCF (halal, synthetic, safe)
- E140 Chlorophylles (halal, plant, safe)
- E141 Complexes cuivre-chlorophylles (halal, plant, safe)
- E150a Caramel (halal, plant, safe)
- E150b Caramel de sulfite caustique (halal, plant, low_concern)
- E150c Caramel ammoniacal (halal, plant, low_concern)
- E150d Caramel de sulfite d'ammonium (halal, plant, low_concern)
- E153 Charbon végétal (halal, plant, safe)
- E160a Bêta-carotène (halal, plant, safe)
- E160b Annatto (halal, plant, safe)
- E160c Extrait de paprika (halal, plant, safe)
- E161b Lutéine (halal, plant, safe)
- E162 Rouge de betterave (halal, plant, safe)
- E163 Anthocyanes (halal, plant, safe)
- E170 Carbonate de calcium (halal, mineral, safe)
- E171 Dioxyde de titane (halal, mineral, high_concern — pregnant + children, banned in EU food since 2022)
- E172 Oxydes de fer (halal, mineral, safe)

**Preservatives (E200-E299) — ~30 entries:**
- E200 Acide sorbique (halal, synthetic, safe)
- E202 Sorbate de potassium (halal, synthetic, safe)
- E210 Acide benzoïque (halal, synthetic, low_concern — allergic)
- E211 Benzoate de sodium (halal, synthetic, low_concern — allergic, children)
- E220 Dioxyde de soufre (halal, synthetic, moderate_concern — allergic sulfites)
- E221-E228 Sulfites (halal, synthetic, moderate_concern — allergic sulfites)
- E234 Nisine (halal, synthetic, safe)
- E249 Nitrite de potassium (halal, synthetic, moderate_concern — pregnant)
- E250 Nitrite de sodium (halal, synthetic, moderate_concern — pregnant)
- E251 Nitrate de sodium (halal, synthetic, low_concern)
- E252 Nitrate de potassium (halal, synthetic, low_concern)
- E260 Acide acétique (halal, plant, safe)
- E270 Acide lactique (halal, plant, safe)
- E280 Acide propionique (halal, synthetic, safe)
- E290 Dioxyde de carbone (halal, mineral, safe)
- E296 Acide malique (halal, plant, safe)
- E297 Acide fumarique (halal, synthetic, safe)

**Antioxidants (E300-E399) — ~25 entries:**
- E300 Acide ascorbique (halal, synthetic, safe)
- E301 Ascorbate de sodium (halal, synthetic, safe)
- E304 Palmitate d'ascorbyle (halal, plant, safe)
- E306-E309 Tocophérols (halal, plant, safe)
- E310 Gallate de propyle (halal, synthetic, low_concern)
- E320 BHA (halal, synthetic, moderate_concern)
- E321 BHT (halal, synthetic, moderate_concern)
- E322 Lécithine (halal, plant, safe) — usually soy
- E322i Lécithine (halal, plant, safe)
- E325-E327 Lactates (halal, synthetic, safe)
- E330 Acide citrique (halal, plant, safe)
- E331 Citrate de sodium (halal, plant, safe)
- E332 Citrate de potassium (halal, plant, safe)
- E334 Acide tartrique (halal, plant, safe)
- E335-E337 Tartrates (halal, plant, safe)
- E338 Acide phosphorique (halal, synthetic, low_concern)
- E339-E341 Phosphates (halal, synthetic, low_concern)
- E392 Extrait de romarin (halal, plant, safe)

**Emulsifiers/Stabilizers (E400-E499) — ~45 entries (most contested halal):**
- E400 Acide alginique (halal, plant, safe)
- E401-E405 Alginates (halal, plant, safe)
- E406 Agar-agar (halal, plant, safe)
- E407 Carraghénane (halal, plant, low_concern)
- E410 Gomme de caroube (halal, plant, safe)
- E412 Gomme guar (halal, plant, safe)
- E413 Gomme tragacanthe (halal, plant, safe)
- E414 Gomme arabique (halal, plant, safe)
- E415 Gomme xanthane (halal, plant, safe)
- E416 Gomme karaya (halal, plant, safe)
- E417 Gomme tara (halal, plant, safe)
- E418 Gomme gellane (halal, plant, safe)
- E420 Sorbitol (halal, plant, safe)
- E421 Mannitol (halal, plant, safe)
- E422 Glycérol (doubtful, mixed, safe) — can be animal-derived
- E432-E436 Polysorbates (doubtful, mixed, safe) — may contain animal fatty acids
- E440 Pectine (halal, plant, safe)
- E441 Gélatine (haram, animal, safe) — animal collagen, usually porcine
- E442 Phosphatides d'ammonium (halal, plant, safe)
- E450-E452 Polyphosphates (halal, synthetic, low_concern)
- E460 Cellulose (halal, plant, safe)
- E461 Méthylcellulose (halal, plant, safe)
- E464 Hydroxypropylméthylcellulose (halal, plant, safe)
- E466 Carboxyméthylcellulose (halal, plant, safe)
- E471 Mono/diglycérides (doubtful, mixed, safe) — KEY: animal or plant origin unknown
- E472a Esters acétiques (doubtful, mixed, safe)
- E472b Esters lactiques (doubtful, mixed, safe)
- E472c Esters citriques (doubtful, mixed, safe)
- E472e Esters DATEM (doubtful, mixed, safe)
- E473 Esters de saccharose (doubtful, mixed, safe)
- E474 Sucroglycérides (doubtful, mixed, safe)
- E475 Esters polyglycérol (doubtful, mixed, safe)
- E476 Polyricinoléate de polyglycérol (halal, plant, safe) — castor oil
- E481 Stéaroyl-2-lactylate de sodium (doubtful, mixed, safe)
- E482 Stéaroyl-2-lactylate de calcium (doubtful, mixed, safe)
- E491 Monostéarate de sorbitan (doubtful, mixed, safe)
- E492 Tristéarate de sorbitan (doubtful, mixed, safe)

**Thickeners/Gelling (E500-E599) — ~20 entries:**
- E500 Bicarbonate de sodium (halal, mineral, safe)
- E501 Carbonate de potassium (halal, mineral, safe)
- E503 Carbonate d'ammonium (halal, mineral, safe)
- E504 Carbonate de magnésium (halal, mineral, safe)
- E507 Acide chlorhydrique (halal, synthetic, safe)
- E508 Chlorure de potassium (halal, mineral, safe)
- E509 Chlorure de calcium (halal, mineral, safe)
- E516 Sulfate de calcium (halal, mineral, safe)
- E524 Hydroxyde de sodium (halal, mineral, safe)
- E542 Phosphate d'os (haram, animal, safe) — bone-derived
- E551 Dioxyde de silicium (halal, mineral, safe)
- E553 Talc (halal, mineral, safe)
- E570 Acide stéarique (doubtful, mixed, safe) — animal or plant
- E574 Acide gluconique (halal, plant, safe)
- E575 Glucono-delta-lactone (halal, plant, safe)

**Flavor Enhancers (E600-E699) — ~15 entries:**
- E620 Acide glutamique (halal, synthetic, safe)
- E621 Glutamate monosodique MSG (halal, synthetic, moderate_concern — children)
- E622 Glutamate monopotassique (halal, synthetic, low_concern)
- E627 Guanylate disodique (halal, synthetic, safe)
- E631 Inosinate disodique (doubtful, mixed, low_concern) — may be animal
- E635 Ribonucléotides disodiques (doubtful, mixed, low_concern) — may be animal
- E640 Glycine (doubtful, mixed, safe) — may be animal

**Glazing/Waxes (E900-E999) — ~20 entries:**
- E900 Diméthylpolysiloxane (halal, synthetic, safe)
- E901 Cire d'abeille (halal, animal, safe) — bee product, halal by consensus
- E903 Cire de carnauba (halal, plant, safe)
- E904 Shellac/Gomme-laque (doubtful, insect, safe) — lac insect
- E920 L-Cystéine (doubtful, mixed, safe) — may be from feathers/hair
- E927b Carbamide (halal, synthetic, safe)
- E938 Argon (halal, mineral, safe)
- E941 Azote (halal, mineral, safe)
- E942 Protoxyde d'azote (halal, mineral, safe)
- E948 Oxygène (halal, mineral, safe)
- E950 Acésulfame-K (halal, synthetic, low_concern)
- E951 Aspartame (halal, synthetic, moderate_concern — pregnant)
- E952 Cyclamate (halal, synthetic, moderate_concern) — banned in US
- E953 Isomalt (halal, plant, safe)
- E954 Saccharine (halal, synthetic, low_concern)
- E955 Sucralose (halal, synthetic, low_concern)
- E960 Stéviol glycosides (halal, plant, safe)
- E965 Maltitol (halal, plant, safe)
- E966 Lactitol (halal, plant, safe) — derived from lactose
- E967 Xylitol (halal, plant, safe)
- E968 Erythritol (halal, plant, safe)

**Step 2: Add seed script to package.json**

In `backend/package.json`, add to scripts:
```json
"db:seed:additives": "tsx --env-file=.env src/db/seeds/additives-seed.ts"
```

**Step 3: Run seed**

Run: `cd backend && pnpm db:seed:additives`
Expected: "✅ 300+ additives seeded"

**Step 4: Verify data**

Run: `cd backend && pnpm tsx --env-file=.env -e "import {db} from './src/db/index.js'; import {additives} from './src/db/schema/index.js'; const count = await db.select({count: require('drizzle-orm').count()}).from(additives); console.log(count); process.exit(0);"`
Expected: Count ≥ 300

**Step 5: Commit**

```bash
git add backend/src/db/seeds/additives-seed.ts backend/package.json
git commit -m "feat(seed): add 300+ additives with toxicity + halal + EFSA data"
```

---

## Task 4: Madhab Rulings Seed Data

**Files:**
- Modify: `backend/src/db/seeds/additives-seed.ts` (add madhab rulings section)

**Step 1: Add madhab rulings to seed file**

Append to the seed file, after additives insertion:

```typescript
async function seedMadhabRulings() {
  console.log("🕌 Seeding madhab rulings...");

  const RULINGS: (typeof additiveMadhabRulings.$inferInsert)[] = [
    // ── E441 Gelatin — most contested ──
    {
      additiveCode: "E441",
      madhab: "hanafi",
      ruling: "doubtful",
      explanationFr:
        "Débat sur l'istihalah (transformation chimique). Certains grands savants hanafis acceptent que la transformation rend la gélatine pure, mais la majorité des muftis hanafis contemporains considèrent que la transformation est insuffisante. Position conservatrice : douteux.",
      explanationEn:
        "Debate on istihalah (chemical transformation). Some senior Hanafi scholars accept transformation makes gelatin pure, but most contemporary Hanafi muftis consider the transformation insufficient. Conservative: doubtful.",
      scholarlyReference: "SeekersGuidance, Darul Ifta Azaadville",
    },
    {
      additiveCode: "E441",
      madhab: "shafii",
      ruling: "haram",
      explanationFr:
        "L'école shafi'ite n'accepte pas l'istihalah pour les substances najis. La gélatine d'animal non-zabiha ou porcine reste impure indépendamment de la transformation chimique.",
      explanationEn:
        "Shafi'i school does not accept istihalah for najis substances. Gelatin from non-zabiha or porcine animal remains impure regardless of chemical transformation.",
      scholarlyReference: "IslamQA, Utrujj Foundation",
    },
    {
      additiveCode: "E441",
      madhab: "maliki",
      ruling: "doubtful",
      explanationFr:
        "Certains savants malikites et conférences islamiques modernes ont accepté l'istihalah même pour la gélatine porcine. Position non unanime — prudence recommandée.",
      scholarlyReference: "Virtual Mosque, IIFA",
    },
    {
      additiveCode: "E441",
      madhab: "hanbali",
      ruling: "haram",
      explanationFr:
        "Le fiqh hanbalite classique considère les produits d'animaux non-abattus comme impurs. Pas d'exception générale via l'istihalah. Position identique au shafi'ite.",
      scholarlyReference: "IslamQA.info (Salafi/Hanbali)",
    },

    // ── Rennet/Présure (not an E-number, but used in cheese) ──
    // Note: We'll handle rennet via the HARAM_INGREDIENTS keyword list
    // But we can add rulings for E-numbers that involve similar animal derivatives

    // ── E471 Mono/diglycerides — when origin unknown ──
    {
      additiveCode: "E471",
      madhab: "hanafi",
      ruling: "doubtful",
      explanationFr:
        "Si d'origine végétale : halal. Si d'origine animale non-zabiha : douteux (même raisonnement que les graisses animales). Vérifier l'étiquetage ou le statut vegan du produit.",
      scholarlyReference: "SeekersGuidance",
    },
    {
      additiveCode: "E471",
      madhab: "shafii",
      ruling: "doubtful",
      explanationFr:
        "Même position : douteux si origine inconnue. Halal si confirmé végétal. Haram si d'animal non-zabiha.",
      scholarlyReference: "IslamQA",
    },
    {
      additiveCode: "E471",
      madhab: "maliki",
      ruling: "doubtful",
      explanationFr:
        "Origine inconnue = douteux. La plupart des savants malikites recommandent la prudence.",
      scholarlyReference: "IIFA",
    },
    {
      additiveCode: "E471",
      madhab: "hanbali",
      ruling: "doubtful",
      explanationFr:
        "Position identique aux autres écoles : douteux si origine non confirmée.",
      scholarlyReference: "IslamQA.info",
    },

    // ── E120 Carmine — consensus haram ──
    {
      additiveCode: "E120",
      madhab: "hanafi",
      ruling: "haram",
      explanationFr: "Extrait d'insectes (cochenille). Les insectes ne sont pas considérés halal dans le fiqh hanafite.",
      scholarlyReference: "SeekersGuidance",
    },
    {
      additiveCode: "E120",
      madhab: "shafii",
      ruling: "haram",
      explanationFr: "Insectes impurs — haram par consensus shafi'ite.",
      scholarlyReference: "IslamQA",
    },
    {
      additiveCode: "E120",
      madhab: "maliki",
      ruling: "haram",
      explanationFr: "Haram — les insectes ne sont pas licites à la consommation.",
      scholarlyReference: "IIFA",
    },
    {
      additiveCode: "E120",
      madhab: "hanbali",
      ruling: "haram",
      explanationFr: "Haram — consensus des quatre écoles sur les insectes.",
      scholarlyReference: "IslamQA.info",
    },

    // ── E542 Bone phosphate — consensus haram ──
    {
      additiveCode: "E542",
      madhab: "hanafi",
      ruling: "haram",
      explanationFr: "Phosphate extrait d'os d'animaux — haram si d'animal non-zabiha ou de porc.",
      scholarlyReference: "Darul Ifta",
    },
    {
      additiveCode: "E542",
      madhab: "shafii",
      ruling: "haram",
      explanationFr: "Os d'animal non-zabiha = najis. Haram.",
      scholarlyReference: "IslamQA",
    },
    {
      additiveCode: "E542",
      madhab: "maliki",
      ruling: "haram",
      explanationFr: "Haram — même raisonnement.",
      scholarlyReference: "IIFA",
    },
    {
      additiveCode: "E542",
      madhab: "hanbali",
      ruling: "haram",
      explanationFr: "Haram — consensus.",
      scholarlyReference: "IslamQA.info",
    },

    // ── E904 Shellac — doubtful ──
    {
      additiveCode: "E904",
      madhab: "hanafi",
      ruling: "doubtful",
      explanationFr: "Résine sécrétée par l'insecte lac. Certains hanafis la considèrent comme un produit de l'insecte (comme le miel de l'abeille) et donc acceptable. Non consensuel.",
      scholarlyReference: "SeekersGuidance",
    },
    {
      additiveCode: "E904",
      madhab: "shafii",
      ruling: "doubtful",
      explanationFr: "Position prudente — la shellac est un produit d'insecte, mais certains la comparent au miel.",
      scholarlyReference: "IslamQA",
    },

    // ── E920 L-Cysteine ──
    {
      additiveCode: "E920",
      madhab: "hanafi",
      ruling: "doubtful",
      explanationFr: "Peut être extraite de plumes de volaille (halal si zabiha) ou de cheveux humains (haram). L'origine doit être vérifiée.",
      scholarlyReference: "SeekersGuidance",
    },
    {
      additiveCode: "E920",
      madhab: "shafii",
      ruling: "doubtful",
      explanationFr: "Même position — origine doit être vérifiée. Si cheveux humains : haram.",
      scholarlyReference: "IslamQA",
    },

    // ── E422 Glycerol ──
    {
      additiveCode: "E422",
      madhab: "hanafi",
      ruling: "doubtful",
      explanationFr: "Le glycérol peut être d'origine animale (graisses) ou végétale. Douteux si origine non précisée.",
      scholarlyReference: "SeekersGuidance",
    },
    {
      additiveCode: "E422",
      madhab: "shafii",
      ruling: "doubtful",
      explanationFr: "Même raisonnement — origine inconnue = douteux.",
      scholarlyReference: "IslamQA",
    },

    // ── E951 Aspartame — halal by all ──
    // No madhab-specific rulings needed (consensus halal, synthetic)

    // ── E901 Beeswax — consensus halal ──
    // No madhab-specific rulings needed (consensus halal, bee product like honey)
  ];

  for (const ruling of RULINGS) {
    await db
      .insert(additiveMadhabRulings)
      .values(ruling)
      .onConflictDoNothing(); // unique(additive_code, madhab)
  }

  console.log(`✅ ${RULINGS.length} madhab rulings seeded`);
}
```

**Step 2: Run seed**

Run: `cd backend && pnpm db:seed:additives`
Expected: Both additives and rulings seeded without errors.

**Step 3: Commit**

```bash
git add backend/src/db/seeds/additives-seed.ts
git commit -m "feat(seed): add madhab-specific rulings for contested additives"
```

---

## Task 5: Additives tRPC Router

**Files:**
- Create: `backend/src/trpc/routers/additive.ts`
- Modify: `backend/src/trpc/router.ts` (add to AppRouter)

**Step 1: Create the additive router**

Create `backend/src/trpc/routers/additive.ts`:

```typescript
import { z } from "zod";
import { eq, ilike, or, and } from "drizzle-orm";
import { publicProcedure, protectedProcedure, router } from "../trpc.js";
import { additives, additiveMadhabRulings } from "../../db/schema/index.js";

export const additiveRouter = router({
  /** List all additives, optionally filtered by category or halal status */
  list: publicProcedure
    .input(
      z.object({
        category: z.string().optional(),
        halalStatus: z.enum(["halal", "haram", "doubtful", "unknown"]).optional(),
        limit: z.number().min(1).max(500).default(100),
        offset: z.number().min(0).default(0),
      })
    )
    .query(async ({ ctx, input }) => {
      const conditions = [];
      if (input.category) {
        conditions.push(eq(additives.category, input.category as any));
      }
      if (input.halalStatus) {
        conditions.push(eq(additives.halalStatusDefault, input.halalStatus));
      }
      conditions.push(eq(additives.isActive, true));

      const results = await ctx.db
        .select()
        .from(additives)
        .where(and(...conditions))
        .limit(input.limit)
        .offset(input.offset)
        .orderBy(additives.code);

      return results;
    }),

  /** Get a single additive by E-number code */
  getByCode: publicProcedure
    .input(z.object({ code: z.string() }))
    .query(async ({ ctx, input }) => {
      const code = input.code.toUpperCase().replace(/^EN:/, "").replace(/^E/, "E");

      const [additive] = await ctx.db
        .select()
        .from(additives)
        .where(eq(additives.code, code))
        .limit(1);

      if (!additive) return null;

      // Get madhab rulings for this additive
      const rulings = await ctx.db
        .select()
        .from(additiveMadhabRulings)
        .where(eq(additiveMadhabRulings.additiveCode, code));

      return { ...additive, madhabRulings: rulings };
    }),

  /** Search additives by name or code */
  search: publicProcedure
    .input(z.object({ query: z.string().min(1).max(100) }))
    .query(async ({ ctx, input }) => {
      const q = `%${input.query}%`;

      const results = await ctx.db
        .select()
        .from(additives)
        .where(
          or(
            ilike(additives.code, q),
            ilike(additives.nameFr, q),
            ilike(additives.nameEn, q)
          )
        )
        .limit(20)
        .orderBy(additives.code);

      return results;
    }),

  /** Get additives info for a list of OFF additive tags (used by scan result) */
  getForProduct: publicProcedure
    .input(
      z.object({
        additiveTags: z.array(z.string()),
        madhab: z.enum(["hanafi", "shafii", "maliki", "hanbali", "general"]).default("general"),
      })
    )
    .query(async ({ ctx, input }) => {
      if (input.additiveTags.length === 0) return [];

      // Normalize OFF tags: "en:e322" → "E322"
      const codes = input.additiveTags.map((tag) =>
        tag.replace(/^en:/, "").toUpperCase()
      );

      // Deduplicate (e.g., E322 and E322i both map to E322)
      const uniqueCodes = [...new Set(codes.map((c) => c.replace(/[a-z]$/i, "")))];

      const results = [];
      for (const code of uniqueCodes) {
        const [additive] = await ctx.db
          .select()
          .from(additives)
          .where(eq(additives.code, code))
          .limit(1);

        if (additive) {
          let madhabRuling = null;
          if (input.madhab !== "general") {
            const [ruling] = await ctx.db
              .select()
              .from(additiveMadhabRulings)
              .where(
                and(
                  eq(additiveMadhabRulings.additiveCode, code),
                  eq(additiveMadhabRulings.madhab, input.madhab)
                )
              )
              .limit(1);
            madhabRuling = ruling ?? null;
          }

          results.push({ ...additive, madhabRuling });
        }
      }

      return results;
    }),
});
```

**Step 2: Add to AppRouter**

In `backend/src/trpc/router.ts`, add:
```typescript
import { additiveRouter } from "./routers/additive.js";

// In the appRouter definition:
additive: additiveRouter,
```

**Step 3: Verify TypeScript**

Run: `cd backend && npx tsc --noEmit`
Expected: 0 errors

**Step 4: Commit**

```bash
git add backend/src/trpc/routers/additive.ts backend/src/trpc/router.ts
git commit -m "feat(api): add additives tRPC router with list, search, getByCode, getForProduct"
```

---

## Task 6: Madhab-Aware Halal Analysis Engine

**Files:**
- Modify: `backend/src/services/barcode.service.ts`

This is the core change: replace the hardcoded `ADDITIVES_HALAL_DB` with database queries, and factor in user's madhab + strictness.

**Step 1: Add new types and imports**

At the top of `barcode.service.ts`, update:

```typescript
import { db } from "../db/index.js";
import { additives, additiveMadhabRulings } from "../db/schema/index.js";
import { eq, and, inArray } from "drizzle-orm";

export type Madhab = "hanafi" | "shafii" | "maliki" | "hanbali" | "general";
export type HalalStrictness = "relaxed" | "moderate" | "strict" | "very_strict";

export interface HalalAnalysisOptions {
  madhab: Madhab;
  strictness: HalalStrictness;
}
```

**Step 2: Create DB-backed additive lookup**

Replace the hardcoded `ADDITIVES_HALAL_DB` with a function:

```typescript
interface AdditiveAnalysisResult {
  code: string;
  name: string;
  halalStatus: HalalStatus;
  explanation: string;
  toxicityLevel: string;
  riskPregnant: boolean;
  riskChildren: boolean;
  riskAllergic: boolean;
  madhabOverride?: {
    ruling: HalalStatus;
    explanation: string;
  };
}

async function lookupAdditives(
  tags: string[],
  madhab: Madhab
): Promise<AdditiveAnalysisResult[]> {
  // Normalize: "en:e322i" → "E322"
  const codes = [...new Set(
    tags.map((t) => t.replace(/^en:/, "").toUpperCase().replace(/[a-z]$/i, ""))
  )];

  if (codes.length === 0) return [];

  const dbAdditives = await db
    .select()
    .from(additives)
    .where(inArray(additives.code, codes));

  const results: AdditiveAnalysisResult[] = [];

  for (const add of dbAdditives) {
    let madhabOverride: AdditiveAnalysisResult["madhabOverride"] = undefined;

    if (madhab !== "general") {
      const [ruling] = await db
        .select()
        .from(additiveMadhabRulings)
        .where(
          and(
            eq(additiveMadhabRulings.additiveCode, add.code),
            eq(additiveMadhabRulings.madhab, madhab)
          )
        )
        .limit(1);

      if (ruling) {
        madhabOverride = {
          ruling: ruling.ruling,
          explanation: ruling.explanationFr ?? "",
        };
      }
    }

    results.push({
      code: add.code,
      name: add.nameFr,
      halalStatus: madhabOverride?.ruling ?? add.halalStatusDefault,
      explanation: madhabOverride?.explanation ?? add.halalExplanationFr ?? "",
      toxicityLevel: add.toxicityLevel,
      riskPregnant: add.riskPregnant,
      riskChildren: add.riskChildren,
      riskAllergic: add.riskAllergic,
      madhabOverride,
    });
  }

  // Also check any tags not found in DB — use the old hardcoded fallback
  for (const tag of tags) {
    const code = tag.replace(/^en:/, "").toUpperCase().replace(/[a-z]$/i, "");
    if (!dbAdditives.find((a) => a.code === code)) {
      const fallback = ADDITIVES_HALAL_DB[tag.toLowerCase()];
      if (fallback) {
        results.push({
          code,
          name: fallback.name,
          halalStatus: fallback.status,
          explanation: fallback.explanation,
          toxicityLevel: "safe",
          riskPregnant: false,
          riskChildren: false,
          riskAllergic: false,
        });
      }
    }
  }

  return results;
}
```

**Step 3: Update analyzeHalalStatus signature to be async and madhab-aware**

```typescript
export async function analyzeHalalStatus(
  ingredientsText: string | undefined,
  additivesTags?: string[],
  labelsTags?: string[],
  ingredientsAnalysisTags?: string[],
  options: HalalAnalysisOptions = { madhab: "general", strictness: "moderate" },
): Promise<HalalAnalysis> {
  // ... (same Tier 1 label check)

  // Tier 2-4: Use DB-backed additive lookup
  const additiveResults = await lookupAdditives(
    additivesTags ?? [],
    options.madhab
  );

  // Process additive results with madhab-specific rulings
  for (const add of additiveResults) {
    const effectiveStatus = add.halalStatus;
    reasons.push({
      type: "additive",
      name: `${add.code} (${add.name})`,
      status: effectiveStatus,
      explanation: add.madhabOverride
        ? `${add.explanation} (selon votre école ${options.madhab})`
        : add.explanation,
    });

    if (effectiveStatus === "haram") {
      worstStatus = "haram";
      worstConfidence = Math.max(worstConfidence, 0.9);
    } else if (effectiveStatus === "doubtful" && worstStatus !== "haram") {
      worstStatus = "doubtful";
      worstConfidence = Math.max(worstConfidence, 0.6);
    }
  }

  // ... (same ingredient text analysis)

  // Apply strictness overlay to final result
  return applyStrictnessOverlay(result, options.strictness);
}

function applyStrictnessOverlay(
  result: HalalAnalysis,
  strictness: HalalStrictness
): HalalAnalysis {
  switch (strictness) {
    case "relaxed":
      // Doubtful → show as halal with lower confidence
      if (result.status === "doubtful") {
        return { ...result, status: "halal", confidence: 0.5 };
      }
      return result;
    case "strict":
      // Doubtful → show as haram-adjacent (higher concern)
      if (result.status === "doubtful") {
        return { ...result, confidence: Math.max(result.confidence, 0.7) };
      }
      return result;
    case "very_strict":
      // Only certified (Tier 1) is halal — everything else is unknown
      if (result.tier !== "certified") {
        return {
          ...result,
          status: result.status === "haram" ? "haram" : "doubtful",
          confidence: result.status === "haram" ? result.confidence : 0.3,
        };
      }
      return result;
    default: // "moderate"
      return result;
  }
}
```

**Step 4: Update callers (scan router)**

In `backend/src/trpc/routers/scan.ts`, update the `scanBarcode` procedure to pass user preferences:

```typescript
// In scanBarcode mutation, after getting the user from context:
const halalAnalysis = await analyzeHalalStatus(
  offProduct?.ingredients_text,
  offProduct?.additives_tags,
  offProduct?.labels_tags,
  offProduct?.ingredients_analysis_tags,
  {
    madhab: ctx.user?.madhab ?? "general",
    strictness: ctx.user?.halalStrictness ?? "moderate",
  },
);
```

**Important:** Since `analyzeHalalStatus` is now async (DB queries), all callers must `await` it.

**Step 5: Verify TypeScript + test**

Run: `cd backend && npx tsc --noEmit`
Expected: 0 errors

**Step 6: Commit**

```bash
git add backend/src/services/barcode.service.ts backend/src/trpc/routers/scan.ts
git commit -m "feat(analysis): madhab-aware halal analysis with DB-backed additives lookup"
```

---

## Task 7: Update Profile Router

**Files:**
- Modify: `backend/src/trpc/routers/profile.ts`

**Step 1: Add madhab + health fields to updateProfile input**

In the `updateProfile` procedure input schema, add:

```typescript
madhab: z.enum(["hanafi", "shafii", "maliki", "hanbali", "general"]).optional(),
isPregnant: z.boolean().optional(),
hasChildren: z.boolean().optional(),
```

And in the update object passed to `db.update(users)`, add:

```typescript
...(input.madhab !== undefined && { madhab: input.madhab }),
...(input.isPregnant !== undefined && { isPregnant: input.isPregnant }),
...(input.hasChildren !== undefined && { hasChildren: input.hasChildren }),
```

**Step 2: Ensure getProfile returns new fields**

Verify that `getProfile` / `me` returns `madhab`, `isPregnant`, `hasChildren`. Since we're selecting all user fields, this should work automatically.

**Step 3: Verify TypeScript**

Run: `cd backend && npx tsc --noEmit`
Expected: 0 errors

**Step 4: Commit**

```bash
git add backend/src/trpc/routers/profile.ts
git commit -m "feat(api): add madhab + health profile fields to profile router"
```

---

## Task 8: Allergen Normalization Service

**Files:**
- Create: `backend/src/services/allergen.service.ts`

**Step 1: Create the allergen service**

```typescript
/**
 * Allergen Normalization Service
 *
 * Maps user-entered allergen names (FR/EN) to OpenFoodFacts tag format.
 * Used to cross-match user profile allergens against product allergens.
 */

export interface AllergenMatch {
  userAllergen: string;
  offTag: string;
  matchType: "allergen" | "trace";
  severity: "high" | "medium"; // allergen = high, trace = medium
}

// French/English allergen names → OFF tag format
const ALLERGEN_NORMALIZATION: Record<string, string> = {
  // Milk/Lactose
  lactose: "en:milk",
  lait: "en:milk",
  milk: "en:milk",
  "produits laitiers": "en:milk",
  dairy: "en:milk",

  // Peanuts
  arachides: "en:peanuts",
  "cacahuètes": "en:peanuts",
  peanuts: "en:peanuts",

  // Gluten
  gluten: "en:gluten",
  "blé": "en:gluten",
  wheat: "en:gluten",
  "seigle": "en:gluten",
  "orge": "en:gluten",
  "avoine": "en:gluten",

  // Eggs
  oeufs: "en:eggs",
  "œufs": "en:eggs",
  eggs: "en:eggs",

  // Soy
  soja: "en:soybeans",
  soy: "en:soybeans",
  soybeans: "en:soybeans",

  // Nuts
  "fruits à coque": "en:nuts",
  noix: "en:nuts",
  noisettes: "en:nuts",
  amandes: "en:nuts",
  nuts: "en:nuts",
  almonds: "en:nuts",
  hazelnuts: "en:nuts",
  pistaches: "en:nuts",
  cajou: "en:nuts",
  "noix de cajou": "en:nuts",

  // Fish
  poisson: "en:fish",
  fish: "en:fish",

  // Crustaceans
  "crustacés": "en:crustaceans",
  crustaceans: "en:crustaceans",
  crevettes: "en:crustaceans",
  shrimp: "en:crustaceans",

  // Molluscs
  mollusques: "en:molluscs",
  molluscs: "en:molluscs",

  // Celery
  "céleri": "en:celery",
  celery: "en:celery",

  // Mustard
  moutarde: "en:mustard",
  mustard: "en:mustard",

  // Sesame
  "sésame": "en:sesame-seeds",
  sesame: "en:sesame-seeds",

  // Lupin
  lupin: "en:lupin",

  // Sulfites
  sulfites: "en:sulphur-dioxide-and-sulphites",
  "dioxyde de soufre": "en:sulphur-dioxide-and-sulphites",
  "sulphur dioxide": "en:sulphur-dioxide-and-sulphites",
};

/**
 * Cross-match user allergens against product allergens + traces from OpenFoodFacts.
 */
export function matchAllergens(
  userAllergens: string[],
  productAllergenTags: string[],
  productTracesTags: string[]
): AllergenMatch[] {
  const matches: AllergenMatch[] = [];

  for (const userAllergen of userAllergens) {
    const normalized = ALLERGEN_NORMALIZATION[userAllergen.toLowerCase()];
    if (!normalized) continue;

    // Check direct allergens
    if (productAllergenTags.some((tag) => tag.toLowerCase() === normalized)) {
      matches.push({
        userAllergen,
        offTag: normalized,
        matchType: "allergen",
        severity: "high",
      });
    }

    // Check traces
    if (productTracesTags.some((tag) => tag.toLowerCase() === normalized)) {
      matches.push({
        userAllergen,
        offTag: normalized,
        matchType: "trace",
        severity: "medium",
      });
    }
  }

  return matches;
}
```

**Step 2: Commit**

```bash
git add backend/src/services/allergen.service.ts
git commit -m "feat(service): add allergen normalization + cross-matching engine"
```

---

## Task 9: Enhanced Scan Response

**Files:**
- Modify: `backend/src/trpc/routers/scan.ts`

**Step 1: Add personal alerts to scan response**

In the `scanBarcode` mutation, after halal analysis, add:

```typescript
import { matchAllergens } from "../../services/allergen.service.js";
import { db } from "../../db/index.js";
import { additives as additivesTable } from "../../db/schema/index.js";
import { inArray } from "drizzle-orm";

// After halalAnalysis computation:

// Build personal alerts
const personalAlerts: {
  type: "allergen" | "health" | "boycott";
  severity: "high" | "medium" | "low";
  title: string;
  description: string;
}[] = [];

// 1. Allergen matching
if (ctx.user?.allergens?.length && offProduct) {
  const allergenMatches = matchAllergens(
    ctx.user.allergens,
    offProduct.allergens_tags ?? [],
    offProduct.traces_tags ?? []
  );

  for (const match of allergenMatches) {
    personalAlerts.push({
      type: "allergen",
      severity: match.severity,
      title: match.matchType === "allergen"
        ? `Contient : ${match.userAllergen}`
        : `Traces possibles : ${match.userAllergen}`,
      description: match.matchType === "allergen"
        ? `Ce produit contient un allergène de votre profil (${match.userAllergen}).`
        : `Ce produit peut contenir des traces de ${match.userAllergen}.`,
    });
  }
}

// 2. Health warnings (pregnant/children)
if (offProduct?.additives_tags?.length) {
  const codes = [...new Set(
    offProduct.additives_tags.map((t: string) =>
      t.replace(/^en:/, "").toUpperCase().replace(/[a-z]$/i, "")
    )
  )];

  const riskyAdditives = await db
    .select()
    .from(additivesTable)
    .where(inArray(additivesTable.code, codes));

  for (const add of riskyAdditives) {
    if (add.riskPregnant && ctx.user?.isPregnant) {
      personalAlerts.push({
        type: "health",
        severity: "high",
        title: `${add.code} déconseillé (grossesse)`,
        description: add.healthEffectsFr ?? `${add.nameFr} est déconseillé aux femmes enceintes.`,
      });
    }
    if (add.riskChildren && ctx.user?.hasChildren) {
      personalAlerts.push({
        type: "health",
        severity: "medium",
        title: `${add.code} attention (enfants)`,
        description: add.healthEffectsFr ?? `${add.nameFr} peut affecter les enfants.`,
      });
    }
  }
}

// Add personalAlerts to the response
return {
  scan: insertedScan,
  product: existingProduct ?? newProduct,
  isNewProduct: !existingProduct,
  halalAnalysis,
  boycott: boycottResult,
  offExtras,
  personalAlerts, // NEW
};
```

**Step 2: Verify TypeScript**

Run: `cd backend && npx tsc --noEmit`
Expected: 0 errors

**Step 3: Commit**

```bash
git add backend/src/trpc/routers/scan.ts
git commit -m "feat(scan): add personalized alerts (allergen matching + health warnings)"
```

---

## Task 10: Mobile — Madhab Selector Screen

**Files:**
- Create: `optimus-halal/app/settings/madhab.tsx`
- Modify: `optimus-halal/app/(tabs)/profile.tsx` (add menu link)

**Step 1: Create madhab selector screen**

Create `optimus-halal/app/settings/madhab.tsx`:

```tsx
import React, { useState } from "react";
import { View, Text, Pressable, StyleSheet, ScrollView } from "react-native";
import { Stack, router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "@/hooks/useTheme";
import { trpc } from "@/lib/trpc";
import { useHaptics } from "@/hooks/useHaptics";
import { useTranslation } from "@/i18n";

const MADHAB_OPTIONS = [
  {
    value: "hanafi" as const,
    label: "Hanafi",
    description: "École d'Abu Hanifa — la plus répandue (Turquie, Asie du Sud, Asie Centrale)",
  },
  {
    value: "shafii" as const,
    label: "Shafi'i",
    description: "École d'ash-Shafi'i — Asie du Sud-Est, Afrique de l'Est, Yémen",
  },
  {
    value: "maliki" as const,
    label: "Maliki",
    description: "École de Malik — Afrique du Nord, Afrique de l'Ouest",
  },
  {
    value: "hanbali" as const,
    label: "Hanbali",
    description: "École d'Ahmad ibn Hanbal — Arabie Saoudite, Qatar",
  },
  {
    value: "general" as const,
    label: "Général (le plus prudent)",
    description: "Suit l'avis majoritaire des savants. Recommandé si vous ne suivez pas une école spécifique.",
  },
];

export default function MadhabScreen() {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const haptics = useHaptics();
  const utils = trpc.useUtils();

  const { data: profile } = trpc.profile.getProfile.useQuery();
  const updateProfile = trpc.profile.updateProfile.useMutation({
    onSuccess: () => {
      utils.profile.getProfile.invalidate();
      haptics.success();
    },
  });

  const [selected, setSelected] = useState(profile?.madhab ?? "general");

  const handleSelect = async (value: typeof selected) => {
    setSelected(value);
    haptics.light();
    await updateProfile.mutateAsync({ madhab: value });
  };

  return (
    <>
      <Stack.Screen options={{ title: "École juridique" }} />
      <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
        <Text style={[styles.info, { color: colors.textSecondary }]}>
          Votre école juridique (madhab) influence l'analyse de certains additifs
          comme la gélatine (E441) et la présure. Les savants ont des avis différents
          selon les écoles.
        </Text>

        {MADHAB_OPTIONS.map((option) => (
          <Pressable
            key={option.value}
            style={[
              styles.option,
              {
                backgroundColor: colors.card,
                borderColor: selected === option.value ? colors.primary : colors.border,
                borderWidth: selected === option.value ? 2 : 1,
              },
            ]}
            onPress={() => handleSelect(option.value)}
            accessibilityRole="radio"
            accessibilityState={{ checked: selected === option.value }}
            accessibilityLabel={option.label}
          >
            <View style={styles.optionHeader}>
              <Ionicons
                name={selected === option.value ? "radio-button-on" : "radio-button-off"}
                size={22}
                color={selected === option.value ? colors.primary : colors.textSecondary}
              />
              <Text style={[styles.optionLabel, { color: colors.text }]}>
                {option.label}
              </Text>
            </View>
            <Text style={[styles.optionDesc, { color: colors.textSecondary }]}>
              {option.description}
            </Text>
          </Pressable>
        ))}
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  info: { fontSize: 14, lineHeight: 20, marginBottom: 20 },
  option: { borderRadius: 12, padding: 16, marginBottom: 12 },
  optionHeader: { flexDirection: "row", alignItems: "center", gap: 12 },
  optionLabel: { fontSize: 16, fontWeight: "600" },
  optionDesc: { fontSize: 13, lineHeight: 18, marginTop: 8, marginLeft: 34 },
});
```

**Step 2: Add link in profile screen**

In `optimus-halal/app/(tabs)/profile.tsx`, add a menu item in the preferences section:

```tsx
// After "Dietary Exclusions" menu item
<MenuItem
  icon="school-outline"
  label={t("profile.madhab")}
  onPress={() => router.push("/settings/madhab")}
/>
```

**Step 3: Add i18n key**

Add `"profile.madhab": "École juridique"` to `src/i18n/locales/fr.json` (and en/ar equivalents).

**Step 4: Commit**

```bash
git add optimus-halal/app/settings/madhab.tsx optimus-halal/app/(tabs)/profile.tsx
git commit -m "feat(mobile): add madhab selector screen in settings"
```

---

## Task 11: Mobile — Health Profile Screen

**Files:**
- Create: `optimus-halal/app/settings/health-profile.tsx`
- Modify: `optimus-halal/app/(tabs)/profile.tsx` (add menu link)

**Step 1: Create health profile screen**

Create `optimus-halal/app/settings/health-profile.tsx`:

```tsx
import React from "react";
import { View, Text, Switch, StyleSheet, ScrollView } from "react-native";
import { Stack, router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "@/hooks/useTheme";
import { trpc } from "@/lib/trpc";
import { useHaptics } from "@/hooks/useHaptics";

export default function HealthProfileScreen() {
  const { colors } = useTheme();
  const haptics = useHaptics();
  const utils = trpc.useUtils();

  const { data: profile } = trpc.profile.getProfile.useQuery();
  const updateProfile = trpc.profile.updateProfile.useMutation({
    onSuccess: () => {
      utils.profile.getProfile.invalidate();
      haptics.success();
    },
  });

  const handleToggle = async (field: "isPregnant" | "hasChildren", value: boolean) => {
    haptics.light();
    await updateProfile.mutateAsync({ [field]: value });
  };

  return (
    <>
      <Stack.Screen options={{ title: "Profil santé" }} />
      <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
        <Text style={[styles.info, { color: colors.textSecondary }]}>
          Ces informations personnalisent les alertes santé lors du scan.
          Aucune donnée n'est partagée avec des tiers.
        </Text>

        <View style={[styles.section, { backgroundColor: colors.card }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Situation personnelle
          </Text>

          <View style={styles.toggleRow}>
            <View style={styles.toggleInfo}>
              <Ionicons name="woman-outline" size={22} color={colors.primary} />
              <View>
                <Text style={[styles.toggleLabel, { color: colors.text }]}>
                  Je suis enceinte
                </Text>
                <Text style={[styles.toggleDesc, { color: colors.textSecondary }]}>
                  Alertes sur les additifs déconseillés pendant la grossesse
                </Text>
              </View>
            </View>
            <Switch
              value={profile?.isPregnant ?? false}
              onValueChange={(v) => handleToggle("isPregnant", v)}
              trackColor={{ true: colors.primary }}
              accessibilityLabel="Je suis enceinte"
            />
          </View>

          <View style={[styles.divider, { backgroundColor: colors.border }]} />

          <View style={styles.toggleRow}>
            <View style={styles.toggleInfo}>
              <Ionicons name="people-outline" size={22} color={colors.primary} />
              <View>
                <Text style={[styles.toggleLabel, { color: colors.text }]}>
                  J'ai des enfants en bas âge
                </Text>
                <Text style={[styles.toggleDesc, { color: colors.textSecondary }]}>
                  Alertes sur les colorants liés à l'hyperactivité (Southampton Six)
                </Text>
              </View>
            </View>
            <Switch
              value={profile?.hasChildren ?? false}
              onValueChange={(v) => handleToggle("hasChildren", v)}
              trackColor={{ true: colors.primary }}
              accessibilityLabel="J'ai des enfants en bas âge"
            />
          </View>
        </View>

        <View style={[styles.section, { backgroundColor: colors.card }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Mes allergènes
          </Text>
          <Text style={[styles.linkText, { color: colors.primary }]}
            onPress={() => router.push("/settings/exclusions")}
          >
            Gérer mes exclusions alimentaires →
          </Text>
        </View>
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  info: { fontSize: 14, lineHeight: 20, marginBottom: 20 },
  section: { borderRadius: 12, padding: 16, marginBottom: 16 },
  sectionTitle: { fontSize: 16, fontWeight: "600", marginBottom: 16 },
  toggleRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  toggleInfo: { flexDirection: "row", alignItems: "center", gap: 12, flex: 1, marginRight: 12 },
  toggleLabel: { fontSize: 15, fontWeight: "500" },
  toggleDesc: { fontSize: 12, lineHeight: 16, marginTop: 2 },
  divider: { height: 1, marginVertical: 16 },
  linkText: { fontSize: 15, fontWeight: "500" },
});
```

**Step 2: Add link in profile screen**

In `optimus-halal/app/(tabs)/profile.tsx`, add:

```tsx
// After madhab menu item
<MenuItem
  icon="heart-outline"
  label={t("profile.healthProfile")}
  onPress={() => router.push("/settings/health-profile")}
/>
```

**Step 3: Add i18n key**

Add `"profile.healthProfile": "Profil santé"` to translation files.

**Step 4: Commit**

```bash
git add optimus-halal/app/settings/health-profile.tsx optimus-halal/app/(tabs)/profile.tsx
git commit -m "feat(mobile): add health profile screen (pregnant/children toggles + allergen link)"
```

---

## Task 12: Mobile — Enhanced Scan Result with Additives Detail

**Files:**
- Modify: `optimus-halal/app/scan-result.tsx` (add personal alerts + additive badges)
- Create: `optimus-halal/src/components/scan/AdditiveDetailSheet.tsx`
- Create: `optimus-halal/src/components/scan/PersonalAlerts.tsx`
- Create: `optimus-halal/src/components/scan/NutriScoreBadge.tsx`

This task integrates all the new data into the scan result screen. The exact implementation depends on the current scan result screen structure, which should be read first.

**Step 1: Create PersonalAlerts component**

```tsx
// optimus-halal/src/components/scan/PersonalAlerts.tsx
import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "@/hooks/useTheme";

interface PersonalAlert {
  type: "allergen" | "health" | "boycott";
  severity: "high" | "medium" | "low";
  title: string;
  description: string;
}

export function PersonalAlerts({ alerts }: { alerts: PersonalAlert[] }) {
  const { colors } = useTheme();
  if (alerts.length === 0) return null;

  return (
    <View style={styles.container}>
      <Text style={[styles.sectionTitle, { color: colors.text }]}>
        ⚠️ Alertes personnalisées
      </Text>
      {alerts.map((alert, i) => (
        <View
          key={i}
          style={[
            styles.alert,
            {
              backgroundColor: alert.severity === "high"
                ? colors.error + "15"
                : colors.warning + "15",
              borderLeftColor: alert.severity === "high"
                ? colors.error
                : colors.warning,
            },
          ]}
          accessibilityRole="alert"
        >
          <Ionicons
            name={alert.type === "allergen" ? "warning" : "fitness"}
            size={18}
            color={alert.severity === "high" ? colors.error : colors.warning}
          />
          <View style={styles.alertContent}>
            <Text style={[styles.alertTitle, { color: colors.text }]}>
              {alert.title}
            </Text>
            <Text style={[styles.alertDesc, { color: colors.textSecondary }]}>
              {alert.description}
            </Text>
          </View>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginTop: 16 },
  sectionTitle: { fontSize: 16, fontWeight: "600", marginBottom: 8 },
  alert: { flexDirection: "row", alignItems: "flex-start", gap: 10, padding: 12, borderRadius: 8, borderLeftWidth: 3, marginBottom: 8 },
  alertContent: { flex: 1 },
  alertTitle: { fontSize: 14, fontWeight: "600" },
  alertDesc: { fontSize: 12, color: "#666", marginTop: 2 },
});
```

**Step 2: Create NutriScoreBadge component**

```tsx
// optimus-halal/src/components/scan/NutriScoreBadge.tsx
import React from "react";
import { View, Text, StyleSheet } from "react-native";

const NUTRI_COLORS: Record<string, string> = {
  a: "#038141",
  b: "#85BB2F",
  c: "#FECB02",
  d: "#EE8100",
  e: "#E63E11",
};

export function NutriScoreBadge({ grade }: { grade: string | null | undefined }) {
  if (!grade) return null;
  const g = grade.toLowerCase();
  const color = NUTRI_COLORS[g] ?? "#999";

  return (
    <View style={[styles.badge, { backgroundColor: color }]}>
      <Text style={styles.label}>Nutri</Text>
      <Text style={styles.grade}>{g.toUpperCase()}</Text>
    </View>
  );
}

export function NovaGroupBadge({ group }: { group: number | null | undefined }) {
  if (!group) return null;
  const colors = { 1: "#038141", 2: "#85BB2F", 3: "#EE8100", 4: "#E63E11" };
  const labels = {
    1: "Naturel",
    2: "Transformé",
    3: "Industriel",
    4: "Ultra-transformé",
  };

  return (
    <View style={[styles.badge, { backgroundColor: colors[group as keyof typeof colors] ?? "#999" }]}>
      <Text style={styles.label}>NOVA</Text>
      <Text style={styles.grade}>{group}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8 },
  label: { color: "#fff", fontSize: 10, fontWeight: "600", opacity: 0.9 },
  grade: { color: "#fff", fontSize: 16, fontWeight: "800" },
});
```

**Step 3: Integrate into scan result screen**

Read current `optimus-halal/app/scan-result.tsx` first, then integrate:
- `<PersonalAlerts alerts={scanResult.personalAlerts} />` after the halal verdict
- `<NutriScoreBadge grade={offExtras.nutriscoreGrade} />` in scores section
- Per-additive toxicity dots next to existing additive badges
- Madhab note in verdict: "Selon votre école (Hanafi)"

**Step 4: Commit**

```bash
git add optimus-halal/src/components/scan/ optimus-halal/app/scan-result.tsx
git commit -m "feat(mobile): enhanced scan result with personal alerts, toxicity badges, Nutri-Score"
```

---

## Task 13: Backend Tests

**Files:**
- Create: `backend/src/__tests__/services/barcode.service.test.ts` (update existing)
- Create: `backend/src/__tests__/services/allergen.service.test.ts`

**Step 1: Test allergen matching**

```typescript
import { describe, it, expect } from "vitest";
import { matchAllergens } from "../../services/allergen.service.js";

describe("matchAllergens", () => {
  it("should match direct allergens", () => {
    const matches = matchAllergens(
      ["lactose", "arachides"],
      ["en:milk", "en:nuts"],
      []
    );
    expect(matches).toHaveLength(1); // lactose → en:milk matches
    expect(matches[0].matchType).toBe("allergen");
    expect(matches[0].severity).toBe("high");
  });

  it("should match traces", () => {
    const matches = matchAllergens(
      ["gluten"],
      [],
      ["en:gluten"]
    );
    expect(matches).toHaveLength(1);
    expect(matches[0].matchType).toBe("trace");
    expect(matches[0].severity).toBe("medium");
  });

  it("should return empty for no matches", () => {
    const matches = matchAllergens(
      ["sésame"],
      ["en:milk"],
      []
    );
    expect(matches).toHaveLength(0);
  });
});
```

**Step 2: Run tests**

Run: `cd backend && pnpm test`
Expected: All tests pass

**Step 3: Commit**

```bash
git add backend/src/__tests__/
git commit -m "test: add allergen matching + analysis engine tests"
```

---

## Task 14: Update Dev Seed for New Fields

**Files:**
- Modify: `backend/src/db/seeds/dev-seed.ts`

**Step 1: Update dev user with madhab + health fields**

Add to the dev user insert:
```typescript
madhab: "hanafi",
isPregnant: false,
hasChildren: true,
```

**Step 2: Run dev seed**

Run: `cd backend && pnpm db:seed:dev`
Expected: Dev user updated with new fields

**Step 3: Run additives seed**

Run: `cd backend && pnpm db:seed:additives`
Expected: All additives + madhab rulings seeded

**Step 4: Full verification**

Run: `cd backend && npx tsc --noEmit && pnpm test`
Expected: 0 TS errors, all tests pass

**Step 5: Final commit**

```bash
git add backend/src/db/seeds/dev-seed.ts
git commit -m "feat(seed): update dev user with madhab + health profile fields"
```

---

## Verification Checklist

After all tasks complete:

- [ ] `cd backend && npx tsc --noEmit` → 0 errors
- [ ] `cd backend && pnpm test` → all pass
- [ ] `cd backend && pnpm db:seed:additives` → 300+ additives + madhab rulings seeded
- [ ] `cd backend && pnpm db:seed:dev` → dev user has madhab + health fields
- [ ] `cd optimus-halal && npx tsc --noEmit` → 0 errors
- [ ] Mobile: Settings → "École juridique" → 5 options, saves to backend
- [ ] Mobile: Settings → "Profil santé" → toggles work, saves to backend
- [ ] Mobile: Scan → verdict shows "(selon votre école Hanafi)"
- [ ] Mobile: Scan → personal alerts appear if allergen/health match
- [ ] `trpc.additive.getByCode("E471")` → returns additive + madhab rulings
- [ ] `trpc.additive.search("gélatine")` → returns E441
