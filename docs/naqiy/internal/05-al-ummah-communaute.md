# Al-Ummah (الامة) -- La Communaute

> *"Les croyants, dans leur amour mutuel, leur compassion et leur
> solidarite, sont comme un seul corps : si un membre souffre,
> tout le corps veille et se consume de fievre."*
> -- Hadith rapporte par Al-Bukhari et Muslim, d'apres An-Nu'man ibn Bashir (ra)

---

## La communaute comme infrastructure

L'Ummah -- la communaute des croyants -- n'est pas un concept
abstrait dans l'islam. C'est une obligation operationnelle : chaque
croyant est responsable de son prochain. Dans le contexte de Naqiy,
la communaute n'est pas une "feature" ajoutee pour l'engagement --
c'est le moteur de verification de la donnee elle-meme.

Un algorithme seul ne peut pas garantir la verite d'un verdict
halal. La communaute peut. Quand 47 utilisateurs ont scanne le
meme produit et que 3 d'entre eux signalent une erreur, cette
information communautaire a plus de valeur que n'importe quel
scraping automatise. C'est le principe du `communityVerifiedCount`
retourne par chaque scan : le nombre d'AUTRES utilisateurs qui
ont verifie ce meme produit.

Ce chapitre documente les mecanismes communautaires existants, les
defis de moderation, la vision de long terme, et le chemin de
l'utilisateur de consommateur passif a gardien actif de la verite
halal.

---

## Les trois mecanismes communautaires

### 1. Les signalements (Reports)

Le systeme de signalements est le canal par lequel la communaute
corrige les erreurs de la machine.

**Schema de la table `reports` :**

Un signalement contient :
- `type` : le type d'erreur detectee
- `productId` ou `storeId` : la cible du signalement
- `title` : titre court (5-255 caracteres)
- `description` : detail (10-2000 caracteres)
- `photoUrls` : jusqu'a 5 photos de preuve
- `userId` : l'auteur du signalement

**Les 5 types de signalements :**

| Type                    | Signification                              |
|-------------------------|--------------------------------------------|
| `incorrect_halal_status`| Le statut halal affiche est faux            |
| `wrong_ingredients`     | La liste d'ingredients ne correspond pas   |
| `missing_product`       | Le produit n'est pas dans la base           |
| `store_issue`           | Probleme avec un commerce (ferme, etc.)    |
| `other`                 | Tout autre signalement                     |

**Implementation (`report.ts`) :**

La procedure `createReport` est une `protectedProcedure` --
l'utilisateur doit etre authentifie pour signaler. Cela previent
les signalements de spam anonymes. La validation Zod impose des
contraintes strictes :

```typescript
z.object({
  type: z.enum([
    "incorrect_halal_status",
    "wrong_ingredients",
    "missing_product",
    "store_issue",
    "other",
  ]),
  productId: z.string().uuid().optional(),
  storeId: z.string().uuid().optional(),
  title: z.string().trim().min(5).max(255),
  description: z.string().trim().min(10).max(2000),
  photoUrls: z.array(z.string().url()).max(5).optional(),
})
```

Le minimum de 10 caracteres pour la description force un effort
de qualite : pas de signalements vides ou de "c'est faux" sans
explication.

**L'ecran de signalement (`app/report.tsx`) :**

L'ecran est accessible depuis `scan-result.tsx` via un bouton
"Signaler une erreur". Il guide l'utilisateur a travers un
formulaire structure avec :
- Selection du type d'erreur
- Champ titre pre-rempli si possible
- Zone de texte libre pour le detail
- Upload de photos (camera ou galerie via `useImageUpload`)

### 2. Les avis (Reviews)

Les avis sont le mecanisme de notation communautaire pour les
produits et les commerces.

**Structure d'un avis :**

- `productId` ou `storeId` : la cible de l'avis
- `rating` : note de 1 a 5 (entier, valide par Zod)
- `comment` : texte optionnel (max 2000 caracteres)
- `photoUrls` : jusqu'a 5 photos
- `helpfulCount` : compteur de votes "utile"

**Impact sur les commerces :**

Quand un avis concerne un commerce, la transaction de creation
recalcule atomiquement la moyenne du commerce :

```typescript
return ctx.db.transaction(async (tx) => {
  const [review] = await tx
    .insert(reviews)
    .values({ ...input, userId: ctx.userId })
    .returning();

  if (input.storeId) {
    const [stats] = await tx
      .select({
        avg: sql<number>`AVG(${reviews.rating})::float`,
        count: sql<number>`count(*)::int`,
      })
      .from(reviews)
      .where(eq(reviews.storeId, input.storeId));

    await tx
      .update(stores)
      .set({
        averageRating: stats.avg,
        reviewCount: stats.count,
      })
      .where(eq(stores.id, input.storeId));
  }
  return review;
});
```

Cette approche transactionnelle garantit que `averageRating` et
`reviewCount` dans la table `stores` sont toujours cohrents. Pas
de race condition possible entre deux avis simultanes.

**Le vote "utile" :**

Chaque avis peut recevoir des votes "utile" via `markHelpful`.
Le systeme deduplique par `(reviewId, userId)` via
`onConflictDoNothing()` -- un utilisateur ne peut voter qu'une
fois par avis. Le `helpfulCount` est incremente atomiquement.

Ce mecanisme permet a la communaute de faire remonter les avis
les plus pertinents. A terme, les avis avec le plus de votes
"utile" seront affiches en premier.

### 3. Le systeme de boycott

Le boycott est le mecanisme communautaire le plus politiquement
sensible de Naqiy. Il permet aux utilisateurs de prendre des
decisions d'achat ethiques en croisant les marques scannees avec
une base de cibles de boycott.

**Schema `boycott_targets` :**

| Colonne           | Type            | Role                          |
|-------------------|-----------------|-------------------------------|
| `company_name`    | varchar(255)    | Nom de l'entreprise           |
| `brands`          | text[]          | Marques possedees             |
| `parent_company`  | varchar(255)    | Maison-mere                   |
| `sector`          | varchar(100)    | Secteur d'activite            |
| `boycott_level`   | enum            | Niveau de boycott             |
| `severity`        | varchar(20)     | Gravite (warning par defaut)  |
| `reason`          | text            | Raison detaillee              |
| `reason_summary`  | varchar(500)    | Resume court                  |
| `source_url`      | text            | Source de l'information        |
| `source_name`     | varchar(100)    | Nom de la source              |
| `barcode_prefix`  | text[]          | Prefixes de codes-barres      |
| `off_brand_tags`  | text[]          | Tags OFF des marques          |
| `verified_by`     | varchar(100)    | Verificateur                  |

**Les 4 niveaux de boycott :**

| Niveau          | Signification                                  |
|-----------------|-------------------------------------------------|
| `official_bds`  | Boycott officiel BDS (mouvement international) |
| `grassroots`    | Boycott de base communautaire                  |
| `pressure`      | Campagne de pression (pas boycott total)       |
| `community`     | Signalement communautaire local                |

**Detection automatique au scan :**

La fonction `checkBoycott()` dans `scan.ts` est appelee a chaque
scan. Elle fait une recherche fuzzy bidirectionnelle :

```sql
EXISTS (
  SELECT 1 FROM unnest(brands) AS b
  WHERE lower(b) = $brandLower
  OR $brandLower LIKE '%' || lower(b) || '%'
  OR lower(b) LIKE '%' || $brandLower || '%'
)
```

Si une correspondance est trouvee, le resultat du scan inclut
un bloc `boycott` avec les details : nom de l'entreprise, niveau,
raison, source. L'information est presentee de maniere factuelle,
sans injonction : "Cette marque apparait sur la liste BDS" -- pas
"Ne consommez pas ce produit".

**Cache Redis :**

La liste de boycott est cachee 1h (`withCache` dans `boycott.ts`
pour la premiere page). Le boycott change rarement -- une heure
de cache est un bon compromis entre fraicheur et performance.

**L'ecran de boycott (`settings/boycott-list.tsx`) :**

L'utilisateur peut consulter la liste complete des cibles de
boycott, filtrer par niveau, et voir les details de chaque entree.
Les sources sont toujours citees avec URL pour la verifiabilite.

---

## Les incentives de contribution

### XP par type d'action

| Action       | XP gagnes | Justification                         |
|--------------|-----------|---------------------------------------|
| Scan         | 10        | Enrichit la base de donnees           |
| Review       | 20        | Contribue a la qualite communautaire  |
| Report       | 15        | Corrige les erreurs                   |
| Referral     | 30        | Etend la communaute                   |
| Streak bonus | Variable  | Fidelise l'engagement                 |
| Achievement  | Variable  | Recompense les milestones             |

Le schema `point_action` enum liste les 8 types d'actions
recompensees. Les points sont stockes comme transactions dans
`point_transactions` avec des valeurs positives (gains) et
negatives (echanges de recompenses).

### Les recompenses (Rewards)

La table `rewards` contient le catalogue des recompenses
echangeables :

- `name` / `name_fr` / `name_ar` : nom multilingue
- `description` / `description_fr` : description
- `points_cost` : cout en points
- `category` : categorie de recompense
- `partner_id` / `partner_name` : commercant partenaire
- `total_quantity` / `remaining_quantity` : gestion de stock
  atomique (decrementation concurrentielle securisee)
- `expires_at` : date d'expiration

L'echange est securise par une transaction :
1. Verification du solde de points
2. Decrementation atomique du stock (`WHERE remaining_quantity > 0`)
3. Deduction des points
4. Generation d'un code de redemption cryptographique (UUID tronque
   a 10 caracteres majuscules)

### Les badges (Achievements)

La table `achievements` definit des jalons deblocables :

- Structure JSONB `requirement` : `{ type: "scans", count: 100 }`
- `points_reward` : bonus de points au deblocage
- `sort_order` : ordre d'affichage dans l'ecran
  `settings/achievements.tsx`

Le deblocage est stocke dans `user_achievements` avec timestamp
`unlocked_at`. L'ecran affiche les badges debloques (lumineux) et
les badges verrouilles (grises) pour creer une motivation visuelle.

---

## La moderation : le defi central

### Le probleme

Toute plateforme communautaire fait face au meme dilemme :
l'ouverture invite la contribution ET l'abus. Dans le contexte
halal, les risques specifiques sont :

1. **Faux signalements malveillants :** Un concurrent qui signale
   systematiquement des produits comme haram pour nuire.
2. **Avis sectaires :** Un utilisateur d'une ecole qui denigre les
   commerces certifies par une autre ecole.
3. **Spam promotionnel :** Des commercants qui postent de faux avis
   positifs sur leurs propres boutiques.
4. **Contenu offensant :** Insultes, discours de haine, propos
   discriminatoires dans les commentaires.
5. **Manipulation du boycott :** Ajouts non sources ou
   ideologiquement motives a la liste de boycott.

### Les garde-fous actuels

**Authentification obligatoire :** Toutes les actions communautaires
(signalement, avis, vote) sont des `protectedProcedure`. Pas de
contribution anonyme.

**Validation Zod stricte :** Longueurs minimales et maximales,
formats valides, nombre limite de photos. Empeche le spam brut.

**Deduplification des votes :** Le `markHelpful` utilise
`onConflictDoNothing` pour empecher les votes multiples. Un
utilisateur = un vote.

**Boycott verifie :** Le champ `verified_by` dans `boycott_targets`
indique qui a verifie l'entree. `source_url` et `source_name`
obligent la citation des sources. Seul l'admin peut ajouter des
cibles de boycott (pas d'endpoint public de creation).

**Rate limiting :** Le middleware Hono avec Redis empeche le spam
par flood de requetes.

### Ce qui manque (roadmap moderation)

- **Moderation automatique des textes :** Filtre de mots interdits
  et detection de toxicite sur les commentaires d'avis et les
  descriptions de signalements.
- **Systeme de reputation utilisateur :** Score de confiance base
  sur l'historique de contributions (signalements confirmes vs
  rejetes). Les utilisateurs a haute reputation voient leurs
  signalements traites en priorite.
- **File de moderation admin :** Interface d'administration pour
  revoir les signalements, valider/rejeter, sanctionner les abus.
  Actuellement inexistante -- tous les signalements sont stockes
  mais non traites automatiquement.
- **Appel communautaire :** Mecanisme pour contester une decision
  de moderation.

---

## La vision long terme : verification communautaire

### Phase 1 : Consommateurs passifs (actuel)

L'utilisateur scanne, recoit un verdict algorithmique, et peut
laisser un avis ou un signalement. La communaute contribue mais ne
corrige pas directement les donnees.

### Phase 2 : Contributeurs actifs (Q2-Q3 2026)

- Les utilisateurs confirmes (niveau 5+, > 100 scans, > 5
  signalements confirmes) deviennent des "Contributeurs".
- Les Contributeurs peuvent soumettre des corrections sur la base
  d'additifs (exemple : "Le E471 de la marque X est d'origine
  vegetale, voici la preuve").
- Les corrections sont soumises a validation par un quorum de 3
  Contributeurs ou un Administrateur.

### Phase 3 : Gardiens / Verificateurs (2027)

- Les utilisateurs de tres haute reputation (niveau 8+, > 500
  scans, > 20 signalements confirmes, zero signalement rejete)
  deviennent des "Gardiens" (Muhtasib -- l'inspecteur des marches
  dans la tradition islamique).
- Les Gardiens peuvent :
  - Valider ou rejeter les signalements des autres utilisateurs
  - Proposer des ajouts a la base d'additifs
  - Verifier physiquement des commerces (avec photo geotaguee)
  - Acceder a un tableau de bord Gardien (future web app)

### Phase 4 : Autorite communautaire (2028+)

- La communaute Naqiy devient une autorite de fait sur le halal
  alimentaire en France.
- Les donnees communautaires (produits scannes, commerces verifies,
  additifs documentes) sont publiees en open data.
- Les organismes de certification consultent les rapports
  communautaires pour leurs audits.
- Naqiy evolue d'un outil vers une institution de confiance.

### Les roles utilisateur

| Role          | Seuils                         | Capacites                       |
|---------------|--------------------------------|---------------------------------|
| Utilisateur   | Inscription                    | Scan, avis, signalement         |
| Contributeur  | Niveau 5+, 100+ scans         | Corrections, review prioritaire |
| Gardien       | Niveau 8+, 500+ scans         | Moderation, verification terrain|
| Administrateur| Designe manuellement           | Acces complet, gestion boycott  |

---

## Le compteur communautaire

Chaque resultat de scan inclut un `communityVerifiedCount` :

```typescript
const [communityCount] = await ctx.db
  .select({ count: sql<number>`count(DISTINCT ${scans.userId})::int` })
  .from(scans)
  .where(
    and(
      eq(scans.barcode, input.barcode),
      sql`${scans.userId} != ${ctx.userId}`
    )
  );
```

Ce compteur dit : "47 autres utilisateurs ont scanne ce produit."
Il fonctionne comme un signal de confiance sociale -- plus le
nombre est eleve, plus l'utilisateur se sent en securite avec le
verdict. C'est le meme principe que le nombre de telechargements
d'une app : la validation par les pairs.

**Privacy :** Le compteur est un COUNT DISTINCT, pas une liste.
L'utilisateur ne peut jamais savoir QUI a scanne. Le `userId`
courant est explicitement exclu du calcul.

---

## Les 212+ commerces : une communaute physique

### L'etat de la base

La table `stores` contient 212+ commerces halal verifies en France,
provenant de :
- **Seeds automatises :** Donnees des organismes de certification
  (AVS, Achahada) importees via les fichiers de seed
  (`backend/src/db/seeds/stores-halal.ts`, `seed-stores.ts`)
- **Source metadata :** Chaque commerce importe a un `source_id`
  et `source_type` pour la tracabilite

### Les 8 types de commerces

| Type          | Icone              | Couleur   |
|---------------|--------------------|-----------|
| Boucherie     | restaurant         | Rouge     |
| Restaurant    | restaurant-menu    | Orange    |
| Supermarche   | shopping-cart      | Bleu      |
| Boulangerie   | bakery-dining      | Or        |
| Abattoir      | agriculture        | Violet    |
| Grossiste     | local-shipping     | Cyan      |
| En ligne      | language           | Vert      |
| Autre         | store              | Gris      |

### Les horaires (store_hours)

La table `store_hours` stocke les horaires d'ouverture par jour
de la semaine (0=dimanche, 6=samedi). Le format est simple :
`open_time` / `close_time` en `HH:MM`, ou `is_closed = true`.

**Limitation connue :** La requete d'horaires utilise
`EXTRACT(DOW FROM NOW())` qui est en UTC. A 1h du matin heure de
Paris, le DOW est celui de la veille en UTC. Correction planifiee :
utiliser `AT TIME ZONE 'Europe/Paris'`.

### Enrichissement communautaire futur

A terme, les Gardiens pourront :
- Ajouter de nouveaux commerces avec photo + position GPS
- Mettre a jour les horaires d'un commerce existant
- Confirmer ou infirmer la certification halal affichee
- Signaler la fermeture definitive d'un commerce

---

## Le defi de la neutralite communautaire

### Le risque sectaire

La communaute musulmane francaise est diverse : origines
maghrebines, subsahariennes, turques, asiatiques. Traditions
hanafites, malikites, shafi'ites, hanbalites. Niveaux de pratique
varies. Cette diversite est une richesse, mais elle est aussi un
risque de conflits internes.

**Comment Naqiy gere ce risque :**

1. **Le madhab est personnel.** Le champ `madhab` est dans le
   profil utilisateur, pas dans les avis publics. Un avis sur un
   commerce ne mentionne pas le madhab de l'auteur.

2. **Les verdicts sont comparatifs.** Le tableau `madhabVerdicts`
   montre les 4 ecoles cote a cote. Personne ne dit "mon avis est
   le seul valable".

3. **Le leaderboard est anonyme.** Le hash SHA-256 sur les IDs
   empeche les clivages communautaires ("les Hanafites sont en tete").

4. **Les signalements sont factuels.** Le type `incorrect_halal_status`
   demande des preuves (description, photos), pas des opinions.

### Le risque politique

Le systeme de boycott est inheremment politique. Naqiy prend le
parti de la transparence : les sources sont toujours citees, les
niveaux de boycott sont explicites (officiel BDS vs communautaire),
et l'information est presentee sans injonction.

Nous ne disons pas "boycottez cette marque". Nous disons "cette
marque apparait sur la liste X, source Y, pour la raison Z". La
decision d'achat reste individuelle.

---

## Metriques communautaires cibles

| Metrique                     | Cible 6 mois | Cible 12 mois |
|------------------------------|--------------|---------------|
| Utilisateurs inscrits        | 10 000       | 50 000        |
| Scans mensuels               | 100 000      | 500 000       |
| Produits uniques scannes     | 15 000       | 50 000        |
| Signalements soumis          | 500          | 2 000         |
| Avis publies                 | 1 000        | 5 000         |
| Commerces references         | 500          | 2 000         |
| Contributeurs (niveau 5+)    | 100          | 500           |
| Gardiens (niveau 8+)         | 10           | 50            |

Ces cibles sont ambitieuses mais realistes pour un marche de 5-6M
de personnes. Un taux de penetration de 1% en 12 mois donnerait
50 000 utilisateurs -- notre cible haute.

---

## L'Ummah numerique

La communaute Naqiy n'est pas un forum, pas un reseau social, pas
un groupe WhatsApp. C'est un collectif structure autour d'une
mission : rendre la verite halal accessible a tous.

Chaque scan enrichit la base commune. Chaque signalement corrige
une erreur. Chaque avis guide un autre consommateur. Chaque
verification de commerce ajoute un point de confiance sur la carte.

Le hadith de l'epigraphe decrit l'Ummah comme un corps unique.
Naqiy est le systeme nerveux de ce corps : il transmet l'information,
detecte la douleur, et coordonne la reponse. Pas de hierarchie
centralisee, pas de fatwa unilaterale -- une intelligence
collective au service de la purete.

---

*Document interne Naqiy -- Version 1.0 -- Fevrier 2026*
*Classification : Strategique -- Diffusion restreinte*
