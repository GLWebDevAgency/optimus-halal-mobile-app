# Landing Page World-Class Polish — Design Spec

**Date**: 2026-03-24
**Status**: Approved
**Scope**: Multi-dimensional polish pass on naqiy.app landing page
**Target**: 7.5/10 → 9.5/10

---

## Context

The Naqiy landing page has a solid foundation — OKLCH design system, animation primitives (AnimateIn, SplitText, SmoothScroll), scroll-driven phone orchestrator with 3D parallax, and a clean AIDA funnel. But it falls short of "world-class" due to visual monotony, lack of micro-interactions, static content, and missing polish details.

## Approach: 8 Simultaneous Dimensions

Each dimension is independently implementable but their combined effect creates the premium feel.

---

## D1 — Hero Impact

### Scroll Indicator
- Animated chevron at bottom of hero section
- CSS `bounce` animation (infinite, 2s)
- Micro-text "Découvrir" underneath, `text-muted-foreground/50`, `text-xs`
- Fades out when user scrolls past 200px (via `useScroll` opacity interpolation)

### Background Mesh
- 3 animated blobs (gold, leaf, warm-white)
- Each blob: `position: absolute`, radial gradient, `animation: float-slow` with different delays
- Blobs drift slowly (20-30s cycle) creating living background
- `pointer-events: none`, `mix-blend-mode: normal` (no color bleed)

### Stats Micro-Strip
- Below hero CTA, inline flex: "817K+ produits analysés · 383 magasins · 100% gratuit"
- Each number uses animated counter (see D2)
- `text-sm text-muted-foreground/60`

---

## D2 — Motion Craft

### Animated Counters
- New component: `AnimatedCounter`
- Uses `useInView` trigger + `useSpring` from Motion
- Spring config: `stiffness: 50, damping: 30` (smooth 2s ramp)
- Formats with `Intl.NumberFormat('fr-FR')` (spaces as thousand separators)
- Suffix support: "K+", "+", "%"
- Used in: SocialProof stats, Hero micro-strip

### Card 3D Tilt
- New utility component: `TiltCard`
- `onMouseMove`: calculate cursor position relative to card center
- Apply `transform: perspective(800px) rotateX(Xdeg) rotateY(Ydeg)`
- Max rotation: 3 degrees
- `onMouseLeave`: spring back to 0
- Applied to: Analysis cards, ScanResult cards, Pioneer cards, Pricing cards

### Button Hover Enhancement
- All primary buttons: `transition-all duration-200`
- Hover: `scale-[1.03] -translate-y-px shadow-lg`
- Gold CTAs: hover adds `box-shadow: 0 0 30px oklch(0.76 0.14 88 / 20%)`

### Link Underline Animation
- Navbar links + footer links
- `::after` pseudo-element: `scaleX(0) → scaleX(1)`, `origin-left`
- Height: 2px, color: gold
- Transition: 200ms ease-out

### Section Reveal Enhancement
- New AnimateIn variant: `reveal` — uses `clip-path: inset(100% 0 0 0) → inset(0)`
- New variant: `parallaxUp` — `y: 40px, opacity: 0, scale: 0.98 → y: 0, opacity: 1, scale: 1`
- Apply to section headings and key visual elements

---

## D3 — Visual Variety

### Background Strategy

Each section gets a distinct background treatment. No two adjacent sections share the same approach.

| Section | Treatment | CSS |
|---------|-----------|-----|
| Hero | 3 animated mesh blobs (gold, leaf, warm) | Absolute positioned divs with `float-slow` |
| Scan | Subtle grid pattern | `background-image: linear-gradient(...)` creating 24px grid at 3% opacity |
| Analysis | Warm cream gradient | `bg-gradient-to-b from-background to-secondary/30` |
| ScanResult | Radial spotlight | `radial-gradient(ellipse at 50% 40%, gold/3%, transparent 60%)` |
| NaqiyScore | Concentrique gold glow | `radial-gradient(circle at 50% 30%, gold/5%, transparent 50%)` |
| SocialProof | Secondary with warm tint | `bg-secondary/50` |
| Map | Dot grid | `radial-gradient(circle, border 1px, transparent 1px)` 24px repeat |
| Restaurant | Same dot grid (continuity) | Same as Map |
| ComingSoon | Gradient toward dark | `bg-gradient-to-b from-background to-secondary/80` |
| Pricing | Deep secondary + spotlight | `bg-secondary/50` + radial gold under Naqiy+ card |
| CTA | Full warm mesh + breathing glow | Enhanced existing `breathe` animation |
| Footer | Dark (unchanged) | Already premium |

### Section Dividers
- Use existing `divider-gold` utility between major narrative transitions
- Placed between: Hero→Scan, RestaurantDetail→ComingSoon, Pricing→CTA
- Not between every section (would be too much)

---

## D4 — Social Proof Power

### Animated Stats Cards
- Replace static text with `AnimatedCounter` component
- Each counter triggers when card enters viewport
- Icon inside each card gets subtle `pulse` animation on hover

### Pioneer Cards Redesign
- Replace `border-dashed` with `border-solid border-border/50`
- Add subtle gradient background: `bg-gradient-to-b from-card/80 to-card/40`
- Add `TiltCard` 3D effect
- Add micro CTA button at bottom of each card: "Rejoindre" / "Partager" / "S'inscrire"
- CTA buttons use `border-gold/30` outline style

### Trust Badge
- Add `Badge` above stats: "Données réelles — mis à jour quotidiennement"
- Uses `leaf` accent color (reinforces honesty/transparency)

---

## D5 — Navbar Premium

### Scroll Progress Bar
- 2px gold bar at very top of page (above navbar)
- Width: 0% → 100% based on page scroll position
- Uses `useScroll` from Motion → `scaleX` transform (GPU-accelerated)

### Active Section Indicator
- Gold dot (4px circle) under active nav link
- Determined by which section ref is currently `inView`
- Animated with `layoutId` for smooth slide between links

### CTA Enhancement
- Navbar download button: add subtle `glow-pulse` animation at rest
- On scroll past hero: button transitions from `outline` to `filled` (gold background)

---

## D6 — CTA Magnetism

### Primary CTA Buttons
- Hero store badges: add `border-gradient-gold` (animated rotating border)
- Pricing Naqiy+ button: add CSS `glow-pulse` (existing keyframe, 5s cycle)
- CTA Download buttons: same `border-gradient-gold` treatment

### Mobile Floating CTA
- Fixed bottom bar (below fold only): "Télécharger Naqiy" + App Store/Play badges
- Appears after scroll > 100vh
- `backdrop-blur-xl bg-background/80 border-t border-border/50`
- Hides when CTA download section is in view (no duplicate)
- `lg:hidden` (desktop has CTAs inline)

---

## D7 — Micro-Details

### Noise Overlay Adaptation
- Reduce grain opacity from 0.035 to 0.02 on Hero (less distraction)
- 0.03 on content sections
- 0 on CTA and Footer (clean finish)
- Implementation: CSS variable `--grain-opacity` set per section

### Cursor Glow (Desktop Only)
- On NaqiyScore and Pricing sections
- 200px radial gradient following cursor
- `gold/8%` opacity, `pointer-events: none`
- Uses `onMouseMove` on section wrapper
- `prefers-reduced-motion: reduce` → disabled

### Focus States
- Global: `focus-visible:ring-2 focus-visible:ring-gold/50 focus-visible:ring-offset-2`
- Applied via Tailwind base layer on interactive elements

### Phone Screen Blur Transition
- During screen change in `PhoneScreenManager`, add 2px blur to exiting screen
- Exit variant: `{ opacity: 0, filter: "blur(2px)", y/x: "-30%" }`

---

## D8 — Mobile Excellence

### Responsive Phone
- Below `sm` (< 640px): `scale-[0.75]`
- `sm` to `lg`: `scale-[0.85]` → `scale-[0.95]`
- Above `lg`: full size in sticky column

### Touch Targets
- All buttons: `min-h-[48px] min-w-[48px]`
- Footer links: `py-2` for comfortable tapping

### Reduced Motion
- Wrap all scroll-driven animations in `prefers-reduced-motion` check
- Counters: instant display (no animation)
- Parallax: disabled
- TiltCard: disabled
- Transitions: `duration-0`

### Mobile Background Optimization
- Mesh blobs: reduce to 2 (instead of 3) on mobile
- Grid/dot patterns: increase gap to 32px on mobile (less rendering)
- Cursor glow: disabled entirely (`lg:` only)

---

## Files Affected

### New Components
- `components/animations/animated-counter.tsx` — Spring-based number counter
- `components/animations/tilt-card.tsx` — 3D cursor-following card
- `components/animations/cursor-glow.tsx` — Section-level cursor glow
- `components/layout/scroll-progress.tsx` — Navbar progress bar
- `components/layout/mobile-cta-bar.tsx` — Floating mobile CTA

### Modified Components
- `app/globals.css` — New backgrounds, focus states, link underline utility, dot-grid pattern
- `components/layout/navbar.tsx` — Progress bar, active indicator, CTA enhancement
- `components/layout/sections/hero.tsx` — Scroll indicator, mesh blobs, stats micro-strip
- `components/layout/sections/social-proof.tsx` — Counter animation, pioneer cards redesign, trust badge
- `components/layout/sections/scan-section.tsx` — Grid pattern background
- `components/layout/sections/analysis-section.tsx` — Warm gradient, TiltCards
- `components/layout/sections/scan-result-section.tsx` — Spotlight, TiltCards
- `components/layout/sections/naqiy-score-section.tsx` — Concentrique glow
- `components/layout/sections/map-section.tsx` — Dot grid background
- `components/layout/sections/restaurant-detail-section.tsx` — Dot grid background
- `components/layout/sections/coming-soon-section.tsx` — Gradient toward dark
- `components/layout/sections/pricing.tsx` — Deep secondary + spotlight, TiltCards, CTA pulse
- `components/layout/sections/cta-download.tsx` — Enhanced mesh + animated borders
- `components/layout/sections/footer.tsx` — Link underline animation
- `components/phone/phone-screen-manager.tsx` — Blur on exit transition
- `components/phone/landing-phone-orchestrator.tsx` — Section dividers
- `components/animations/animate-in.tsx` — New `reveal` and `parallaxUp` variants

### Untouched
- `components/phone/phone-frame.tsx` — Already excellent
- `components/phone/sticky-phone.tsx` — Already excellent
- `components/animations/smooth-scroll.tsx` — No changes needed
- `components/brand/naqiy-logo.tsx` — No changes needed
- All phone screen replicas — No changes needed

---

## Implementation Phases

### Phase 1 — Visual Impact (~4h)
1. D3: Section backgrounds + dividers
2. D2: AnimatedCounter component + integration in SocialProof + Hero
3. D1: Scroll indicator + mesh blobs

### Phase 2 — Micro-Interactions (~3h)
4. D2: TiltCard component + integration
5. D2: Button hover + link underline (globals.css + navbar + footer)
6. D5: Navbar progress bar + active section indicator

### Phase 3 — Social Proof & CTA (~2h)
7. D4: Pioneer cards redesign + trust badge
8. D6: CTA glow pulse + animated borders + mobile FAB

### Phase 4 — Polish (~2h)
9. D7: Cursor glow + focus states + phone blur transitions
10. D8: Mobile optimizations + reduced motion support
11. D2: New AnimateIn variants (reveal, parallaxUp)
