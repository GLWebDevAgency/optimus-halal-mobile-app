# Spec: Carousel Halal/Santé + Refonte Avis des Écoles + Section Alternatives

**Date:** 2026-03-13
**Branch:** `feat/world-class-tier1-health-nutrition-engine`
**Scope:** UI/UX scan-result screen — Spec 1 (frontend only, backend search engine = Spec 2 séparée)

---

## 1. Résumé

Trois changements interconnectés sur l'écran scan-result :

1. **Carousel hybride scroll+swipe** — Remplace le scroll vertical linéaire des sections Halal/Santé par 2 onglets swipeables avec tab bar sticky et indicateur gold animé
2. **Refonte "Avis des 4 écoles"** — Design V1 Hero First exploitant les données savantes riches de la DB (dalils, fatwas, ingredient_rulings, additive_madhab_rulings, scholarly_sources)
3. **Section Alternatives Hero+Grille** — Hero card de la meilleure correspondance + grille 2 colonnes, avec composant certifieur réutilisable (micro-logo + nom + trust score)

## 2. Architecture globale

```
┌─────────────────────────┐
│     Photo produit        │  scroll vertical
│     VerdictHero          │
│     AlertPillStrip       │
├─────────────────────────┤
│  [ Halal ]  [ Santé ]   │  tab bar → sticky sous CompactStickyHeader
├─────────────────────────┤
│                          │
│   Contenu swipeable      │  swipe horizontal (Halal ↔ Santé)
│                          │
├─────────────────────────┤
│   Alternatives           │  scroll vertical continu
│   (Hero + Grille)        │
├─────────────────────────┤
│   Votre avis compte      │
└─────────────────────────┘
```

### Scroll behavior (hybride)

1. L'utilisateur scroll verticalement (photo → verdict → alertes)
2. Quand la tab bar atteint le `CompactStickyHeader`, elle se fixe juste en dessous
3. Le contenu sous la tab bar devient swipeable horizontalement entre Halal et Santé
4. En continuant de scroller verticalement après le contenu de l'onglet actif → Alternatives → "Votre avis compte"

### Tab bar

- 2 onglets : **Halal** · **Santé**
- Indicateur gold animé (Reanimated `useSharedValue` + `withSpring`)
- Peek subtil : aperçu léger de l'onglet adjacent (translateX parallax) pour inviter au swipe
- Implémentation : `react-native-pager-view` pour le swipe natif

## 3. Onglet Halal — Avis des 4 écoles (V1 Hero First)

### 3.1 Hero Card (madhab de l'utilisateur)

Carte principale affichant l'école sélectionnée dans les préférences utilisateur.

**Contenu :**
- Verdict coloré : "Halal selon l'école Hanafite" (vert/jaune/rouge)
- Explication détaillée (2-3 lignes) issue de `ingredient_rulings.explanation_fr/en/ar`
- 3 compteurs : conflits (haram/doubtful), doutes (mushbooh), sources citées
- Si conflits > 0 : liste inline des conflits avec :
  - Nom ingrédient/additif
  - Motif ("Origine animale possible")
  - Ruling one-liner
  - Référence dalil (`ingredient_rulings.dalil_reference`)

**Données DB :**
- `ingredient_rulings` filtré par `madhab_id` de l'utilisateur
- `ingredient_rulings.status` : halal | haram | doubtful | mushbooh
- `ingredient_rulings.explanation_fr`, `explanation_en`, `explanation_ar`
- `ingredient_rulings.dalil_reference`

### 3.2 Barre segmentée (3 autres écoles)

Barre horizontale compacte sous le hero :

```
┌────────┬────────┬────────┐
│ Maliki  │ Shafi'i │ Hanbali│
│  🟢     │  🟡     │  🟢    │
│ Halal   │ Doute   │ Halal  │
└────────┴────────┴────────┘
```

- Tap sur une école → le hero card se transforme avec animation `layout` Reanimated
- Le madhab utilisateur reste accessible en retappant

### 3.3 Couches d'analyse expandables

3 accordéons (Reanimated `useAnimatedStyle` + height interpolation) :

**a) Ingrédients**
- Liste : nom + icône statut (✓/⚠/✗) + ruling one-liner par école active
- Tap → expand : explication complète + dalil
- Source : `ingredient_rulings`

**b) Additifs**
- E-numbers avec rulings par madhab
- Pastilles colorées par école : vert/jaune/rouge
- Source : `additive_madhab_rulings` JOIN `additives`

**c) Certification**
- Certifieur du produit scanné
- Score de confiance + reconnaissance par les écoles
- Composant certifieur réutilisable (cf. section 5)

### 3.4 Ruban sources scrollable

Ribbon horizontal en bas, scroll natif :

```
[ 📖 Radd al-Muhtar ] [ 📖 Al-Mughni ] [ 📖 Fatwa EFSA ] →
```

- Tap → ouvre `ScholarlySourceSheet` (BottomSheet) avec :
  - Titre complet de l'ouvrage
  - Auteur + période
  - Passage cité (arabe + traduction)
- Source : `scholarly_sources` + `scholarly_citations`

## 4. Onglet Santé

Contenu existant : `HealthNutritionCard` (déjà redesignée dans PR #28).

Aucune modification de contenu. Simplement encapsulé dans le swipeable view.

## 5. Section Alternatives (Hero + Grille)

Sous les onglets swipeables, accessible en scroll vertical continu.

### 5.1 Header de section

```
🔄 Alternatives halal          3 trouvées
```

### 5.2 Hero Card (meilleure correspondance)

**Layout validé :** Image bannière + infos + certifieur étendu + pills + comparaison

**Contenu :**
- Image bannière produit (100px height)
- Badge flottant "✦ MEILLEURE CORRESPONDANCE" (gradient gold)
- Health score badge (ScoreRing 36px, coin haut droit)
- Nom + marque + grammage
- Prix (doré, aligné droite)
- **Composant certifieur étendu** : micro-logo 28px + nom + sous-titre + badge score `/100`
- Match reason pills : `🎯 Type produit` + `🏪 Enseignes`
- Barre de comparaison scanné vs alternative (statut halal + scores)

### 5.3 Grille 2 colonnes

Cartes compactes pour les alternatives suivantes :
- Photo produit (56px thumbnail)
- Nom + marque
- **Composant certifieur compact** : micro-logo 14px + nom + score
- Health score (mini ScoreRing 20px)
- Prix (doré)

### 5.4 CTA

Lien doré "Voir toutes les alternatives →" → ouvre BottomSheet liste complète.

### 5.5 Composant certifieur réutilisable

Deux variantes (même composant, prop `size: "compact" | "extended"`) :

**Extended (hero card) :**
- Micro-logo 28px (lettre sur fond coloré, ou vrai logo R2)
- Nom court (ex: "AVS")
- Sous-titre (ex: "Association Vigilance et Sûreté")
- Badge score : pastille colorée + score `/100`

**Compact (grid card) :**
- Micro-logo 14px
- Nom court
- Score (pastille + nombre)

**Couleurs dynamiques selon tier de confiance :**
- Vert `#4cd964` : score ≥ 80
- Jaune `#ffd60a` : score 50-79
- Rouge `#ff453a` : score < 50

### 5.6 Type de données attendu

```typescript
type AlternativeProduct = {
  barcode: string;
  name: string;
  brand: string;
  imageUrl: string;
  healthScore: number;
  halalStatus: HalalVerdict;
  certifier: {
    name: string;
    shortName: string;
    logoUrl: string | null;
    trustScore: number;
  };
  matchReason: string;
  matchType: "exact" | "category" | "similar";
  price?: number;
  availableAt?: string[];
};
```

**Note :** Le matching intelligent (Elasticsearch-level) fait l'objet de la Spec 2 séparée (backend). Pour cette Spec 1, les composants UI consomment les données du endpoint existant `recommendation.service.ts`. L'interface `AlternativeProduct` est conçue pour être compatible avec le futur endpoint amélioré sans changement UI.

## 6. Section "Votre avis compte"

Dernière section en scroll vertical.

```
┌─────────────────────────────────┐
│  ⭐ Votre avis compte            │
│                                   │
│  Ce produit vous semble mal       │
│  classé ? Signalez une erreur     │
│  ou suggérez une correction.      │
│                                   │
│  [ 👍 Correct ]  [ 🚩 Signaler ] │
└─────────────────────────────────┘
```

- `👍 Correct` → feedback positif silencieux (toast de remerciement)
- `🚩 Signaler` → BottomSheet avec choix : "Verdict halal incorrect", "Score santé incorrect", "Informations manquantes", "Autre"

## 7. Fichiers impactés (estimation)

### Nouveaux fichiers
- `ScanResultTabBar.tsx` — Tab bar 2 onglets avec indicateur gold animé
- `ScanResultPager.tsx` — PagerView wrapper pour le swipe horizontal
- `HalalSchoolsCard.tsx` — Onglet Halal complet (hero + barre segmentée + accordéons + ruban)
- `ScholarlySourceSheet.tsx` — BottomSheet sources savantes
- `AlternativesSection.tsx` — Section complète (header + hero + grille + CTA)
- `AlternativeHeroCard.tsx` — Hero card meilleure alternative
- `AlternativeGridCard.tsx` — Carte compacte grille
- `CertifierBadge.tsx` — Composant certifieur réutilisable (compact/extended)
- `FeedbackCard.tsx` — Section "Votre avis compte"

### Fichiers modifiés
- `scan-result.tsx` — Restructurer le layout (pager + sections)
- `CompactStickyHeader.tsx` — Intégrer la tab bar sticky
- `scan-types.ts` — Ajouter `AlternativeProduct` et types associés
- `fr.ts`, `en.ts`, `ar.ts` — Nouvelles clés i18n

### Dépendances à ajouter
- `react-native-pager-view` — Swipe natif entre onglets

## 8. Hors scope (Spec 2)

- Matching intelligent backend (Elasticsearch / pg_trgm / categories_tags)
- Import `categories_tags` depuis OFF
- Ranking par trust score certifieur
- Recherche par type de produit exact
- Endpoint `/alternatives/v2`

## 9. Critères de succès

- [ ] Swipe fluide entre Halal et Santé (60fps, pas de jank)
- [ ] Tab bar sticky fonctionne correctement avec le CompactStickyHeader existant
- [ ] Hero card madhab affiche les données réelles de `ingredient_rulings`
- [ ] Barre segmentée permet de switcher entre les 4 écoles avec animation
- [ ] Accordéons Ingrédients/Additifs/Certification fonctionnels
- [ ] Ruban sources scrollable avec tap → BottomSheet
- [ ] Hero alternative affiche toutes les infos (photo, nom, marque, certifieur avec micro-logo+nom+score, health score, prix, raison du match, comparaison)
- [ ] Grille 2 colonnes avec composant certifieur compact
- [ ] Composant certifieur réutilisable avec couleurs dynamiques par tier
- [ ] Section "Votre avis compte" avec feedback positif + signalement
- [ ] Toutes les chaînes i18n en fr/en/ar
- [ ] Accessibilité : labels sur tous les éléments interactifs
