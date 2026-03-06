# Trust Score — Per-Madhab Weight System (V5.1)

> Reference document for the per-madhab trust score weights used in the Naqiy Trust Index.
> Every weight is sourced and classified by epistemological basis (classical / derived / empirical).
> Last updated: V5.1 (2026-03-06) — Post-challenge revision with A/B/C classification.

---

## 1. Methodological Framework

### 1.1 Epistemological basis — the A/B/C classification

The per-madhab weights in Naqiy repose on **two distinct sources**:

1. **Classical positions explicitly attested** in the mutun and shuruh of each school on tasmiyah, validity of dhabh, and the requirement that the animal be alive at the moment of the cut;
2. **Contemporary derivations** applying these classical principles to modern industrial technologies (mechanical slaughter, electrical stunning, water-bath electronarcosis), informed by contemporary halal standards and veterinary literature on reversibility, viability at cut, and non-conformity identification.

Every weight is tagged with its epistemological basis:

| Level | Label | Definition | Example |
|:---:|---|---|---|
| **A** | Classical textual | Explicit position in mutun/shuruh of the school | Tasmiyah is wajib in Hanafi fiqh (al-Kasani, Bada'i) |
| **B** | Contemporary derived | Application of usul/qawa'id to modern technology | Mufti Taqi Usmani applying hayah mustaqqirrah to bolt stunning |
| **C** | Empirical/operational | Veterinary/scientific evidence influencing application | EFSA: 4-8% mortality from cattle bolt stunning |

**This matters because**: A weight tagged A has strong textual authority within the school. A weight tagged B+C is a methodological choice by Naqiy based on derived reasoning — defensible but challengeable. The distinction protects Naqiy's intellectual credibility.

### 1.2 What we do NOT claim

- We do NOT claim "the Hanafi school says -25 for mechanical slaughter." We say: "Based on the classical Hanafi requirement of per-animal tasmiya (A) and the practical impossibility of this in continuous industrial mechanical slaughter (B), the Naqiy weight is -25."
- We do NOT use IIFA Resolution 225 (9/23) as terminal proof — this resolution refers the matter back for study and amendment. We DO use IIFA Resolution 201 (7/21) which reaffirms the need for procedural standards and field verification.
- We do NOT claim ijma' (consensus) that all mechanical slaughter is haram. We say: "Continuous industrial mechanical slaughter is practically incompatible with the classical requirements of individual tasmiya and human agency."

---

## 2. Weight Table (V5.1)

| Indicator | Editorial | Hanafi | Shafi'i | Maliki | Hanbali | Basis |
|---|:---:|:---:|:---:|:---:|:---:|:---:|
| controllersAreEmployees | +15 | +15 | +15 | +15 | +15 | A |
| controllersPresentEachProduction | +15 | +15 | +15 | +15 | +15 | A |
| hasSalariedSlaughterers | +10 | **+15** | +10 | **+5** | **+12** | A |
| acceptsMechanicalSlaughter | -20 | **-25** | -18 | **-14** | **-22** | A+B |
| acceptsStunning | -18 | **-20** | **-14** | **-10** | **-18** | B+C |
| acceptsElectronarcosis | -12 | **-14** | **-10** | **-6** | **-13** | B+C |
| acceptsPostSlaughterElec | -2 | **-3** | -2 | **-1** | **-3** | A+C |
| acceptsVsm | -8 | **-8** | **-7** | **-5** | **-8** | B |
| transparencyBonus (x3 max) | +5 | +5 | +5 | +5 | +5 | -- |
| **MAX_RAW** | **+55** | **+60** | **+55** | **+50** | **+57** | |
| **MIN_RAW** | **-69** | **-79** | **-60** | **-45** | **-71** | |

Bold values deviate from the editorial weight.
Basis: A = classical textual, B = contemporary derived, C = empirical/operational.

---

## 3. V5 Hierarchy Rule

**Within EVERY madhab:**
```text
mechanical > stunning > electronarcosis
```

| Rank | Indicator | Nature of violation | Certainty | Basis |
|:---:|---|---|---|:---:|
| 1 | `acceptsMechanicalSlaughter` | Tasmiya + agency violation | **Qat'i** (certain) | A+B |
| 2 | `acceptsStunning` | Hayah mustaqqirrah risk | **Zanni** (probable) | B+C |
| 3 | `acceptsElectronarcosis` | Consciousness doubt | **Possible** (low risk) | B+C |

**Note on the hierarchy gaps**: The gap between mechanical and stunning is WIDER than between stunning and electronarcosis. This reflects the epistemological difference: mechanical slaughter involves a classical textual (A) violation (tasmiya), while stunning and electronarcosis are derived (B) + empirical (C) assessments. The wider gap between A-basis and B+C-basis indicators is deliberate.

---

## 4. Hierarchy & Cross-School Verification

### Within each school

| School | Mechanical | Stunning | Electronarcosis | Gaps | Valid? |
|---|:---:|:---:|:---:|---|:---:|
| Hanafi | -25 | -20 | -14 | 5, 6 | OK |
| Shafi'i | -18 | -14 | -10 | 4, 4 | OK |
| Maliki | -14 | -10 | -6 | 4, 4 | OK |
| Hanbali | -22 | -18 | -13 | 4, 5 | OK |

### Cross-school (Hanafi > Hanbali > Shafi'i > Maliki)

| Indicator | Hanafi | Hanbali | Shafi'i | Maliki | Valid? |
|---|:---:|:---:|:---:|:---:|:---:|
| Mechanical | -25 | -22 | -18 | -14 | OK |
| Stunning | -20 | -18 | -14 | -10 | OK |
| Electronarcosis | -14 | -13 | -10 | -6 | OK |

### Editorial vs madhab average

| Indicator | Madhab avg | Editorial | Diff | Justification |
|---|:---:|:---:|:---:|---|
| Mechanical | -19.75 | -20 | -0.25 | Near average. Classical basis (A). |
| Stunning | -15.50 | -18 | -2.50 | Prudence on derived (B+C) indicator. |
| Electronarcosis | -10.75 | -12 | -1.25 | Prudence on derived (B+C) indicator. |

**Note on editorial bias**: The editorial weights for stunning and electronarcosis are ABOVE the madhab average. This is a deliberate Naqiy editorial choice: for indicators with derived (B) + empirical (C) basis, where classical texts don't address the technology directly, Naqiy applies a **precautionary editorial adjustment**. This bias is documented, transparent, and challengeable.

---

## 5. Fiqh Justifications — Critical Indicators

### 5.1 Mechanical Slaughter — Basis: A+B

**Core fiqh question:** Can a machine perform valid dhabh?

**This indicator has the strongest classical (A) basis** of the three critical indicators. Two independent grounds:

- **(a) Tasmiya**: All four schools require tasmiya (wajib or sunnah mu'akkadah). A machine cannot pronounce "bismillah Allahu akbar." The question is whether individual per-animal tasmiya is required.
- **(b) Agency**: The slaughterer must be a human (Muslim or Kitabi). A machine is neither rational ('aqil) nor discerning (mumayyiz).

**The contemporary (B) element**: Classical scholars obviously didn't address industrial rotary mechanical blade lines. The B-derived question is: does the continuous industrial format (one tasmiya for thousands of birds, multi-hour runs, miss rates) satisfy the classical conditions? The answer, per AMJA analysis, is: generally no, though some Hanafi scholars theoretically envision simultaneous slaughter exceptions (which industrial practice doesn't meet).

#### Hanafi (-25) — Basis: A

| Source | Reference | Key text |
|---|---|---|
| Al-Kasani | *Bada'i al-Sana'i*, 5/41-42 | "wa yusamma 'inda dhabhi kulli wahid" — tasmiya at each one |
| Al-Haskafi | *Al-Durr al-Mukhtar*, Kitab al-Dhaba'ih | "al-tasmiyah shart li-sihhati al-dhakah" |
| Ibn Abidin | *Radd al-Muhtar*, 6/296 | Deliberate omission = haram |
| IIFA | Resolution 201 (7/21) | Reaffirms need for procedural standards and field verification |
| Mufti Taqi Usmani | *The Islamic Laws of Animal Slaughter* | "The act of slaughter must be performed by a human being" |

Strongest penalty. Classical textual basis on both tasmiya and agency.

#### Shafi'i (-18) — Basis: A (agency) + B (tasmiya nuance)

| Source | Reference | Key text |
|---|---|---|
| Al-Nawawi | *Al-Majmu'*, 9/75-76 | Tasmiya is sunnah mu'akkadah, not wajib. Omission is makruh. |
| Al-Shirazi | *Al-Muhadhdhab* | "al-dhabih yushrat an yakuna insanan" — slaughterer must be human |
| Ibn Hajar al-Haytami | *Tuhfat al-Muhtaj*, 9/340-342 | Dhabh requires "qasd" from a rational agent |

Severe on agency (A), moderate on tasmiya (since sunnah not wajib).

#### Maliki (-14) — Basis: A (tasmiya) + B (industrial impracticality)

| Source | Reference | Key text |
|---|---|---|
| Khalil ibn Ishaq | *Mukhtasar*, Kitab al-Dhaba'ih | Conditions: niyyah, tasmiyah, inharu al-dam |
| Al-Dardir | *Al-Sharh al-Kabir*, 2/108-109 | "al-ala ma taqta'u" — the ala (instrument) concept |
| Al-Kharashi | *Sharh Mukhtasar Khalil* | "al-shart anna al-dhabih yakun insanan" |

The Maliki "ala" concept creates genuine scholarly debate (A), but industrial speed makes per-animal tasmiya impractical (B). Moderate-high penalty.

#### Hanbali (-22) — Basis: A

| Source | Reference | Key text |
|---|---|---|
| Ibn Qudama | *Al-Mughni*, 13/285-290 | "al-tasmiyah shart fi sihhati al-dhakah" |
| Al-Buhuti | *Kashshaf al-Qina'*, 6/205-210 | Tasmiya as shart; human slaughterer required |
| Ibn Taymiyyah | *Majmu' al-Fatawa*, 35/239 | "al-dhabh 'ibadah yushtar fiha al-niyyah" |

Very severe. Classical textual basis similar to Hanafi. Slightly below Hanafi because Hanbali strictness is principled precaution (sadd al-dhara'i) rather than categorical wujub.

---

### 5.2 Stunning (cattle/calves/lambs) — Basis: B+C

**Core fiqh question:** Does pre-slaughter stunning invalidate the dhabh?

**Classical texts (A) do not address modern stunning directly.** The classical texts establish the principle of hayah mustaqqirrah (stable life at the moment of cut). All modern stunning jurisprudence is derived (B) from this classical principle, informed by empirical (C) veterinary data.

**The real pivot (per the 2023 scientific review):** Is the animal alive or deemed alive at the moment of the cut? Did the stunning cause death? Did it cause permanent incompatible injury? Is the bleed-out complete? Are dead-before-cut carcasses identified and removed?

#### Hanafi (-20) — Basis: B+C

| Source | Reference | Key text |
|---|---|---|
| Ibn Abidin | *Radd al-Muhtar*, 6/296 | "idha shakka fi hayatiha lam tahillu" — Classical (A) principle |
| Mufti Taqi Usmani | *The Islamic Laws of Animal Slaughter* | Categorical prohibition — Contemporary (B) fatwa |
| Darul Uloom Deoband | Fatwa #13254 (2009) | Stunning prohibited — Contemporary (B) ruling |
| EFSA | Scientific Report (2004) | 4-8% mortality from bolt stunning — Empirical (C) |

**Why -20, not -25**: Unlike mechanical slaughter where the tasmiya violation is certain (qat'i, basis A), stunning involves probabilistic (zanni) hayah violation (basis B+C). The gap of 5 points between mechanical(-25) and stunning(-20) reflects this epistemological difference.

#### Shafi'i (-14) — Basis: B+C

| Source | Reference | Key text |
|---|---|---|
| Al-Nawawi | *Al-Majmu'*, 9/75-80 | Hayah mustaqqirrah = "hayat thabitah" — Classical (A) principle |
| Al-Shirazi | *Al-Muhadhdhab* | If alive at slaughter, slaughter is valid — Classical (A) principle |
| Al-Qaradawi | *Fiqh al-Halal wa al-Haram* | Reversible stunning is makruh if alive at cut — Contemporary (B) |

Explicitly conditional on lethality. Lower than Hanafi because the Shafi'i school's outcome-based assessment creates more room for conditional acceptance.

#### Maliki (-10) — Basis: B+C

| Source | Reference | Key text |
|---|---|---|
| Al-Dardir | *Al-Sharh al-Kabir*, 2/108-110 | "al-i'tibar bi-hal al-hayawan 'inda al-dhabh" — Classical (A) |
| Egyptian Dar al-Ifta | Fatwa of 1978 | Permissible if animal doesn't die — Contemporary (B) |
| Muslim World League | 10th session, 1987 | Conditional acceptance — Contemporary (B) |

Most permissive. Focus on outcome, not method. Conditional acceptance is well-documented.

#### Hanbali (-18) — Basis: B+C

| Source | Reference | Key text |
|---|---|---|
| Ibn Qudama | *Al-Mughni*, 13/293-300 | "al-asl 'adam al-hill" when doubt exists — Classical (A) principle |
| Hadith | Al-Tirmidhi 2518 | "da' ma yuribuka..." — Classical (A) principle |
| AAOIFI | Standard No. 23 | Hanbali position as prohibitory — Contemporary (B) |

Sadd al-dhara'i applied to modern stunning. Classical principles (A) applied to modern technology (B).

---

### 5.3 Electronarcosis (poultry) — Basis: B+C

**Classical texts do not address electronarcosis.** This is entirely derived (B) + empirical (C).

**Critical distinctions from cattle stunning:**
1. Lower voltage/amperage — designed to be **reversible**
2. Applied to head only — lower cardiac arrest risk
3. Ritual **fully preserved** — human slaughterer, manual cut, tasmiya

These three differences justify a lower weight than stunning in every school.

| School | Weight | Basis | Key reasoning |
|---|:---:|:---:|---|
| Hanafi | -14 | B+C | Darul Ifta Karachi: "makruh tahriman" (not qat'i haram). Gap of 6 from stunning(-20). |
| Shafi'i | -10 | B+C | Outcome-based: if alive at cut, valid. Ritual preserved. Gap of 4 from stunning(-14). |
| Maliki | -6 | B+C | Near-acceptance. Maslahah applies. Reversible + ritual preserved. Gap of 4 from stunning(-10). |
| Hanbali | -13 | B+C | Proportional precaution: weaker shubhah than stunning. Gap of 5 from stunning(-18). |

---

## 6. Non-Critical Indicators

### 6.1 Post-Slaughter Electrocution — Basis: A+C

| School | Weight | Source | Principle |
|---|:---:|---|---|
| Hanafi | -3 | Ibn Abidin, *Radd al-Muhtar*, 6/296 | Precautionary. Dhakah already complete. |
| Shafi'i | -2 | Al-Nawawi, *Al-Majmu'*, 9/89 | Post-cut interventions not critical. |
| Maliki | -1 | Al-Dardir, *Al-Sharh al-Kabir*, 2/108 | Fully accepted post-dhakah. |
| Hanbali | -3 | Ibn Qudama, *Al-Mughni*, 13/293 | Sadd al-dhara'i, but dhakah accomplished. |

### 6.2 VSM — Basis: B

| School | Weight | Source | Principle |
|---|:---:|---|---|
| Hanafi | -8 | Al-Kasani, *Bada'i*, 5/41-42 | Tayyib integral to halal. Quran 7:157. |
| Shafi'i | -7 | Al-Nawawi, *Al-Majmu'*, 9/28-30 | Tayyib matters but less binding. |
| Maliki | -5 | Al-Dardir, *Al-Sharh al-Kabir*, 2/115 | Quality concern, not strictly fiqh. |
| Hanbali | -8 | Ibn Qudama, *Al-Mughni*, 13/331 | Khabaith — precautionary. |

**Note**: VSM weights are less differentiated across schools than in V5.0 because the textual basis for differentiation on tayyib is weaker than for ritual validity.

### 6.3 Salaried Slaughterers — Basis: A

| School | Weight | Source | Principle |
|---|:---:|---|---|
| Hanafi | +15 | Al-Kasani, *Bada'i*, 5/41 | Independence and amanah of dhabih. |
| Shafi'i | +10 | Al-Nawawi, *Al-Majmu'*, 9/75 | Important but secondary to act conditions. |
| Maliki | +5 | Khalil, *Mukhtasar*, Kitab al-Dhaba'ih | Focus on the act, not affiliation. |
| Hanbali | +12 | Ibn Qudama, *Al-Mughni*, 13/285 | Independent slaughterers reduce pressure. |

---

## 7. Per-Certifier Scores (V5.1)

| Certifier | Editorial | Hanafi | Shafi'i | Maliki | Hanbali |
|---|:---:|:---:|:---:|:---:|:---:|
| European Halal Trust | 100 | 100 | 100 | 100 | 100 |
| ALTAKWA | 97 | 98 | 97 | 96 | 97 |
| AVS | 96 | 97 | 96 | 96 | 96 |
| ACHAHADA | 95 | 94 | 95 | 96 | 95 |
| KHALIS HALAL | 95 | 96 | 95 | 93 | 96 |
| SIDQ | 95 | 96 | 95 | 93 | 96 |
| HMC | 93 | 94 | 95 | 96 | 94 |
| HALAL SERVICES | 92 | 91 | 92 | 93 | 92 |
| MCI | 63 | 59 | 67 | 77 | 60 |
| ARGML | 51 | 51 | 55 | 55 | 51 |
| HALAL POLSKA | 10 | 8 | 16 | 24 | 9 |
| ARRISSALA | 3 | 2 | 4 | 8 | 2 |
| ACMIF | 1 | 1 | 2 | 5 | 1 |
| ALAMANE | 1 | 1 | 2 | 5 | 1 |
| HALAL CORRECT | 1 | 1 | 2 | 5 | 1 |
| Islamic Centre Aachen | 1 | 1 | 2 | 5 | 1 |
| AFCAI | 0 | 0 | 1 | 2 | 0 |
| SFCVH | 0 | 0 | 0 | 0 | 0 |

---

## 8. Scholarly Bibliography

### Classical fiqh texts

| Author | Title | School |
|---|---|---|
| Al-Kasani (d. 587 AH) | *Bada'i al-Sana'i fi Tartib al-Shara'i*, Vol. 5 | Hanafi |
| Al-Haskafi (d. 1088 AH) | *Al-Durr al-Mukhtar* | Hanafi |
| Ibn Abidin (d. 1252 AH) | *Radd al-Muhtar ala al-Durr al-Mukhtar*, Vol. 6 | Hanafi |
| Al-Nawawi (d. 676 AH) | *Al-Majmu' Sharh al-Muhadhdhab*, Vol. 9 | Shafi'i |
| Al-Shirazi (d. 476 AH) | *Al-Muhadhdhab fi Fiqh al-Imam al-Shafi'i* | Shafi'i |
| Ibn Hajar al-Haytami (d. 974 AH) | *Tuhfat al-Muhtaj bi Sharh al-Minhaj*, Vol. 9 | Shafi'i |
| Al-Ramli (d. 1004 AH) | *Nihayat al-Muhtaj ila Sharh al-Minhaj*, Vol. 8 | Shafi'i |
| Khalil ibn Ishaq (d. 776 AH) | *Mukhtasar Khalil*, Kitab al-Dhaba'ih | Maliki |
| Al-Dardir (d. 1201 AH) | *Al-Sharh al-Kabir ala Mukhtasar Khalil*, Vol. 2 | Maliki |
| Al-Kharashi (d. 1101 AH) | *Sharh Mukhtasar Khalil* | Maliki |
| Al-Dasuqi (d. 1230 AH) | *Hashiyat al-Dasuqi ala al-Sharh al-Kabir*, Vol. 2 | Maliki |
| Ibn Qudama (d. 620 AH) | *Al-Mughni*, Vol. 13 | Hanbali |
| Al-Buhuti (d. 1051 AH) | *Kashshaf al-Qina'*, Vol. 6 | Hanbali |
| Ibn Taymiyyah (d. 728 AH) | *Majmu' al-Fatawa*, Vols. 20, 35 | Hanbali |

### Contemporary authorities and institutions

| Authority | Reference |
|---|---|
| Mufti Taqi Usmani | *The Islamic Laws of Animal Slaughter* (Idarah-e-Islamiat) |
| Al-Qaradawi | *Fiqh al-Halal wa al-Haram* |
| IIFA (OIC) | Resolution 201 (7/21) — procedural standards and field verification |
| AAOIFI | Shari'ah Standard No. 23 (2010) |
| SMIIC | OIC/SMIIC 1:2019 |
| MWL | 10th session (1987) — conditional stunning acceptance |
| Egyptian Dar al-Ifta | Fatwa of 1978 (Grand Mufti Khater) |
| Darul Uloom Deoband | Fatwa #13254 (2009) |
| Darul Uloom Karachi | Darul Ifta rulings |
| ECFR | European Council for Fatwa and Research |
| HFSAA | Halal Food Standards Alliance of America |
| Malaysian Halal Protocol | MS 1500:2019 — stunning procedures and viability checks |

### Empirical data

| Source | Reference | Data point |
|---|---|---|
| EFSA | Scientific Report (2004) | Cattle bolt stunning: 4-8% mortality |
| EFSA | Poultry water-bath data | Electronarcosis: <1% mortality at proper parameters |
| 2023 Scientific Review | Stunning acceptability review | Pivots: reversibility, viability at cut, bleed-out, reject identification |

---

## 9. Implementation

- **Schema**: [certifiers.ts](backend/src/db/schema/certifiers.ts) — `MADHAB_WEIGHTS`, `NAQIY_EDITORIAL_WEIGHTS`
- **Runtime**: [certifier-score.service.ts](backend/src/services/certifier-score.service.ts) — dynamic computation
- **DB Columns**: `trust_score_hanafi`, `trust_score_shafii`, `trust_score_maliki`, `trust_score_hanbali`
- **API**: [scan.ts](backend/src/trpc/routers/scan.ts) — returns all 5 scores
- **Frontend**: Scan result displays school-specific score based on user preference
