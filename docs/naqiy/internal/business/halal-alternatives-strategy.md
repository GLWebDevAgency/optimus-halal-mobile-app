# Strategie de distribution — Alternatives halal post-scan

> **Statut** : Analyse strategique — Phase exploratoire
> **Date** : 2026-03-08
> **Objectif** : Transformer Naqiy d'un outil d'information (scan) en plateforme transactionnelle (achat)

---

## Synthese executive

Le pivot scan-to-purchase est le levier de monetisation principal de Naqiy.
L'avantage competitif unique repose sur le **Trust Score + l'intention d'achat post-scan**.
La strategie recommandee suit une progression asset-light vers asset-heavy en 4 phases.

---

## 1. Marketplace / Affiliation (Asset-light)

**Principe** : Naqiy ne touche jamais le produit. Connexion utilisateur-vendeur halal existant.

| Aspect | Detail |
|---|---|
| Mecanisme | Apres scan, affichage "Alternatives halal verifiees" avec lien d'achat partenaire |
| Revenus | Commission 5-15% par vente (affiliation) ou fee fixe par lead |
| Partenaires cibles | Epiceries halal en ligne (Al-Andalous, Orient-Market), grossistes via revendeurs, marques D2C halal |
| Investissement | Quasi nul — API affiliation + integration catalogue |
| Risque | Tres faible — pas de stock, pas de logistique |

### Avantages
- Zero capex logistique
- Scalable immediatement dans toute la France
- Le Trust Score devient l'avantage concurrentiel (recommandation par qualite de certification)
- Monetisation de la base utilisateur sans friction

### Inconvenients
- Marges faibles (5-15%)
- Dependance aux partenaires (stock, prix, qualite de service)
- Experience utilisateur fragmentee (redirection vers site tiers)

### Verdict
C'est le **move #1**. Valider la demande avant d'investir dans l'infra.

---

## 2. Click & Collect avec reseau de partenaires

**Principe** : Commande via Naqiy, retrait dans une boucherie/epicerie halal partenaire.

| Aspect | Detail |
|---|---|
| Mecanisme | Catalogue unifie Naqiy → commande → notification au commercant → retrait en boutique |
| Revenus | Commission 10-20% + abonnement commercant (SaaS B2B) |
| Partenaires cibles | Boucheries halal, epiceries orientales, supermarches communautaires |
| Investissement | Moyen — app commercant, gestion commandes, catalogue |
| Risque | Modere — depend de l'adoption commercants |

### Avantages
- Pas de logistique propre (le commercant gere le stock)
- Experience locale forte (le consommateur prefere souvent son boucher de confiance)
- Double revenu : commission + SaaS
- Potentiel de devenir la **plateforme** du commerce halal local (modele TheFork)

### Inconvenients
- Onboarding commercants = vente terrain (lent, couteux)
- Qualite de service variable selon les partenaires
- Catalogue non unifie (chaque commercant a ses produits)

### Synergie Naqiy
La carte des magasins halal existe deja (383 magasins enrichis avec Google Places).
C'est une **base de prospection** directe avec donnees, avis et horaires.

---

## 3. Livraison via partenariat grossiste (Dropshipping halal)

**Principe** : Association avec un grossiste/distributeur halal. Naqiy gere la vente en ligne, le grossiste gere stock et expedition.

| Aspect | Detail |
|---|---|
| Mecanisme | Catalogue Naqiy → commande → transmise au grossiste → expedition directe client |
| Revenus | Marge commerciale 20-35% |
| Partenaires cibles | Isla Mondial, Reghalal, Dounia Halal, Orient Viandes, grossistes regionaux |
| Investissement | Moyen — integration ERP/EDI grossiste, gestion SAV |
| Risque | Modere — dependance au grossiste pour qualite et delais |

### Avantages
- Pas de stock propre
- Catalogue large des le lancement
- Marges meilleures que l'affiliation
- Scalable geographiquement

### Inconvenients
- Negociation grossiste complexe (volumes minimums, exclusivites)
- SAV a la charge de Naqiy (retours, reclamations, qualite)
- Chaine du froid critique pour viande/surgeles

### Point critique
La chaine du froid pour la viande impose des contraintes reglementaires lourdes
(agrement sanitaire, tracabilite, HACCP). Le sec/epicerie est beaucoup plus simple pour commencer.

---

## 4. Darkstore propre

**Principe** : Entrepot propre avec stock dedie, livraison directe.

| Aspect | Detail |
|---|---|
| Mecanisme | Stock centralise → preparation → livraison dernier km (Stuart/Uber Direct) |
| Revenus | Marge commerciale 30-50% |
| Investissement | Tres eleve — loyer (2-5k EUR/mois), stock initial (20-50k EUR), employes, froid, agrement |
| Risque | Eleve — operations lourdes, capex important |

### Avantages
- Controle total de l'experience (qualite, delais, packaging)
- Marges maximales
- Donnees precieuses (comportement d'achat, panier moyen)
- Differenciation forte (livraison rapide, curation halal)

### Inconvenients
- Capex lourd (100-200k EUR pour un darkstore operationnel avec froid)
- Complexite operationnelle massive (approvisionnement, peremption, inventaire)
- Zone de chalandise limitee (~15-20 km)
- Transformation en entreprise logistique plutot que tech
- Agrement sanitaire obligatoire pour produits frais/surgeles

### Verdict
Modele Gorillas/Flink — la plupart ont fait faillite. **Ne pas commencer par la.**

---

## 5. Roadmap recommandee — Progression en 4 phases

| Phase | Modele | Investissement | Delai | Objectif |
|---|---|---|---|---|
| **Phase 1** | Affiliation/Marketplace | ~0 EUR | 1-2 mois | Valider la demande, mesurer le taux de conversion scan → achat |
| **Phase 2** | Click & Collect partenaires | 5-15k EUR | 3-6 mois | Densifier l'offre locale, onboarder 50-100 commercants |
| **Phase 3** | Dropshipping grossiste (sec uniquement) | 10-20k EUR | 6-12 mois | Livraison nationale, catalogue cure par Trust Score |
| **Phase 4** | Darkstore (conditionnel) | 100-200k EUR | 12-24 mois | Uniquement si Phase 3 > 50k EUR/mois GMV et demande concentree geo |

---

## 6. Avantage competitif unique de Naqiy

Ce que **personne d'autre** ne peut reproduire facilement :

### 6.1 Curation par Trust Score
Naqiy ne recommande pas n'importe quel produit halal.
Les alternatives sont filtrees par la qualite de certification de l'organisme audite.
C'est le **moat** defensif.

### 6.2 Personnalisation par madhab
Un utilisateur Hanafi ne voit pas les memes alternatives qu'un Shafi'i.
Aucun concurrent ne propose cette granularite.

### 6.3 Contexte du scan
L'utilisateur vient de scanner un produit non-halal ou a certification faible.
Le moment d'intention d'achat est **maximal**. Meilleur funnel de conversion possible.

### 6.4 Base de donnees magasins
383 magasins geolocalises avec horaires et avis — fondation du Click & Collect.

---

## 7. Pieges a eviter

- **Ne pas commencer par la viande fraiche** — chaine du froid et agrements sanitaires = gouffre. Commencer par l'epicerie seche (confiseries, sauces, conserves, boissons).
- **Ne pas construire son propre dernier kilometre** — utiliser Stuart, Uber Direct, ou Colissimo.
- **Ne pas faire de darkstore sans avoir prouve le PMF** avec l'affiliation d'abord.
- **Ne pas stocker** avant d'avoir 1000+ commandes/mois validees via le modele sans stock.

---

## 8. Benchmarks marche

| Acteur | Modele | Lecon |
|---|---|---|
| **Yuka** | Affiliation (alternatives bio) | Scan → recommandation fonctionne. ~10M EUR/an sans toucher un produit. |
| **La Fourche** | Marketplace bio avec abonnement | Abonnement + marges grossiste = modele viable. Applicable au halal. |
| **Gorillas/Flink** | Darkstore | Milliards brules. Darkstore solo non viable sans scale massive. |
| **TheFork** | Marketplace restaurants | Plateforme locale avec commercants partenaires fonctionne bien. |
| **Al-Andalous Shop** | E-commerce halal classique | Prouve que la demande existe. UX datee, pas de curation, pas de scan. |

---

## 9. Metriques cles a suivre

| Phase | KPI | Seuil Go/No-Go |
|---|---|---|
| Phase 1 | Taux de clic scan → alternative | > 5% |
| Phase 1 | Taux de conversion clic → achat | > 3% |
| Phase 2 | Commercants onboardes | > 50 |
| Phase 2 | Commandes Click & Collect / mois | > 500 |
| Phase 3 | GMV mensuelle | > 20k EUR |
| Phase 3 | Panier moyen | > 25 EUR |
| Phase 4 | GMV mensuelle | > 50k EUR |
| Phase 4 | Densite commandes / zone | > 100 commandes/km2/mois |

---

## Resume

> Monetiser l'intelligence, pas la logistique.
> Le vrai asset de Naqiy est le Trust Score + l'intention d'achat post-scan.
> Commencer asset-light (affiliation), prouver le PMF, puis densifier progressivement.
