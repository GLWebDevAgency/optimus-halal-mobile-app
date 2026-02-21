# Gold Dark Theme — Design Document

**Date:** 2026-02-20
**Status:** Approved
**Scope:** Dark mode only (light mode untouched)

## Overview

Replace the "deep forest" green-tinted dark theme with a luxury gold/anthracite dark theme. The new identity uses `#D4AF37` gold as the primary accent on a pure `#121212` anthracite background with glassmorphism cards.

## Color Token Changes (darkTheme)

| Token | Before | After |
|-------|--------|-------|
| background | `#0a1a10` | `#121212` |
| backgroundSecondary | `#071209` | `#1A1A1A` |
| card | `#132a1a` | `#1E1E1E` |
| cardBorder | `rgba(255,255,255,0.05)` | `rgba(207,165,51,0.15)` |
| textPrimary | `#e8f5e9` | `#FFFFFF` |
| textSecondary | `#9ca3af` | `#A0A0A0` |
| textMuted | `#6b7280` | `#6b7280` (unchanged) |
| textInverse | `#0d1b13` | `#1A1A1A` |
| iconPrimary | `#e8f5e9` | `#FFFFFF` |
| iconSecondary | `#9ca3af` | `#A0A0A0` |
| buttonSecondary | `rgba(255,255,255,0.05)` | `rgba(255,255,255,0.04)` |
| buttonSecondaryHover | `rgba(255,255,255,0.10)` | `rgba(255,255,255,0.08)` |

## Brand Primary (Theme-Aware)

`useTheme().colors.primary` resolves per theme:

| Context | Light | Dark |
|---------|-------|------|
| primary | `#13ec6a` | `#D4AF37` |
| primaryDark | `#0ea64b` | `#CFA533` |
| primaryLight | `rgba(19,236,106,0.10)` | `rgba(207,165,51,0.15)` |
| buttonPrimary | `#13ec6a` | `#D4AF37` |

## Glass Tokens (dark)

| Token | Before | After |
|-------|--------|-------|
| bg | `rgba(19,42,26,0.65)` | `rgba(255,255,255,0.04)` |
| bgSubtle | `rgba(19,42,26,0.40)` | `rgba(255,255,255,0.02)` |
| border | `rgba(255,255,255,0.08)` | `rgba(207,165,51,0.20)` |
| borderStrong | `rgba(255,255,255,0.12)` | `rgba(207,165,51,0.30)` |
| highlight | `rgba(255,255,255,0.05)` | `rgba(207,165,51,0.08)` |

## Gradients

| Gradient | Before (dark) | After (dark) |
|----------|--------------|--------------|
| primary | `["#13ec6a","#0ea64b"]` | `["#FDE08B","#CFA533"]` |
| premium | `["#13ec6a","#D4AF37"]` | `["#FDE08B","#CFA533"]` |
| heroDark | `["#0a1a10","#132a1a"]` | `["#121212","#1A1A1A"]` |

Gradients become theme-aware via `useTheme()` — new `primaryGradient` and `premiumGradient` fields.

## Shadows (darkShadows)

| Preset | shadowColor Before | shadowColor After |
|--------|-------------------|-------------------|
| card | `primary[900]` #0c6231 | `gold[900]` #6c421c |
| float | `primary[800]` #0d7939 | `gold[800]` #7f501b |
| hero | `primary[500]` #13ec6a | `gold[500]` #D4AF37 |
| glow | `primary[500]` #13ec6a | `gold[500]` #D4AF37 |

Scanner card special glow: `shadowColor: #CFA533, opacity: 0.35, radius: 24`.

## Scanner FAB (Center Tab Button)

| Property | Before (dark) | After (dark) |
|----------|--------------|--------------|
| Fill gradient | `["rgba(255,255,255,0.95)","rgba(240,255,245,0.9)"]` | `["#FDE08B","#CFA533"]` |
| Icon color | `#0d1b13` | `#1A1A1A` |
| Shadow color | `#13ec6a` | `#CFA533` |
| Ring border | `brand.primary` | `gold[500]` |
| Pulse glow | `rgba(19,236,106,0.35↔0.15)` | `rgba(207,165,51,0.35↔0.15)` |

## Tab Bar

- Active icon: `#D4AF37` in dark mode
- Top glow gradient: gold-tinted (`#D4AF37` + alpha)
- Android bg fallback: `rgba(18,18,18,0.97)`

## Islamic Pattern

- Color: `#808080` (neutral grey) instead of `brand.primary`
- Opacity: `0.06` (up from `0.03`)

## Home Screen

- Scanner card: gold gradient `["#FDE08B","#CFA533"]`, gold glow shadow
- Quick action cards: glass `rgba(255,255,255,0.04)` + gold border
- Favorites ring: `["#D4AF37","#CFA533","#FDE08B"]`
- Section links ("Ouvrir la Map", "Voir tout"): `#D4AF37`
- Decorative waves (~): `#D4AF37`

## Files to Modify

### Theme layer (5 files)
1. `src/theme/colors.ts` — darkTheme, glass.dark, gradients
2. `src/theme/shadows.ts` — darkShadows
3. `src/hooks/useTheme.ts` — theme-aware primary, gradients
4. `src/components/ui/IslamicPattern.tsx` — greyscale default
5. `src/components/navigation/PremiumTabBar.tsx` — gold FAB, active color, glow

### Screen layer (1 file)
6. `src/app/(tabs)/index.tsx` — scanner card, favorites ring, glass cards

### Component layer (2 files)
7. `src/components/ui/GlowCard.tsx` — default glowColor
8. `src/components/ui/Button.tsx` — primary gradient

### Hardcoded green cleanup (~15 files)
All files with raw `#13ec6a` references migrated to theme tokens.

## Unchanged
- Light mode — completely untouched
- Semantic colors (halal/haram verdicts: green/red/orange)
- Store type colors (each store keeps distinct color)
- Status score colors
- Ramadan mode (overlays on top, may need minor gold→gold dedup)
