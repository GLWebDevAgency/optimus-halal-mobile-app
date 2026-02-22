import type { MaterialIcons } from "@expo/vector-icons";
import type { useTheme } from "@/hooks/useTheme";

export interface StoreFeatureProperties {
  id: string;
  name: string;
  storeType: string;
  imageUrl: string | null;
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

export const STORE_TYPE_ICON: Record<string, keyof typeof MaterialIcons.glyphMap> = {
  butcher: "restaurant",
  restaurant: "restaurant-menu",
  supermarket: "shopping-cart",
  bakery: "bakery-dining",
  abattoir: "agriculture",
  wholesaler: "local-shipping",
  online: "language",
  other: "store",
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

export function openStatusBg(status: string, isDark = false): string {
  if (status === "open" || status === "opening_soon") return isDark ? "rgba(74,222,128,0.12)" : "rgba(22,163,74,0.10)";
  if (status === "closing_soon") return isDark ? "rgba(251,191,36,0.12)" : "rgba(217,119,6,0.10)";
  return isDark ? "rgba(248,113,113,0.12)" : "rgba(220,38,38,0.10)";
}
