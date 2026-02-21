# 04 — Al-Ihsan : L'Excellence du Produit

> "Inna Allaha kataba al-ihsana 'ala kulli shay'"
> — Allah a prescrit l'excellence en toute chose. (Hadith rapporte par Muslim)

---

## Le Standard Ihsan : Faire Comme Si Allah Regardait

L'ihsan (l'excellence) est le niveau le plus eleve de la pratique : "Adore Allah comme si tu Le voyais." Traduit en produit, cela signifie : **chaque pixel, chaque animation, chaque feedback haptique est concu comme si l'utilisateur le plus exigeant et le plus vulnerable le testait.**

Nous ne visons pas "suffisamment bon". Nous visons l'excellence silencieuse — celle qu'on ne remarque pas consciemment mais qui fait dire : "Cette app, elle est bien."

---

## 1. Le Design System — Architecture d'un Language Visuel

### 1.1 Structure du Theme

```
src/theme/
├── index.ts        → barrel export (5 modules)
├── colors.ts       → palettes completes (light, dark, gold, ramadan, semantic, glass)
├── typography.ts   → fontFamily, fontSize, fontWeight, textStyles, RTL scaling
├── spacing.ts      → 4-8-12-16-20-24-32 echelle + radius + hitSlop
├── shadows.ts      → lightShadows, darkShadows, getShadows(isDark)
└── animations.ts   → durations, easings, springs, entry/exit/layout
```

### 1.2 Palettes : Semantique, Pas Decorative

| Token | Light Mode | Dark Mode | Utilisation |
|-------|------------|-----------|-------------|
| `primary` | `#13ec6a` (vert halal) | `#13ec6a` | CTA, statut halal, accents positifs |
| `brand.gold` | `#D4AF37` | `#D4AF37` | Premium, streaks, accents luxe |
| `halalStatus.halal` | `#22c55e` | `#22c55e` | Verdict vert |
| `halalStatus.doubtful` | `#f59e0b` | `#f59e0b` | Verdict orange |
| `halalStatus.haram` | `#ef4444` | `#ef4444` | Verdict rouge |
| `semantic.error` | `#ef4444` | `#ef4444` | Erreurs |
| `glass.dark.bg` | — | `rgba(15,23,42,0.8)` | Cards glass-morphism |

**Decision cle** : En dark mode, le scanner card et les accents principaux passent du vert au **dore** (`#CFA533` → `#FDE08B`). C'est un choix delibere : le gold evoque le premium et la confiance dans la culture islamique — il ne remplace pas le vert halal (qui reste pour les verdicts), mais donne une identite nocturne distincte.

### 1.3 Le Gold Dark Theme — Signature Visuelle

L'implementation recente (branche `feat/gold-dark-theme`) a etabli :

- **Scanner card** : gradient `["#FDE08B", "#CFA533"]` avec texte `#1A1A1A`
- **Shadow glow** : `#CFA53340` au lieu de `#13ec6a25`
- **Favorites ring** : gradient `["#D4AF37", "#CFA533", "#FDE08B"]`
- **TabBar active** : gold au lieu de vert
- **Secondary cards** : halo gold directionnel (radiant depuis le scanner card)
  - Index 1 (haut-droite) : glow horizontal
  - Index 2 (bas-gauche) : glow vertical
  - Index 3 (bas-droite) : glow diagonal

Ce systeme cree une **hierarchie lumineuse** : le scanner card est la source de lumiere, les cards secondaires captent son eclat selon leur distance.

### 1.4 Glass-Morphism

Le glass-morphism est utilise pour les cards non-primaires et les pilules de stats :

```
Light: bg rgba(255,255,255,0.7) / border rgba(0,0,0,0.06)
Dark:  bg rgba(15,23,42,0.8) / border rgba(255,255,255,0.08)
```

Pas de `backdrop-filter: blur()` — trop couteux sur mobile. L'effet est obtenu par opacite et bordure subtile, ce qui est performant meme sur des appareils Android bas de gamme.

---

## 2. Animations — Le Rythme de l'App

### 2.1 Philosophie : Fonctionnelle, Pas Decorative

Chaque animation a un objectif :

| Animation | Objectif | Duree |
|-----------|----------|-------|
| `FadeInDown` (hero) | Etablir la hierarchie de lecture | 500ms springify |
| `FadeInDown` stagger (cards) | Guider l'oeil du haut vers le bas | 60ms entre chaque |
| `FadeInRight` (carrousels) | Indiquer la direction de scroll | 400-500ms |
| Parallax scroll (hero) | Creer de la profondeur, cacher le hero progressivement | Continu |
| Haptic feedback (scan) | Confirmer le resultat sensoriel | Instantane |

### 2.2 Springs, Pas Bezier

On utilise des springs (react-native-reanimated) plutot que des courbes bezier :

```typescript
springConfig:  { damping: 15, stiffness: 150, mass: 1 }
springBouncy:  { damping: 8, stiffness: 120, mass: 1 }
springStiff:   { damping: 20, stiffness: 200, mass: 1 }
springOptimus: { damping: 18, stiffness: 150, mass: 1 } // Notre signature
```

Le `springOptimus` (damping 18, stiffness 150) est le spring par defaut — ni trop rebondissant (qui fait "jouet"), ni trop rigide (qui fait "corporate"). C'est un compromis entre personnalite et professionnalisme.

### 2.3 Haptic Design

Trois niveaux de feedback haptique, lies aux verdicts de scan :

| Verdict | Type | Ressenti |
|---------|------|----------|
| Halal | `Success` (notificationSuccess) | Vibration douce, rassurante |
| Doubtful | `Warning` (notificationWarning) | Vibration moyenne, attention |
| Haram | `Error` (notificationError) | Vibration forte, alerte |

Les actions de navigation utilisent `impact()` (ImpactFeedbackStyle.Light) — subtil, confirmatif.

---

## 3. Architecture des Ecrans — 44 Routes

### 3.1 Hierarchie de Navigation

```
app/
├── (auth)/          → 8 ecrans (login, signup, magic-link, forgot/reset password, welcome)
├── (tabs)/          → 6 tabs (home, scanner, map, marketplace/alerts, profile)
├── (marketplace)/   → 7 ecrans (cart, catalog, checkout, coming-soon, product/[id], order-tracking)
├── (onboarding)/    → 1 ecran (index)
├── articles/        → 2 ecrans (index, [id])
├── auth/            → 1 ecran (verify)
├── settings/        → 16 ecrans (achievements, appearance, boycott-list, certifications, ...)
└── root             → 3 ecrans (index, report, scan-result)
```

### 3.2 Patterns de Navigation

| Contexte | Transition | Raison |
|----------|------------|--------|
| Changement de tab | `fade` | Pas de direction impliquee |
| Drill-down settings | `slide_from_right` | Hierarchie de profondeur |
| Modales (report, scan-result) | `slide_from_bottom` | Superposition temporaire |
| Cross-tab (depuis home) | `router.navigate("/(tabs)/...")` | Eviter l'empilement de stack |

### 3.3 Le Home Screen — Vitrine de l'App

Le home screen est la premiere impression apres le login. Il est concu en 5 sections avec un stagger d'entree :

1. **Hero Header** (0ms) : Avatar + salam + notification bell
2. **Stats Pill** (60ms) : Scans / Reports / Niveau / Streak
3. **Quick Actions 2x2** (240-360ms) : Scanner (primary), Map, Alertes, Historique
4. **Discover Around You** (320ms) : Stores proches en carrousel horizontal
5. **Featured Content** (360ms) : Alertes + Articles mixees
6. **Quick Favorites** (480ms) : Cercles Instagram-stories avec ring gradient

Le stagger cree un **effet cascade** de haut en bas — l'oeil suit naturellement la revelation progressive. Chaque section a un delai de 60ms par rapport a la precedente.

---

## 4. Performance — L'Excellence Invisible

### 4.1 Ce Qui Est En Place

| Optimisation | Implementation | Impact |
|-------------|----------------|--------|
| React.memo | Sur tous les sous-composants (StatPillItem, QuickActionCard, FeaturedCard, FavoriteCircle, DiscoverStoreCard) | Evite les re-renders inutiles |
| useCallback | Sur tous les handlers de navigation et d'interaction | Stabilise les references pour React.memo |
| useMemo | Sur les donnees derivees (featuredItems, favoriteProducts, userName) | Evite les recalculs a chaque render |
| staleTime | 30s-120s selon les queries | Reduit les requetes reseau |
| Pull-to-refresh | Promise.all sur 6 queries en parallele | Rafraichit tout d'un coup |
| Skeleton loading | HomeSkeleton, AlertsSkeleton, ProfileSkeleton | Evite le flash de contenu vide |
| expo-image | Avec `transition={200}` et `contentFit="cover"` | Chargement progressif des images |

### 4.2 Ce Qui Manque (Honnêtement)

| Probleme | Impact | Solution |
|----------|--------|----------|
| map.tsx = 1133 lignes | Maintenance difficile, hot-reload lent | Extraire MapMarkerLayer + MapControls |
| 292 fontSize: inline | Inconsistance typographique | Migration incrementale vers textStyles |
| Pas de code splitting | Bundle initial lourd | Lazy load des screens settings |
| FlashList sous-utilise | ScrollView plate sur les listes longues | Remplacer dans alerts, scan-history |
| Pas de prefetch | Navigation vers scan-result peut etre lente | prefetchQuery sur les additifs apres scan |

### 4.3 Metriques de Performance Cibles

| Metrique | Cible | Statut |
|----------|-------|--------|
| TTI (Time to Interactive) | < 2.5s | Non mesure |
| FPS moyen en scroll | > 55 FPS | Non mesure |
| Taille du bundle JS | < 15 MB | Non mesure |
| Memoire peak | < 300 MB | Non mesure |

**Action requise** : Integrer `react-native-performance` ou Sentry Performance pour mesurer ces metriques en production.

---

## 5. Accessibilite — L'Excellence Inclusif

### 5.1 Ce Qui Est En Place

- `accessibilityRole` sur les boutons, liens, headers
- `accessibilityLabel` sur les actions (notification bell, quick actions, favorites)
- `accessibilityHint` pour les sous-titres d'actions
- `IconButton` impose `accessibilityLabel` comme prop REQUIRED

### 5.2 Ce Qui Manque

| Besoin | Statut | Priorite |
|--------|--------|----------|
| Support VoiceOver complet | Partiel | Haute |
| Contraste minimum WCAG AA | Non verifie | Haute |
| Focus trap dans les modales | Non implemente | Moyenne |
| taille de texte dynamique | Non (fontSize: en dur) | Basse (Post-MVP) |
| Support daltonisme | Non (couleurs seules pour les verdicts) | Haute |

**Le risque daltonisme est reel** : Les verdicts halal/doubtful/haram reposent sur vert/orange/rouge — la combinaison la plus problematique pour le daltonisme rouge-vert (8% des hommes). Solution : ajouter des icones distinctives (checkmark, question, X) en plus de la couleur.

### 5.3 RTL (Right-to-Left)

L'app supporte l'arabe avec :
- `I18nManager.forceRTL()` + redemarrage via `Updates.reloadAsync()`
- `rtlFontMultiplier` et `scaleFontForRTL` dans typography.ts
- Traduction complete en `ar.ts`

**Limitation** : Le changement RTL necessite un redemarrage complet de l'app. C'est une limitation d'Expo/RN, pas un choix.

---

## 6. Le Design System en Chiffres

| Metrique | Valeur |
|----------|--------|
| Composants UI reexploitables | 22 (`src/components/ui/`) |
| Composants metier | 10 (scan, skeletons, navigation, onboarding) |
| Tokens couleur exportes | 11 types + ramadan + glass |
| TextStyles definis | 12+ presets (typography.ts) |
| Animations predefines | 6 entry + 3 exit + 3 springs + 1 layout |
| Shadows predefines | 4 niveaux (light + dark) |
| Spacing echelle | 7 niveaux (4-8-12-16-20-24-32) |
| Border radius presets | 5 niveaux (xs-sm-md-lg-xl-full) |

---

## 7. La Promesse Ihsan

L'excellence n'est pas un objectif — c'est une methode. A chaque PR, a chaque composant, se demander :

1. **Est-ce que c'est fluide ?** (60 FPS, pas de jank)
2. **Est-ce que c'est accessible ?** (VoiceOver, daltonisme, grosse police)
3. **Est-ce que c'est coherent ?** (theme tokens, pas de valeurs en dur)
4. **Est-ce que c'est honnete ?** (skeleton plutot que spinner, erreur claire plutot que silence)

> La mediocrite est interdite quand l'excellence est possible. Chaque detail compte parce que chaque detail est un acte.
