/**
 * ShareCard — Generates a shareable text card for scan results
 *
 * Creates a branded, formatted message for WhatsApp/Instagram sharing
 * with emoji status indicators and trust score.
 * All labels are passed by the caller (i18n-aware).
 */

import { Share } from "react-native";

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

// ── Emoji map ────────────────────────────────────────────────

const STATUS_EMOJI: Record<string, string> = {
  halal: "✅",
  haram: "❌",
  doubtful: "⚠️",
  unknown: "❓",
};

// ── Message generator ────────────────────────────────────────

export function generateShareMessage(
  data: ShareCardData,
  labels: ShareLabels,
): string {
  const emoji = STATUS_EMOJI[data.halalStatus] ?? "❓";

  let message = `${emoji} ${labels.statusLabel}\n\n`;

  // Product name + brand
  message += `📦 ${data.productName}`;
  if (data.brand) message += ` — ${data.brand}`;
  message += "\n";

  // Certifier
  if (data.certifier) {
    message += `📋 ${labels.certifiedBy}: ${data.certifier}\n`;
  }

  // Boycott warning
  if (data.isBoycotted) {
    message += `🚨 ${labels.boycotted}\n`;
  }

  // Footer
  message += `\n─────────────────────\n`;
  message += `${labels.verifiedWith} 🌿\n`;
  message += labels.tagline;

  return message;
}

// ── Share action ─────────────────────────────────────────────

export async function shareProductCard(
  data: ShareCardData,
  labels: ShareLabels,
): Promise<void> {
  const message = generateShareMessage(data, labels);

  try {
    await Share.share({ message });
  } catch (error: unknown) {
    // User cancelled the share sheet — not an error
    if (
      error instanceof Error &&
      error.message.includes("User did not share")
    ) {
      return;
    }
    console.error("[ShareCard] Share failed:", error);
  }
}
