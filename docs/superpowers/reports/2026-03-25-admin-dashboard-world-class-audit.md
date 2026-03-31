# Audit World-Class du Dashboard Admin `/web/admin`

Date: 2026-03-25  
Benchmark: mix spec interne approuvée + standard world-class de back-office  
Référentiel implicite: Stripe / Linear / Shopify / Vercel pour la rigueur opératoire  
Persona prioritaire: fondateur / ops  
Mode d'évidence: code + spec d'abord, avec vérification du build et du HTML SSR généré

## Verdict exécutif

**Note globale: 4.0 / 10**

Le dashboard admin actuel n'est **pas un cockpit opératoire**. C'est une **façade admin consultative**, propre dans l'intention, mais très en-dessous d'un standard world-class et très loin de la spec approuvée.

Le problème principal n'est pas l'esthétique de base. Le problème principal est l'**écart entre ce que l'interface suggère et ce qu'elle permet réellement d'exécuter**:

- le back-office est **majoritairement read-only**
- plusieurs surfaces critiques sont **décoratives ou inertes**
- une partie du dashboard consomme des **routers publics** au lieu d'une vraie surface admin spécialisée
- l'architecture d'auth et de rendu est **client-side, statique et fragile** pour un outil d'administration
- l'écart avec la spec “comprehensive admin dashboard” est **massif**

En une phrase:

> **Aujourd'hui, c'est un tableau de consultation admin, pas un centre de contrôle pour piloter l'app mobile et le site web.**

Estimation du niveau actuel vs cible world-class:

- efficacité opérateur réelle: **25-30%**
- profondeur fonctionnelle admin: **20-25%**
- crédibilité technique du back-office: **35-40%**
- qualité UI perçue: **55-60%**

## Ce qui tient déjà debout

- Le socle UI est propre, cohérent, lisible, avec une base de composants sérieuse.
- Les pages principales existent déjà: overview, produits, utilisateurs, magasins, articles, alertes, settings.
- Il y a un vrai middleware admin côté backend via `adminProcedure`.
- Les listes produits, magasins et utilisateurs ont une base utile: recherche, filtres simples, pagination.
- `pnpm build` et `pnpm lint` passent sur `web`, donc le socle n'est pas instable.

## Ce qui bloque immédiatement un niveau world-class

- **Le dashboard ne permet presque rien d'opérationnel.** Hors login, l'admin peut surtout lire des listes.
- **Le SSR des routes admin est dégradé.** Le HTML buildé de `/admin/login` et des autres pages admin rend un spinner, pas l'écran utile.
- **L'interface promet plus qu'elle ne livre.** Exemples: recherche globale, notifications, “Nouvel article”, boutons “Enregistrer”.
- **L'admin n'est pas réellement isolé comme prévu.** Le client web admin pointe encore vers `/trpc` partagé et réutilise plusieurs routers publics.
- **La spec approuvée n'est pas simplement incomplète: elle est largement absente dans l'implémentation actuelle.**

## Scorecard

| Axe | Score | Niveau world-class attendu | Écart concret | Impact opérationnel | Sévérité |
| --- | --- | --- | --- | --- | --- |
| Architecture de navigation et efficacité opérateur | 4.4/10 | Un shell qui sert de tour de contrôle, orienté tâches et priorités | Navigation courte, mais modules majeurs absents; recherche et notifications décoratives | Perte de temps, faux sentiment de contrôle | P1 |
| Vue d'ensemble / KPI / capacité de pilotage | 3.6/10 | Dashboard de décision avec tendances, anomalies, actions immédiates | 4 KPI simples, pas de trends, pas de charts, pas d'actions, plusieurs libellés trompeurs | Pilotage produit faible | P0 |
| Gestion produits | 3.2/10 | CRUD, overrides, détails complets, audit trail, export | Simple table read-only branchée sur `product.search` public | Impossible de corriger ou gouverner la donnée | P0 |
| Gestion utilisateurs / support / abonnements | 4.3/10 | Profil complet + actions support/subscription/GDPR | Une table, aucun profil, aucune action, aucun bulk | Support et ops client impossibles | P0 |
| Gestion magasins / réseau halal | 3.5/10 | Liste + carte + édition + import + revue | Table consultative branchée sur `store.search` public | Gestion réseau quasi nulle | P1 |
| Gestion contenu site web / blog CMS | 2.4/10 | Vrai CMS CRUD avec draft/review/publish/media/SEO | Liste de cartes uniquement, CTA inert, router public qui ne renvoie que les articles publiés | Impossible de gérer réellement le site web | P0 |
| Alertes / incidents / trust & safety | 3.3/10 | Triage, ack, ownership, historique, priorisation | Feed public filtrable, sans workflow d'action ni modération | Gestion incident superficielle | P1 |
| Settings / feature flags / configuration / releases | 1.8/10 | Command center de config et releases | Pseudo-formulaires statiques, aucune persistance visible, releases absentes | Aucun contrôle runtime crédible | P0 |
| Recherche, filtres, pagination, bulk actions | 4.9/10 | Recherche transverse, bulk operations, raccourcis, tri utile | Filtres simples présents, mais pas de bulk, pas de recherche globale réelle, peu de tri UI | Gains de productivité limités | P1 |
| Auth admin, RBAC, sécurité, auditabilité | 4.2/10 | Auth dédiée, server-guarded, auditée, clairement séparée | Auth client-side via localStorage, pages statiques, pas d'audit trail UI, isolation admin partielle | Risque de crédibilité et d'exploitation | P1 |
| Qualité visuelle, lisibilité, densité data, cohérence desktop | 5.8/10 | Data-dense, sophistiqué, hiérarchisé, ultra opérable | UI propre mais encore générique, peu dense, peu orientée monitoring | Perception “outil interne basique” | P2 |
| Alignement entre promesse spec et réalité implémentée | 2.0/10 | Implémentation fidèle de la vision approuvée | Une large partie des modules, flows et garanties annoncés n'existent pas | Dette stratégique et confusion d'équipe | P0 |

## Audit chirurgical

### 1. Ce qu'un fondateur / ops peut réellement faire aujourd'hui

En pratique, il peut:

- se connecter avec un compte utilisateur qui existe déjà puis vérifier son statut admin
- voir 4 compteurs globaux
- consulter les derniers scans
- parcourir des listes de produits, utilisateurs, magasins, alertes et articles
- filtrer un peu ces listes
- se déconnecter

En pratique, il ne peut pas vraiment:

- corriger un produit
- overrider un verdict
- exporter proprement des données
- gérer un incident de production ou de contenu
- piloter les releases mobile
- activer ou désactiver des feature flags crédibles
- gérer un brouillon d'article avec workflow éditorial
- traiter un support user ou une action abonnement
- modérer, assigner, historiser, auditer

Le dashboard facilite aujourd'hui la **lecture de l'état apparent** du produit, pas sa **gestion opérationnelle**.

### 2. Le shell admin donne une illusion de cockpit, mais il manque la moitié du cockpit

Le shell est propre visuellement, mais il n'est pas encore un outil d'ops.

Constats:

- la navigation ne contient ni `events`, ni `releases`, ni `database`, ni `certifiers`, pourtant prévus dans la spec
- le champ “Rechercher...” du header n'est pas relié à un état ou une recherche transverse (`web/src/app/admin/layout.tsx:143-150`)
- le bouton notifications n'est connecté à aucun flux (`web/src/app/admin/layout.tsx:153-157`)
- la sidebar ne priorise ni incidents, ni tâches urgentes, ni activités critiques

Le shell ressemble à un admin standard de template. Il ne ressemble pas à un back-office qui sait ce qui est urgent.

### 3. Overview: joli résumé, mais très faible capacité de décision

La page overview consomme seulement:

- `stats.global`
- `alert.list`
- `admin.recentScans`

Références:

- `web/src/app/admin/page.tsx:121-123`
- `backend/src/trpc/routers/stats.ts:13-52`
- `backend/src/trpc/routers/admin.ts:87-106`

Problèmes majeurs:

- pas de tendance temporelle
- pas de segmentation
- pas de funnel
- pas de performance web
- pas de statut releases mobile
- pas de statut cron / jobs / sync / imports
- pas d'alerting opératoire

Deux problèmes de crédibilité métier:

- le KPI “Utilisateurs actifs” affiche en réalité le total des utilisateurs `isActive = true`, pas des actifs 7 jours (`web/src/app/admin/page.tsx:113-118`, `backend/src/trpc/routers/stats.ts:19-23`)
- le KPI “Magasins verifies” affiche en réalité le nombre de stores actifs, pas des stores “vérifiés” (`web/src/app/admin/page.tsx:113-118`, `backend/src/trpc/routers/stats.ts:32-35`)

Troisième problème:

- le bloc “Alertes actives” charge `limit: 3` mais affiche ensuite “X alertes en cours” avec `items.length`, donc le compteur peut sous-estimer le vrai volume (`web/src/app/admin/page.tsx:122`, `web/src/app/admin/page.tsx:232-236`, `backend/src/trpc/routers/alert.ts:12-18`, `backend/src/trpc/routers/alert.ts:44-57`)

Ce sont de petits détails en code, mais de gros signaux d'un dashboard qui n'est pas encore digne d'être une source de vérité.

### 4. Produits: l'interface dit “gérez”, la réalité dit “consultez”

La page produits est utile comme outil de lecture rapide. Elle n'est pas un module de gestion.

Ce qui existe:

- recherche
- filtre halal
- pagination
- colonnes de base

Ce qui manque par rapport à la spec:

- détail produit admin
- override halal_status
- flagging
- export CSV
- audit trail
- filtres avancés
- barre de stats

Le point structurel important est ici:

- la page admin consomme `trpc.product.search`
- ce router est **public** (`web/src/app/admin/products/page.tsx:103-108`, `backend/src/trpc/routers/product.ts:33-82`)

Autrement dit: la surface “admin produits” n'est pas une vraie surface admin produits. C'est une vue admin posée sur une recherche catalogue publique.

### 5. Utilisateurs: meilleur point du dashboard actuel, mais encore très loin d'un module support

La page utilisateurs est l'une des rares à utiliser un vrai router admin (`web/src/app/admin/users/page.tsx:68-73`, `backend/src/trpc/routers/admin.ts:13-82`).

Ce qui marche:

- pagination
- recherche
- filtre tier
- données de base utiles

Ce qui manque:

- profil utilisateur
- scan history détaillée
- support tooling
- actions abonnement
- ban / unban
- reset password
- GDPR delete
- bulk actions

Il y a aussi un défaut d'implémentation:

- le debounce de recherche est incorrect: `handleSearch` crée un `setTimeout`, retourne une cleanup function, mais cette cleanup n'est jamais utilisée (`web/src/app/admin/users/page.tsx:75-82`)

Résultat probable:

- timeouts concurrents
- mises à jour tardives
- requêtes potentiellement redondantes

Ce n'est pas le plus grave du dashboard, mais cela montre un niveau d'exécution encore insuffisant pour un outil admin censé faire gagner du temps.

### 6. Magasins: bonne lecture catalogue, aucun vrai pilotage réseau

La page magasins est propre et lisible, mais elle reste une table consultative.

Ce qui manque vs spec:

- map view
- édition d'un store
- lien certifier
- flag for review
- import bulk
- revue qualité

Point structurel identique aux produits:

- la page admin consomme `trpc.store.search`
- ce router est **public** (`web/src/app/admin/stores/page.tsx:95-100`, `backend/src/trpc/routers/store.ts:14-74`)

L'admin magasins n'est donc pas encore un module d'opérations réseau halal. C'est une projection tabulaire d'un endpoint de recherche public.

### 7. Articles: c'est le point le plus trompeur du dashboard

Le module articles se présente comme une “gestion du contenu éditorial Naqiy”, avec un CTA “Nouvel article”. En réalité, ce n'est pas un CMS.

Faits:

- la page consomme `trpc.article.list` (`web/src/app/admin/articles/page.tsx:74-77`)
- ce router est **public**
- il filtre explicitement `articles.isPublished = true` (`backend/src/trpc/routers/article.ts:18-20`)

Conséquences:

- l'admin ne peut pas voir les vrais drafts
- le badge “Brouillon” dans l'UI est pratiquement sans fondement opérationnel (`web/src/app/admin/articles/page.tsx:127-130`)
- le bouton “Nouvel article” n'a aucun wiring (`web/src/app/admin/articles/page.tsx:90-93`)
- il n'y a ni éditeur, ni preview, ni media upload, ni SEO fields, ni workflow

Sur ce point, l'écart entre ce que l'écran promet et ce qu'il fait réellement est majeur.

### 8. Alertes: lecture, pas gestion d'incident

La page alertes est propre visuellement. Elle ne constitue pas un vrai module trust & safety.

Constats:

- consommation de `trpc.alert.list`, router public (`web/src/app/admin/alerts/page.tsx:68-71`, `backend/src/trpc/routers/alert.ts:12-58`)
- aucun ack
- aucune assignation
- aucune dismissal admin
- aucun statut de traitement
- aucune distinction entre alerte vue / en cours / résolue
- aucune traçabilité opérateur

Le module montre des cartes, pas un workflow de traitement.

### 9. Settings: surface la plus “fake admin” du lot

La page settings est la plus problématique en termes de crédibilité produit.

Pourquoi:

- les valeurs sont majoritairement hardcodées
- les switches n'ont pas de source de vérité visible
- les boutons “Enregistrer” ne déclenchent aucune mutation
- aucune persistance n'apparaît
- aucun module releases n'existe
- aucun cron status n'existe
- aucun vrai feature flag system n'est branché

Références:

- `web/src/app/admin/settings/page.tsx:29-239`

Cette page donne l'illusion d'un centre de contrôle plateforme. En réalité, c'est un mock fonctionnellement vide.

### 10. Le problème d'architecture le plus sérieux: le back-office est statique, client-side et mal séparé

Le point le plus important du rapport n'est pas purement visuel. Il est architectural.

#### 10.1 Les routes admin sont générées comme contenu statique

Le build Next marque `/admin`, `/admin/login`, `/admin/products`, etc. comme routes statiques.  
Ce n'est pas illégal, mais c'est un très mauvais signal pour un dashboard censé être auth-protected et piloté côté serveur.

#### 10.2 Le HTML SSR admin ne rend pas l'écran utile, seulement un spinner

Cause:

- `AdminLayout` affiche d'abord un loading state (`web/src/app/admin/layout.tsx:54-61`)
- `isLoading` vaut `true` côté serveur car défini comme `typeof window === "undefined"` (`web/src/lib/admin-auth.tsx:109`)

Effet observable:

- le HTML buildé de `/admin/login` rend un spinner centré, pas le formulaire de login
- le même problème se retrouve sur les autres pages admin buildées

Preuves:

- `web/.next/server/app/admin/login.html`
- `web/src/app/admin/layout.tsx:54-65`
- `web/src/lib/admin-auth.tsx:109`

Conséquence:

- premier rendu faible
- auth guard purement client-side
- impression d'outil admin non souverain

#### 10.3 Les métadonnées marketing fuient sur les pages admin

Le HTML buildé de `/admin/login` reprend encore:

- le title de la landing
- la canonical home
- `robots: index, follow`
- l'Open Graph de la landing
- le JSON-LD MobileApplication de la landing

Preuves:

- `web/src/app/layout.tsx:30-100`
- `web/.next/server/app/admin/login.html`
- `web/src/app/robots.ts:3-13`

Même si `robots.txt` disallow `/admin/`, l'hygiène SEO et la séparation des contextes restent faibles.

#### 10.4 L'isolation admin spécifiée n'est pas visible côté client web

La spec demande une vraie séparation admin:

- proxy admin dédié
- auth dédiée
- surface router admin isolée

Références spec:

- `docs/superpowers/specs/2026-03-18-naqiy-web-platform-design.md:248-260`
- `docs/superpowers/specs/2026-03-18-naqiy-web-platform-design.md:289-349`

État réel:

- le client web admin pointe vers `${getBaseUrl()}/trpc`
- il prend le bearer token depuis `localStorage`

Référence:

- `web/src/lib/trpc-provider.tsx:9-12`
- `web/src/lib/trpc-provider.tsx:27-40`

En plus, l'app root a déjà un `TRPCProvider`, puis l'admin layout en rajoute un second:

- `web/src/app/layout.tsx:167-171`
- `web/src/app/admin/layout.tsx:179-183`

Ce n'est pas catastrophique à lui seul, mais cela confirme une architecture encore bricolée au lieu d'une séparation nette.

## Alignement spec vs réalité

La spec approuvée parle d'un “comprehensive admin dashboard” gérant:

- produits
- users
- events
- releases
- stores
- certifiers
- articles CMS
- database explorer
- settings / cron / feature flags

Références:

- `docs/superpowers/specs/2026-03-18-naqiy-web-platform-design.md:187-237`
- `docs/superpowers/specs/2026-03-18-naqiy-web-platform-design.md:293-301`

État réel observé:

- `events`: absent
- `releases`: absent
- `certifiers`: absent
- `database explorer`: absent
- `product detail`: absent
- `user profile`: absent
- `article editor`: absent
- `store map`: absent
- `feature flags`: absents
- `cron status`: absent
- `settings` persistés: absents

Le dashboard actuel ne souffre donc pas d'un simple “manque de polish”. Il souffre d'un **manque de livraison fonctionnelle par rapport à la vision décidée**.

## Ce qu'il faut retenir côté crédibilité technique

- Le backend admin existe, mais il est très étroit: `listUsers`, `recentScans`, `checkAccess`, `list`, `grant`, `revoke`.
- Le frontend admin n'exploite presque pas cette surface.
- Plusieurs pages admin importantes reposent sur des endpoints publics.
- Aucun vrai workflow admin critique n'est visible ni testé.

Sur les tests:

- la spec prévoit des tests admin dédiés
- aucun test admin web ou backend significatif n'est visible dans le repo

## Top 10 écarts à traiter

1. **Le dashboard n'est pas actionnable.** La majorité des modules ne permettent aucune opération métier réelle. Impact: P0.
2. **Le module settings est une façade.** Les contrôles sont surtout statiques et non persistés. Impact: P0.
3. **Le module articles n'est pas un CMS.** Il repose sur `article.list` public filtré sur le publié. Impact: P0.
4. **L'overview n'est pas une source de vérité fiable.** KPI limités, libellés approximatifs, compteur d'alertes potentiellement faux. Impact: P0.
5. **Le SSR admin rend un spinner au lieu du contenu.** Cela dégrade fortement la crédibilité et le comportement d'un vrai back-office. Impact: P1.
6. **L'isolation admin est incomplète côté client.** Le web admin pointe encore vers `/trpc` partagé, avec auth client-side via localStorage. Impact: P1.
7. **Produits et magasins utilisent des routers publics.** L'admin n'a pas encore de gouvernance dédiée sur ces domaines. Impact: P1.
8. **Des éléments de shell sont décoratifs.** Recherche globale et notifications créent une promesse non tenue. Impact: P1.
9. **La promesse spec vs réalité est trop éloignée.** Cela crée du brouillage stratégique et produit. Impact: P1.
10. **L'hygiène metadata / SEO de l'admin est faible.** Les pages admin héritent encore de la landing. Impact: P2.

## Conclusion

Le dashboard admin actuel ne doit pas être évalué comme un “admin presque fini qu'il faut juste polisher”. Ce serait une erreur de lecture.

Il faut l'évaluer pour ce qu'il est aujourd'hui:

> **une base UI admin propre, avec quelques listes utiles, mais sans la profondeur, la fiabilité et la souveraineté d'un vrai back-office de pilotage produit.**

La bonne nouvelle est que la base n'est pas chaotique.  
La mauvaise nouvelle est que le chemin vers un niveau Stripe / Linear / Shopify n'est pas un travail de cosmétique. C'est une **refonte d'intention opérationnelle**, de séparation admin, de workflows et de surfaces d'action.

## Base d'évidence utilisée

- audit du code `web/src/app/admin/*`
- audit du code `web/src/lib/admin-auth.tsx`
- audit de `web/src/lib/trpc-provider.tsx`
- audit des routeurs backend `admin`, `stats`, `product`, `store`, `article`, `alert`
- comparaison avec `docs/superpowers/specs/2026-03-18-naqiy-web-platform-design.md`
- `pnpm build` sur `web`: OK
- `pnpm lint` sur `web`: OK
- inspection du HTML SSR buildé de `/admin/login` et des autres routes admin dans `web/.next/server/app/admin*.html`
