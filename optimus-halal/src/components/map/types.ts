import type { useTheme } from "@/hooks/useTheme";
import { type IconName } from "@/lib/icons";

export interface StoreFeatureProperties {
  id: string;
  name: string;
  storeType: string;
  imageUrl: string | null;
  logoUrl: string | null;
  address: string;
  city: string;
  phone: string | null;
  certifier: string;
  certifierName: string | null;
  halalCertified: boolean;
  averageRating: number;
  reviewCount: number;
  distance: number;
  openStatus?: string;
  openTime?: string | null;
  closeTime?: string | null;
}

export type ThemeColors = ReturnType<typeof useTheme>["colors"];

export const STORE_TYPE_ICON: Record<string, IconName> = {
  butcher: "restaurant",
  restaurant: "restaurant-menu",
  supermarket: "shopping-cart",
  bakery: "bakery-dining",
  abattoir: "agriculture",
  wholesaler: "local-shipping",
  online: "language",
  other: "store",
};

export const STORE_TYPE_COLOR: Record<string, string> = {
  butcher: "#ef4444",
  restaurant: "#f97316",
  supermarket: "#3b82f6",
  bakery: "#d4af37",
  wholesaler: "#8b5cf6",
  abattoir: "#6b7280",
  online: "#06b6d4",
  other: "#6b7280",
};

export const CARD_WIDTH = 280;

export function formatDistance(meters: number): string {
  if (meters < 1000) return `${Math.round(meters)}m`;
  return `${(meters / 1000).toFixed(1)}km`;
}

// Semantic open-status colors — brighter in dark mode for readability
export function openStatusColor(status: string, isDark = false): string {
  if (status === "open" || status === "opening_soon") return isDark ? "#4ade80" : "#16a34a";
  if (status === "closing_soon") return isDark ? "#fbbf24" : "#d97706";
  return isDark ? "#f87171" : "#dc2626";
}

// Maps store `certifier` DB enum → certifiers table ID (used by CertifierLogo)
export const STORE_CERTIFIER_TO_ID: Record<string, string> = {
  avs: "avs-a-votre-service",
  achahada: "achahada",
  argml: "argml-mosquee-de-lyon",
  mosquee_de_paris: "sfcvh-mosquee-de-paris",
  mosquee_de_lyon: "argml-mosquee-de-lyon",
};

// ── Map Filter System ──────────────────────────────────────
export type MapFilterCategory = "type" | "certifier" | "attribute";

type StoreType = "supermarket" | "butcher" | "restaurant" | "bakery" | "abattoir" | "wholesaler" | "online" | "other";
type CertifierId = "avs" | "achahada" | "argml" | "mosquee_de_paris" | "mosquee_de_lyon" | "other";

export type MapFilter =
  | { id: string; filterKey: string; category: "type"; storeType: StoreType }
  | { id: string; filterKey: string; category: "certifier"; certifierIds: CertifierId[] }
  | { id: string; filterKey: string; category: "attribute"; halalOnly?: boolean; openNow?: boolean; minRating?: number };

export const MAP_FILTERS: MapFilter[] = [
  // Store types (mutually exclusive)
  { id: "butcher", filterKey: "butchers", category: "type", storeType: "butcher" },
  { id: "restaurant", filterKey: "restaurants", category: "type", storeType: "restaurant" },
  { id: "supermarket", filterKey: "grocery", category: "type", storeType: "supermarket" },
  { id: "bakery", filterKey: "bakery", category: "type", storeType: "bakery" },
  { id: "wholesaler", filterKey: "wholesalers", category: "type", storeType: "wholesaler" },
  { id: "abattoir", filterKey: "abattoirs", category: "type", storeType: "abattoir" },
  // Certifiers (multi-select) — ARGML unifies both "argml" + "mosquee_de_lyon" enum values
  { id: "cert-avs", filterKey: "certAvs", category: "certifier", certifierIds: ["avs"] },
  { id: "cert-achahada", filterKey: "certAchahada", category: "certifier", certifierIds: ["achahada"] },
  { id: "cert-argml", filterKey: "certArgml", category: "certifier", certifierIds: ["argml", "mosquee_de_lyon"] },
  { id: "cert-paris", filterKey: "certSfcvh", category: "certifier", certifierIds: ["mosquee_de_paris"] },
  // Attributes (independent toggles)
  { id: "openNow", filterKey: "openNow", category: "attribute", openNow: true },
  { id: "certified", filterKey: "certified", category: "attribute", halalOnly: true },
  { id: "rating", filterKey: "rating", category: "attribute", minRating: 4 },
];

export function openStatusBg(status: string, isDark = false): string {
  if (status === "open" || status === "opening_soon") return isDark ? "rgba(74,222,128,0.12)" : "rgba(22,163,74,0.10)";
  if (status === "closing_soon") return isDark ? "rgba(251,191,36,0.12)" : "rgba(217,119,6,0.10)";
  return isDark ? "rgba(248,113,113,0.12)" : "rgba(220,38,38,0.10)";
}

// i18n-safe open status label — eliminates hardcoded French strings
export function openStatusLabel(
  status: string,
  t: { map: { open: string; closed: string; closingSoon: string; openingSoon: string } },
): string {
  if (status === "open") return t.map.open;
  if (status === "closing_soon") return t.map.closingSoon.replace("{{minutes}}", "30");
  if (status === "opening_soon") return t.map.openingSoon.replace("{{minutes}}", "30");
  return t.map.closed;
}
