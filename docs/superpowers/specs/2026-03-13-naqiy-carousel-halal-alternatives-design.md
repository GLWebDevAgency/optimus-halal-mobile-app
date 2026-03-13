# Spec: Carousel Halal/Santé + Refonte Avis des Écoles + Section Alternatives

**Date:** 2026-03-13
**Branch:** `feat/world-class-tier1-health-nutrition-engine`
**Scope:** UI/UX scan-result screen — Spec 1 (frontend only, backend search engine = Spec 2 séparée)

---

## 1. Résumé

Trois changements interconnectés sur l'écran scan-result :

1. **Carousel hybride scroll+swipe** — Remplace le scroll vertical linéaire des sections Halal/Santé par 2 onglets swipeables avec tab bar sticky et indicateur gold animé
2. **Refonte "Avis des 4 écoles"** — Design V1 Hero First exploitant les données savantes riches de la DB (ingredient_rulings, additive_madhab_rulings, scholarly_sources, scholarly_citations)
3. **Section Alternatives Hero+Grille** — Hero card de la meilleure correspondance + grille 2 colonnes, avec composant certifieur réutilisable (micro-logo + nom + trust score)

## 2. Prérequis

### 2.1 Madhab utilisateur (store local)

Le store Zustand (`store/index.ts`) ne contient **pas encore** de champ madhab. Cette spec nécessite l'ajout d'un champ `selectedMadhab` au store local :

```typescript
// Dans useLocalPreferencesStore (store/index.ts)
selectedMadhab: MadhabId; // "hanafi" | "maliki" | "shafii" | "hanbali"
setMadhab: (madhab: MadhabId) => void;
```

**Valeur par défaut :** `"hanafi"` (école la plus suivie en France).
**Sélection :** L'onboarding a déjà un slide `"madhab"` (`constants/onboarding.ts:33`). Ce slide doit persister le choix dans le store. L'utilisateur peut aussi changer via les settings ou la barre segmentée dans l'onglet Halal.

### 2.2 Types partagés

```typescript
type MadhabId = "hanafi" | "maliki" | "shafii" | "hanbali";
```

Ce type est ajouté dans `scan-types.ts` et réutilisé dans le store et les composants.

## 3. Architecture globale

```
┌─────────────────────────┐
│     Photo produit        │  scroll vertical (Animated.ScrollView)
│     VerdictHero          │
│     AlertPillStrip       │
├─────────────────────────┤
│  [ Halal ]  [ Santé ]   │  tab bar → sticky sous CompactStickyHeader
├─────────────────────────┤
│                          │
│   Contenu swipeable      │  swipe horizontal (PagerView)
│   (Halal ou Santé)       │
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

### Scroll architecture technique

**Problème courant :** Un `ScrollView` vertical contenant un `PagerView` horizontal avec du contenu scrollable cause des conflits de gestes sur Android.

**Solution :**
- Le `ScrollView` principal est un `Animated.ScrollView` (Reanimated) pour tracker la position
- Le `PagerView` (via `react-native-pager-view`) gère uniquement le swipe horizontal
- Chaque page du PagerView n'est **pas** scrollable individuellement — tout le contenu s'inscrit dans le scroll vertical principal
- La hauteur du conteneur PagerView est **dynamique** : calculée à partir du contenu de l'onglet actif via `onLayout` measurement
- `nestedScrollEnabled={true}` sur Android pour les éventuels FlatList imbriqués (ruban sources)

### Tab bar sticky — mécanique de positionnement

- La tab bar est rendue inline dans le scroll, juste après `AlertPillStrip`
- Un `onLayout` sur la tab bar capture son `y` offset dans le scroll
- Quand `scrollY >= tabBarY - stickyHeaderHeight`, une copie fixe de la tab bar s'affiche en position absolue sous le `CompactStickyHeader` (z-index inférieur au header)
- Transition : opacité interpolée (0→1 sur 20px) pour un apparition smooth
- `stickyHeaderHeight` = hauteur du `CompactStickyHeader` (~56px)

### Tab bar

- 2 onglets : **Halal** · **Santé**
- Indicateur gold animé (Reanimated `useSharedValue` + `withSpring`)
- Peek subtil : aperçu léger de l'onglet adjacent (translateX parallax) pour inviter au swipe
- Implémentation : `react-native-pager-view` pour le swipe natif

## 4. Onglet Halal — Avis des 4 écoles (V1 Hero First)

### 4.1 Hero Card (madhab de l'utilisateur)

Carte principale affichant l'école stockée dans `useLocalPreferencesStore.selectedMadhab`.

**Contenu :**
- Verdict coloré : "Halal selon l'école Hanafite" (vert/jaune/rouge)
- Explication détaillée (2-3 lignes) issue de `ingredient_rulings.explanation_fr/en/ar`
- 3 compteurs : conflits (haram/doubtful), doutes (mushbooh), sources citées
- Si conflits > 0 : liste inline des conflits avec :
  - Nom ingrédient/additif
  - Motif ("Origine animale possible")
  - Ruling one-liner
  - Référence savante (`ingredient_rulings.scholarly_reference`)

**Si conflits = 0** (produit halal pour toutes les écoles) :
- Afficher verdict vert + explication
- Compteurs : `0 conflits · 0 doutes · N sources`
- Pas de liste de conflits (la section est masquée, pas un empty state)

**Données DB :**
- `ingredient_rulings` filtré par colonnes madhab : `ruling_hanafi`, `ruling_maliki`, `ruling_shafii`, `ruling_hanbali`
- Si la colonne madhab spécifique est `null` → fallback sur `ruling_default`
- `ingredient_rulings.status` : halal | haram | doubtful | mushbooh
- `ingredient_rulings.explanation_fr`, `explanation_en`, `explanation_ar`
- `ingredient_rulings.scholarly_reference`

### 4.2 Barre segmentée (3 autres écoles)

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
- Les 3 écoles affichées excluent le madhab actif du hero

### 4.3 Couches d'analyse expandables

3 accordéons (Reanimated `useAnimatedStyle` + height interpolation) :

**a) Ingrédients**
- Liste : nom + icône statut (✓/⚠/✗) + ruling one-liner par école active
- Tap → expand : explication complète + référence savante
- Source : `ingredient_rulings`
- Icônes : Phosphor `CheckCircleIcon` / `WarningIcon` / `XCircleIcon`

**b) Additifs**
- E-numbers avec rulings par madhab
- Pastilles colorées par école : vert/jaune/rouge
- Source : `additive_madhab_rulings` JOIN `additives`
- Icônes : Phosphor `FlaskIcon`

**c) Certification**
- Certifieur du produit scanné
- Score de confiance + reconnaissance par les écoles
- Composant certifieur réutilisable (cf. section 6)

### 4.4 Ruban sources scrollable

Ribbon horizontal en bas, scroll natif (`ScrollView horizontal`) :

```
[ BookOpenIcon Radd al-Muhtar ] [ BookOpenIcon Al-Mughni ] [ BookOpenIcon Fatwa EFSA ] →
```

- Tap → ouvre `ScholarlySourceSheet` (BottomSheet) avec :
  - Titre complet de l'ouvrage
  - Auteur + période
  - Passage cité (arabe + traduction)
- Source : `scholarly_sources` + `scholarly_citations`
- Icônes : Phosphor `BookOpenIcon`

**Si aucune source savante liée :** Le ruban est masqué entièrement (pas de empty state).

## 5. Onglet Santé

Contenu existant : `HealthNutritionCard` (déjà redesignée dans PR #28).

Aucune modification de contenu. Simplement encapsulé dans le swipeable view.

## 6. Section Alternatives (Hero + Grille)

Sous les onglets swipeables, accessible en scroll vertical continu.

### 6.1 Header de section

```
ArrowsClockwiseIcon  Alternatives halal          3 trouvées
```

Icône : Phosphor `ArrowsClockwiseIcon`. Titre + compteur.

### 6.2 Hero Card (meilleure correspondance)

**Layout validé :** Image bannière + infos + certifieur étendu + pills + comparaison

**Contenu :**
- Image bannière produit (100px height)
- Badge flottant "MEILLEURE CORRESPONDANCE" (gradient gold, Phosphor `StarIcon`)
- Health score badge (ScoreRing 36px, coin haut droit)
- Nom + marque + quantité (champ `quantity` du produit, ex: "200g")
- Prix (doré, aligné droite) — optionnel, affiché si disponible
- **Composant certifieur étendu** : micro-logo 28px + nom + sous-titre + badge score `/100`
- Match reason pills : `CrosshairIcon Type produit` + `StorefrontIcon Enseignes`
- Barre de comparaison scanné vs alternative (statut halal + health scores)

### 6.3 Grille 2 colonnes

Cartes compactes pour les alternatives suivantes :
- Photo produit (56px thumbnail)
- Nom + marque
- **Composant certifieur compact** : micro-logo 14px + nom + score
- Health score (mini ScoreRing 20px)
- Prix (doré) — optionnel

### 6.4 CTA

Lien doré "Voir toutes les alternatives →" → ouvre BottomSheet liste complète.

### 6.5 Empty state (aucune alternative trouvée)

Si `findAlternatives()` retourne un tableau vide :

```
┌─────────────────────────────────┐
│  MagnifyingGlassIcon             │
│  Aucune alternative trouvée      │
│  Nous n'avons pas encore         │
│  d'alternative halal pour ce     │
│  type de produit.                │
└─────────────────────────────────┘
```

La section entière (header + empty state) reste visible — ne pas masquer. L'utilisateur sait qu'on a cherché.

### 6.6 Composant certifieur réutilisable (`CertifierBadge`)

Deux variantes (même composant, prop `size: "compact" | "extended"`) :

**Extended (hero card) :**
- Micro-logo 28px (lettre sur fond coloré, ou vrai logo depuis R2 via `logoUrl`)
- Nom court (ex: "AVS")
- Sous-titre (ex: "Association Vigilance et Sûreté")
- Badge score : pastille colorée + score `/100`

**Compact (grid card) :**
- Micro-logo 14px
- Nom court
- Score (pastille + nombre)

**Couleurs dynamiques selon tier de confiance** (réutilise `getTrustScoreColor` de `@/theme/colors`) :
- Vert `#4cd964` : score ≥ 80
- Jaune `#ffd60a` : score 50-79
- Rouge `#ff453a` : score < 50

### 6.7 Type de données attendu

```typescript
import type { HalalStatusKey } from "./scan-constants";

type AlternativeProductUI = {
  barcode: string;
  name: string;
  brand: string;
  imageUrl: string | null;
  quantity?: string;           // ex: "200g"
  healthScore: number | null;
  halalStatus: HalalStatusKey;
  certifier: {
    name: string;              // "Association Vigilance et Sûreté"
    shortName: string;         // "AVS"
    logoUrl: string | null;    // URL R2 ou null
    trustScore: number;        // 0-100
  } | null;
  matchReason: string;         // "Lardons fumés"
  matchType: "exact" | "category" | "similar";
  price?: number;
  availableAt?: string[];      // ["Carrefour", "Leclerc"]
};
```

### 6.8 Adapter layer (endpoint existant → UI type)

L'endpoint actuel `recommendation.service.ts` retourne un shape différent (pas de `certifier`, `matchReason`, `price`, etc.). Un **adapter** dans `scan-result.tsx` mappe les données existantes vers `AlternativeProductUI` :

```typescript
function adaptLegacyAlternative(raw: LegacyAlternative): AlternativeProductUI {
  return {
    barcode: raw.barcode,
    name: raw.name ?? "Produit inconnu",
    brand: raw.brand ?? "",
    imageUrl: raw.imageUrl,
    quantity: undefined,           // non disponible dans V1
    healthScore: null,             // nutriscoreGrade (lettre) → pas convertible en score
    halalStatus: (raw.halalStatus as HalalStatusKey) ?? "unknown",
    certifier: null,               // non disponible dans V1
    matchReason: raw.category ?? "",
    matchType: "category",         // V1 matche uniquement par catégorie
    price: undefined,
    availableAt: undefined,
  };
}
```

Les champs `null`/`undefined` sont gérés dans les composants UI :
- `certifier: null` → le `CertifierBadge` n'est pas rendu
- `healthScore: null` → le `ScoreRing` affiche "—"
- `price: undefined` → la zone prix est masquée
- `quantity: undefined` → seuls nom + marque sont affichés

Quand le backend Spec 2 sera prêt, l'adapter sera remplacé par un mapping direct.

## 7. Section "Votre avis compte"

Dernière section en scroll vertical.

```
┌─────────────────────────────────┐
│  StarIcon Votre avis compte      │
│                                   │
│  Ce produit vous semble mal       │
│  classé ? Signalez une erreur     │
│  ou suggérez une correction.      │
│                                   │
│  [ ThumbsUpIcon Correct ]         │
│  [ FlagIcon Signaler ]            │
└─────────────────────────────────┘
```

Icônes : Phosphor `StarIcon`, `ThumbsUpIcon`, `FlagIcon`

- `Correct` → feedback positif silencieux (toast de remerciement). **Backend : noop pour cette spec** — le tap déclenche un toast local uniquement. L'endpoint de feedback sera ajouté ultérieurement.
- `Signaler` → BottomSheet avec choix : "Verdict halal incorrect", "Score santé incorrect", "Informations manquantes", "Autre". **Backend : noop** — les choix sont stockés localement (MMKV) en attendant l'endpoint.

## 8. Clés i18n

Préfixe : `scanResult.` (existant). Nouvelles clés à ajouter dans `fr.ts`, `en.ts`, `ar.ts` :

### Tab bar
- `tabHalal` — "Halal" / "Halal" / "حلال"
- `tabHealth` — "Santé" / "Health" / "الصحة"

### Onglet Halal
- `schoolHeroTitle` — "{{status}} selon l'école {{school}}" / "{{status}} according to {{school}} school" / "{{status}} حسب المذهب {{school}}"
- `schoolConflicts` — "{{count}} conflit(s)" / "{{count}} conflict(s)" / "{{count}} خلاف(ات)"
- `schoolDoubts` — "{{count}} doute(s)" / "{{count}} doubt(s)" / "{{count}} شك(وك)"
- `schoolSources` — "{{count}} source(s)" / "{{count}} source(s)" / "{{count}} مصدر(مصادر)"
- `schoolNoConflicts` — "Aucun conflit détecté" / "No conflicts detected" / "لم يتم اكتشاف أي خلاف"
- `accordionIngredients` — "Ingrédients" / "Ingredients" / "المكونات"
- `accordionAdditives` — "Additifs" / "Additives" / "المضافات"
- `accordionCertification` — "Certification" / "Certification" / "الشهادة"
- `scholarlySourceTitle` — "Source savante" / "Scholarly source" / "المصدر العلمي"

### Alternatives
- `alternativesTitle` — "Alternatives halal" / "Halal alternatives" / "بدائل حلال"
- `alternativesCount` — "{{count}} trouvée(s)" / "{{count}} found" / "{{count}} وُجدت"
- `alternativesBestMatch` — "Meilleure correspondance" / "Best match" / "أفضل تطابق"
- `alternativesMatchExact` — "Même type" / "Same type" / "نفس النوع"
- `alternativesMatchCategory` — "Même catégorie" / "Same category" / "نفس الفئة"
- `alternativesMatchSimilar` — "Produit similaire" / "Similar product" / "منتج مشابه"
- `alternativesNoneFound` — "Aucune alternative trouvée" / "No alternatives found" / "لم يتم العثور على بدائل"
- `alternativesNoneDesc` — "Nous n'avons pas encore d'alternative halal pour ce type de produit." / "We don't have halal alternatives for this product type yet." / "لا تتوفر لدينا بدائل حلال لهذا النوع من المنتجات بعد."
- `alternativesSeeAll` — "Voir toutes les alternatives" / "See all alternatives" / "عرض جميع البدائل"
- `alternativesScanned` — "Scanné" / "Scanned" / "الممسوح"
- `alternativesAlternative` — "Alternative" / "Alternative" / "البديل"

### Feedback
- `feedbackTitle` — "Votre avis compte" / "Your feedback matters" / "رأيك مهم"
- `feedbackDesc` — "Ce produit vous semble mal classé ? Signalez une erreur ou suggérez une correction." / "Does this product seem incorrectly classified? Report an error or suggest a correction." / "هل يبدو لك أن هذا المنتج مصنف بشكل خاطئ؟ أبلغ عن خطأ أو اقترح تصحيحًا."
- `feedbackCorrect` — "Correct" / "Correct" / "صحيح"
- `feedbackReport` — "Signaler" / "Report" / "إبلاغ"
- `feedbackThanks` — "Merci pour votre retour !" / "Thanks for your feedback!" / "شكرًا لملاحظاتك!"
- `feedbackReportVerdict` — "Verdict halal incorrect" / "Incorrect halal verdict" / "حكم حلال غير صحيح"
- `feedbackReportScore` — "Score santé incorrect" / "Incorrect health score" / "نتيجة صحية غير صحيحة"
- `feedbackReportMissing` — "Informations manquantes" / "Missing information" / "معلومات ناقصة"
- `feedbackReportOther` — "Autre" / "Other" / "أخرى"

### Certifieur
- `certifierTrustScore` — "Score de confiance" / "Trust score" / "درجة الثقة"

**Total : ~30 nouvelles clés.**

## 9. Fichiers impactés (estimation)

### Nouveaux fichiers
- `ScanResultTabBar.tsx` — Tab bar 2 onglets avec indicateur gold animé
- `ScanResultPager.tsx` — PagerView wrapper pour le swipe horizontal
- `HalalSchoolsCard.tsx` — Onglet Halal complet (hero + barre segmentée + accordéons + ruban)
- `ScholarlySourceSheet.tsx` — BottomSheet sources savantes
- `AlternativesSection.tsx` — Section complète (header + hero + grille + CTA + empty state) — remplace l'existant
- `AlternativeHeroCard.tsx` — Hero card meilleure alternative
- `AlternativeGridCard.tsx` — Carte compacte grille
- `CertifierBadge.tsx` — Composant certifieur réutilisable (compact/extended)
- `FeedbackCard.tsx` — Section "Votre avis compte"

### Fichiers modifiés
- `scan-result.tsx` — Restructurer le layout (pager + sections) + adapter alternatives
- `CompactStickyHeader.tsx` — Intégrer la tab bar sticky
- `scan-types.ts` — Ajouter `AlternativeProductUI`, `MadhabId` et types associés
- `store/index.ts` — Ajouter `selectedMadhab` au store préférences
- `fr.ts`, `en.ts`, `ar.ts` — ~30 nouvelles clés i18n

### Dépendances à ajouter
- `react-native-pager-view` — Swipe natif entre onglets

## 10. Hors scope (Spec 2)

- Matching intelligent backend (Elasticsearch / pg_trgm / categories_tags)
- Import `categories_tags` depuis OFF
- Ranking par trust score certifieur
- Recherche par type de produit exact
- Endpoint `/alternatives/v2`
- Endpoint feedback backend (POST /feedback)

## 11. Critères de succès

- [ ] Swipe fluide entre Halal et Santé (60fps, pas de jank)
- [ ] Tab bar sticky fonctionne correctement avec le CompactStickyHeader existant
- [ ] Hauteur dynamique du PagerView selon l'onglet actif
- [ ] `selectedMadhab` persiste dans le store et survit aux relances
- [ ] Hero card madhab affiche les données réelles de `ingredient_rulings`
- [ ] Fallback `ruling_default` quand la colonne madhab spécifique est null
- [ ] Barre segmentée permet de switcher entre les 4 écoles avec animation
- [ ] Accordéons Ingrédients/Additifs/Certification fonctionnels
- [ ] Ruban sources scrollable avec tap → BottomSheet (masqué si aucune source)
- [ ] Hero alternative affiche toutes les infos avec composant certifieur étendu
- [ ] Grille 2 colonnes avec composant certifieur compact
- [ ] Empty state alternatives quand aucun résultat
- [ ] Adapter layer mappe correctement l'endpoint existant vers `AlternativeProductUI`
- [ ] Champs manquants (certifier, price, etc.) gérés gracieusement dans l'UI
- [ ] Section "Votre avis compte" avec toast local (noop backend)
- [ ] Toutes les chaînes i18n en fr/en/ar (~30 clés)
- [ ] Accessibilité : labels sur tous les éléments interactifs
- [ ] Icônes Phosphor (pas d'emoji dans le code)
