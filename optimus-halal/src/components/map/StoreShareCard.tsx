/**
 * StoreShareCard — Premium Naqiy share card for stores
 *
 * World-class branded card rendered off-screen, captured as PNG via
 * react-native-view-shot, shared via expo-sharing. Text fallback.
 *
 * Layout (top → bottom):
 *   1. Glass header — logo "N" + ✦ VÉRIFIÉ badge
 *   2. Store identity — map pin icon + name + address
 *   3. Status row — open/closed + rating stars
 *   4. Certifier badge (conditional — halal certified)
 *   5. Footer — ✦ naqiy.app • Scanne. Comprends. Choisis.
 */

import React, { forwardRef } from "react";
import { View, Text, StyleSheet, Share, Platform } from "react-native";
import {
  MapPinIcon,
  SealCheckIcon,
  StarIcon,
} from "phosphor-react-native";

// Guard native imports
let captureRef: typeof import("react-native-view-shot").captureRef | null =
  null;
let Sharing: typeof import("expo-sharing") | null = null;
try {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  captureRef = require("react-native-view-shot").captureRef;
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  Sharing = require("expo-sharing");
} catch {
  // Expo Go — fall back to text-only sharing
}

import { brand, gold, neutral } from "@/theme/colors";

// ── Types ────────────────────────────────────────────────────

export interface StoreShareCardData {
  storeName: string;
  address: string;
  city: string;
  halalCertified: boolean;
  certifierName: string | null;
  averageRating: number;
  reviewCount: number;
  openStatus?: string;
  storeType: string;
}

export interface StoreShareLabels {
  certifiedLabel: string;
  openNow: string;
  closed: string;
  verifiedWith: string;
  tagline: string;
}

// ── Open status helpers ──────────────────────────────────────

function getOpenStatusColor(status?: string): string {
  if (status === "open") return "#22c55e";
  if (status === "closing_soon") return "#f59e0b";
  return "#ef4444";
}

function getOpenStatusText(status: string | undefined, labels: StoreShareLabels): string {
  if (status === "open" || status === "closing_soon") return labels.openNow;
  return labels.closed;
}

// ── Visual Card Component ────────────────────────────────────

export const StoreShareCardView = forwardRef<
  View,
  { data: StoreShareCardData; labels: StoreShareLabels }
>(function StoreShareCardView({ data, labels }, ref) {
  const isOpen = data.openStatus === "open" || data.openStatus === "closing_soon";
  const statusColor = getOpenStatusColor(data.openStatus);
  const hasRating = data.averageRating > 0;

  return (
    <View ref={ref} style={s.card} collapsable={false}>
      {/* ── 1. Glass Header ── */}
      <View style={s.glassHeader}>
        <View style={s.logoRow}>
          <View style={s.logoMark}>
            <Text style={s.logoMarkText}>N</Text>
          </View>
          <Text style={s.logoName}>Naqiy</Text>
        </View>
        <View style={s.verifiedBadge}>
          <Text style={s.verifiedText}>✦ VÉRIFIÉ</Text>
        </View>
      </View>

      {/* ── 2. Store Identity ── */}
      <View style={s.identitySection}>
        <View style={s.pinCircle}>
          <MapPinIcon size={28} color={gold[500]} weight="fill" />
        </View>
        <Text style={s.storeName} numberOfLines={2}>
          {data.storeName}
        </Text>
        <Text style={s.storeAddress} numberOfLines={2}>
          {data.address}, {data.city}
        </Text>
      </View>

      {/* ── 3. Status Row (glass card) ── */}
      <View style={s.statusCard}>
        <View style={s.statusLeft}>
          <View
            style={[s.statusDot, { backgroundColor: statusColor }]}
          />
          <Text style={[s.statusText, { color: statusColor }]}>
            {getOpenStatusText(data.openStatus, labels)}
          </Text>
        </View>
        {hasRating && (
          <View style={s.ratingRow}>
            <Text style={s.ratingText}>
              {data.averageRating.toFixed(1)}
            </Text>
            <StarIcon size={14} color={gold[500]} weight="fill" />
            {data.reviewCount > 0 && (
              <Text style={s.reviewCount}>
                ({data.reviewCount})
              </Text>
            )}
          </View>
        )}
      </View>

      {/* ── 4. Certifier Badge (conditional) ── */}
      {data.halalCertified && (
        <View style={s.certifierPill}>
          <SealCheckIcon size={14} color={gold[500]} weight="fill" />
          <Text style={s.certifierText}>
            {labels.certifiedLabel}
            {data.certifierName ? ` — ${data.certifierName}` : ""}
          </Text>
        </View>
      )}

      {/* ── 5. Footer ── */}
      <View style={s.footer}>
        <View style={s.footerDivider} />
        <View style={s.brandFooter}>
          <Text style={s.footerStar}>✦</Text>
          <Text style={s.footerLink}>naqiy.app</Text>
          <Text style={s.footerDot}>•</Text>
          <Text style={s.footerTagline}>{labels.tagline}</Text>
        </View>
      </View>
    </View>
  );
});

// ── Text message generator (fallback) ────────────────────────

export function generateStoreShareMessage(
  data: StoreShareCardData,
  labels: StoreShareLabels,
): string {
  let message = `📍 ${data.storeName}\n`;
  message += `${data.address}, ${data.city}\n`;

  if (data.halalCertified) {
    message += `✅ ${labels.certifiedLabel}`;
    if (data.certifierName) message += ` — ${data.certifierName}`;
    message += "\n";
  }

  if (data.averageRating > 0) {
    message += `⭐ ${data.averageRating.toFixed(1)}/5`;
    if (data.reviewCount > 0) message += ` (${data.reviewCount} avis)`;
    message += "\n";
  }

  message += `\n─────────────────────\n`;
  message += `${labels.verifiedWith} 🌿\n`;
  message += labels.tagline;

  return message;
}

// ── Capture + share ──────────────────────────────────────────

export async function captureAndShareStoreCard(
  viewRef: React.RefObject<View | null>,
  data: StoreShareCardData,
  labels: StoreShareLabels,
): Promise<void> {
  const textMessage = generateStoreShareMessage(data, labels);

  try {
    if (!captureRef || !Sharing) throw new Error("Native modules unavailable");

    const uri = await captureRef(viewRef, {
      format: "png",
      quality: 1,
      result: "tmpfile",
    });

    const canShare = await Sharing.isAvailableAsync();
    if (canShare) {
      await Sharing.shareAsync(uri, {
        mimeType: "image/png",
        dialogTitle: labels.verifiedWith,
        UTI: "public.png",
      });
      return;
    }
  } catch (error: unknown) {
    if (
      error instanceof Error &&
      error.message.includes("User did not share")
    ) {
      return;
    }
    console.warn("[StoreShareCard] Image share failed, falling back to text:", error);
  }

  try {
    await Share.share({
      message: textMessage,
      ...(Platform.OS === "ios" ? { url: undefined } : {}),
    });
  } catch (error: unknown) {
    if (
      error instanceof Error &&
      error.message.includes("User did not share")
    ) {
      return;
    }
    console.error("[StoreShareCard] Text share failed:", error);
  }
}

// ── Styles ───────────────────────────────────────────────────

const s = StyleSheet.create({
  card: {
    width: 360,
    borderRadius: 28,
    overflow: "hidden",
    backgroundColor: "#0f0f0f",
  },

  // Glass header (same as product card)
  glassHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 14,
    backgroundColor: "rgba(255,255,255,0.04)",
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.06)",
  },
  logoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  logoMark: {
    width: 24,
    height: 24,
    borderRadius: 8,
    backgroundColor: "rgba(19,236,106,0.15)",
    alignItems: "center",
    justifyContent: "center",
  },
  logoMarkText: {
    fontSize: 13,
    fontWeight: "900",
    color: brand.primary,
  },
  logoName: {
    fontSize: 14,
    fontWeight: "700",
    color: "#ffffff",
    letterSpacing: 0.3,
  },
  verifiedBadge: {
    backgroundColor: "rgba(212,175,55,0.1)",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  verifiedText: {
    fontSize: 10,
    fontWeight: "700",
    color: gold[500],
    letterSpacing: 0.5,
  },

  // Store identity
  identitySection: {
    alignItems: "center",
    paddingHorizontal: 28,
    paddingTop: 28,
    paddingBottom: 20,
  },
  pinCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "rgba(212,175,55,0.08)",
    borderWidth: 1,
    borderColor: "rgba(212,175,55,0.15)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 18,
  },
  storeName: {
    color: "#ffffff",
    fontSize: 20,
    fontWeight: "800",
    textAlign: "center",
    lineHeight: 26,
    letterSpacing: -0.3,
    marginBottom: 6,
  },
  storeAddress: {
    fontSize: 13,
    fontWeight: "400",
    color: "rgba(255,255,255,0.45)",
    textAlign: "center",
    lineHeight: 18,
  },

  // Status card
  statusCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginHorizontal: 20,
    marginBottom: 14,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 14,
    backgroundColor: "rgba(255,255,255,0.03)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
  },
  statusLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  statusText: {
    fontSize: 13,
    fontWeight: "700",
  },
  ratingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  ratingText: {
    fontSize: 14,
    fontWeight: "800",
    color: gold[500],
  },
  reviewCount: {
    fontSize: 11,
    fontWeight: "400",
    color: "rgba(255,255,255,0.35)",
  },

  // Certifier badge
  certifierPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    alignSelf: "center",
    marginBottom: 16,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: "rgba(212,175,55,0.06)",
    borderWidth: 1,
    borderColor: "rgba(212,175,55,0.12)",
  },
  certifierText: {
    fontSize: 12,
    fontWeight: "600",
    color: gold[500],
  },

  // Footer (same as product card)
  footer: {
    alignItems: "center",
    paddingHorizontal: 28,
    paddingBottom: 20,
    paddingTop: 4,
  },
  footerDivider: {
    width: "80%",
    height: 1,
    backgroundColor: "rgba(212,175,55,0.08)",
    marginBottom: 14,
  },
  brandFooter: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  footerStar: {
    fontSize: 10,
    color: gold[500],
  },
  footerLink: {
    fontSize: 12,
    fontWeight: "700",
    color: gold[500],
  },
  footerDot: {
    fontSize: 8,
    color: "#333333",
  },
  footerTagline: {
    fontSize: 11,
    color: neutral[500],
  },
});
