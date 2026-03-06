# Naqiy Trust Index V5.1 — Technical Methodology

> Authoritative technical reference for the Naqiy Trust Index algorithm.
> Audience: developers, certifiers, auditors.
> Last updated: 2026-03-06. Source of truth: `backend/src/db/schema/certifiers.ts`.

---

## 1. Overview

The Naqiy Trust Index measures **certifier rigor**, not product halal status. A score of 85 means "this certifier applies rigorous practices across the indicators we track" — it does not mean "85% of their products are halal."

Key properties:

- **11 practice indicators** + a dynamic controversy penalty
- **Sigmoid-normalized** to 0--100, with post-sigmoid caps/guardrails
- **5 scores computed** per certifier: 1 editorial (Naqiy's position) + 4 per-madhab (Hanafi, Shafi'i, Maliki, Hanbali)
- **Runtime computation** from raw boolean flags and `certifier_events` table, cached in Redis (TTL 1h)
- **Deterministic**: same inputs always produce the same output (modulo time-decay on controversy events)

---

## 2. Indicators

### 2.1 Indicator catalog

The trust score is built from 11 boolean practice indicators organized into three categories, plus a controversy penalty.

#### Positive indicators (operational assurance)

| # | Indicator | DB column | Meaning |
|---|-----------|-----------|---------|
| P1 | `controllersAreEmployees` | `controllers_are_employees` | Controllers are salaried by the certifier (independent from slaughterhouse) |
| P2 | `controllersPresentEachProduction` | `controllers_present_each_production` | A controller is present at every production run |
| P3 | `hasSalariedSlaughterers` | `has_salaried_slaughterers` | Slaughterers are employed by the certifier, not the slaughterhouse |

#### Negative indicators (ritual validity + product quality)

| # | Indicator | DB column | Meaning | Domain |
|---|-----------|-----------|---------|--------|
| N1 | `acceptsMechanicalSlaughter` | `accepts_mechanical_slaughter` | Accepts mechanical poultry slaughter | Ritual validity |
| N2 | `acceptsStunning` | `accepts_stunning` | Accepts pre-slaughter stunning for cattle/calves/lambs | Ritual validity |
| N3 | `acceptsElectronarcosis` | `accepts_electronarcosis` | Accepts poultry electronarcosis (water-bath or head-only) | Ritual validity |
| N4 | `acceptsPostSlaughterElectrocution` | `accepts_post_slaughter_electrocution` | Accepts post-slaughter electrical shock | Ritual validity |
| N5 | `acceptsVsm` | `accepts_vsm` | Accepts VSM (viande separee mecaniquement) | Product quality (tayyib) |

#### Transparency bonus indicators

| # | Indicator | DB column | Meaning |
|---|-----------|-----------|---------|
| T1 | `transparencyPublicCharter` | `transparency_public_charter` | Publishes a public charter / cahier des charges |
| T2 | `transparencyAuditReports` | `transparency_audit_reports` | Publishes audit or control reports |
| T3 | `transparencyCompanyList` | `transparency_company_list` | Publishes the list of certified companies |

### 2.2 Weight table (V5.1)

| Indicator | Editorial | Hanafi | Shafi'i | Maliki | Hanbali | Basis |
|-----------|:---------:|:------:|:-------:|:------:|:-------:|:-----:|
| controllersAreEmployees | +15 | +15 | +15 | +15 | +15 | A |
| controllersPresentEachProduction | +15 | +15 | +15 | +15 | +15 | A |
| hasSalariedSlaughterers | +10 | **+15** | +10 | **+5** | **+12** | A |
| acceptsMechanicalSlaughter | -20 | **-25** | -18 | **-14** | **-22** | A+B |
| acceptsStunning | -18 | **-20** | **-14** | **-10** | **-18** | B+C |
| acceptsElectronarcosis | -12 | **-14** | **-10** | **-6** | **-13** | B+C |
| acceptsPostSlaughterElectrocution | -2 | **-3** | -2 | **-1** | **-3** | A+C |
| acceptsVsm | -8 | **-8** | **-7** | **-5** | **-8** | B |
| transparencyBonus (x3 max) | +5 | +5 | +5 | +5 | +5 | -- |

Bold values deviate from the editorial weight.

**Basis key**: A = classical textual (explicit in mutun/shuruh), B = contemporary derived (modern fatwa applying classical usul), C = empirical/operational (veterinary/scientific data).

### 2.3 Derived bounds

| Metric | Editorial | Hanafi | Shafi'i | Maliki | Hanbali |
|--------|:---------:|:------:|:-------:|:------:|:-------:|
| MAX_RAW | +55 | +60 | +55 | +50 | +57 |
| MIN_RAW | -69 | -79 | -60 | -45 | -71 |

Where:
- `MAX_RAW = P1 + P2 + P3 + 3 * transparencyBonus`
- `MIN_RAW = 3 * NULL_POSITIVE_PENALTY + N1 + N2 + N3 + N4 + N5`

---

## 3. Null Handling

Null semantics differ by indicator category:

| Category | null meaning | Treatment | Rationale |
|----------|-------------|-----------|-----------|
| Positive (P1--P3) | Unknown or refuses to disclose | **-3 penalty** (`NULL_POSITIVE_PENALTY`) | Opacity reduces trust. A certifier who will not confirm a positive practice deserves a small penalty. |
| Negative (N1--N5) | Unknown or does not accept | **0** (no penalty) | Treated as "does not accept." Absence of evidence for a negative practice is not penalized. |
| Transparency (T1--T3) | Unknown | **0** (no bonus) | No bonus awarded without confirmation. |

The -3 null penalty is proportional to the +15 maximum positive bonus (20% of the full indicator weight).

---

## 4. Raw Score Computation

The raw score is a linear sum:

```
raw = SUM(positive bonuses)
    + SUM(negative penalties)
    + SUM(transparency bonuses)
    + controversyPenalty
```

Expanded:

```
raw = bonus(P1, w_P1) + bonus(P2, w_P2) + bonus(P3, w_P3)
    + penalty(N1, w_N1) + penalty(N2, w_N2) + penalty(N3, w_N3) + penalty(N4, w_N4) + penalty(N5, w_N5)
    + transp(T1, w_T) + transp(T2, w_T) + transp(T3, w_T)
    + controversyPenalty
```

Where:

```
bonus(indicator, weight) =
    +weight   if indicator === true
    -3        if indicator === null     (NULL_POSITIVE_PENALTY)
    0         if indicator === false

penalty(indicator, weight) =
    weight    if indicator === true     (weight is negative)
    0         otherwise                 (false or null)

transp(indicator, weight) =
    +weight   if indicator === true
    0         otherwise
```

Implementation: `computeRawScore()` in `certifiers.ts` (line 792).

---

## 5. Controversy Penalty

The controversy penalty is computed dynamically from the `certifier_events` table, not stored as a static field.

### 5.1 Time-decay formula

For each **active** event (where `isActive = true` and `scoreImpact != 0`):

```
decayed_i = scoreImpact_i * e^(-lambda * t_i)
```

Where:
- `t_i` = years elapsed since the event (`occurredAt` to reference date)
- `lambda = ln(2) / halfLife = ln(2) / 5 ~ 0.1386`
- Half-life = **5 years** (after 5 years, impact is halved; after 10, quartered)

### 5.2 Aggregation

```
controversyPenalty = clamp( round( SUM(decayed_i) ), -50, 0 )
```

### 5.3 Rules

| Rule | Detail |
|------|--------|
| Resolved events | `isActive = false` events are **excluded** entirely. They remain in the timeline for transparency but do not affect the score. |
| Future events | If `t < 0` (edge case), full `scoreImpact` is used without decay. |
| Range | Clamped to [-50, 0]. Positive event impacts do not contribute. |
| Score impact range | Individual events: -30 to +5 (stored in `score_impact` column). |

Implementation: `computeControversyPenalty()` in `certifiers.ts` (line 1114).

---

## 6. Sigmoid Normalization

### 6.1 Why sigmoid

A linear mapping from raw to 0--100 would give equal weight to every point on the scale. The sigmoid provides two desirable properties:

1. **Base effect**: The first positive indicators matter more. Going from "no oversight" to "some oversight" is a large trust jump.
2. **Diminishing returns**: The last improvements matter less. Near-perfection gains compress.

The sigmoid compresses extremes and stretches the middle, improving separation in the critical decision range.

### 6.2 Formula

Steepness constant:

```
k = 0.06
```

Sigmoid function centered at raw = 0:

```
sig(r) = 1 / (1 + e^(-r * k))
```

Renormalized to [0, 100]:

```
score = ( sig(raw) - sig(minRaw) ) / ( sig(maxRaw) - sig(minRaw) ) * 100
```

Where `maxRaw` and `minRaw` are the theoretical bounds for the weight set being used (see Section 2.3).

The renormalization guarantees:
- A certifier with all positive + all transparency = exactly **100**
- A certifier with all null positives + all negatives accepted = exactly **0**
- Controversy penalty can push raw below `minRaw`, which the sigmoid maps gracefully toward 0 (asymptotic, never negative)

Final score is rounded to the nearest integer and clamped to [0, 100].

### 6.3 Sigmoid curve properties (editorial weights)

| Raw score | Sigmoid output | Interpretation |
|-----------|:--------------:|----------------|
| +55 (max) | 100 | Perfect certifier |
| +40 | 96 | Excellent — all positives, minor negatives |
| +20 | 85 | Strong — most positives, few negatives |
| 0 | 55 | Neutral — no data or mixed |
| -20 | 27 | Poor — significant negatives |
| -40 | 11 | Very poor — most negatives accepted |
| -69 (min) | 0 | Worst case (boolean-only) |

Implementation: `normalizeScore()` in `certifiers.ts` (line 856).

---

## 7. Caps / Guardrails (V5)

Post-sigmoid safety net preventing compensatory scoring. Critical failures should not be offset by good scores elsewhere.

### 7.1 Cap rules

| Condition | Cap value | Rationale |
|-----------|:---------:|-----------|
| 3 critical negatives accepted (mechanical + stunning + electronarcosis) | **35** | Fundamental ritual validity failures cannot be compensated by operational excellence. |
| 2 critical negatives accepted | **55** | Significant ritual concerns limit maximum achievable score. |
| 0 positive indicators (none of P1, P2, P3 are `true`) | **45** | No operational assurance means limited trust regardless of what is rejected. |

### 7.2 Application order

1. Compute sigmoid score
2. Count critical negatives: `[acceptsMechanicalSlaughter, acceptsStunning, acceptsElectronarcosis].filter(v === true).length`
3. Count positive indicators: `[P1, P2, P3].filter(v === true).length`
4. Apply the **lowest applicable cap** (caps stack via `Math.min`)
5. Final score = `min(sigmoidScore, cap)`

### 7.3 Structural guarantee

With current V5.1 weights, the sigmoid already pushes certifiers with critical failures below these cap thresholds. The caps are a **structural guarantee** — they do not change any existing score today but prevent future weight changes from accidentally allowing compensation.

Implementation: `applyCaps()` in `certifiers.ts` (line 901).

---

## 8. Semantic Blocks (Detail View)

Four independent 0--100 scores provide an explanation breakdown in the certifier detail UI. These are **not inputs** to the composite score; they are computed in parallel for display.

### 8.1 Bloc A -- Ritual Validity

Percentage of negative ritual penalties **avoided**.

```
maxNegative = |w_N1| + |w_N2| + |w_N3| + |w_N4|
negativeTotal = SUM( |w_Ni| for each Ni where indicator === true )
blocA = round( (1 - negativeTotal / maxNegative) * 100 )
```

Note: N5 (VSM) is excluded from ritual validity — it belongs to product quality.

### 8.2 Bloc B -- Operational Assurance

Percentage of positive indicator weight **obtained**.

```
maxPositive = w_P1 + w_P2 + w_P3
positiveTotal = SUM( w_Pi for each Pi where indicator === true )
blocB = round( positiveTotal / maxPositive * 100 )
```

### 8.3 Bloc C -- Product Quality (Tayyib)

Binary assessment based on VSM acceptance.

```
blocC = (acceptsVsm === true) ? 0 : 100
```

### 8.4 Bloc D -- Transparency

Transparency bonus ratio, reduced by controversy impact.

```
maxTransparency = 3 * w_T
transparencyPoints = SUM( w_T for each Ti where indicator === true )
controversyImpact = max( -maxTransparency, controversyPenalty )
blocD = max( 0, round( (transparencyPoints + controversyImpact) / maxTransparency * 100 ) )
```

The `controversyImpact` is clamped so that it cannot drive the denominator below 0.

### 8.5 Relationship to composite score

The **composite score** (what the user sees on the main card) is the sigmoid + caps result from Sections 6--7. The four blocks are independent explanatory metrics displayed on the certifier detail screen.

Implementation: `computeTrustScoreDetail()` in `certifiers.ts` (line 1030).

---

## 9. Evidence Level System

Each certifier is assigned an evidence level based on data completeness.

### 9.1 Levels

| Level | Condition | Meaning |
|-------|-----------|---------|
| `verified` | Explicit marking in source data | Audit-confirmed practices. Cannot be auto-inferred. |
| `declared` | `nullCount === 0` across 6 core fields | All core practice fields are known (at minimum self-declared). |
| `inferred` | `nullCount <= 2` | Most fields known, some gaps filled by inference. |
| `unknown` | `nullCount > 2` | Too many null fields — insufficient data for reliable scoring. |

### 9.2 Core fields evaluated

The 6 core fields checked for null count:

1. `controllersAreEmployees`
2. `controllersPresentEachProduction`
3. `hasSalariedSlaughterers`
4. `acceptsMechanicalPoultrySlaughter`
5. `acceptsPoultryElectronarcosis`
6. `acceptsStunningForCattleCalvesLambs`

Transparency indicators and VSM are excluded from the evidence level calculation — they are supplementary data points.

Implementation: `inferEvidenceLevel()` in `certifiers.ts` (line 992).

---

## 10. Scoring Tiers

Display tiers for the UI and API responses:

| Tier | Range | Color | Interpretation |
|------|:-----:|:-----:|----------------|
| Strong | >= 90 | Green | Certifier applies rigorous practices across all indicators. |
| Moderate | 55 -- 89 | Yellow | Mixed practices — some strengths, some concerns. |
| Caution | 20 -- 54 | Orange | Significant concerns — multiple negative indicators or low transparency. |
| Weak | < 20 | Red | Fundamental deficiencies — most critical practices accepted or unknown. |

---

## 11. Per-Madhab Weight System

The per-madhab scores use school-specific weight tables that reflect each school's jurisprudential priorities. The editorial score is Naqiy's independent assessment.

Full weight justifications, fiqh sources, and epistemological classifications are in [trust-score-madhab-weights.md](trust-score-madhab-weights.md).

### 11.1 Hierarchy rules

**Within every madhab** (intra-school severity ordering):

```
|w(mechanical)| > |w(stunning)| > |w(electronarcosis)|
```

This ordering is invariant across all five weight sets (editorial + 4 madhabs). It reflects epistemological certainty:
- Mechanical slaughter: **certain** (qat'i) tasmiya + agency violation (Basis A+B)
- Stunning: **probable** (zanni) hayah mustaqqirrah violation (Basis B+C)
- Electronarcosis: **possible** risk, ritual preserved (Basis B+C)

**Cross-school strictness ordering** (inter-school for each indicator):

```
|w_Hanafi| > |w_Hanbali| > |w_Shafi'i| > |w_Maliki|
```

Verification:

| Indicator | Hanafi | Hanbali | Shafi'i | Maliki | Valid |
|-----------|:------:|:-------:|:-------:|:------:|:-----:|
| mechanical | -25 | -22 | -18 | -14 | OK |
| stunning | -20 | -18 | -14 | -10 | OK |
| electronarcosis | -14 | -13 | -10 | -6 | OK |

### 11.2 Intra-school gap verification

| School | Mechanical | Stunning | Electronarcosis | Gaps (mech-stun, stun-elec) | Valid |
|--------|:----------:|:--------:|:---------------:|:---------------------------:|:-----:|
| Hanafi | -25 | -20 | -14 | 5, 6 | OK |
| Shafi'i | -18 | -14 | -10 | 4, 4 | OK |
| Maliki | -14 | -10 | -6 | 4, 4 | OK |
| Hanbali | -22 | -18 | -13 | 4, 5 | OK |

The gap between mechanical and stunning is wider than between stunning and electronarcosis (in Hanafi and Hanbali). This reflects the epistemological difference: mechanical involves a classical textual (A) violation, while stunning and electronarcosis are derived (B) + empirical (C).

---

## 12. Editorial Bias Documentation

The Naqiy editorial weights are **not** the arithmetic mean of the four madhab weights. They incorporate a deliberate precautionary adjustment on derived indicators.

### 12.1 Editorial vs madhab average

| Indicator | Madhab avg | Editorial | Diff | Justification |
|-----------|:----------:|:---------:|:----:|---------------|
| acceptsMechanicalSlaughter | -19.75 | -20 | -0.25 | Near average. Classical basis (A) — minimal editorial adjustment. |
| acceptsStunning | -15.50 | -18 | **-2.50** | Precautionary. Derived basis (B+C) — editorial prudence. |
| acceptsElectronarcosis | -10.75 | -12 | **-1.25** | Precautionary. Derived basis (B+C) — editorial prudence. |

### 12.2 Rationale

For indicators with **derived (B) + empirical (C) basis**, where classical texts do not address the technology directly, Naqiy applies a precautionary editorial adjustment above the madhab average. This means:

- The editorial score is **stricter than the madhab average** on stunning and electronarcosis
- The editorial score is **near-average** on mechanical slaughter (which has strong classical textual basis)
- The bias is proportional: stunning (+2.5 above avg) > electronarcosis (+1.25 above avg), matching the severity hierarchy

This bias is a documented, transparent, and challengeable Naqiy editorial choice.

---

## 13. Implementation Reference

### 13.1 Source files

| File | Role |
|------|------|
| `backend/src/db/schema/certifiers.ts` | Weight tables, raw score, sigmoid, caps, semantic blocks, evidence level, controversy penalty |
| `backend/src/services/certifier-score.service.ts` | Runtime engine: DB read, event loading, caching, batch computation |
| `backend/src/trpc/routers/certifier.ts` | API endpoints returning scores |
| `backend/src/trpc/routers/scan.ts` | Scan result includes all 5 trust scores |
| `backend/src/db/seeds/materialize-scores.ts` | Materialization pipeline for pre-computed scores in DB |

### 13.2 Key constants

| Constant | Value | Location |
|----------|-------|----------|
| `NULL_POSITIVE_PENALTY` | -3 | `certifiers.ts:786` |
| `SIGMOID_K` | 0.06 | `certifiers.ts:834` |
| `CONTROVERSY_HALF_LIFE_YEARS` | 5 | `certifiers.ts:1093` |
| `CONTROVERSY_LAMBDA` | ln(2)/5 ~ 0.1386 | `certifiers.ts:1094` |
| Controversy clamp range | [-50, 0] | `certifiers.ts:1140` |
| Redis cache TTL | 3600s (1h) | `certifier-score.service.ts:84` |
| Cache key prefix | `certifier:scores:v5:` | `certifier-score.service.ts:82` |

### 13.3 Type exports

```typescript
type MadhabKey = "hanafi" | "shafii" | "maliki" | "hanbali";
type EvidenceLevel = "verified" | "declared" | "inferred" | "unknown";

interface TrustScoreDetail {
  score: number;
  blocks: {
    ritualValidity: number;
    operationalAssurance: number;
    productQuality: number;
    transparency: number;
  };
  cap?: number;
  evidenceLevel: EvidenceLevel;
}
```

---

## 14. Related Documents

| Document | Path | Content |
|----------|------|---------|
| Whitepaper | [trust-score-whitepaper.md](trust-score-whitepaper.md) | Public-facing explanation of the trust index philosophy |
| Madhab weights | [trust-score-madhab-weights.md](trust-score-madhab-weights.md) | Full per-madhab weight table with fiqh sourcing and A/B/C classification |
| Changelog | [trust-score-changelog.md](trust-score-changelog.md) | Version history of scoring algorithm changes |
| Complete reference | [trust-score-complete.md](trust-score-complete.md) | Consolidated technical reference |
| Formula reference | [trust-score-formula.md](trust-score-formula.md) | Compact formula sheet |
| Certifier dossiers | `backend/src/db/seeds/certifiers.ts` | Raw certifier data with practice flags |
