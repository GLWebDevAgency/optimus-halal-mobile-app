import { useCurrentFrame, interpolate, spring, useVideoConfig } from "remotion";
import { rulingColor, rulingLabel, colors, fonts } from "../theme";

interface VerdictBadgeProps {
  madhab: string;
  ruling: string;
  enterDelay?: number;
  lang?: "fr" | "en" | "ar";
}

const MADHAB_LABELS: Record<string, Record<string, string>> = {
  hanafi: { fr: "Hanafite", en: "Hanafi", ar: "حنفي" },
  shafii: { fr: "Chafiite", en: "Shafi'i", ar: "شافعي" },
  maliki: { fr: "Malikite", en: "Maliki", ar: "مالكي" },
  hanbali: { fr: "Hanbalite", en: "Hanbali", ar: "حنبلي" },
};

export const VerdictBadge: React.FC<VerdictBadgeProps> = ({
  madhab,
  ruling,
  enterDelay = 0,
  lang = "fr",
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const scale = spring({
    frame: frame - enterDelay,
    fps,
    config: { damping: 12, stiffness: 150, mass: 0.6 },
  });

  const opacity = interpolate(frame - enterDelay, [0, 8], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const color = rulingColor(ruling);
  const label = rulingLabel(ruling, lang);
  const madhabLabel = MADHAB_LABELS[madhab]?.[lang] ?? madhab;

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "20px 32px",
        borderRadius: 20,
        backgroundColor: colors.bgCard,
        border: `2px solid ${color}33`,
        transform: `scale(${scale})`,
        opacity,
        width: "100%",
      }}
    >
      <span
        style={{
          fontFamily: fonts.body,
          fontSize: 36,
          fontWeight: 600,
          color: colors.textPrimary,
        }}
      >
        {madhabLabel}
      </span>
      <span
        style={{
          fontFamily: fonts.body,
          fontSize: 34,
          fontWeight: 800,
          color,
          letterSpacing: 1.5,
          textTransform: "uppercase",
        }}
      >
        {label}
      </span>
    </div>
  );
};
