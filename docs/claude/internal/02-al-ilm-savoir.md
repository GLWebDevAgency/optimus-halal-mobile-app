# 02 — Al-Ilm : Le Moteur de Savoir

> "Qul hal yastawi alladhina ya'lamuna walladhina la ya'lamun"
> — Dis : sont-ils egaux, ceux qui savent et ceux qui ne savent pas ? (Sourate Az-Zumar, 39:9)

---

## Le Coeur du Produit : Transformer l'Ignorance en Savoir

Optimus Halal n'est pas un scanner. C'est un moteur de savoir contextuel.

La difference est fondamentale :
- Un scanner dit "halal" ou "haram" → **jugement binaire**
- Un moteur de savoir dit "selon l'ecole Hanafi, cet additif (E471) est douteux car il peut etre d'origine animale ou vegetale. Le score de confiance est de 65%. Voici les alternatives certifiees." → **comprehension personnalisee**

Le premier genere de la dependance. Le second genere du savoir. Notre objectif est que l'utilisateur, apres 6 mois d'utilisation, soit capable de lire une etiquette et de comprendre par lui-meme. L'app doit viser sa propre obsolescence partielle — c'est le signe qu'elle a reellement eduque.

---

## 1. Le Pipeline de Scan — De la Camera au Verdict

```
[Camera detecte un code-barres]
    │
    ▼
[useScan() → mutation scan.scanBarcode]
    │
    ├──► [1] Recherche en DB locale (table `products`, index sur `barcode`)
    │         └─► Cache hit → retour immediat (~50ms)
    │
    ├──► [2] Cache miss → appel OpenFoodFacts API v2
    │         └─► GET /api/v2/product/{barcode}.json
    │         └─► Extraction : nom, marque, ingredients, additifs, nutri-score, labels
    │
    ├──► [3] Analyse halal heuristique (analyzeHalalStatus)
    │         │
    │         ├── Etape 3a : Detection de labels halal explicites
    │         │     └─► "en:halal" dans labels_tags → confidenceScore += 0.3
    │         │
    │         ├── Etape 3b : Analyse des ingredients textuels
    │         │     └─► Mots-cles haram (porc, gelatine, alcool, E120, E441...)
    │         │     └─► Pattern matching avec poids (certains mots = haram certain, d'autres = douteux)
    │         │
    │         ├── Etape 3c : Croisement avec la base d'additifs
    │         │     └─► Chaque E-number → lookup dans `additives` + `additive_madhab_rulings`
    │         │     └─► Si le madhab de l'utilisateur = Hanafi et l'additif = douteux chez Hanafi → flag
    │         │
    │         └── Etape 3d : Calcul du verdict final
    │               └─► Aggregation des signaux → halalStatus + confidenceScore (0-1)
    │               └─► Si ≥1 ingredient haram certain → "haram" (confidence haute)
    │               └─► Si ingredients douteux uniquement → "doubtful" (confidence variable)
    │               └─► Si aucun flag → "halal" (confidence basee sur la completude des donnees)
    │
    ├──► [4] Sauvegarde en DB (upsert produit + insert scan)
    │
    └──► [5] Mise a jour stats utilisateur (XP, streak, scans count)
            └─► Retour : { scan, product, isNewProduct, xpEarned }
```

### Les Limites Honnetes du Moteur

| Limite | Impact | Mitigation |
|--------|--------|------------|
| OpenFoodFacts n'a pas tous les produits | ~30% de "produit inconnu" pour les produits ethniques | L'utilisateur peut contribuer (photo + ingredients). Backend `analysis_requests` pour review manuelle. |
| Les ingredients textuels sont ambigus | "arome" peut etre animal ou vegetal | Le systeme flag comme "doubtful" avec explication. Le confidenceScore reflete l'incertitude. |
| Les rulings par madhab ne sont pas exhaustifs | Certains additifs n'ont pas d'avis pour les 4 ecoles | Affichage "Pas d'avis specifique pour cette ecole" plutot qu'un faux "halal". |
| Le label "halal" sur OFF n'est pas fiable | N'importe qui peut ajouter un label sur OFF | On croise avec notre base de certifiers. Un label sans certifier reconnu = confidence basse. |

---

## 2. Le Graphe de Connaissances — Schema Reel

Contrairement a ce que GPT-5.2 appelle un "graphe de connaissances probabiliste", notre structure est un **schema relationnel PostgreSQL avec des scores de confiance**. C'est moins glamour mais plus fiable et auditable.

### Relations Cles

```
products (barcode, name, brand, halalStatus, confidenceScore)
    │
    ├──► contient → additives (code E, name, origin, defaultStatus)
    │                   │
    │                   └──► juge_par → additive_madhab_rulings
    │                            │      (additiveId, madhab, status, confidence, source)
    │                            │
    │                            └──► 4 lignes par additif :
    │                                  ├── hanafi:  halal | doubtful | haram
    │                                  ├── maliki:  halal | doubtful | haram
    │                                  ├── shafii:  halal | doubtful | haram
    │                                  └── hanbali: halal | doubtful | haram
    │
    ├──► certifie_par → certifiers (name, country, reliability, website)
    │
    └──► scanne_par → scans (userId, halalStatus, location, scannedAt)
                        │
                        └──► utilisateur → users (madhab, halalStrictness, allergens, isPregnant)
```

### Les Additifs — Le Nerf de la Guerre

Notre base contient **140+ additifs** (E100 a E1500) avec leurs statuts par defaut et les avis par madhab.

Exemples critiques :

| Code | Nom | Defaut | Hanafi | Maliki | Shafi'i | Hanbali | Complexite |
|------|-----|--------|--------|--------|---------|---------|------------|
| E120 | Cochenille | haram | haram | haram | haram | haram | Simple — origine insecte, consensus |
| E441 | Gelatine | haram | haram* | haram* | haram* | haram* | *Sauf si origine bovine halal certifiee |
| E471 | Mono/diglycerides | doubtful | doubtful | halal | doubtful | doubtful | Complexe — origine indeterminee |
| E322 | Lecithine (soja) | halal | halal | halal | halal | halal | Simple — origine vegetale |
| E904 | Shellac (gomme laque) | doubtful | halal | doubtful | doubtful | doubtful | Divergence — origine insecte, debat |

**Le probleme du E471** illustre parfaitement notre defi : c'est l'additif le plus courant dans l'industrie alimentaire (present dans des centaines de produits), et son statut depend de son origine — animale ou vegetale — que le fabricant n'est pas oblige de preciser. Notre reponse : "doubtful" avec explication, et proposition d'alternatives.

---

## 3. Gestion de l'Incertitude — La Categorie "Mashbouh"

La categorie "doubtful" (mashbouh) est la plus delicate de toute l'application.

### Le Hadith Fondateur

> "Le halal est clair et le haram est clair, et entre les deux il y a des choses ambigues (mushbtabihat) que beaucoup de gens ne connaissent pas. Celui qui se garde des choses ambigues a preserve sa religion et son honneur."
> — Hadith rapporte par Al-Bukhari et Muslim

### Notre Approche

1. **Jamais de faux "halal"** : Si le moindre doute existe, on montre le doute. Il vaut mieux 100 faux positifs (produit halal marque comme douteux) qu'un seul faux negatif (produit haram marque comme halal).

2. **Le confidenceScore est visible** : L'utilisateur voit "Confiance : 65%" et comprend que le systeme n'est pas certain. Cacher l'incertitude serait une trahison de l'amanah.

3. **L'explication accompagne toujours le verdict** : "Douteux car contient E471 (mono et diglycerides d'acides gras) — cet additif peut etre d'origine animale ou vegetale. Le fabricant ne precise pas l'origine."

4. **Le profil utilisateur module la reponse** :
   - `halalStrictness: "strict"` → le doubtful est traite comme un warning fort
   - `halalStrictness: "moderate"` → le doubtful est presente comme une information
   - `halalStrictness: "lenient"` → le doubtful est minimise (mais jamais cache)

5. **Les alternatives sont toujours proposees** : Un produit douteux n'est jamais un cul-de-sac. L'ecran affiche immediatement des alternatives certifiees dans la meme categorie.

---

## 4. Les Divergences entre Madhabs — Le Defi du Pluralisme

### Le Principe

Les 4 ecoles sunnites (Hanafi, Maliki, Shafi'i, Hanbali) ont des avis differents sur certains additifs et pratiques. Ces divergences sont **normales et saines** — elles refletent la richesse du fiqh islamique.

### Notre Responsabilite

| Regle | Implementation |
|-------|---------------|
| **Presenter, ne pas trancher** | L'UI montre les 4 avis cote a cote. Aucune ecole n'est mise en avant comme "la bonne". |
| **Respecter le choix de l'utilisateur** | Le profil stocke le madhab choisi. Le verdict principal est calcule selon CE madhab. |
| **Montrer les differences** | Si 3 ecoles disent "halal" et 1 dit "douteux", les 4 avis sont affiches. Le consensus est mis en evidence sans disqualifier la minorite. |
| **Citer les sources** | Chaque ruling a un champ `source` (nom du savant, livre, fatwa). Quand c'est disponible, on le montre. |
| **Humilite epistemique** | Si on n'a pas d'avis fiable pour une ecole, on affiche "Pas de ruling trouve" plutot qu'un avis invente. |

### Schema de donnees

```sql
-- Table additive_madhab_rulings
CREATE TABLE additive_madhab_rulings (
  id UUID PRIMARY KEY,
  additive_id UUID REFERENCES additives(id),
  madhab VARCHAR(20) NOT NULL,     -- 'hanafi' | 'maliki' | 'shafii' | 'hanbali'
  status VARCHAR(20) NOT NULL,     -- 'halal' | 'doubtful' | 'haram'
  confidence FLOAT NOT NULL,       -- 0.0 a 1.0
  source TEXT,                     -- Reference bibliographique
  notes TEXT,                      -- Conditions ou exceptions
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
);
```

---

## 5. Les Certifiers — La Chaine de Confiance

### Les 18 Certifiers en Base

Notre base reference **18 organismes de certification halal** opérant en France :

| Organisme | Fiabilite percue | Notes |
|-----------|-----------------|-------|
| **AVS** (Association de Valorisation des Standards) | Haute | Le plus exigeant en France. Controles inopines. |
| **Achahada** | Haute | Base dans le Nord. Rigueur reconnue. |
| **ARGML** (Association Rituelle de la Grande Mosquee de Lyon) | Moyenne-Haute | Adosse a une institution. |
| **Mosquee de Paris** | Controversee | Historiquement critique pour sa rigueur jugee insuffisante par certains. |
| **SFCVH** | Moyenne | Presence en Ile-de-France. |
| ... | ... | ... (13 autres) |

### Le Ranking des Certifiers — Un Choix Ethique

Le `relevanceScore` dans le router `store.nearby` donne un bonus aux commerces certifies :

```typescript
0.25 * CASE WHEN halal_certified THEN COALESCE(average_rating, 2.5) / 5.0 ELSE 0 END
```

**La question ethique** : Faut-il ponderer differemment selon le certifier ? Un commerce AVS devrait-il ranker plus haut qu'un commerce avec une certification moins exigeante ?

**Notre position actuelle** : Non. Tous les certifiers sont traites egalement dans le ranking. La raison :
1. Nous n'avons pas la legitimite pour juger la rigueur des certifiers
2. Creer une hierarchie officielle nous exposerait a des poursuites juridiques
3. L'utilisateur peut filtrer par certifier et faire son propre choix

**Notre position future (a debattre)** : Afficher des metriques objectives (frequence de controles, nombre de retraits de certification, transparence des methodes) sans creer de "note" explicite. Laisser l'utilisateur conclure.

---

## 6. OpenFoodFacts — Notre Source Principale et Ses Limites

### Ce qu'on exploite

| Champ OFF | Usage dans Optimus |
|-----------|-------------------|
| `product_name`, `brands` | Affichage principal |
| `ingredients_text` | **ANALYSE HALAL** — parsing des mots-cles |
| `additives_tags` | **CROISEMENT ADDITIFS** — lookup dans notre base |
| `labels_tags` | Detection labels halal explicites |
| `nutriscore_grade`, `nova_group`, `ecoscore_grade` | Badges sante/environnement |
| `allergens_tags`, `traces` | Alertes allergenes (profil sante) |
| `image_front_url` | Image produit |

### Ce qu'on n'exploite PAS encore (opportunites)

| Champ OFF | Potentiel |
|-----------|-----------|
| `manufacturing_places` | Tracabilite — ou est fabrique le produit |
| `origins` | Origine des ingredients — pertinent pour la confiance |
| `stores` | Cross-reference avec notre carte — quels magasins vendent ce produit |
| `ingredients_text_fr` | Affichage localise des ingredients |
| `ingredients_analysis_tags` | Detection auto huile de palme, vegan, vegetarien |

### Le Cold Start Problem

OpenFoodFacts couvre bien les produits de grande distribution (Nutella, Coca-Cola, Haribo) mais tres mal les produits ethniques et halal specifiques. Un "Merguez Isla Delice" a moins de chances d'etre dans OFF qu'un "Nutella".

**Solution en place** : Quand un produit n'est pas dans OFF, l'utilisateur voit "Produit inconnu — aidez-nous !" avec un formulaire pour contribuer (photo + ingredients). Le backend cree une `analysis_request` pour review manuelle.

**Solution a terme** : Partenariats directs avec les marques halal (Isla Delice, Reghalal, Samia, Oriental Viandes) pour alimenter notre base en priorite.

---

## 7. Le Ilm comme Responsabilite Continue

Le savoir n'est pas statique. Les additifs changent de formulation, les certifications evoluent, les avis des savants se nuancent. Notre responsabilite est de maintenir la base vivante :

### Mecanismes de mise a jour

1. **Seed automatique a chaque deploy** : `entrypoint.js` → `run-all.ts` → upsert idempotent
2. **Contribution utilisateur** : Signalement d'erreurs, ajout de produits, photos de certificats
3. **Veille editoriale** : Alertes Al-Kanz, RappelConso, mises a jour reglementaires
4. **Future** : Pipeline de scraping automatise pour les certifiers (listes AVS, Achahada)

### Le Reve : Le Conseil Scientifique et Religieux

A terme, Optimus Halal devrait disposer d'un **comite consultatif** compose de :
- 2-3 savants reconnus (un par madhab majoritaire en France : Hanafi, Maliki)
- 1 chimiste alimentaire specialise en additifs
- 1 juriste specialise en droit alimentaire et religieux

Ce comite validerait les rulings les plus sensibles et servirait de caution scientifique et religieuse. C'est la condition pour passer de "app utile" a "reference de confiance".

> "Celui qui emprunte un chemin a la recherche du savoir, Allah lui facilite un chemin vers le Paradis."
> — Hadith rapporte par Muslim
