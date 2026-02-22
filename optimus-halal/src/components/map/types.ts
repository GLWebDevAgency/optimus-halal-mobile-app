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

export function openStatusColor(status: string): string {
  if (status === "open" || status === "opening_soon") return "#22c55e";
  if (status === "closing_soon") return "#f59e0b";
  return "#ef4444";
}

export function openStatusBg(status: string): string {
  if (status === "open" || status === "opening_soon") return "rgba(34,197,94,0.12)";
  if (status === "closing_soon") return "rgba(245,158,11,0.12)";
  return "rgba(239,68,68,0.12)";
}
