/**
 * ShareCard — Premium Naqiy share card for scan results
 *
 * World-class branded card rendered off-screen, captured as PNG via
 * react-native-view-shot, shared via expo-sharing. Text fallback.
 *
 * Layout (top → bottom):
 *   1. Glass header — logo "N" + ✦ VÉRIFIÉ badge
 *   2. Hero — product image + name + brand (gold uppercase)
 *   3. Madhab consensus — 4 dots + label
 *   4. Verdict — status dot glow + "Composition Conforme"
 *   5. Boycott strip (conditional)
 *   6. Score encadré — certifier + NaqiyGradeBadge + health ScoreRing
 *   7. Barcode with barcode icon
 *   8. Footer — ✦ naqiy.app • Scanne. Comprends. Choisis.
 */

import React, { forwardRef } from "react";
import { View, Text, StyleSheet, Share, Platform } from "react-native";
import { Image } from "expo-image";
import Svg, { Path } from "react-native-svg";
import {
  BarcodeIcon,
  PackageIcon,
  WarningIcon,
} from "phosphor-react-native";

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
  halalStatus as halalStatusTokens,
  neutral,
  gold,
} from "@/theme/colors";
import { buildVerdictSummary } from "@/utils/verdict-summary";

// ── Types ────────────────────────────────────────────────────

export interface ShareCardData {
  productName: string;
  brand: string | null;
  halalStatus: "halal" | "haram" | "doubtful" | "unknown";
  certifier: string | null;
  isBoycotted: boolean;
  barcode: string;
  /** Product image URL (optional — shows placeholder icon if missing) */
  imageUrl?: string | null;
  /** Madhab verdicts for consensus dots */
  madhabStatuses?: Array<{ madhab: string; status: string }>;
  /** Naqiy Trust Grade (1-5, only when certifier present) */
  trustGrade?: { grade: number; label: string; color: string } | null;
  /** Health score (0-100) */
  healthScore?: number | null;
  /** Health label ("Bon", "Mediocre", etc.) */
  healthLabel?: string | null;
  /** Certifier grade label for verdict summary */
  certifierGrade?: string | null;
  /** Certifier numeric score for verdict summary (0-100) */
  certifierScore?: number | null;
}

export interface ShareLabels {
  statusLabel: string;
  certifiedBy: string;
  boycotted: string;
  verifiedWith: string;
  tagline: string;
  /** Intelligent fiqh verdict line (from buildVerdictSummary) */
  fiqhLine?: string;
  /** Certifier assessment line (from buildVerdictSummary) */
  certifierLine?: string | null;
}

// ── Status visual config ─────────────────────────────────────

const STATUS_VISUAL: Record<
  string,
  { color: string; bg: string; emoji: string }
> = {
  halal: {
    color: halalStatusTokens.halal.base,
    bg: "#0a1a10",
    emoji: "✅",
  },
  haram: {
    color: halalStatusTokens.haram.base,
    bg: "#1a0a0a",
    emoji: "❌",
  },
  doubtful: {
    color: halalStatusTokens.doubtful.base,
    bg: "#1a140a",
    emoji: "⚠️",
  },
  unknown: {
    color: halalStatusTokens.unknown.base,
    bg: "#0f0f0f",
    emoji: "❓",
  },
};

// ── NaqiyGradeBadge strip (inlined — no useTheme, always dark) ──

const TRUST_GRADES_VISUAL = [
  { grade: 1, arabic: "١", color: "#22c55e" },
  { grade: 2, arabic: "٢", color: "#84cc16" },
  { grade: 3, arabic: "٣", color: "#f59e0b" },
  { grade: 4, arabic: "٤", color: "#f97316" },
  { grade: 5, arabic: "٥", color: "#ef4444" },
] as const;

function InlineGradeStrip({ activeGrade }: { activeGrade: number }) {
  return (
    <View style={s.gradeStrip}>
      <Text style={s.gradeN}>N</Text>
      {TRUST_GRADES_VISUAL.map((g) => {
        const isActive = g.grade === activeGrade;
        return (
          <View
            key={g.grade}
            style={[
              s.gradePill,
              isActive ? s.gradePillActive : s.gradePillInactive,
              { backgroundColor: g.color },
              !isActive && { opacity: 0.2 },
            ]}
          >
            <Text
              style={[
                s.gradePillText,
                { fontSize: isActive ? 14 : 10 },
              ]}
            >
              {g.arabic}
            </Text>
          </View>
        );
      })}
    </View>
  );
}

// ── Inline Health ScoreRing (static SVG — no animation) ──────

function InlineScoreRing({
  score,
  color,
}: {
  score: number;
  color: string;
}) {
  const size = 52;
  const strokeWidth = 4;
  const r = (size - strokeWidth) / 2;
  const cx = size / 2;
  const cy = size / 2;
  const arcLength = Math.PI * r;
  const offset = arcLength * (1 - score / 100);
  const svgHeight = size / 2 + strokeWidth;
  const arcPath = `M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`;

  return (
    <View style={{ width: size, height: svgHeight, alignItems: "center" }}>
      <Svg width={size} height={svgHeight} viewBox={`0 0 ${size} ${svgHeight}`}>
        <Path
          d={arcPath}
          fill="none"
          stroke="rgba(255,255,255,0.08)"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
        />
        {score > 0 && (
          <Path
            d={arcPath}
            fill="none"
            stroke={color}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={arcLength}
            strokeDashoffset={offset}
          />
        )}
      </Svg>
      <View style={s.ringOverlay} pointerEvents="none">
        <Text style={[s.ringScore, { color }]}>{score}</Text>
      </View>
    </View>
  );
}

function getHealthColor(score: number): string {
  if (score >= 70) return "#22c55e";
  if (score >= 40) return "#f59e0b";
  return "#ef4444";
}

function getMadhabDotColor(status: string): string {
  if (status === "halal") return halalStatusTokens.halal.base;
  if (status === "haram") return halalStatusTokens.haram.base;
  if (status === "doubtful") return halalStatusTokens.doubtful.base;
  return "#6b7280";
}

// ── Visual Card Component ────────────────────────────────────

export const ShareCardView = forwardRef<View, { data: ShareCardData; labels: ShareLabels }>(
  function ShareCardView({ data, labels }, ref) {
    const status = STATUS_VISUAL[data.halalStatus] ?? STATUS_VISUAL.unknown;
    const hasCertifier = !!data.certifier;
    const hasTrustGrade = hasCertifier && !!data.trustGrade;
    const hasHealthScore = data.healthScore != null && data.healthScore > 0;
    const healthColor = hasHealthScore ? getHealthColor(data.healthScore!) : "#6b7280";

    // Madhab consensus
    const madhabStatuses = data.madhabStatuses ?? [];
    const hasMadhab = madhabStatuses.length > 0;
    const allAgree = hasMadhab && madhabStatuses.every(
      (v) => v.status === madhabStatuses[0].status,
    );

    return (
      <View
        ref={ref}
        style={[s.card, { backgroundColor: status.bg }]}
        collapsable={false}
      >
        {/* ── 1. Glass Header ── */}
        <View style={s.glassHeader}>
          <View style={s.logoRow}>
            <Image
              source={require("@assets/images/logo_naqiy.webp")}
              style={s.logoImg}
              contentFit="contain"
            />
            <Text style={s.logoName}>Naqiy</Text>
          </View>
          <View style={s.verifiedBadge}>
            <Text style={s.verifiedText}>✦ VÉRIFIÉ</Text>
          </View>
        </View>

        {/* ── 2. Hero — image + name + brand ── */}
        <View style={s.heroSection}>
          <View style={s.productImgContainer}>
            {data.imageUrl ? (
              <Image
                source={{ uri: data.imageUrl }}
                style={s.productImg}
                contentFit="contain"
              />
            ) : (
              <PackageIcon size={32} color="rgba(255,255,255,0.15)" />
            )}
          </View>
          <Text style={s.productName} numberOfLines={2}>
            {data.productName}
          </Text>
          {data.brand ? (
            <Text style={s.productBrand}>{data.brand.toUpperCase()}</Text>
          ) : null}
        </View>

        {/* ── 3. Madhab consensus dots + verdict summary ── */}
        {hasMadhab && (
          <View style={s.madhabSection}>
            <View style={s.madhabRow}>
              <View style={s.madhabDots}>
                {madhabStatuses.map((v, i) => (
                  <View
                    key={i}
                    style={[
                      s.madhabDot,
                      { backgroundColor: getMadhabDotColor(v.status) },
                    ]}
                  />
                ))}
              </View>
              {labels.fiqhLine ? (
                <Text style={s.madhabLabel} numberOfLines={2}>
                  {labels.fiqhLine}
                </Text>
              ) : (
                <Text style={s.madhabLabel}>
                  {allAgree ? "Les 4 \u00e9coles s'accordent" : "Avis partag\u00e9s entre \u00e9coles"}
                </Text>
              )}
            </View>
            {labels.certifierLine ? (
              <Text style={s.certifierLineText} numberOfLines={2}>
                {labels.certifierLine}
              </Text>
            ) : null}
          </View>
        )}

        {/* ── 4. Verdict label ── */}
        <View style={s.verdictRow}>
          <View style={[s.statusDotOuter, { backgroundColor: `${status.color}20` }]}>
            <View style={[s.statusDot, { backgroundColor: status.color }]} />
          </View>
          <Text style={[s.verdictText, { color: status.color }]}>
            {labels.statusLabel}
          </Text>
        </View>

        {/* ── 5. Boycott strip ── */}
        {data.isBoycotted && (
          <View style={s.boycottStrip}>
            <WarningIcon size={14} color={halalStatusTokens.haram.base} />
            <Text style={s.boycottText}>{labels.boycotted}</Text>
          </View>
        )}

        {/* ── 6. Score encadré ── */}
        {(hasTrustGrade || hasHealthScore) && (
          <View style={s.scoreBox}>
            {/* Certifier + NaqiyGradeBadge (only when certified) */}
            {hasTrustGrade && (
              <>
                <View style={s.certifierRow}>
                  <Text style={s.certifierLabel}>{labels.certifiedBy}:</Text>
                  <Text style={s.certifierName}>{data.certifier}</Text>
                </View>
                <InlineGradeStrip activeGrade={data.trustGrade!.grade} />
                <Text style={[s.gradeLabel, { color: data.trustGrade!.color }]}>
                  {data.trustGrade!.label}
                </Text>
                {hasHealthScore && <View style={s.scoreBoxSeparator} />}
              </>
            )}

            {/* Health ScoreRing */}
            {hasHealthScore && (
              <View style={s.healthRow}>
                <InlineScoreRing score={data.healthScore!} color={healthColor} />
                <View style={s.healthTextCol}>
                  <Text style={s.healthTitle}>Santé</Text>
                  <Text style={[s.healthLabel, { color: healthColor }]}>
                    {data.healthLabel ?? "—"}
                  </Text>
                </View>
              </View>
            )}
          </View>
        )}

        {/* ── 7. Barcode ── */}
        <View style={s.barcodeRow}>
          <BarcodeIcon size={14} color={neutral[500]} />
          <Text style={s.barcodeText}>{data.barcode}</Text>
        </View>

        {/* ── 8. Footer ── */}
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

  if (labels.fiqhLine) {
    message += `\n📖 ${labels.fiqhLine}\n`;
  }
  if (labels.certifierLine) {
    message += `${labels.certifierLine}\n`;
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
    console.warn("[ShareCard] Image share failed, falling back to text:", error);
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
    console.error("[ShareCard] Text share failed:", error);
  }
}

// ── Legacy export ────────────────────────────────────────────

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

const s = StyleSheet.create({
  card: {
    width: 360,
    borderRadius: 28,
    overflow: "hidden",
  },

  // Glass header
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
  logoImg: {
    width: 24,
    height: 24,
    borderRadius: 6,
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

  // Hero
  heroSection: {
    alignItems: "center",
    paddingHorizontal: 28,
    paddingTop: 24,
    paddingBottom: 16,
  },
  productImgContainer: {
    width: 88,
    height: 88,
    borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.04)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
    overflow: "hidden",
  },
  productImg: {
    width: 88,
    height: 88,
  },
  productName: {
    color: "#ffffff",
    fontSize: 20,
    fontWeight: "800",
    textAlign: "center",
    lineHeight: 26,
    letterSpacing: -0.3,
    marginBottom: 6,
  },
  productBrand: {
    fontSize: 12,
    fontWeight: "600",
    letterSpacing: 1.2,
    color: "rgba(212,175,55,0.7)",
  },

  // Madhab dots + verdict
  madhabSection: {
    marginBottom: 6,
    paddingHorizontal: 20,
    gap: 4,
  },
  madhabRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  madhabDots: {
    flexDirection: "row",
    gap: 4,
  },
  madhabDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  madhabLabel: {
    fontSize: 11,
    fontWeight: "500",
    color: "rgba(212,175,55,0.6)",
    flex: 1,
  },
  certifierLineText: {
    fontSize: 10,
    fontWeight: "400",
    color: "rgba(255,255,255,0.35)",
    textAlign: "center",
  },

  // Verdict
  verdictRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginBottom: 12,
  },
  statusDotOuter: {
    width: 16,
    height: 16,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  verdictText: {
    fontSize: 16,
    fontWeight: "800",
    letterSpacing: -0.2,
  },

  // Boycott
  boycottStrip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginHorizontal: 20,
    marginBottom: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: "rgba(239,68,68,0.08)",
    borderWidth: 1,
    borderColor: "rgba(239,68,68,0.12)",
    alignSelf: "center",
  },
  boycottText: {
    fontSize: 13,
    fontWeight: "600",
    color: halalStatusTokens.haram.base,
  },

  // Score encadré
  scoreBox: {
    marginHorizontal: 20,
    marginBottom: 14,
    paddingHorizontal: 18,
    paddingVertical: 16,
    borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.03)",
    borderWidth: 1,
    borderColor: "rgba(212,175,55,0.12)",
    alignItems: "center",
  },
  certifierRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 12,
  },
  certifierLabel: {
    fontSize: 12,
    color: "rgba(255,255,255,0.45)",
  },
  certifierName: {
    fontSize: 12,
    fontWeight: "700",
    color: gold[500],
  },

  // NaqiyGradeBadge strip (inlined)
  gradeStrip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    marginBottom: 6,
  },
  gradeN: {
    fontSize: 13,
    fontWeight: "900",
    color: gold[500],
    marginRight: 3,
  },
  gradePill: {
    borderRadius: 6,
    alignItems: "center",
    justifyContent: "center",
  },
  gradePillActive: {
    width: 44,
    height: 26,
  },
  gradePillInactive: {
    width: 22,
    height: 22,
  },
  gradePillText: {
    color: "#ffffff",
    fontWeight: "900",
  },
  gradeLabel: {
    fontSize: 12,
    fontWeight: "700",
    marginBottom: 12,
  },
  scoreBoxSeparator: {
    width: "60%",
    height: 1,
    backgroundColor: "rgba(255,255,255,0.06)",
    marginBottom: 12,
  },

  // Health ScoreRing
  healthRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  ringOverlay: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 1,
    alignItems: "center",
  },
  ringScore: {
    fontSize: 15,
    fontWeight: "900",
  },
  healthTextCol: {
    gap: 1,
  },
  healthTitle: {
    fontSize: 11,
    fontWeight: "500",
    color: "rgba(255,255,255,0.4)",
  },
  healthLabel: {
    fontSize: 13,
    fontWeight: "700",
  },

  // Barcode
  barcodeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    alignSelf: "center",
    marginBottom: 10,
  },
  barcodeText: {
    color: neutral[500],
    fontSize: 11,
    fontWeight: "400",
    fontVariant: ["tabular-nums"],
  },

  // Footer
  footer: {
    alignItems: "center",
    paddingHorizontal: 28,
    paddingBottom: 20,
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
