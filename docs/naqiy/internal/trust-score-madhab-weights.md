# Trust Score — Per-Madhab Weight System

Reference document for the per-madhab trust score weights used in Naqiy.

## Overview

The Naqiy Trust Score evaluates halal certifier rigor using 6 boolean practice indicators.
The **universal score** uses school-agnostic average weights. The **per-madhab scores** apply
school-specific weights reflecting each madhab's fiqh positions on slaughter practices.

Users can select their madhab in Settings > Islamic School. When set, the scan result
displays their school-specific score instead of the universal one.

## Weight Table

| Indicator | Universal | Hanafi | Shafi'i | Maliki | Hanbali |
|---|:---:|:---:|:---:|:---:|:---:|
| controllersAreEmployees | +15 | +15 | +15 | +15 | +15 |
| controllersPresentEachProduction | +15 | +15 | +15 | +15 | +15 |
| hasSalariedSlaughterers | +10 | **+15** | +10 | **+5** | **+12** |
| acceptsMechanicalSlaughter | -15 | **-20** | **-18** | **-8** | **-18** |
| acceptsElectronarcosis | -15 | **-20** | -15 | **-8** | **-18** |
| acceptsStunning | -20 | **-25** | **-15** | **-10** | **-25** |
| **MAX_RAW** | +40 | +45 | +40 | +35 | +42 |
| **MIN_RAW** | -50 | -65 | -48 | -26 | -61 |

Bold values deviate from the universal weight.

## Normalization

Raw scores are normalized to 0-100 using a **centered sigmoid curve** (k=0.08):

```
sig(r) = 1 / (1 + e^(-r * 0.08))
score  = round((sig(raw) - sig(MIN_RAW)) / (sig(MAX_RAW) - sig(MIN_RAW)) * 100)
```

Where MIN_RAW and MAX_RAW are computed from each school's weight set.
MIN_RAW includes worst case: all 3 positive indicators `null` (penalty -3 each) + all 3 negative indicators `true`.

The sigmoid is centered at raw=0 (inflection point), then renormalized so MAX_RAW → 100 and MIN_RAW → 0.
This compresses extremes and stretches the mid-range, giving better separation between certifiers.

## Fiqh Justifications

### Organizational Indicators (Same Across All Schools)

- **controllersAreEmployees (+15)**: Independent, salaried controllers — organizational quality
- **controllersPresentEachProduction (+15)**: Present at every production run — oversight standard

### Salaried Slaughterers

| School | Weight | Justification |
|---|:---:|---|
| Hanafi | +15 | Emphasizes human agent's niyyah and competence. Ref: Al-Kasani, *Bada'i al-Sana'i* 5/41 |
| Shafi'i | +10 | Valued but not as critical. Ref: Al-Nawawi, *Rawdat al-Talibin* |
| Maliki | +5 | School focuses on the act of slaughter itself. Ref: Malik, *Al-Muwatta*, Kitab al-Dhaba'ih |
| Hanbali | +12 | Emphasizes qualifications and taqwa of the slaughterer. Ref: Ibn Qudama, *Al-Mughni* 13/283 |

### Mechanical Slaughter

| School | Weight | Justification |
|---|:---:|---|
| Hanafi | -20 | Tasmiya on each animal is wajib. Machine cannot pronounce = haram. Ref: HFSAA; Imam al-Haskafi, *Durr al-Mukhtar* |
| Shafi'i | -18 | "Istikhfaf" (taking lightly) invalidates slaughter. Machine = systematic istikhfaf. Ref: HFSAA analysis |
| Maliki | -8 | Some scholars debated recorded tasmiya. Intentional omission ≠ forgetfulness. Ref: Al-Dardir, *Al-Sharh al-Kabir* 2/108 |
| Hanbali | -18 | Machine cannot have niyyah or pronounce tasmiya. Prohibited. Ref: Ibn Qudama, *Al-Mughni* 13/285 |

### Electronarcosis

| School | Weight | Justification |
|---|:---:|---|
| Hanafi | -20 | Risk of death before saignée = invalidation. Ref: Fatwa Darul Ifta, Jamia Darul Uloom Karachi |
| Shafi'i | -15 | Haram if lethal, makruh if not. Same principle as stunning. Ref: Imam al-Shirazi, *Al-Muhadhdhab* |
| Maliki | -8 | Tolerated under conditions (reversible). Ref: Egyptian Fatwa Committee 1978; World Islamic League Decision No. 4, 1987 |
| Hanbali | -18 | Prohibited by precaution — shubuha (doubt). Ref: Ibn Qudama, *Al-Mughni*; Hadith "What you doubt, leave it" (Tirmidhi) |

### Stunning (Cattle/Calves/Lambs)

| School | Weight | Justification |
|---|:---:|---|
| Hanafi | -25 | Animal must be fully conscious. Any doubt about animal being alive invalidates slaughter. Ref: Ibn Abidin, *Radd al-Muhtar* 6/296; Mufti Taqi Usmani |
| Shafi'i | -15 | Prohibited if it kills before slaughter. If reversible and animal provably alive → makruh but tolerated. Ref: Al-Nawawi, *Al-Majmu'* 9/75 |
| Maliki | -10 | Tolerated if animal survives shock (reversible). Principle of "al-asl al-ibaha". Ref: Khalil ibn Ishaq, *Mukhtasar*; Al-Dardir, *Al-Sharh al-Kabir* |
| Hanbali | -25 | Prohibited as precaution (ihtiyat). If doubt whether stunning kills, avoid entirely. Ref: Ibn Qudama, *Al-Mughni* 13/293; Ahmad's principle of ihtiyat |

## Per-Certifier Scores (Current Data)

| Certifier | Universal | Hanafi | Shafi'i | Maliki | Hanbali |
|---|:---:|:---:|:---:|:---:|:---:|
| AVS | 100 | 100 | 100 | 100 | 100 |
| European Halal Trust | 100 | 100 | 100 | 100 | 100 |
| Halal Monitoring Committee | 100 | 100 | 100 | 100 | 100 |
| KHALIS HALAL | 100 | 100 | 100 | 100 | 100 |
| SIDQ | 100 | 100 | 100 | 100 | 100 |
| ALTAKWA | 100 | 100 | 100 | 100 | 100 |
| ACHAHADA | 95 | 94 | 95 | 97 | 95 |
| HALAL SERVICES | 95 | 94 | 95 | 97 | 95 |
| MCI | 80 | 71 | 80 | 90 | 75 |
| ARGML - Mosquée de Lyon | 27 | 19 | 35 | 48 | 18 |
| HALAL POLSKA | 12 | 6 | 13 | 37 | 6 |
| Tier F (7 certifiers) | 1 | 0 | 1 | 6 | 0 |

## Key Scholarly References

- **AAOIFI Standard 23** (OIC 2017): Slaughtering standards including stunning conditions
- **IIFA Resolution 225 (9/23)**: International Islamic Fiqh Academy resolution on machine slaughter
- **HFSAA (Halal Food Standards Alliance of America)**: All 4 schools' positions on tasmiya and mechanical slaughter
- **Mufti Taqi Usmani**, *Legal Rulings on Slaughtered Animals*: Hanafi position on stunning
- **Al-Nawawi**, *Al-Majmu' Sharh al-Muhadhdhab* 9/75: Shafi'i position on reversible stunning
- **Ibn Qudama**, *Al-Mughni* 13/283-293: Hanbali positions on slaughterer qualifications and stunning
- **Al-Dardir**, *Al-Sharh al-Kabir* 2/108: Maliki position on tasmiya omission
- **Khalil ibn Ishaq**, *Mukhtasar*: Maliki default permissibility principle
- **Al-Kasani**, *Bada'i al-Sana'i* 5/41: Hanafi emphasis on dhābih's niyyah

## Implementation

- **Schema**: `backend/src/db/schema/certifiers.ts` — weights, types, and computation functions
- **DB Columns**: `trust_score_hanafi`, `trust_score_shafii`, `trust_score_maliki`, `trust_score_hanbali`
- **Seed**: `backend/src/db/seeds/certifiers.ts` — uses `computeAllTrustScores()`
- **API**: `backend/src/trpc/routers/scan.ts` — returns all 5 scores in `certifierData`
- **Frontend**: `optimus-halal/app/scan-result.tsx` — selects score based on `userProfile.madhab`
- **Settings**: `optimus-halal/app/settings/madhab.tsx` — user selects school preference
