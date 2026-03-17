/** Naqiy brand design tokens — shared across all compositions */

export const colors = {
  bg: "#0C0C0C",
  bgCard: "#1A1A1A",
  bgElevated: "#242424",

  gold: "#D4AF37",
  goldLight: "#E8D48B",
  goldDark: "#B8860B",

  green: "#2E7D32",
  greenLight: "#4CAF50",
  greenLeaf: "#3D8B40",

  white: "#FFFFFF",
  textPrimary: "#F5F5F5",
  textSecondary: "#A0A0A0",
  textMuted: "#666666",

  halal: "#22C55E",
  haram: "#EF4444",
  doubtful: "#F59E0B",
  unknown: "#6B7280",
} as const;

export const gradients = {
  gold: `linear-gradient(180deg, ${colors.goldLight} 0%, ${colors.goldDark} 100%)`,
  goldHorizontal: `linear-gradient(90deg, ${colors.goldLight} 0%, ${colors.goldDark} 100%)`,
  darkVignette: `radial-gradient(ellipse at center, ${colors.bg} 40%, #000000 100%)`,
} as const;

export const fonts = {
  heading: "Inter, system-ui, sans-serif",
  body: "Inter, system-ui, sans-serif",
  arabic: "'Noto Sans Arabic', 'Geeza Pro', sans-serif",
} as const;

export const sizes = {
  /** Instagram Reel / TikTok / Story */
  reel: { width: 1080, height: 1920 },
  /** Instagram Feed Post */
  square: { width: 1080, height: 1080 },
  /** YouTube landscape */
  landscape: { width: 1920, height: 1080 },
} as const;

/** Reusable CSS for gold gradient text (via background-clip) */
export const goldTextStyle: React.CSSProperties = {
  background: gradients.gold,
  backgroundClip: "text",
  WebkitBackgroundClip: "text",
  WebkitTextFillColor: "transparent",
  color: "transparent",
};

export const rulingColor = (ruling: string): string => {
  switch (ruling) {
    case "halal":
      return colors.halal;
    case "haram":
      return colors.haram;
    case "doubtful":
      return colors.doubtful;
    default:
      return colors.unknown;
  }
};

export const rulingLabel = (
  ruling: string,
  lang: "fr" | "en" | "ar" = "fr"
): string => {
  const labels: Record<string, Record<string, string>> = {
    halal: { fr: "HALAL", en: "HALAL", ar: "حلال" },
    haram: { fr: "HARAM", en: "HARAM", ar: "حرام" },
    doubtful: { fr: "DOUTEUX", en: "DOUBTFUL", ar: "مشكوك فيه" },
    unknown: { fr: "INCONNU", en: "UNKNOWN", ar: "غير معروف" },
  };
  return labels[ruling]?.[lang] ?? ruling.toUpperCase();
};
