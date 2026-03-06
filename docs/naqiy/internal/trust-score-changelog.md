# Trust Score — Changelog methodologique

> Historique des evolutions du Naqiy Trust Index.
> Chaque version documente les changements, leurs raisons, et leur impact.

---

## V5.1 (2026-03-06) — Re-evaluation madhab post-challenge

### Changements

- **Classification epistemologique A/B/C** : chaque poids declare sa base
  - A = texte classique explicite (mutun/shuruh)
  - B = derivation contemporaine (application des usul aux technologies modernes)
  - C = preuve empirique/operationnelle (donnees veterinaires, mortalite)
- **Re-evaluation des 3 indicateurs critiques par madhab** :
  - Stunning (B+C) : poids reduits (Hanafi -23→-20, Hanbali -20→-18, Shafi'i -16→-14)
  - Electronarcosis (B+C) : poids reduits (Hanafi -18→-14, Hanbali -15→-13, Shafi'i -12→-10, Maliki -7→-6)
  - Mechanical (A+B) : Maliki ajuste (-12→-14, vitesse industrielle)
  - VSM : spread reduit (Hanafi/Hanbali -10→-8, Shafi'i -8→-7)
- **Ecarts mecanical-stunning elargis** : reflete la difference epistemologique A vs B+C
- **Correction IIFA** : Resolution 225 n'est pas une preuve terminale. Resolution 201 utilisee.
- **Formulation** : "incompatibilite pratique" au lieu de "ijma' que c'est haram"

### Raison

Troisieme audit methodologique identifie une confusion entre base textuelle classique
et derivation contemporaine. Les poids par madhab doivent distinguer ce qui vient des
textes classiques de ce qui est une application Naqiy aux technologies modernes.

### Impact

- Scores Tier S/A : quasi-inchanges (pas de pratiques critiques)
- MCI : Hanafi 50→59 (+9), Maliki 75→77 (+2)
- ARGML : Hanafi 37→51 (+14), Shafi'i 54→55 (+1)
- Tier F : leger ajustement (<3 pts)

---

## V5 (2026-03-06) — Refonte architecturale

### Changements

- **Renommage** : "universal" → "editorial Naqiy" (poids editoraux documentes, pas un consensus)
- **Poids editoriaux ajustes** :
  - `acceptsMechanicalSlaughter` : -15 → **-20** (textuel classique, IIFA 201)
  - `acceptsStunning` : -20 → **-18** (ikhtilaf, derive contemporain)
  - `acceptsElectronarcosis` : -15 → **-12** (rituel humain preserve, risque moindre)
- **Caps/guardrails** : systeme de plafonds empechant les compensations absurdes
  - 3 pratiques critiques acceptees → cap a 35/100
  - 2 pratiques critiques acceptees → cap a 55/100
  - 0 indicateurs positifs → cap a 45/100
- **4 blocs semantiques** : detail par categorie (rituel/operationnel/tayyib/transparence)
- **Niveau de preuve** : champ `evidence_level` (verified/declared/inferred/unknown)
- **Tiers renommes** : Strong (>=90) / Moderate (55-89) / Caution (20-54) / Weak (<20)
- **Documentation** : scindee en 4 artefacts (whitepaper, methodology, data dictionary, dossiers)

### Raison

Deux audits methodologiques externes ont identifie des failles architecturales :
modele purement additif, booleens trop grossiers, absence de caps, "universal" trompeur.

### Impact

- Scores Tier S/A : inchanges (caps non declenchees)
- Scores mid-range (MCI, ARGML) : legere hausse (+4 a +8 pts) due a electronarcose alleges
- Tier F : inchange (deja au plancher)
- Aucun changement de classement relatif

---

## V4 (2026-02-24) — Enrichissement multi-indicateurs

### Changements

- Ajout `acceptsVsm` (-8) : Viande Separee Mecaniquement (tayyib)
- Ajout `acceptsPostSlaughterElectrocution` (-2) : marginal
- Ajout 3 indicateurs transparence : charte publique, rapports d'audit, liste d'entreprises (+5 chacun)
- Ajout `controversyPenalty` avec decay temporel (`e^(-lambda*t)`, half-life 5 ans)
- Passage de la normalisation lineaire a la sigmoide (k=0.06)

### Raison

V3 manquait de granularite. Les indicateurs de transparence et de controverse ajoutent
une dimension organisationnelle essentielle.

---

## V3 (2026-01-xx) — Scores par madhab

### Changements

- Ajout des scores per-madhab (Hanafi, Shafi'i, Maliki, Hanbali)
- `MADHAB_WEIGHTS` avec sources fiqh inline
- Null penalty (-3) pour indicateurs positifs `null`

### Raison

Les 4 ecoles ont des positions differentes sur le stunning et l'abattage mecanique.
Un score unique ne respecte pas cette diversite.

---

## V1-V2 (2025) — Fondation

### Changements

- 6 indicateurs de base (3 positifs, 3 negatifs)
- Normalisation lineaire [0-100]
- Score unique (pas de madhab)

### Raison

MVP initial pour la beta de l'application.
