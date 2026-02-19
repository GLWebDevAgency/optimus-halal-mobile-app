/**
 * ShareCard — Visual + text share card for scan results
 *
 * Renders a branded card (off-screen), captures it as an image via
 * react-native-view-shot, then shares via expo-sharing. Falls back
 * to plain-text sharing if image capture fails.
 */

import React, { forwardRef } from "react";
import { View, Text, StyleSheet, Share, Platform } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";

// Guard native imports — react-native-view-shot requires a dev client build
let captureRef: typeof import("react-native-view-shot").captureRef | null = null;
let Sharing: typeof import("expo-sharing") | null = null;
try {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  captureRef = require("react-native-view-shot").captureRef;
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  Sharing = require("expo-sharing");
} catch {
  // Expo Go — fall back to text-only sharing
}
import {
  brand,
  primary,
  halalStatus as halalStatusTokens,
  neutral,
  darkTheme,
} from "@/theme/colors";

// ── Types ────────────────────────────────────────────────────

export interface ShareCardData {
  productName: string;
  brand: string | null;
  halalStatus: "halal" | "haram" | "doubtful" | "unknown";
  certifier: string | null;
  isBoycotted: boolean;
  barcode: string;
}

export interface ShareLabels {
  statusLabel: string;
  certifiedBy: string;
  boycotted: string;
  verifiedWith: string;
  tagline: string;
}

// ── Status visual config for the card ────────────────────────

const STATUS_VISUAL: Record<
  string,
  { icon: keyof typeof MaterialIcons.glyphMap; color: string; bg: string; emoji: string }
> = {
  halal: {
    icon: "verified",
    color: halalStatusTokens.halal.base,
    bg: "#0a1a10",
    emoji: "✅",
  },
  haram: {
    icon: "dangerous",
    color: halalStatusTokens.haram.base,
    bg: "#1a0a0a",
    emoji: "❌",
  },
  doubtful: {
    icon: "help",
    color: halalStatusTokens.doubtful.base,
    bg: "#1a140a",
    emoji: "⚠️",
  },
  unknown: {
    icon: "help-outline",
    color: halalStatusTokens.unknown.base,
    bg: "#0f0f0f",
    emoji: "❓",
  },
};

// ── Visual Card Component (rendered off-screen, captured as image) ──

export const ShareCardView = forwardRef<View, { data: ShareCardData; labels: ShareLabels }>(
  function ShareCardView({ data, labels }, ref) {
    const status = STATUS_VISUAL[data.halalStatus] ?? STATUS_VISUAL.unknown;

    return (
      <View
        ref={ref}
        style={[styles.card, { backgroundColor: status.bg }]}
        collapsable={false}
      >
        {/* Top bar with logo */}
        <View style={styles.topBar}>
          <View style={styles.logoBadge}>
            <Text style={styles.logoText}>🌿 Optimus Halal</Text>
          </View>
        </View>

        {/* Status icon + verdict */}
        <View style={styles.verdictSection}>
          <View style={[styles.iconCircle, { backgroundColor: `${status.color}20` }]}>
            <MaterialIcons name={status.icon} size={40} color={status.color} />
          </View>
          <Text style={[styles.verdictText, { color: status.color }]}>
            {labels.statusLabel}
          </Text>
        </View>

        {/* Product info */}
        <View style={styles.productSection}>
          <Text style={styles.productName} numberOfLines={2}>
            {data.productName}
          </Text>
          {data.brand ? (
            <Text style={styles.productBrand}>{data.brand}</Text>
          ) : null}
        </View>

        {/* Certifier */}
        {data.certifier ? (
          <View style={styles.infoRow}>
            <MaterialIcons name="workspace-premium" size={16} color={primary[400]} />
            <Text style={styles.infoText}>
              {labels.certifiedBy}: {data.certifier}
            </Text>
          </View>
        ) : null}

        {/* Boycott warning */}
        {data.isBoycotted ? (
          <View style={[styles.infoRow, styles.boycottRow]}>
            <MaterialIcons name="warning" size={16} color={halalStatusTokens.haram.base} />
            <Text style={[styles.infoText, { color: halalStatusTokens.haram.base }]}>
              {labels.boycotted}
            </Text>
          </View>
        ) : null}

        {/* Barcode */}
        <View style={styles.barcodeRow}>
          <MaterialIcons name="qr-code-2" size={14} color={neutral[500]} />
          <Text style={styles.barcodeText}>{data.barcode}</Text>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <View style={styles.footerDivider} />
          <Text style={styles.footerText}>{labels.verifiedWith}</Text>
          <Text style={styles.footerTagline}>{labels.tagline}</Text>
        </View>
      </View>
    );
  },
);

// ── Text message generator (fallback) ────────────────────────

export function generateShareMessage(
  data: ShareCardData,
  labels: ShareLabels,
): string {
  const emoji = STATUS_VISUAL[data.halalStatus]?.emoji ?? "❓";

  let message = `${emoji} ${labels.statusLabel}\n\n`;

  message += `📦 ${data.productName}`;
  if (data.brand) message += ` — ${data.brand}`;
  message += "\n";

  if (data.certifier) {
    message += `📋 ${labels.certifiedBy}: ${data.certifier}\n`;
  }

  if (data.isBoycotted) {
    message += `🚨 ${labels.boycotted}\n`;
  }

  message += `\n─────────────────────\n`;
  message += `${labels.verifiedWith} 🌿\n`;
  message += labels.tagline;

  return message;
}

// ── Capture + share (image with text fallback) ───────────────

export async function captureAndShareCard(
  viewRef: React.RefObject<View | null>,
  data: ShareCardData,
  labels: ShareLabels,
): Promise<void> {
  const textMessage = generateShareMessage(data, labels);

  try {
    if (!captureRef || !Sharing) throw new Error("Native modules unavailable");

    // Capture the visual card as a PNG
    const uri = await captureRef(viewRef, {
      format: "png",
      quality: 1,
      result: "tmpfile",
    });

    // Check if sharing is available (always true on iOS/Android, but defensive)
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
    // If capture/share fails, fall through to text
    if (
      error instanceof Error &&
      error.message.includes("User did not share")
    ) {
      return;
    }
    console.warn("[ShareCard] Image share failed, falling back to text:", error);
  }

  // Fallback: plain text share
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
    console.error("[ShareCard] Text share failed:", error);
  }
}

// ── Keep legacy export for backward compat during transition ──

export async function shareProductCard(
  data: ShareCardData,
  labels: ShareLabels,
): Promise<void> {
  const message = generateShareMessage(data, labels);
  try {
    await Share.share({ message });
  } catch (error: unknown) {
    if (
      error instanceof Error &&
      error.message.includes("User did not share")
    ) {
      return;
    }
    console.error("[ShareCard] Share failed:", error);
  }
}

// ── Styles ───────────────────────────────────────────────────

const styles = StyleSheet.create({
  card: {
    width: 360,
    borderRadius: 24,
    padding: 28,
    overflow: "hidden",
  },
  topBar: {
    flexDirection: "row",
    justifyContent: "center",
    marginBottom: 24,
  },
  logoBadge: {
    backgroundColor: "rgba(19, 236, 106, 0.12)",
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
  },
  logoText: {
    color: brand.primary,
    fontSize: 14,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  verdictSection: {
    alignItems: "center",
    marginBottom: 20,
  },
  iconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  verdictText: {
    fontSize: 22,
    fontWeight: "800",
    letterSpacing: 0.3,
  },
  productSection: {
    alignItems: "center",
    marginBottom: 16,
  },
  productName: {
    color: "#ffffff",
    fontSize: 18,
    fontWeight: "700",
    textAlign: "center",
    lineHeight: 24,
  },
  productBrand: {
    color: neutral[400],
    fontSize: 14,
    fontWeight: "500",
    marginTop: 4,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 8,
    alignSelf: "center",
  },
  boycottRow: {
    backgroundColor: "rgba(239, 68, 68, 0.10)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  infoText: {
    color: neutral[300],
    fontSize: 13,
    fontWeight: "500",
  },
  barcodeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    alignSelf: "center",
    marginTop: 4,
    marginBottom: 16,
  },
  barcodeText: {
    color: neutral[500],
    fontSize: 12,
    fontWeight: "400",
    fontVariant: ["tabular-nums"],
  },
  footer: {
    alignItems: "center",
  },
  footerDivider: {
    width: 60,
    height: 1,
    backgroundColor: "rgba(255,255,255,0.08)",
    marginBottom: 12,
  },
  footerText: {
    color: neutral[400],
    fontSize: 12,
    fontWeight: "500",
    marginBottom: 2,
  },
  footerTagline: {
    color: neutral[500],
    fontSize: 11,
    fontWeight: "400",
  },
});
