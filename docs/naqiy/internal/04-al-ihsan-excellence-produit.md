# Al-Ihsan (الاحسان) -- L'Excellence du Produit

> *"Al-Ihsan an ta'buda Allaha ka'annaka tarahu, fa in lam takun tarahu
> fa innahu yarak."*
> *"L'Ihsan, c'est adorer Allah comme si tu Le voyais, car si tu ne Le
> vois pas, Lui te voit."*
> -- Hadith de Jibril, rapporte par Muslim

---

## L'excellence comme exigence

L'Ihsan est le sommet de la pratique islamique : faire chaque chose
avec une excellence telle que l'on agit comme si l'on etait observe
par le Tres-Haut. Transpose dans le design produit, cela signifie
que chaque pixel, chaque milliseconde de latence, chaque transition
d'ecran est travaillee avec la conscience qu'elle affecte l'experience
d'un etre humain qui nous fait confiance.

Ce chapitre documente les cinq piliers de notre design system, les
patterns de navigation, les optimisations de performance, et les
chantiers d'accessibilite en cours.

---

## Le design system Naqiy : cinq modules

Le design system est structure en cinq fichiers source dans
`optimus-halal/src/theme/`, chacun exportant des tokens types et
documentes.

### Module 1 : Colors (`colors.ts`) -- 365 lignes

Le module de couleurs est le plus volumineux car il porte l'identite
visuelle entiere de Naqiy. Il est structure en couches :

**Palettes primitives :**
- `primary` : 11 nuances du vert hero `#13ec6a` (50 a 950)
- `gold` : 11 nuances de l'or accent `#D4AF37` (50 a 950)
- `neutral` : 11 nuances de gris chaud avec sous-ton vert (50 a 950)

**Couleurs semantiques :**
- `semantic.success` / `warning` / `danger` / `info` : chaque
  intention a une base, un light (fond teinte), et un dark (texte
  contrastant)

**Couleurs de statut halal :**
- `halalStatus.halal` : vert `#22c55e` avec fond transparent
- `halalStatus.haram` : rouge `#ef4444`
- `halalStatus.doubtful` : orange `#f97316`
- `halalStatus.unknown` : gris `#6b7280`
- Chaque statut a un `bg` (light mode) et un `bgDark` (dark mode)
  avec des opacites calibrees pour la lisibilite

**Themes contextuels :**
- `lightTheme` : 24 tokens (background, card, textes, bordures,
  overlays, boutons, icones, scores de statut)
- `darkTheme` : 24 tokens miroir avec esthetique anthracite-or

**Surfaces vitrees :**
- `glass.light` / `glass.dark` : 5 tokens chacun pour les surfaces
  glassmorphism (frosted glass effect). Le dark mode utilise des
  bordures dorees subtiles (`rgba(207, 165, 51, 0.20)`).

**Palette saisonniere Ramadan :**
- `ramadan` : 7 couleurs (or, indigo, violet, warm black,
  crescent glow) pour le mode Ramadan active par `useRamadanMode.ts`

**Couleurs de types de commerces :**
- `storeTypeColors` : 8 entrees (butcher, restaurant, supermarket,
  bakery, abattoir, wholesaler, online, other) avec base, light,
  dark, et icone MaterialIcons associee

**Gradients :**
- `gradients` : 10 tuples nommes (primary, premium, trust, alert,
  heroDark, heroLight, ramadanDark, ramadanLight, ramadanPrimary)

**Exports de types :** Chaque palette exporte son type TypeScript
derive via `typeof`. Le type `Colors` est l'union complete.

### Module 2 : Typography (`typography.ts`) -- 214 lignes

**Police :** Inter (Google Fonts via expo-font). Choisie pour :
- Excellente lisibilite sur petit ecran
- Support complet des ligatures
- 5 graisses utilisees : Regular (400), Medium (500), SemiBold (600),
  Bold (700), Black (900)
- Mapping platform-aware : iOS utilise `Inter`, Android utilise
  les noms de fichiers specifiques (`Inter_400Regular`, etc.)

**Echelle typographique (minor third modular scale) :**

| Token      | Taille | Graisse  | Interligne | Usage                    |
|------------|--------|----------|------------|--------------------------|
| `display`  | 32px   | Black    | 40px       | Splash, onboarding       |
| `h1`       | 28px   | Bold     | 36px       | Titres d'ecran           |
| `h2`       | 24px   | Bold     | 32px       | Titres de section        |
| `h3`       | 20px   | SemiBold | 28px       | Titres de carte          |
| `h4`       | 18px   | SemiBold | 26px       | Labels, items de liste   |
| `body`     | 16px   | Medium   | 24px       | Texte courant            |
| `bodySmall`| 14px   | Regular  | 21px       | Descriptions secondaires |
| `caption`  | 12px   | Regular  | 16px       | Timestamps, notes        |
| `micro`    | 10px   | Medium   | 14px       | Badges, labels uppercase |

**Styles composites :** `textStyles` exporte 9 objets `TextStyle`
prets a etre spreades : `<Text style={textStyles.h1}>`.

**Support RTL arabe :**
- `rtlFontMultiplier = 1.12` : les glyphes arabes connectes
  necessitent +12% de taille pour une lisibilite equivalente
- `scaleFontForRTL(size, isRTL)` : fonction utilitaire qui
  applique le multiplicateur conditionnellement

**Dette active :** 292 `fontSize` inline persistent dans 25 ecrans.
La migration vers les tokens `textStyles` est planifiee comme
chantier incremental.

### Module 3 : Spacing (`spacing.ts`) -- 125 lignes

**Base spatiale :** 4px avec intermediaires 2px et 6px.

| Token   | Valeur | Usage                                    |
|---------|--------|------------------------------------------|
| `2xs`   | 2px    | Micro-espacement, icone-texte            |
| `xs`    | 4px    | Intra-composant serre                    |
| `sm`    | 6px    | Padding de badge                         |
| `md`    | 8px    | Gap par defaut petit                     |
| `lg`    | 12px   | Gap intra-section                        |
| `xl`    | 16px   | Padding de composant par defaut          |
| `2xl`   | 20px   | Padding genereux                         |
| `3xl`   | 24px   | Espacement de section                    |
| `4xl`   | 32px   | Division majeure                         |
| `5xl`   | 40px   | Espacement vertical d'ecran              |
| `6xl`   | 48px   | Hero spacing                             |
| `7xl`   | 64px   | Clearance maximale                       |

**Border radius :**

| Token  | Valeur | Usage                              |
|--------|--------|------------------------------------|
| `none` | 0px    | Aretes vives                       |
| `sm`   | 8px    | Inputs, petites cartes             |
| `md`   | 12px   | Cartes standard                    |
| `lg`   | 16px   | Modales, sheets                    |
| `xl`   | 20px   | Hero cards, CTAs                   |
| `2xl`  | 24px   | FABs, pills                       |
| `full` | 9999px | Cercles, pilules                   |

**Touch targets :**
- `hitSlop.default` : 8px sur chaque cote (= 44x44 minimum WCAG)
- `hitSlop.large` : 12px (boutons d'action)

### Module 4 : Shadows (`shadows.ts`) -- 159 lignes

**Approche :** Les ombres sont les seuls tokens qui different
structurellement entre light et dark mode.

**Light mode (`lightShadows`) :**
- Couleur de base : noir avec opacite faible (0.04 a 0.15)
- 5 niveaux : `subtle` (1px), `card` (2px), `float` (4px),
  `hero` (8px), `glow` (vert primaire, 16px radius)

**Dark mode (`darkShadows`) :**
- Couleur de base : `gold[900]` et `gold[800]` avec opacite
  moyenne (0.20 a 0.40)
- Le meme objet a 5 niveaux mais le `card` utilise `gold[900]`
  comme `shadowColor`, creant un halo dore subtil sous chaque carte
- Le `glow` utilise `gold[500]` avec opacite 0.40 -- un eclat
  d'or pur pour les elements actifs

**Fonction utilitaire :**
```typescript
const getShadows = (isDark: boolean) => isDark ? darkShadows : lightShadows;
```

**Limitation Android :** Android ignore `shadowColor` et utilise
uniquement `elevation`. Les halos dores du dark mode sont donc
invisibles sur Android -- cette limitation est documentee mais
non contournable sans un wrapper custom avec `react-native-shadow-2`.

### Module 5 : Animations (`animations.ts`) -- 275 lignes

Le module d'animations est le "caractere" de Naqiy. Il definit
comment l'app bouge.

**Durees :**

| Token      | Valeur | Usage                              |
|------------|--------|------------------------------------|
| `instant`  | 100ms  | Micro-interactions, toggles        |
| `fast`     | 200ms  | Boutons, changements d'icone       |
| `normal`   | 300ms  | Transitions standard               |
| `slow`     | 500ms  | Revealations deliberees            |
| `dramatic` | 800ms  | Entrees hero, onboarding           |

**Easings :**
- `easeOut` : deceleration (elements qui arrivent)
- `easeIn` : acceleration (elements qui partent)
- `easeInOut` : symetrique (boucles, progres)
- `overshoot` : bezier(0.34, 1.56, 0.64, 1) -- micro-interactions
  joueuses
- `linear` : barres de progression

**Spring presets :**

| Preset         | Damping | Stiffness | Mass | Usage                  |
|----------------|---------|-----------|------|------------------------|
| `springConfig`  | 15      | 150       | 1.0  | Defaut responsive      |
| `springBouncy`  | 10      | 180       | 0.8  | Celebrations, onboarding|
| `springStiff`   | 20      | 300       | 1.0  | Snappy, sans overshoot |
| **`springNaqiy`**| **14**  | **170**   |**0.9**| **Signature Naqiy**    |

**Le `springNaqiy` :** C'est notre animation signature. Damping 14
(assez amorti pour etre pro, assez souple pour etre vivant),
stiffness 170 (reactif mais pas brusque), mass 0.9 (legerement
plus legere que la masse unitaire pour une sensation d'elegance).
La documentation interne le decrit ainsi : *"comme poser un produit
sur du velours"*.

Il est utilise pour : card presses, tab switches, sheet reveals,
scroll snap, layout transitions. Le `layoutTransition` du module
utilise les memes parametres via `Layout.springify()`.

**Animations d'entree (7 presets) :**
- `fadeIn`, `fadeInDown`, `slideInUp`, `slideFromBottom`,
  `slideFromTop`, `scaleIn`, `dramaticFadeIn`
- Chaque preset accepte un `index` pour le stagger (60ms par defaut)

**Animations de sortie (6 presets) :**
- `fadeOut`, `fadeOutDown`, `fadeOutUp`, `slideOutRight`,
  `slideOutLeft`, `scaleOut`
- Utilisent `easings.easeIn` (acceleration) -- l'inverse des entrees

---

## Navigation : 44 routes, 5 groupes

### Les 5 groupes de navigation

| Groupe          | Pattern de transition        | Routes |
|-----------------|------------------------------|--------|
| `(auth)`        | `slide_from_right`           | 8      |
| `(onboarding)`  | `slide_from_right`           | 1      |
| `(tabs)`        | `fade` (cross-fade premium)  | 6      |
| `(marketplace)` | `slide_from_right`           | 7      |
| `settings`      | `slide_from_right`           | 15     |

Plus les routes racine : `index.tsx`, `scan-result.tsx`, `report.tsx`,
et `articles/`.

### Le PremiumTabBar

La tab bar custom (`PremiumTabBar.tsx`) est l'element de navigation
le plus travaille :

- 5 onglets : Home, Map, Scanner (central), Marketplace, Profile
- Le bouton Scanner est sureleve avec un glow vert primaire
  en dark mode et un glow vert clair en light mode
- Les icones changent entre fill et outline selon l'etat actif
- Backdrop blur effect sous la barre (iOS uniquement)
- Haptic feedback selectionne sur chaque changement d'onglet
- Transition `fade` entre les onglets (200ms sur Android)

### Patterns de navigation

- **Cross-tab :** Toujours `router.navigate("/(tabs)/...")`, jamais
  `router.push` (evite l'empilement de l'historique)
- **Drill-down settings :** `slide_from_right` pour coherence
  avec les conventions natives
- **Modals :** `slide_from_bottom` pour `scan-result.tsx` et
  `report.tsx`
- **Retour :** Le geste swipe-back est active sur toutes les
  routes non-root

---

## Performance

### Optimisations implementees

**Cache Redis :** Les lookups OpenFoodFacts sont caches 24h.
Les listes de boycott sont cachees 1h. Impact : < 500ms pour un
re-scan vs ~1-2s pour un premier scan.

**Cursor-based pagination :** L'historique de scans utilise un
cursor UUID au lieu d'un offset numerique. Avantage : performance
constante O(1) quel que soit la profondeur de pagination (pas de
`OFFSET N` qui scanne N lignes).

**Batch madhab rulings :** La fonction `lookupAdditives()` fait
un seul `inArray` pour tous les additifs + un seul `inArray` pour
tous les rulings madhab. Zero requete N+1.

**Transaction atomique :** Le scan+XP+streak+level est une seule
transaction PostgreSQL. Pas de race condition possible entre
le calcul d'XP et la mise a jour du niveau.

**React.memo :** Les composants lourds (`StoreCard`, `MapMarkerLayer`,
`MapControls`) sont encapsuled dans `React.memo`. Limitation connue :
`StoreCard` est defait par une arrow function inline dans `onPress`
-- a corriger avec un callback stable.

**FlashList v2 :** Utilise pour les listes longues (historique,
articles, commerces). FlashList v2 calcule automatiquement
`estimatedItemSize`, pas besoin de le specifier.

### Metriques cibles

| Metrique                    | Cible      | Actuel        |
|-----------------------------|------------|---------------|
| Time to verdict (rescan)    | < 500ms    | ~300ms        |
| Time to verdict (first scan)| < 3s       | ~1.5-2.5s     |
| TTI (Time to Interactive)   | < 2s       | ~1.8s (iOS)   |
| Bundle size (JS)            | < 5 MB     | ~4.2 MB       |
| Memory usage (idle)         | < 150 MB   | ~120 MB       |

---

## Accessibilite : l'etat des lieux

### Ce qui est fait

- `hitSlop` sur tous les boutons (44x44 minimum WCAG AA)
- `accessibilityLabel` requis sur `IconButton` (prop obligatoire)
- Contraste texte : blanc sur anthracite = ratio > 15:1 (AAA)
- Couleurs de statut halal identiques en light/dark (coherence)
- `scaleFontForRTL` pour les locales arabes (+12%)
- Traduction complete en 3 langues (fr, en, ar) avec types

### Ce qui manque

- **VoiceOver/TalkBack :** Non teste systematiquement. Les roles
  ARIA des composants custom (GlowCard, TrustRing, IslamicPattern)
  ne sont pas definis.
- **Contraste orange :** Le `doubtful` orange `#f97316` sur fond
  sombre `#0C0C0C` a un ratio de 5.2:1 -- passe AA mais echoue
  AAA pour le texte petit.
- **Animations reduites :** Pas de respect de
  `prefers-reduced-motion`. Les animations du springNaqiy devraient
  etre desactivees si l'utilisateur a active le mode reduit dans
  les reglages systeme.
- **Focus visible :** Pas d'indicateur de focus clavier/switch
  sur les elements interactifs.
- **Dynamic Type :** Les tailles de texte ne reagissent pas aux
  preferences systeme de taille de police (iOS Dynamic Type /
  Android font scale).

### Le RTL arabe

Le support RTL est partiellement implemente :

- **I18nManager.forceRTL()** est appele quand la locale est `ar`
- **Probleme :** Le changement de direction necessite un restart
  complet de l'app via `Updates.reloadAsync()`. Un dialogue
  d'avertissement est affiche a l'utilisateur.
- **Limitation :** Certains composants tiers (Mapbox, bottom sheet)
  ne respectent pas parfaitement le RTL.
- **Font :** La police Inter ne contient pas les glyphes arabes.
  Le systeme fallback sur la police arabe du systeme, ce qui cree
  une inconsistance visuelle. Solution future : ajouter Noto Sans
  Arabic comme police secondaire.

---

## Composants UI remarquables

### GlowCard

Carte avec halo lumineux. Utilisee pour les elements premium et les
resultats de scan. En dark mode, l'ombre doree (`darkShadows.glow`)
cree un effet "carte qui flotte sur de l'or". Limitation : le
`shadowColor` dore est ignore sur Android.

### TrustRing

Anneau de progression circulaire qui affiche le score de confiance
du verdict halal. Anime avec `springNaqiy`. La couleur de l'anneau
varie selon le statut (vert/orange/rouge/gris).

### IslamicPattern

Motif geometrique islamique utilise en arriere-plan subtil sur
certains ecrans (onboarding, profile). Genere procedurallement en
SVG via `react-native-svg`.

### ArabicCalligraphy

Composant qui affiche un texte en calligraphie arabe decorative.
Utilise pour les epigraphes et les citations coraniques dans
l'interface.

### PremiumBackground

Arriere-plan multi-couches qui s'adapte au theme. En dark mode :
fond anthracite `#0C0C0C` avec un gradient subtil. En light mode :
fond chaud `#f3f1ed` avec un leger grain. Synchronise avec les
tokens `lightTheme.background` et `darkTheme.background`.

### ShareCard

Carte visuelle generee par `react-native-view-shot` pour le
partage social du resultat d'un scan. Contient : nom du produit,
verdict halal, score de confiance, branding Naqiy. Capturee off-screen
(`opacity: 1, left: -9999`) avec `collapsable={false}` pour
Android. Partagee via `expo-sharing` (image) ou en fallback texte.

---

## La palette saisonniere : mode Ramadan

Le hook `useRamadanMode.ts` detecte la periode de Ramadan (dates
calculees) et active une palette saisonniere :

- Gradient hero : `ramadanDark` (`#0f0a1e` --> `#312e81`) --
  un noir chaud qui tend vers l'indigo
- Accent : `ramadan.gold` (`#D4AF37`) remplace le vert primaire
  pour les CTAs
- Halo : `ramadan.crescentGlow` (`rgba(212, 175, 55, 0.25)`) --
  un croissant dore en arriere-plan
- Gradient CTA : `ramadanPrimary` (`#D4AF37` --> `#7c3aed`) --
  or vers violet spirituel

Ce mode est subtil : il ne change pas la fonctionnalite, juste
l'ambiance visuelle. C'est un clin d'oeil respectueux a la periode
sacree, pas un evenement marketing.

---

## L'aspiration : ou va le design

### Court terme

- Migrer les 292 `fontSize` inline vers `textStyles`
- Extraire un composant `ScreenHeader` partage (les hauteurs
  d'en-tete varient de 15-20px entre ecrans)
- Extraire `NotificationBell` (duplique 3x)
- Implementer `prefers-reduced-motion`
- Ajouter Noto Sans Arabic pour le support RTL

### Moyen terme

- Design system tokens dans un package partage (`@naqiy/theme`)
  utilisable par le web (futur dashboard admin)
- Storybook React Native pour documentation visuelle des composants
- Tests visuels de regression avec Percy ou Chromatic
- Support Dynamic Type (iOS) et font scale (Android)

### Long terme

- Micro-animations contextuelles : le TrustRing pulse doucement
  quand le score de confiance est en zone grise, invitant a
  explorer les details
- Transitions shared-element entre la carte et le detail commerce
- Mode compact pour les utilisateurs avances qui veulent plus
  de densite d'information

L'Ihsan n'a pas de fin. L'excellence est un horizon, pas une
destination. Chaque sprint rapproche le produit de ce que nos
utilisateurs meritent.

---

*Document interne Naqiy -- Version 1.0 -- Fevrier 2026*
*Classification : Strategique -- Diffusion restreinte*
