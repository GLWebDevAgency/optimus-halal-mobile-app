# Landing World-Class Polish — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Transform the Naqiy landing page from 7.5/10 to 9.5/10 through 8 dimensions of premium polish — motion, variety, micro-interactions, social proof, navbar, CTAs, details, and mobile.

**Architecture:** All changes are additive to the existing landing page. New reusable animation components (`AnimatedCounter`, `TiltCard`, `CursorGlow`) are created in `components/animations/`. Section backgrounds are applied via inline styles and Tailwind classes. Navbar enhancements use Motion's `useScroll`/`useTransform`. No breaking changes.

**Tech Stack:** Next.js 15, Tailwind CSS 4, Motion (Framer Motion), @phosphor-icons/react, existing Naqiy design system (OKLCH tokens).

---

## File Structure

### New Files
- `web/src/components/animations/animated-counter.tsx` — Spring-based number counter (useInView + useSpring)
- `web/src/components/animations/tilt-card.tsx` — 3D cursor-following card wrapper
- `web/src/components/animations/cursor-glow.tsx` — Section-level cursor glow effect
- `web/src/components/layout/scroll-progress.tsx` — Navbar gold progress bar
- `web/src/components/layout/mobile-cta-bar.tsx` — Floating mobile download bar

### Modified Files
- `web/src/app/globals.css` — New utilities, backgrounds, focus states
- `web/src/components/animations/animate-in.tsx` — New `reveal` and `parallaxUp` variants
- `web/src/components/layout/navbar.tsx` — Progress bar, active indicator, CTA glow
- `web/src/components/layout/sections/hero.tsx` — Scroll indicator, mesh blobs, stats strip
- `web/src/components/layout/sections/scan-section.tsx` — Grid pattern background
- `web/src/components/layout/sections/analysis-section.tsx` — Warm gradient + TiltCards
- `web/src/components/layout/sections/scan-result-section.tsx` — Spotlight + TiltCards
- `web/src/components/layout/sections/naqiy-score-section.tsx` — Concentrique glow
- `web/src/components/layout/sections/social-proof.tsx` — Counters, pioneer redesign, trust badge
- `web/src/components/layout/sections/map-section.tsx` — Dot grid background
- `web/src/components/layout/sections/restaurant-detail-section.tsx` — Dot grid background
- `web/src/components/layout/sections/coming-soon-section.tsx` — Gradient toward dark
- `web/src/components/layout/sections/pricing.tsx` — Spotlight + TiltCards + CTA pulse
- `web/src/components/layout/sections/cta-download.tsx` — Enhanced mesh + animated borders
- `web/src/components/layout/sections/footer.tsx` — Link underline animation
- `web/src/components/phone/phone-screen-manager.tsx` — Blur exit transition
- `web/src/components/phone/landing-phone-orchestrator.tsx` — Section dividers
- `web/src/app/page.tsx` — Add MobileCTABar

---

## Phase 1 — Visual Impact

### Task 1: AnimatedCounter Component

**Files:**
- Create: `web/src/components/animations/animated-counter.tsx`

- [ ] **Step 1: Create AnimatedCounter**

```tsx
"use client";

import { useRef, useEffect } from "react";
import { useInView, useSpring, useTransform, motion } from "motion/react";

interface AnimatedCounterProps {
  value: number;
  suffix?: string;
  className?: string;
  duration?: number;
}

export function AnimatedCounter({ value, suffix = "", className, duration = 2 }: AnimatedCounterProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: true, amount: 0.5 });

  const spring = useSpring(0, {
    stiffness: 50,
    damping: 30,
    duration: duration * 1000,
  });

  const display = useTransform(spring, (v) => {
    const rounded = Math.round(v);
    // Format with FR locale (space as thousands separator)
    return new Intl.NumberFormat("fr-FR").format(rounded) + suffix;
  });

  useEffect(() => {
    if (isInView) spring.set(value);
  }, [isInView, spring, value]);

  return <motion.span ref={ref} className={className}>{display}</motion.span>;
}
```

- [ ] **Step 2: Verify it renders** — Check dev server, no errors.

- [ ] **Step 3: Commit**
```bash
git add web/src/components/animations/animated-counter.tsx
git commit -m "feat(web): add AnimatedCounter component with spring animation"
```

---

### Task 2: TiltCard Component

**Files:**
- Create: `web/src/components/animations/tilt-card.tsx`

- [ ] **Step 1: Create TiltCard**

```tsx
"use client";

import { useRef, useState } from "react";
import { motion, useSpring } from "motion/react";

interface TiltCardProps {
  children: React.ReactNode;
  className?: string;
  maxTilt?: number;
}

export function TiltCard({ children, className, maxTilt = 3 }: TiltCardProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [isHovered, setIsHovered] = useState(false);

  const rotateX = useSpring(0, { stiffness: 200, damping: 20 });
  const rotateY = useSpring(0, { stiffness: 200, damping: 20 });

  function handleMouseMove(e: React.MouseEvent) {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    rotateY.set(x * maxTilt * 2);
    rotateX.set(-y * maxTilt * 2);
  }

  function handleMouseLeave() {
    setIsHovered(false);
    rotateX.set(0);
    rotateY.set(0);
  }

  return (
    <motion.div
      ref={ref}
      className={className}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={handleMouseLeave}
      style={{
        perspective: 800,
        rotateX,
        rotateY,
        transformStyle: "preserve-3d",
      }}
    >
      {children}
    </motion.div>
  );
}
```

- [ ] **Step 2: Commit**
```bash
git add web/src/components/animations/tilt-card.tsx
git commit -m "feat(web): add TiltCard 3D cursor-following card component"
```

---

### Task 3: New AnimateIn Variants

**Files:**
- Modify: `web/src/components/animations/animate-in.tsx`

- [ ] **Step 1: Add `reveal` and `parallaxUp` variants to the variants record**

Add to the `variants` map (after `blur`):
```ts
reveal: {
  hidden: { opacity: 0, clipPath: "inset(8% 0 8% 0)" },
  visible: { opacity: 1, clipPath: "inset(0% 0 0% 0)" },
},
parallaxUp: {
  hidden: { opacity: 0, y: 40, scale: 0.98 },
  visible: { opacity: 1, y: 0, scale: 1 },
},
```

Update the type:
```ts
type AnimateInVariant = "fadeUp" | "fadeDown" | "fadeLeft" | "fadeRight" | "scaleIn" | "blur" | "reveal" | "parallaxUp";
```

- [ ] **Step 2: Commit**
```bash
git add web/src/components/animations/animate-in.tsx
git commit -m "feat(web): add reveal and parallaxUp animation variants"
```

---

### Task 4: Section Backgrounds + Dividers in globals.css

**Files:**
- Modify: `web/src/app/globals.css`

- [ ] **Step 1: Add new background utilities and focus states**

Append these utilities before the ANIMATIONS section:

```css
/* ═══════════════════════════════════════════════════
   SECTION BACKGROUNDS — VISUAL VARIETY
   ═══════════════════════════════════════════════════ */

@utility bg-grid-subtle {
  background-image:
    linear-gradient(to right, oklch(0.12 0.01 90 / 3%) 1px, transparent 1px),
    linear-gradient(to bottom, oklch(0.12 0.01 90 / 3%) 1px, transparent 1px);
  background-size: 24px 24px;
}

@utility bg-dot-grid {
  background-image: radial-gradient(circle, oklch(0.12 0.01 90 / 6%) 1px, transparent 1px);
  background-size: 24px 24px;
}

@utility bg-gold-spotlight {
  background-image: radial-gradient(ellipse 60% 50% at 50% 40%, oklch(0.76 0.14 88 / 4%) 0%, transparent 60%);
}

@utility bg-gold-concentrique {
  background-image: radial-gradient(circle at 50% 30%, oklch(0.76 0.14 88 / 5%) 0%, oklch(0.76 0.14 88 / 2%) 30%, transparent 50%);
}

/* ═══════════════════════════════════════════════════
   FOCUS STATES — ACCESSIBILITY
   ═══════════════════════════════════════════════════ */

@utility focus-gold {
  &:focus-visible {
    outline: 2px solid oklch(0.76 0.14 88 / 50%);
    outline-offset: 2px;
  }
}

/* ═══════════════════════════════════════════════════
   LINK UNDERLINE — PREMIUM NAV
   ═══════════════════════════════════════════════════ */

@utility link-underline {
  position: relative;
  &::after {
    content: "";
    position: absolute;
    bottom: -2px;
    left: 0;
    width: 100%;
    height: 2px;
    background: oklch(0.76 0.14 88);
    transform: scaleX(0);
    transform-origin: left;
    transition: transform 200ms ease-out;
  }
  &:hover::after {
    transform: scaleX(1);
  }
}
```

- [ ] **Step 2: Commit**
```bash
git add web/src/app/globals.css
git commit -m "feat(web): add section backgrounds, focus states, link underline utilities"
```

---

### Task 5: Apply Backgrounds to All Sections

**Files:**
- Modify: all 12 section components

- [ ] **Step 1: Apply section-specific backgrounds**

For each section, add the appropriate background treatment:

**scan-section.tsx** — Add `bg-grid-subtle` to the section className.

**analysis-section.tsx** — Wrap in a gradient: add `bg-gradient-to-b from-background to-secondary/30` to the section className.

**scan-result-section.tsx** — Add inline `bg-gold-spotlight` as an absolute positioned div (same pattern as hero glows).

**naqiy-score-section.tsx** — Replace the existing subtle glow div with `bg-gold-concentrique` class.

**map-section.tsx** + **restaurant-detail-section.tsx** — Add `bg-dot-grid` to the section className.

**coming-soon-section.tsx** — Add `bg-gradient-to-b from-background to-secondary/60` to section.

**pricing.tsx** — Add `bg-secondary/30` to section + a gold radial glow behind the Naqiy+ card.

- [ ] **Step 2: Add gold dividers between key narrative transitions in orchestrator**

In `landing-phone-orchestrator.tsx`, add `<div className="divider-gold mx-auto max-w-5xl" />` between:
- Hero → Scan (inside grid, after Hero div)
- RestaurantDetail → ComingSoon (between grid end and full-width)
- Pricing → CTA

- [ ] **Step 3: Commit**
```bash
git add web/src/components/layout/sections/ web/src/components/phone/landing-phone-orchestrator.tsx
git commit -m "feat(web): apply distinct backgrounds to all sections + gold dividers"
```

---

### Task 6: Hero — Scroll Indicator + Mesh Blobs + Stats Strip

**Files:**
- Modify: `web/src/components/layout/sections/hero.tsx`

- [ ] **Step 1: Add scroll indicator at bottom of hero**

After the trust bar `AnimateIn`, before closing `</div>` of container:

```tsx
{/* Scroll indicator */}
<AnimateIn variant="fadeUp" delay={1.2}>
  <div className="mt-16 flex flex-col items-center gap-2 text-muted-foreground/40">
    <motion.div
      animate={{ y: [0, 8, 0] }}
      transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
    >
      <ArrowDown className="size-5" />
    </motion.div>
    <span className="text-xs tracking-widest uppercase">Découvrir</span>
  </div>
</AnimateIn>
```

Import `ArrowDown` from phosphor-icons and `motion` from motion/react.

- [ ] **Step 2: Convert static glows to animated mesh blobs**

Replace the 2 existing glow divs with 3 animated blobs:

```tsx
{/* Animated mesh blob — gold (top-right, drifts) */}
<div
  className="pointer-events-none absolute -top-40 -right-40 h-[600px] w-[600px] rounded-full"
  style={{
    background: "radial-gradient(circle, oklch(0.76 0.14 88 / 8%) 0%, transparent 70%)",
    animation: "float-slow 20s ease-in-out infinite",
  }}
  aria-hidden="true"
/>
{/* Animated mesh blob — leaf (bottom-left, drifts opposite) */}
<div
  className="pointer-events-none absolute -bottom-60 -left-40 h-[500px] w-[500px] rounded-full"
  style={{
    background: "radial-gradient(circle, oklch(0.50 0.14 142 / 6%) 0%, transparent 70%)",
    animation: "float-slow 25s ease-in-out infinite reverse",
  }}
  aria-hidden="true"
/>
{/* Animated mesh blob — warm (center, subtle) */}
<div
  className="pointer-events-none absolute top-1/3 left-1/4 h-[400px] w-[400px] rounded-full"
  style={{
    background: "radial-gradient(circle, oklch(0.90 0.04 88 / 5%) 0%, transparent 60%)",
    animation: "float-slow 30s ease-in-out infinite",
    animationDelay: "-10s",
  }}
  aria-hidden="true"
/>
```

- [ ] **Step 3: Add stats micro-strip below CTA**

After the store badges AnimateIn, before the trust bar:

```tsx
{/* Stats micro-strip */}
<AnimateIn variant="fadeUp" delay={0.85}>
  <div className="mt-6 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground/60">
    <span><AnimatedCounter value={817000} suffix="+" className="font-semibold text-foreground/80" /> produits analysés</span>
    <span className="text-border">·</span>
    <span><AnimatedCounter value={383} className="font-semibold text-foreground/80" /> magasins</span>
    <span className="text-border">·</span>
    <span className="font-semibold text-leaf/70">100% gratuit</span>
  </div>
</AnimateIn>
```

Import `AnimatedCounter` from `@/components/animations/animated-counter`.

- [ ] **Step 4: Commit**
```bash
git add web/src/components/layout/sections/hero.tsx
git commit -m "feat(web): hero — scroll indicator, mesh blobs, animated stats strip"
```

---

### Task 7: SocialProof — Animated Counters + Pioneer Redesign

**Files:**
- Modify: `web/src/components/layout/sections/social-proof.tsx`

- [ ] **Step 1: Replace static stat values with AnimatedCounter**

In the stats map, replace `<p className="text-3xl...">` with:
```tsx
<p className="text-3xl font-black text-foreground md:text-4xl">
  <AnimatedCounter value={stat.rawValue} suffix={stat.suffix} />
</p>
```

Update the `stats` array to include `rawValue` and `suffix`:
```ts
const stats = [
  { rawValue: 817000, suffix: "+", label: "Produits analysés", icon: Barcode, accent: "gold" as const },
  { rawValue: 383, suffix: "", label: "Magasins référencés", icon: Storefront, accent: "gold" as const },
  { rawValue: 5, suffix: "", label: "Écoles juridiques", icon: Scales, accent: "gold" as const },
  { rawValue: 100, suffix: "%", label: "Gratuit", icon: Leaf, accent: "leaf" as const },
];
```

- [ ] **Step 2: Add trust badge above stats**

After the subtitle paragraph, before stats Stagger:
```tsx
<AnimateIn variant="blur" delay={0.2}>
  <div className="flex justify-center mt-6">
    <Badge variant="outline" className="gap-1.5 border-leaf/30 bg-leaf/5 px-3 py-1 text-leaf">
      <ShieldCheck className="size-3" weight="fill" />
      Données réelles — mises à jour quotidiennement
    </Badge>
  </div>
</AnimateIn>
```

Import `Badge` from `@/components/ui/badge`, `ShieldCheck` from phosphor.

- [ ] **Step 3: Redesign pioneer cards — solid borders, gradient bg, CTA micro-button**

Replace the pioneer card `div` with:
```tsx
<div className={`group rounded-2xl border p-6 h-full flex flex-col items-center text-center backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg ${isLeaf ? "border-leaf/15 bg-gradient-to-b from-leaf/[4%] to-leaf/[1%] hover:border-leaf/25" : "border-gold/15 bg-gradient-to-b from-gold/[4%] to-gold/[1%] hover:border-gold/25"}`}>
```

Add micro CTA button at bottom of each pioneer card (after description `<p>`):
```tsx
<button className={`mt-4 rounded-full px-4 py-1.5 text-xs font-semibold transition-all duration-200 hover:scale-[1.03] ${isLeaf ? "border border-leaf/20 text-leaf hover:bg-leaf/5" : "border border-gold/20 text-gold hover:bg-gold/5"}`}>
  {card.ctaLabel}
</button>
```

Add `ctaLabel` to the `pioneerCards` data:
```ts
{ ..., ctaLabel: "Donner mon avis" },
{ ..., ctaLabel: "Partager" },
{ ..., ctaLabel: "Rejoindre" },
```

- [ ] **Step 4: Commit**
```bash
git add web/src/components/layout/sections/social-proof.tsx
git commit -m "feat(web): social proof — animated counters, trust badge, pioneer redesign"
```

---

## Phase 2 — Micro-Interactions

### Task 8: Apply TiltCard to Feature Cards

**Files:**
- Modify: `web/src/components/layout/sections/analysis-section.tsx`
- Modify: `web/src/components/layout/sections/scan-result-section.tsx`
- Modify: `web/src/components/layout/sections/pricing.tsx`

- [ ] **Step 1: Wrap feature cards in TiltCard**

In `analysis-section.tsx`, wrap each card's outer div with `<TiltCard>`:
```tsx
<StaggerItem key={feature.title}>
  <TiltCard>
    <div className="group rounded-2xl border ...">
      {/* existing card content */}
    </div>
  </TiltCard>
</StaggerItem>
```

Import: `import { TiltCard } from "@/components/animations/tilt-card";`

Do the same for `scan-result-section.tsx` and the pricing cards in `pricing.tsx`.

- [ ] **Step 2: Commit**
```bash
git add web/src/components/layout/sections/analysis-section.tsx web/src/components/layout/sections/scan-result-section.tsx web/src/components/layout/sections/pricing.tsx
git commit -m "feat(web): apply TiltCard 3D effect to feature and pricing cards"
```

---

### Task 9: Button Hover Enhancement + Link Underline

**Files:**
- Modify: `web/src/components/layout/navbar.tsx`
- Modify: `web/src/components/layout/sections/footer.tsx`

- [ ] **Step 1: Apply link-underline to navbar links**

In `navbar.tsx`, add `link-underline` to each desktop nav link:
```tsx
className="link-underline rounded-lg px-3 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
```

- [ ] **Step 2: Apply link-underline to footer links**

In `footer.tsx`, add `link-underline` class to footer column links.

- [ ] **Step 3: Enhance navbar CTA button**

Add glow animation class to the desktop CTA button:
```tsx
<Button size="sm" className="hidden md:inline-flex transition-all duration-200 hover:scale-[1.03] hover:shadow-[0_0_20px_oklch(0.76_0.14_88/15%)]">
```

- [ ] **Step 4: Commit**
```bash
git add web/src/components/layout/navbar.tsx web/src/components/layout/sections/footer.tsx
git commit -m "feat(web): link underline animation, navbar CTA glow on hover"
```

---

### Task 10: Scroll Progress Bar

**Files:**
- Create: `web/src/components/layout/scroll-progress.tsx`
- Modify: `web/src/app/page.tsx`

- [ ] **Step 1: Create ScrollProgress component**

```tsx
"use client";

import { motion, useScroll, useSpring } from "motion/react";

export function ScrollProgress() {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, { stiffness: 100, damping: 30 });

  return (
    <motion.div
      className="fixed top-0 inset-x-0 z-[60] h-[2px] origin-left"
      style={{
        scaleX,
        background: "linear-gradient(90deg, oklch(0.76 0.14 88), oklch(0.76 0.14 88 / 60%))",
      }}
    />
  );
}
```

- [ ] **Step 2: Add to page.tsx**

In `page.tsx`, add `<ScrollProgress />` just before `<Navbar />`.

Import: `import { ScrollProgress } from "@/components/layout/scroll-progress";`

- [ ] **Step 3: Commit**
```bash
git add web/src/components/layout/scroll-progress.tsx web/src/app/page.tsx
git commit -m "feat(web): add gold scroll progress bar at top of page"
```

---

## Phase 3 — CTA & Social

### Task 11: CTA Glow Pulse + Animated Borders

**Files:**
- Modify: `web/src/components/layout/sections/cta-download.tsx`
- Modify: `web/src/components/layout/sections/hero.tsx`

- [ ] **Step 1: Add animated gold border to hero store badges**

Wrap each store badge `<a>` with the `border-gradient-gold` utility class (already exists in globals.css). Add a wrapper div:
```tsx
<div className="border-gradient-gold rounded-xl">
  <a href="#" className="group relative inline-flex items-center gap-3 rounded-xl bg-card px-5 py-3 ...">
```

- [ ] **Step 2: Add glow-pulse to CTA download buttons**

In `cta-download.tsx`, add `animation: glow-pulse 5s ease-in-out infinite` style to each store badge link.

- [ ] **Step 3: Commit**
```bash
git add web/src/components/layout/sections/cta-download.tsx web/src/components/layout/sections/hero.tsx
git commit -m "feat(web): animated gold borders on hero badges, glow pulse on CTA"
```

---

### Task 12: Mobile Floating CTA Bar

**Files:**
- Create: `web/src/components/layout/mobile-cta-bar.tsx`
- Modify: `web/src/app/page.tsx`

- [ ] **Step 1: Create MobileCTABar**

```tsx
"use client";

import { motion, useScroll, useTransform } from "motion/react";
import { AppleLogo, GooglePlayLogo } from "@phosphor-icons/react";

export function MobileCTABar() {
  const { scrollYProgress } = useScroll();
  // Show after 15% scroll, hide after 90% (when CTA section is visible)
  const opacity = useTransform(scrollYProgress, [0.1, 0.15, 0.88, 0.92], [0, 1, 1, 0]);
  const y = useTransform(scrollYProgress, [0.1, 0.15], [60, 0]);

  return (
    <motion.div
      className="fixed bottom-0 inset-x-0 z-50 lg:hidden"
      style={{ opacity, y }}
    >
      <div className="mx-auto flex items-center justify-center gap-3 border-t border-border/50 bg-background/80 px-4 py-3 backdrop-blur-xl">
        <span className="text-sm font-semibold text-foreground">Télécharger Naqiy</span>
        <div className="flex gap-2">
          <a href="#" className="flex items-center gap-1.5 rounded-lg bg-foreground px-3 py-1.5 text-xs font-medium text-background">
            <AppleLogo className="size-3.5" weight="fill" />
            iOS
          </a>
          <a href="#" className="flex items-center gap-1.5 rounded-lg bg-foreground px-3 py-1.5 text-xs font-medium text-background">
            <GooglePlayLogo className="size-3.5" weight="fill" />
            Android
          </a>
        </div>
      </div>
    </motion.div>
  );
}
```

- [ ] **Step 2: Add to page.tsx after ScrollProgress**

- [ ] **Step 3: Commit**
```bash
git add web/src/components/layout/mobile-cta-bar.tsx web/src/app/page.tsx
git commit -m "feat(web): add floating mobile CTA bar with scroll-driven visibility"
```

---

## Phase 4 — Polish

### Task 13: CursorGlow Component + Apply to Premium Sections

**Files:**
- Create: `web/src/components/animations/cursor-glow.tsx`
- Modify: `web/src/components/layout/sections/naqiy-score-section.tsx`
- Modify: `web/src/components/layout/sections/pricing.tsx`

- [ ] **Step 1: Create CursorGlow**

```tsx
"use client";

import { useRef, useState } from "react";
import { motion, useSpring } from "motion/react";

interface CursorGlowProps {
  children: React.ReactNode;
  className?: string;
  color?: string;
  size?: number;
}

export function CursorGlow({ children, className, color = "oklch(0.76 0.14 88 / 8%)", size = 200 }: CursorGlowProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  const x = useSpring(0, { stiffness: 200, damping: 30 });
  const y = useSpring(0, { stiffness: 200, damping: 30 });

  function handleMouseMove(e: React.MouseEvent) {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    x.set(e.clientX - rect.left);
    y.set(e.clientY - rect.top);
  }

  return (
    <div
      ref={ref}
      className={`relative ${className ?? ""}`}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setVisible(true)}
      onMouseLeave={() => setVisible(false)}
    >
      <motion.div
        className="pointer-events-none absolute hidden lg:block"
        style={{
          x,
          y,
          width: size,
          height: size,
          marginLeft: -size / 2,
          marginTop: -size / 2,
          borderRadius: "50%",
          background: `radial-gradient(circle, ${color}, transparent 70%)`,
          opacity: visible ? 1 : 0,
          transition: "opacity 300ms",
        }}
        aria-hidden="true"
      />
      <div className="relative z-10">{children}</div>
    </div>
  );
}
```

- [ ] **Step 2: Wrap NaqiyScoreSection and PricingSection content in CursorGlow**

In `naqiy-score-section.tsx`, wrap the inner `<div className="mx-auto max-w-5xl...">` with:
```tsx
<CursorGlow>
  {/* existing content */}
</CursorGlow>
```

Same for `pricing.tsx`.

- [ ] **Step 3: Commit**
```bash
git add web/src/components/animations/cursor-glow.tsx web/src/components/layout/sections/naqiy-score-section.tsx web/src/components/layout/sections/pricing.tsx
git commit -m "feat(web): add CursorGlow effect to NaqiyScore and Pricing sections"
```

---

### Task 14: Phone Screen Blur Transition

**Files:**
- Modify: `web/src/components/phone/phone-screen-manager.tsx`

- [ ] **Step 1: Add blur to exit variants**

In `phone-screen-manager.tsx`, update the exit variants to include blur:

```tsx
// Horizontal exit
exit: { x: "-30%", opacity: 0, filter: "blur(2px)" }

// Vertical exit
exit: { y: "-30%", opacity: 0, filter: "blur(2px)" }
```

Also add `filter: "blur(0px)"` to both `animate` states to ensure clean entry.

- [ ] **Step 2: Commit**
```bash
git add web/src/components/phone/phone-screen-manager.tsx
git commit -m "feat(web): add blur transition to phone screen exits"
```

---

### Task 15: Global Focus States + Reduced Motion

**Files:**
- Modify: `web/src/app/globals.css`

- [ ] **Step 1: Add global focus-visible rule and reduced motion**

In the `@layer base` section of globals.css:
```css
/* Focus states — gold ring on all interactive elements */
a:focus-visible,
button:focus-visible,
input:focus-visible,
[tabindex]:focus-visible {
  outline: 2px solid oklch(0.76 0.14 88 / 50%);
  outline-offset: 2px;
}

/* Reduced motion — respect user preference */
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

- [ ] **Step 2: Commit**
```bash
git add web/src/app/globals.css
git commit -m "feat(web): add global gold focus states + prefers-reduced-motion support"
```

---

### Task 16: Final Visual Verification

- [ ] **Step 1: Start dev server and scroll through entire page**

Run: `cd web && pnpm dev`

Verify each section has:
- Distinct background treatment (no two adjacent sections identical)
- Animated counters trigger on scroll-in
- TiltCards respond to cursor on desktop
- Navbar shows scroll progress bar
- Hero has scroll indicator + mesh blobs
- Pioneer cards have solid borders + gradient + micro CTAs
- CTA buttons glow on hover
- Phone screens blur on transition
- Mobile floating CTA appears/disappears correctly
- Gold focus rings on Tab navigation
- No console errors

- [ ] **Step 2: Final commit — all loose changes**
```bash
git add -A && git commit -m "polish(web): final visual verification pass"
```
