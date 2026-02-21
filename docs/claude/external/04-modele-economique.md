# Optimus Halal — Modele Economique

---

## Principe Fondateur

Le statut halal d'un produit est **toujours gratuit**. L'information religieuse ne se monnaie pas. La monetisation repose sur la **valeur ajoutee** au-dela du verdict de base.

---

## Sources de Revenu

### 1. B2C — Abonnement "Optimus+" (2,99 EUR/mois | 24,99 EUR/an)

| Gratuit (a vie) | Premium (Optimus+) |
|-----------------|-------------------|
| Scan illimite + verdict | Tout le gratuit + |
| Ingredients + additifs | Analyse chimique detaillee |
| Avis du madhab choisi | Historique de scans complet |
| Carte des commerces | Filtres avances carte |
| Alertes sanitaires | Mode hors-ligne |
| Gamification basique | Themes et badges exclusifs |
| 20 favoris | Favoris illimites |
| 1 signalement/jour | Signalements illimites |
| | Alertes push personnalisees |
| | Profil sante avance |
| | Support prioritaire |

**Logique** : Le gratuit resout le probleme. Le premium ameliore l'experience.

### 2. B2B — Commercants (9,90 a 29,90 EUR/mois)

| Offre | Prix | Contenu |
|-------|------|---------|
| Profil Verifie | 9,90 EUR/mois | Badge "Verifie par Optimus" |
| Profil Enrichi | 19,90 EUR/mois | Photos, menu, horaires, promotions |
| Visibilite Locale | 29,90 EUR/mois | Mise en avant locale + analytics |

**Garde-fou** : La visibilite payante apparait avec un badge "Sponsorise" et n'affecte jamais le classement organique.

### 3. B2B2C — Marques et Certificateurs

| Offre | Description |
|-------|-------------|
| Label "Verifie Optimus" | Certification apres audit reel |
| Contenu sponsorise | Articles educatifs marques |
| Donnees anonymisees | Tendances de consommation halal par region |

**Interdit** : Payer pour ameliorer un statut halal, supprimer des avis negatifs, ou masquer des signalements.

---

## Projections Financieres

### Hypotheses

| Parametre | An 1 | An 2 | An 3 |
|-----------|------|------|------|
| Utilisateurs actifs mensuels | 10 000 | 50 000 | 200 000 |
| Taux de conversion premium | 2% | 4% | 6% |
| Abonnes premium | 200 | 2 000 | 12 000 |
| Commercants B2B | 20 | 150 | 500 |
| ARPU premium | 2,99 EUR | 2,99 EUR | 2,99 EUR |
| ARPU B2B | 14,90 EUR | 19,90 EUR | 24,90 EUR |

### Revenu Projete

| Source | An 1 | An 2 | An 3 |
|--------|------|------|------|
| B2C (Optimus+) | ~7 000 EUR | ~72 000 EUR | ~430 000 EUR |
| B2B (Commercants) | ~3 600 EUR | ~36 000 EUR | ~150 000 EUR |
| B2B2C (Marques) | 0 EUR | ~15 000 EUR | ~80 000 EUR |
| **Total annuel** | **~11 000 EUR** | **~123 000 EUR** | **~660 000 EUR** |

### Couts d'Infrastructure

| Poste | Cout mensuel |
|-------|-------------|
| Railway (serveur + DB + Redis) | ~50 EUR |
| Apple Developer Account | ~8 EUR |
| Google Play Console | ~2 EUR (unique) |
| Mapbox | 0 EUR (tier gratuit) |
| Sentry + PostHog | 0 EUR (tiers gratuits) |
| **Total** | **~60 EUR/mois** |

### Seuil de Rentabilite Infrastructure

**20 abonnes premium** = infrastructure couverte. L'app est concue pour etre rentable des les premiers utilisateurs payants.

---

## Unit Economics

| Metrique | Cible |
|----------|-------|
| CAC (Customer Acquisition Cost) | < 1 EUR (acquisition organique principalement) |
| LTV (Lifetime Value) — Premium | > 30 EUR (10 mois de retention moyenne) |
| LTV/CAC | > 30x |
| Churn premium mensuel | < 8% |
| Payback period | < 1 mois |

### Pourquoi le CAC est si bas

L'acquisition est principalement **organique** :
- Le partage de scan (ShareCard) est un mecanisme viral natif
- Les groupes WhatsApp de la communaute musulmane propagent les bonnes apps
- L'ASO sur "scan halal" est un marche avec peu de competition qualitative
- Le bouche a oreille dans les mosquees est un canal a cout zero

---

## Scalabilite Economique

```
Utilisateurs ──────────────────────────── Croissance lineaire
Infrastructure ──── ─── ── ─ ─            Croissance sub-lineaire
                                          (grace au cache Redis, CDN)

Resultat: Les marges augmentent avec la scale
```

| MAU | Cout infra/mois | Revenu/mois | Marge |
|-----|----------------|-------------|-------|
| 1 000 | 60 EUR | ~50 EUR | -10 EUR |
| 10 000 | 80 EUR | ~900 EUR | 91% |
| 50 000 | 200 EUR | ~10 000 EUR | 98% |
| 200 000 | 500 EUR | ~55 000 EUR | 99% |

Les couts d'infrastructure sont quasi-fixes grace a l'architecture optimisee (cache, compression, tier gratuits des services).

---

## Philosophie Economique

### Ce que nous faisons
- Monetiser la valeur ajoutee (confort, profondeur, personnalisation)
- Etre transparents sur les prix et les fonctionnalites
- Offrir un produit gratuit qui resout veritablement le probleme

### Ce que nous ne faisons pas
- Mettre un paywall sur l'information halal de base
- Vendre un classement favorable aux commercants
- Creer une dependance artificielle pour pousser a l'achat
- Exploiter les donnees utilisateur a des fins publicitaires

### Engagement ethique
- 2,5% des benefices nets reserves a des causes communautaires (education alimentaire, aide aux familles, soutien aux petits commercants halal)
- Rapport annuel public sur l'utilisation de ces fonds

---

*Un modele economique ou le revenu est une consequence de la valeur delivree, pas un objectif en soi.*
