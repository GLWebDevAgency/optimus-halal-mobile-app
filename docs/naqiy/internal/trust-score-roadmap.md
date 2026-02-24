# Analyse critique du Trust Score — Points d'amelioration

> Derniere mise a jour : 2026-02-24
> Formule actuelle : voir `trust-score-formula.md`
> Code : `backend/src/db/schema/certifiers.ts` → `computeTrustScore()`
> **Document complet** : voir `trust-score-complete.md` pour la reference exhaustive

---

## P0 — Corrections immediates

### ~~P0-A : Integrer `acceptsPostSlaughterElectrocution` dans le score~~ — ANNULE

> **Decision (2026-02-24)** : Ne PAS integrer dans le trust score.
>
> L'electrocution post-abattage se produit **apres** la saignee — l'animal est deja
> abattu rituellement. Aucun impact fiqhi sur la validite halal dans les 4 ecoles.
> L'ajouter melangerait conformite halal (ce que le score mesure) et bien-etre animal
> (preoccupation distincte). Le champ reste en DB comme info complementaire.

---

### P0-B : Penaliser `null` sur les indicateurs positifs

**Probleme**

Actuellement `null` = 0 points (neutre). Mais `null` signifie "inconnu" ou "refuse de communiquer", ce qui est **different** de `false` (= "non, on ne fait pas ca").

Cas concret : ARGML a `controllersAreEmployees = null` avec une note explicite :
> "les controleurs sont aussi salaries de l'usine, ce qui ne garantit pas l'independance"

Traiter ca comme 0 (neutre) est trop genereux. Un certifieur qui ne peut pas confirmer un critere positif devrait etre legerement penalise.

**Proposition**

Pour chaque indicateur **positif** :
- `true` → points complets (+15, +15, +10)
- `false` → 0 points
- `null` → **malus de -3** (le doute ne profite pas au certifieur)

Cela n'affecte que les certifieurs avec des `null` sur des indicateurs positifs. Seul ARGML est concerne dans les donnees actuelles (`controllersAreEmployees = null`).

**Impact**

| Certifieur | Score actuel | Nouveau score | Delta |
|---|---|---|---|
| ARGML | 44 | 41 | -3 |
| Tous les autres | inchange | inchange | 0 |

**Effort** : 10 min

**Fichiers a modifier** :
- `backend/src/db/schema/certifiers.ts` — ajouter `else if (practices.X === null) raw -= 3` pour les 3 positifs
- Mettre a jour `MIN_RAW` si necessaire
- Re-run seed

---

## P1 — Ameliorations a moyen terme

### P1-A : Ajouter des indicateurs de transparence et d'audit

**Probleme**

7 certifieurs ont un score de 0/100 — exactement le meme profil. Mais dans la realite, ils ne sont pas identiques :
- **SFCVH** a une histoire de scandales et de sous-traitance documentee
- **AFCAI** a des accords commerciaux specifiques
- **Islamic Centre Aachen** opere dans un contexte juridique allemand different

Le score dit "tous pareils" alors qu'un consommateur averti les distinguerait.

**Nouveaux indicateurs proposes**

| Indicateur | Type | Points | Source de donnees |
|---|---|---|---|
| Publie sa liste de certifies en ligne | Positif | +8 | Verification manuelle des sites web |
| Frequence d'audit > 1x/mois | Positif | +7 | Communication des organismes |
| Exige un systeme de tracabilite lot-par-lot | Positif | +5 | Cahier des charges public |
| Effectue des tests ADN aleatoires | Positif | +10 | Communication / presse |
| A fait l'objet de sanctions/retraits | Negatif | -15 | Presse, rapports officiels |
| Finance par les industriels certifies | Negatif | -10 | Structure juridique / rapports |

**Impact**

Ces indicateurs differencieraient le Tier F et creeraient des ecarts entre des certifieurs actuellement identiques. Par exemple, SFCVH (scandales documentes) pourrait descendre a -15 au lieu de 0 dans le tier, tandis qu'un organisme transparent mais laxiste pourrait remonter a 15-20.

**Effort** : 2-3 jours de recherche + 1 jour de code

**Plan de mise en oeuvre** :
1. Recherche : compiler les donnees pour les 18 certifieurs (sites web, presse, rapports)
2. Schema : ajouter les nouvelles colonnes a `certifiers` table
3. JSON : enrichir `certification-list.json` avec les nouveaux champs
4. Formule : ajouter les nouveaux termes a `computeTrustScore()`
5. Seed : re-run pour recalculer

---

### P1-B : Justifier les poids (source fiqh ou editoriale)

**Probleme**

Les poids actuels (+15, +15, +10, -15, -15, -20) n'ont pas de justification documentee. Pourquoi l'etourdissement vaut -20 et pas -25 ? Pourquoi les controleurs salaries valent +15 et pas +20 ?

Ce n'est pas forcement faux, mais sans justification, c'est un choix editorial opaque. Si un utilisateur ou un certifieur conteste le score, on ne peut pas pointer vers une source.

**Options**

1. **Source fiqh** : s'appuyer sur les fatawa des 4 ecoles pour ponderer la gravite relative de chaque pratique. Ex : l'AAOIFI classe l'etourdissement comme "interdit sauf necessite" tandis que l'abattage mecanique est "interdit sans exception" → inverser les poids (-20 mecanique, -15 etourdissement) ?

2. **Source editoriale explicite** : publier un document "Methodologie Naqiy" qui explique chaque poids comme un choix editorial assume, avec la logique derriere. Transparent vis-a-vis des utilisateurs.

3. **Comite consultatif** : constituer un panel de 3-5 savants/experts qui valident les poids. Le plus credible, mais le plus lent.

**Effort** : 3-5 jours de redaction / recherche

**Livrable** : un document `trust-score-methodology.md` publiable, avec pour chaque poids :
- La pratique concernee
- Le consensus des 4 ecoles
- La justification du poids choisi
- Les sources

---

## P2 — Evolutions structurelles

### P2-A : Score par madhab

**Probleme**

Le score actuel est universel. Mais les 4 ecoles de jurisprudence (madhahib) ne jugent pas les memes pratiques avec la meme severite.

**Divergences cles**

| Pratique | Hanafi | Shafi'i | Maliki | Hanbali |
|---|---|---|---|---|
| **Etourdissement** | Majoritairement interdit — animal pleinement conscient | Interdit si tue avant saignee, tolere sinon | Plus permissif — tolere si animal survit | Interdit par precaution |
| **Electronarcose** | Interdit — risque de mort pre-saignee | Interdit si letal, makruh sinon | Tolere sous conditions | Interdit par precaution |
| **Abattage mecanique** | Interdit — tasmiya exige un humain | Interdit — meme raisonnement | Certains acceptent avec tasmiya enregistree | Interdit |
| **Sacrificateur salarie** | Tres valorise (independance du dhabih) | Valorise | Moins critique | Valorise |

**Exemple concret : ARGML**

| Madhab | Poids etourdissement | Poids electronarcose | Score resultant |
|---|---|---|---|
| Universel (actuel) | -20 | -15 | 44/100 |
| Hanafi | -30 | -20 | ~25/100 |
| Shafi'i | -20 | -15 | ~44/100 (similaire) |
| Maliki | -8 | -8 | ~65/100 |
| Hanbali | -25 | -18 | ~30/100 |

L'utilisateur qui a choisi "Hanafi" dans ses preferences verrait un score plus severe. "Maliki" verrait un score plus indulgent. **Meme certifieur, meme donnees, interpretation differente.**

**Architecture technique**

Option A — 4 colonnes :
```sql
trust_score_hanafi   INTEGER NOT NULL DEFAULT 0,
trust_score_shafii   INTEGER NOT NULL DEFAULT 0,
trust_score_maliki   INTEGER NOT NULL DEFAULT 0,
trust_score_hanbali  INTEGER NOT NULL DEFAULT 0,
```

Option B — JSONB :
```sql
trust_scores JSONB NOT NULL DEFAULT '{"universal":0,"hanafi":0,"shafii":0,"maliki":0,"hanbali":0}'
```

Option A est preferee : typage fort, indexable, pas de parsing JSON.

**Implementation**

```typescript
// 4 jeux de poids
const MADHAB_WEIGHTS = {
  universal: {
    controllersAreEmployees: 15,
    controllersPresentEachProduction: 15,
    hasSalariedSlaughterers: 10,
    acceptsMechanicalSlaughter: -15,
    acceptsElectronarcosis: -15,
    acceptsStunning: -20,
  },
  hanafi: {
    controllersAreEmployees: 15,
    controllersPresentEachProduction: 15,
    hasSalariedSlaughterers: 12,
    acceptsMechanicalSlaughter: -20,  // plus strict
    acceptsElectronarcosis: -20,      // plus strict
    acceptsStunning: -30,             // beaucoup plus strict
  },
  maliki: {
    controllersAreEmployees: 15,
    controllersPresentEachProduction: 15,
    hasSalariedSlaughterers: 8,
    acceptsMechanicalSlaughter: -12,  // legerement tolere
    acceptsElectronarcosis: -8,       // tolere sous conditions
    acceptsStunning: -8,              // tolere si non-letal
  },
  // shafii, hanbali...
};
```

Le frontend lit le madhab de l'utilisateur (deja stocke dans les preferences) et affiche le score correspondant.

**Pourquoi c'est un killer feature**

Aucune app halal ne fait ca. Toutes donnent un verdict binaire sans considerer les divergences entre ecoles. Un maliki qui voit "Score bas" sur un certifieur que son madhab tolere — c'est trompeur. L'inverse aussi.

**Effort** :
- Recherche fiqh : 2-3 jours (compiler les fatawa des 4 ecoles sur chaque pratique)
- Code backend : 1 jour (4 colonnes + `computeTrustScore` par madhab + seed)
- Code frontend : 0.5 jour (le madhab selectionne determine quel score afficher)
- **Risque principal** : legitimite des poids — il faut des sources credibles

**Fichiers a modifier** :
- `backend/src/db/schema/certifiers.ts` — 4 colonnes + fonction par madhab
- `backend/src/db/seeds/certifiers.ts` — calculer les 4 scores au seed
- `backend/src/db/seeds/run.ts` — afficher le ranking par madhab
- `backend/src/trpc/routers/scan.ts` — retourner le score du madhab de l'utilisateur
- `optimus-halal/app/scan-result.tsx` — afficher le bon score

---

### P2-B : Normalisation sigmoide — FAIT (2026-02-24)

**Probleme**

La normalisation lineaire traitait chaque point brut egalement. En realite, les premiers criteres positifs comptent plus (effet de base) et les derniers comptent moins (rendements decroissants).

**Solution implementee**

Sigmoide centree sur raw=0 avec steepness k=0.08, renormalisee pour que MAX_RAW → 100 et MIN_RAW → 0 :

```typescript
const SIGMOID_K = 0.08;
const sig = (r: number) => 1 / (1 + Math.exp(-r * SIGMOID_K));
const normalized = ((sig(raw) - sig(minRaw)) / (sig(maxRaw) - sig(minRaw))) * 100;
```

Le point d'inflexion a raw=0 signifie "aucune pratique = 50% avant renormalisation", ce qui est intuitif.

**Impact reel sur les scores (universal)**

| Certifieur | Lineaire (avant) | Sigmoide (apres) | Delta |
|---|---|---|---|
| AVS (Tier S) | 100 | 100 | 0 |
| ACHAHADA | 90 | 95 | +5 |
| MCI | 75 | 80 | +5 |
| ARGML | 46 | 27 | -19 |
| HALAL POLSKA | 34 | 12 | -22 |
| Tier F (7 certifieurs) | 9 | 1 | -8 |

La sigmoide cree 3 clusters distincts : elite (95-100), mediocre (12-48), et defaillant (0-1)

---

## P3 — Vision long terme

### P3 : Versioning temporel des pratiques

**Probleme**

Le JSON source est un snapshot fige. La realite evolue :
- 2019 : ACHAHADA ne certifiait pas la volaille industrielle
- 2022 : ACHAHADA commence la volaille — criteres changes ?
- 2024 : SFCVH perd son partenariat Mosquee de Paris, puis le recupere
- 2025 : ARGML annonce renforcer ses controles

Aucune de ces evolutions n'est tracable. Le score de 2026 repose sur des donnees dont la date de collecte est inconnue.

**3 niveaux d'implementation**

#### Niveau 1 — Date de verification (minimal)

Ajouter 2 colonnes au schema `certifiers` :

```sql
last_verified_at  TIMESTAMP WITH TIME ZONE,  -- quand les donnees ont ete verifiees
data_source_url   TEXT                        -- d'ou viennent les donnees
```

Frontend : si `lastVerifiedAt` > 12 mois, afficher un badge "Donnees anciennes" a cote du score.

**Effort** : 30 min (schema + seed + badge frontend)

#### Niveau 2 — Changelog (modere)

Nouvelle table `certifier_changes` :

```sql
CREATE TABLE certifier_changes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  certifier_id VARCHAR(100) REFERENCES certifiers(id),
  field_changed VARCHAR(100) NOT NULL,
  old_value TEXT,
  new_value TEXT,
  changed_at TIMESTAMP WITH TIME ZONE NOT NULL,
  source_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

Le seed detecte les changements a chaque run et log la diff automatiquement. Le frontend peut afficher : "ARGML a change X en juin 2024".

**Effort** : 1-2 jours

#### Niveau 3 — Versioning complet (lourd)

Table `certifier_snapshots` avec historique complet par periode, scores recalcules, graphe d'evolution temporelle.

**Effort** : 1 semaine+

**Prerequis** : un flux de donnees entrant. Sans veille editoriale ou partenariat (Al-Kanz, associations), c'est une coquille vide. Le vrai declencheur est un partenariat de contenu.

**Recommandation** : commencer par le Niveau 1 (30 min, zero risque), planifier le Niveau 2 quand un flux de donnees est en place.

**Fichiers a modifier** :
- `backend/src/db/schema/certifiers.ts` — colonnes `lastVerifiedAt`, `dataSourceUrl`
- `backend/asset/certification-list.json` — ajouter `lastVerifiedAt` par entree
- `backend/src/db/seeds/certifiers.ts` — mapper les nouveaux champs
- (Niveau 2) `backend/src/db/schema/certifier-changes.ts` — nouveau schema
- (Niveau 2) `backend/src/db/seeds/run.ts` — diff detection avant upsert

---

## Resume des priorites

| Prio | ID | Quoi | Effort | Impact | Statut |
|---|---|---|---|---|---|
| ~~P0~~ | ~~A~~ | ~~Integrer `acceptsPostSlaughterElectrocution`~~ | ~~10 min~~ | ~~Corrige un champ fantome~~ | **ANNULE** — post-abattage, aucun impact fiqhi sur la validite halal |
| ~~P0~~ | ~~B~~ | ~~Penaliser `null` sur positifs (-3)~~ | ~~10 min~~ | ~~Score ARGML plus juste~~ | **FAIT** — `NULL_POSITIVE_PENALTY = -3`, applique aux 3 indicateurs positifs |
| **P1** | A | Indicateurs transparence/audit | 3-4 jours | Differencie le Tier F | A planifier |
| ~~P1~~ | ~~B~~ | ~~Justifier les poids (source fiqh)~~ | ~~3-5 jours~~ | ~~Credibilite~~ | **FAIT** — integre dans P2-A (sources inline dans le code) |
| ~~P2~~ | ~~A~~ | ~~Score par madhab~~ | ~~4-5 jours~~ | ~~Killer feature~~ | **FAIT** — 4 colonnes + poids par madhab + frontend + docs |
| ~~P2~~ | ~~B~~ | ~~Normalisation sigmoide~~ | ~~15 min~~ | ~~Meilleure distribution~~ | **FAIT** — sigmoide centree (k=0.08) + renormalisation min/max |
| **P3** | — | Versioning temporel (Niv. 1→3) | 30min→1sem | Tracabilite | A faire (Niv. 1) |

### Ordre d'execution recommande

```
FAIT :       P0-B null penalty (-3)
FAIT :       P2-B sigmoide (k=0.08, centree sur raw=0)
Sprint +1 :  P3 Niveau 1 — lastVerifiedAt (30 min)
Sprint +2 :  P1-A nouveaux indicateurs (3-4 jours recherche)
Sprint +3 :  P3 Niveau 2 changelog (quand flux de donnees en place)
```
