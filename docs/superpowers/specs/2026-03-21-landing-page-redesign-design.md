# Naqiy Landing Page — Complete Redesign Spec

**Date**: 2026-03-21
**Status**: Draft
**Approach**: Refactor in-place (rewrite existing sections)

---

## 1. Overview

Complete redesign of the naqiy.app landing page to world-class premium quality. The new landing follows a cinematic dark-to-light scroll narrative with a sticky iPhone mockup that displays faithful React replicas of the actual mobile app screens, transitioning between screens as the user scrolls through content sections.

### Design Decisions

| Decision | Choice |
|----------|--------|
| Aesthetic | Cinematic Dark → Light (dark hero transitioning to light at scroll) |
| Typography | Sora (display headings) + Plus Jakarta Sans (body text) |
| Phone screens | Faithful React replicas of mobile app UI with fake data |
| Phone behavior | Sticky with micro-movements (fallback: pure sticky if not polished enough) |
| Premium effects | Lenis smooth scroll, SplitText character reveal, stagger fade-in, grain overlay, dark→light transition |
| Excluded effects | CustomCursor, MagneticElement, HorizontalScroll, PageLoader |
| Implementation | Refactor in-place — rewrite `web/src/components/layout/sections/` |

---

## 2. Architecture

### 2.1 Three-Layer Structure

**Layer 1 — Animation Infrastructure**

| Component | Location | Role |
|-----------|----------|------|
| `SmoothScroll` | `components/animations/smooth-scroll.tsx` | Lenis provider wrapping entire page (lerp: 0.08) |
| `SplitText` | `components/animations/split-text.tsx` | Per-character scroll-triggered reveal with 3D perspective (rotateX: 90°→0°) |
| `AnimateIn` | `components/animations/animate-in.tsx` | Generic scroll-triggered wrapper (fadeUp, scaleIn, stagger variants) |
| `GrainOverlay` | `components/animations/grain-overlay.tsx` | SVG noise overlay, visible only in dark zone (opacity fades with dark→light transition) |

**Layer 2 — Sticky Phone System**

| Component | Location | Role |
|-----------|----------|------|
| `StickyPhone` | `components/phone/sticky-phone.tsx` | Sticky container with scroll-driven micro-movements (rotateX/Y, scale, translateY) |
| `PhoneFrame` | `components/phone/phone-frame.tsx` | Realistic iPhone frame (notch, edges, reflections) |
| `PhoneScreenManager` | `components/phone/phone-screen-manager.tsx` | Orchestrates transitions between screens (vertical/horizontal) based on active section |
| 7 screen components | `components/phone/screens/*.tsx` | Faithful React replicas of each mobile app screen |

**Layer 3 — Content Sections**

| Section | Associated Screen | Background | Transition In |
|---------|------------------|------------|--------------|
| `HeroSection` | HomeScreen | Dark (#0a0a0a) | — |
| `ScanSection` | ScanScreen | Dark | Vertical ↓ |
| `AnalysisSection` | ScanLoadingScreen → ScanResultScreen | Dark → Mid | Horizontal → (×2) |
| `MapSection` | MapScreen → RestaurantScreen | Mid → Light | Vertical ↓, then Horizontal → |
| `PricingSection` | ProfileScreen | Light (#fafaf8) | Vertical ↓ |
| `SocialProofSection` | Phone fades out | Light | Full-width |
| `CtaSection` | Phone fades back in (HomeScreen) | Dark (#0a0a0a) | Full-width |
| `Footer` | — | Dark | Static |

### 2.2 Page Layout

```
<SmoothScroll>
  <Navbar />                              ← fixed, glass blur, adaptive colors
  <GrainOverlay />                        ← dark zone only
  <div className="grid lg:grid-cols-2">
    <div>                                 ← left column: scrolling content
      <HeroSection />
      <ScanSection />
      <AnalysisSection />
      <MapSection />
      <PricingSection />
    </div>
    <StickyPhone>                         ← right column: sticky phone
      <PhoneFrame>
        <PhoneScreenManager screens={[...]} />
      </PhoneFrame>
    </StickyPhone>
  </div>
  <SocialProofSection />                  ← full width, phone gone
  <CtaSection />                          ← full width, phone returns center
  <Footer />
</SmoothScroll>
```

**Mobile layout**: The phone is not sticky on mobile (< 1024px). Instead it appears inline between sections as a centered element, with the same screen transitions triggered by scroll.

---

## 3. Transitions & Animations

### 3.1 Dark → Light Background Transition

- Implemented via `useScroll` + `useTransform` from Motion 12
- Interpolates `background-color` from `#0a0a0a` to `#fafaf8` between 30-50% scroll progress
- GrainOverlay opacity follows same curve: `1 → 0`
- Text colors invert: `#fff → #1a1a1a`
- Navbar adapts: transparent dark → `rgba(250,250,248,0.8)` with border

### 3.2 Phone Screen Transitions

Logic: same category = horizontal, different category = vertical.

| From → To | Type | Animation |
|-----------|------|-----------|
| Home → Scan | Vertical ↓ | `translateY(100%) → 0`, spring (stiffness: 100, damping: 20) |
| Scan → ScanLoading | Horizontal → | `translateX(100%) → 0` |
| ScanLoading → ScanResult | Horizontal → | `translateX(100%) → 0` |
| ScanResult → Map | Vertical ↓ | `translateY(100%) → 0` |
| Map → Restaurant | Horizontal → | `translateX(100%) → 0` + bottomsheet slide-up |
| Restaurant → Profile | Vertical ↓ | `translateY(100%) → 0` |

Trigger: section visibility at 40% via `useInView` with `amount: 0.4`.

### 3.3 Phone Micro-Movements (Plan B, fallback to pure sticky)

Scroll-driven transforms on `StickyPhone`:
- `rotateY`: ±2° sinusoidal across section scroll
- `rotateX`: ±1°
- `scale`: 0.98 → 1.02 (breathing effect)
- `translateY`: ±8px parallax

Uses `useScroll` + `useTransform` with `[0, 0.5, 1]` ranges. If result isn't polished → remove transforms (fallback A).

### 3.4 Content Animations (Left Column)

- **Titles**: `SplitText` character reveal, stagger 0.02s, `rotateX: 90° → 0°` with perspective
- **Subtitles**: `AnimateIn` fadeUp (opacity + translateY 24px), 0.1s delay after title
- **Badges/tags**: Stagger scale-in (0.8 → 1 + opacity), 0.05s between each
- **CTAs**: Fade-up with blur (`filter: blur(6px) → blur(0)`)

### 3.5 Accessibility

All animations respect `prefers-reduced-motion: reduce`:
- No SplitText → simple fadeIn
- No phone micro-movements
- Instant transitions (opacity only, no translate)
- Lenis disabled → native scroll

---

## 4. Phone Screens (React Replicas)

Each screen is a React component at fixed 375×812 dimensions, `overflow: hidden`, scaled by PhoneFrame parent. Tailwind 4 styling, hardcoded fake data, no fetching.

### 4.1 HomeScreen
- Header: Naqiy logo + notification bell + avatar
- Search bar with scan icon
- "Scannés récemment": 3 horizontal product cards (Nutella, Kinder Bueno, Haribo) with verdict badges
- "Magasins proches": 2 store cards with distance
- Bottom tab bar: Home (active), Scanner, Map, Profile
- Palette: dark (#0f0f0f), cards #1a1a1a, gold accents

### 4.2 ScanScreen
- Full-screen simulated camera (dark gradient + scan grid)
- Central scan frame (rounded rectangle, gold border with pulse animation)
- Text: "Placez le code-barres dans le cadre"
- Flash + gallery icons at bottom
- Scanner tab active

### 4.3 ScanLoadingScreen
- Detected barcode displayed at top (3017620422003)
- Animated circular progress (stroke-dashoffset)
- "Analyse en cours..." with staggered steps:
  - "Identification du produit..."
  - "Analyse des ingrédients..."
  - "Vérification halal..."
- Naqiy logo watermark

### 4.4 ScanResultScreen
- Product: Nutella 400g, Ferrero, image placeholder
- Verdict: HALAL — large green badge, score 87/100
- Naqiy Grade: circular progress bar (gold)
- Ingredients list with green/red icons per ingredient
- Madhab section: "Selon l'école Hanafi" badge
- CTAs: "Voir les alternatives" + "Ajouter aux favoris"

### 4.5 MapScreen
- Stylized map (light gray background with street shapes, not a real map)
- 5-6 certified store pins (gold pin icon)
- Search bar: "Rechercher un magasin..."
- Filter badges: "Tous", "AVS", "Achahada"
- Blue dot for user location
- Map tab active

### 4.6 RestaurantScreen
- Same map background (slightly zoomed)
- Bottomsheet sliding up with:
  - Restaurant photo placeholder
  - "Istanbul Kebab" — 4.5 stars — "Certifié AVS"
  - Address + distance (1.2 km)
  - Hours: "Ouvert · Ferme à 22h00"
  - Gold "Itinéraire" button

### 4.7 ProfileScreen
- Avatar + name "Youssef M."
- "Naqiy+" gold badge with shimmer
- Stats: 47 scans, 12 favorites, école Hanafi
- Settings: École juridique, Notifications, Apparence
- "Mon abonnement" section with Naqiy+ details
- Logout button at bottom

---

## 5. Navbar

- `position: fixed`, `backdrop-blur-xl`, `z-50`
- Dark zone: transparent bg, white text, no border
- Light zone: `rgba(250,250,248,0.8)` bg, dark text, subtle border-bottom
- Scroll-reactive color interpolation via `useScroll`
- Content: Logo (left) + links (Fonctionnalités, Tarifs) + gold "Télécharger" CTA button
- Mobile: hamburger → sheet slide-in

---

## 6. Pricing Section

Associated phone screen: ProfileScreen. Background: light (#fafaf8).

- Two-tier comparison: Free vs Naqiy+ side by side
- Card layout: subtle border, light background, the Naqiy+ card has a gold border + "Recommandé" badge
- Feature list per tier with checkmarks (green) and crosses (muted)
- Monthly/annual toggle with discount badge on annual ("−40%")
- CTA: "Commencer gratuitement" (outline) + "Passer à Naqiy+" (gold filled)
- Carries forward existing pricing content, adapted to light zone styling

---

## 7. Social Proof Section (Full-Width, Phone Fades Out)

Phone fades out (`opacity: 1→0`, `scale: 1→0.95`) when this section enters view.

- **Animated counters** (counter-up on scroll):
  - "817K+" produits analysés
  - "383" magasins certifiés
  - "5" écoles juridiques
  - "100%" gratuit
- **Testimonials**: 3 cards in horizontal grid
  - Avatar + name + "Utilisateur Naqiy+"
  - Quote in guillemets
  - Star rating (4.5-5)
  - Subtle card bg, fine border, no heavy shadow
- **Certified by**: AVS, Achahada, Halal Correct logos in row, grayscale → color on hover
- Background: light (#fafaf8)

---

## 8. CTA Final Section (Full-Width)

Phone fades back in (`opacity: 0→1`, `scale: 0.95→1`) from bottom, showing HomeScreen. Returns to dark.

- Background: dark (#0a0a0a) with grain overlay
- Title: Sora, large, "Prêt à scanner en confiance ?" with SplitText reveal
- Subtitle: Jakarta, "Rejoins les milliers d'utilisateurs qui font confiance à Naqiy"
- 2 buttons: "Télécharger sur l'App Store" + "Disponible sur Google Play" (store icons)
- Phone center/right, slight 3D rotation, gold glow behind

---

## 9. Footer

- Background: dark (#0a0a0a), subtle border-top
- 4-column layout:
  - Col 1: Logo + tagline + social media icons
  - Col 2: Produit (Fonctionnalités, Tarifs)
  - Col 3: Légal (CGU, Politique de confidentialité, Mentions légales)
  - Col 4: Contact (contact@naqiy.app, support@naqiy.app)
- Bottom: "© 2026 Naqiy. Tous droits réservés."
- Static, no animations

---

## 10. Technical Stack

| Dependency | Version | Role |
|-----------|---------|------|
| Next.js | 16.1.7 (existing) | Framework |
| Motion | 12.38.0 (existing) | All animations, scroll-driven transforms |
| Tailwind CSS | 4 (existing) | Styling |
| shadcn/ui | v4 (existing) | Base components (Button, Badge, Card) |
| Sora | Google Fonts | Display headings |
| Plus Jakarta Sans | existing | Body text |
| Lenis | ^1.x (new) | Smooth scroll |
| Phosphor Icons | existing | Icons |

### New files to create (~25 files)

```
web/src/components/animations/
  smooth-scroll.tsx
  split-text.tsx
  animate-in.tsx
  grain-overlay.tsx

web/src/components/phone/
  sticky-phone.tsx
  phone-frame.tsx
  phone-screen-manager.tsx
  screens/
    home-screen.tsx
    scan-screen.tsx
    scan-loading-screen.tsx
    scan-result-screen.tsx
    map-screen.tsx
    restaurant-screen.tsx
    profile-screen.tsx

web/src/components/layout/sections/  (rewrites)
  navbar.tsx          (rewrite)
  hero.tsx            (rewrite)
  scan-section.tsx    (new, replaces features + how-it-works)
  analysis-section.tsx (new)
  map-section.tsx     (new, replaces old certifiers)
  pricing-section.tsx (rewrite)
  social-proof.tsx    (new, replaces testimonials + stats)
  cta-section.tsx     (rewrite of cta-download)
  footer.tsx          (rewrite)

web/src/app/page.tsx  (rewrite)
```

### Files to delete

```
web/src/components/layout/sections/stats.tsx
web/src/components/layout/sections/features.tsx
web/src/components/layout/sections/how-it-works.tsx
web/src/components/layout/sections/certifiers.tsx
web/src/components/layout/sections/naqiy-grade.tsx
web/src/components/layout/sections/testimonials.tsx
web/src/components/layout/sections/faq.tsx
web/src/components/ui/extras/phone-mockup.tsx  (replaced by phone/ system)
```

---

## 11. Mobile Responsiveness

- **Desktop (≥1024px)**: Two-column grid, phone sticky on right
- **Tablet (768-1023px)**: Single column, phone inline between sections (centered, 70% width)
- **Mobile (<768px)**: Single column, phone inline (90% width), simplified animations (no SplitText character-level, just word-level)

---

## 12. Performance Considerations

- Lenis: `requestAnimationFrame` based, <1ms per frame
- Phone screens: static React components, no re-renders on scroll (transforms via Motion, not state)
- `will-change: transform` on StickyPhone and PhoneScreenManager only
- Lazy load sections below fold via `Suspense` + dynamic imports
- GrainOverlay: SVG filter applied once, composited by GPU
- Target: Lighthouse Performance ≥ 90 on mobile
