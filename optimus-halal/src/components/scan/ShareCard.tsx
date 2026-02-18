/**
 * ShareCard — Generates a shareable text card for scan results
 *
 * Creates a branded, formatted message for WhatsApp/Instagram sharing
 * with emoji status indicators and trust score.
 *
 * No extra native dependencies needed — uses React Native's built-in Share API.
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

// ── Emoji & label maps (French defaults) ─────────────────────

const STATUS_EMOJI: Record<string, string> = {
  halal: "✅",
  haram: "❌",
  doubtful: "⚠️",
  unknown: "❓",
};

const SHARED_LABELS: Omit<ShareLabels, "statusLabel"> = {
  certifiedBy: "Certifié par",
  boycotted: "Produit boycotté",
  verifiedWith: "Vérifié avec Optimus Halal",
  tagline: "L'app halal de confiance",
};

const DEFAULT_LABELS: Record<string, ShareLabels> = {
  halal:    { ...SHARED_LABELS, statusLabel: "HALAL CERTIFIÉ" },
  haram:    { ...SHARED_LABELS, statusLabel: "HARAM DÉTECTÉ" },
  doubtful: { ...SHARED_LABELS, statusLabel: "STATUT DOUTEUX" },
  unknown:  { ...SHARED_LABELS, statusLabel: "NON VÉRIFIÉ" },
};

// ── Message generator ────────────────────────────────────────

export function generateShareMessage(
  data: ShareCardData,
  labelsOverride?: Partial<ShareLabels>,
): string {
  const emoji = STATUS_EMOJI[data.halalStatus] ?? "❓";
  const defaults = DEFAULT_LABELS[data.halalStatus] ?? DEFAULT_LABELS.unknown;
  const labels: ShareLabels = { ...defaults, ...labelsOverride };

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
  labelsOverride?: Partial<ShareLabels>,
): Promise<void> {
  const message = generateShareMessage(data, labelsOverride);

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
