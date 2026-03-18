import {
  AbsoluteFill,
  Audio,
  Sequence,
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  spring,
  staticFile,
} from "remotion";
import { z } from "zod";
import { NaqiyLogo, GoldText } from "../components";
import { colors, fonts, goldTextStyle, rulingColor } from "../theme";

/**
 * IngredientReel V4 — 15s educational ingredient verdict.
 *
 * INTRO → NAME → 4x VERDICT → SOURCE → END
 * Dark mode. Calm springs. Factual, no provocation.
 * Tone: Naqiy verbal identity — Calme, Factuel, Inclusif, Humble.
 */

const SNAP = { damping: 25, stiffness: 400, mass: 0.3 };

const RULING_LABELS: Record<string, string> = {
  halal: "HALAL",
  haram: "HARAM",
  doubtful: "DOUTEUX",
  unknown: "INCONNU",
};

export const ingredientReelSchema = z.object({
  ingredientName: z.string(),
  ingredientNameAr: z.string().optional(),
  rulingHanafi: z.enum(["halal", "haram", "doubtful", "unknown"]),
  rulingShafii: z.enum(["halal", "haram", "doubtful", "unknown"]),
  rulingMaliki: z.enum(["halal", "haram", "doubtful", "unknown"]),
  rulingHanbali: z.enum(["halal", "haram", "doubtful", "unknown"]),
  hookText: z.string().optional(),
  sourceText: z.string().optional(),
  lang: z.enum(["fr", "en", "ar"]).default("fr"),
  mode: z.enum(["light", "dark"]).default("dark"),
});

type Props = z.infer<typeof ingredientReelSchema>;

export const IngredientReel: React.FC<Props> = ({
  ingredientName,
  ingredientNameAr,
  rulingHanafi,
  rulingShafii,
  rulingMaliki,
  rulingHanbali,
  hookText,
  sourceText,
  mode = "dark",
}) => {
  const dark = mode !== "light";
  const bg = dark ? "#0A0A0A" : "#FAFAF8";

  const rulings = [rulingHanafi, rulingShafii, rulingMaliki, rulingHanbali];
  const isUnanimous = rulings.every((r) => r === rulings[0]);
  const hook = hookText ?? (isUnanimous ? "Consensus des 4 écoles" : "Avis des écoles juridiques");

  const madhabs = [
    { label: "HANAFITE", ruling: rulingHanafi },
    { label: "CHAFIITE", ruling: rulingShafii },
    { label: "MALIKITE", ruling: rulingMaliki },
    { label: "HANBALITE", ruling: rulingHanbali },
  ];

  return (
    <AbsoluteFill style={{ backgroundColor: bg }}>
      <Audio
        src={staticFile("audio/wind-ambient.mp3")}
        volume={(f) =>
          interpolate(f, [0, 30, 400, 450], [0, 0.12, 0.12, 0], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          })
        }
      />

      {/* HOOK */}
      <Sequence from={0} durationInFrames={75}>
        <CenterText text={hook} size={64} dark={dark} />
      </Sequence>

      {/* NAME */}
      <Sequence from={45} durationInFrames={75}>
        <NameScene name={ingredientName} nameAr={ingredientNameAr} dark={dark} />
      </Sequence>

      {/* 4x VERDICT */}
      {madhabs.map((m, i) => (
        <Sequence key={i} from={120 + i * 60} durationInFrames={60}>
          <VerdictSlide label={m.label} ruling={m.ruling} index={i} dark={dark} />
        </Sequence>
      ))}

      {/* SOURCE */}
      {sourceText && (
        <Sequence from={360} durationInFrames={40}>
          <SourceScene text={sourceText} dark={dark} />
        </Sequence>
      )}

      {/* END */}
      <Sequence from={390}>
        <EndCard dark={dark} />
      </Sequence>
    </AbsoluteFill>
  );
};

// ── Sub-components ──

const CenterText: React.FC<{ text: string; size: number; dark: boolean }> = ({
  text,
  size,
  dark,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const sc = spring({ frame, fps, config: SNAP });
  const scale = interpolate(sc, [0, 1], [1.25, 1]);
  const op = interpolate(frame, [0, 6], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill
      style={{
        alignItems: "center",
        justifyContent: "center",
        opacity: op,
        transform: `scale(${scale})`,
      }}
    >
      <span
        style={{
          fontFamily: fonts.heading,
          fontSize: size,
          fontWeight: 900,
          color: dark ? "#FFFFFF" : "#0d1b13",
          letterSpacing: 4,
          textAlign: "center",
          padding: "0 80px",
        }}
      >
        {text}
      </span>
    </AbsoluteFill>
  );
};

const NameScene: React.FC<{ name: string; nameAr?: string; dark: boolean }> = ({
  name,
  nameAr,
  dark,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const sc = spring({ frame, fps, config: SNAP });
  const scale = interpolate(sc, [0, 1], [1.12, 1]);
  const op = interpolate(frame, [0, 8], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill
      style={{
        alignItems: "center",
        justifyContent: "center",
        gap: 16,
        opacity: op,
        transform: `scale(${scale})`,
      }}
    >
      <span
        style={{
          ...goldTextStyle,
          fontFamily: fonts.heading,
          fontSize: 78,
          fontWeight: 900,
          textAlign: "center",
          lineHeight: 1.1,
          padding: "0 60px",
        }}
      >
        {name}
      </span>
      {nameAr && (
        <span
          style={{
            fontFamily: fonts.arabic,
            fontSize: 36,
            color: dark ? "rgba(255,255,255,0.3)" : "rgba(0,0,0,0.3)",
            direction: "rtl",
          }}
        >
          {nameAr}
        </span>
      )}
    </AbsoluteFill>
  );
};

const VerdictSlide: React.FC<{
  label: string;
  ruling: string;
  index: number;
  dark: boolean;
}> = ({ label, ruling, index, dark }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const sc = spring({ frame, fps, config: SNAP });
  const scale = interpolate(sc, [0, 1], [1.15, 1]);
  const op = interpolate(frame, [0, 5], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const color = rulingColor(ruling);
  const rulingText = RULING_LABELS[ruling] ?? ruling.toUpperCase();

  return (
    <AbsoluteFill
      style={{
        alignItems: "center",
        justifyContent: "center",
        gap: 20,
        opacity: op,
        transform: `scale(${scale})`,
      }}
    >
      <div style={{ width: 50, height: 3, backgroundColor: color, borderRadius: 2 }} />
      <span
        style={{
          fontFamily: fonts.heading,
          fontSize: 22,
          fontWeight: 600,
          color: dark ? "rgba(255,255,255,0.35)" : "rgba(0,0,0,0.35)",
          letterSpacing: 6,
        }}
      >
        {label}
      </span>
      <span
        style={{
          fontFamily: fonts.heading,
          fontSize: 100,
          fontWeight: 900,
          color,
          letterSpacing: 5,
          lineHeight: 1,
        }}
      >
        {rulingText}
      </span>
      <div style={{ position: "absolute", bottom: 280, display: "flex", gap: 12 }}>
        {[0, 1, 2, 3].map((d) => (
          <div
            key={d}
            style={{
              width: d === index ? 28 : 8,
              height: 8,
              borderRadius: 4,
              backgroundColor:
                d === index ? colors.gold : dark ? "rgba(255,255,255,0.12)" : "rgba(0,0,0,0.12)",
            }}
          />
        ))}
      </div>
    </AbsoluteFill>
  );
};

const SourceScene: React.FC<{ text: string; dark: boolean }> = ({ text, dark }) => {
  const frame = useCurrentFrame();
  const op = interpolate(frame, [0, 12], [0, 0.45], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", opacity: op }}>
      <span
        style={{
          fontFamily: fonts.body,
          fontSize: 22,
          color: dark ? "rgba(255,255,255,0.4)" : "rgba(0,0,0,0.4)",
          fontStyle: "italic",
          textAlign: "center",
          padding: "0 80px",
        }}
      >
        {text}
      </span>
    </AbsoluteFill>
  );
};

const EndCard: React.FC<{ dark: boolean }> = ({ dark }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const logoSc = spring({ frame, fps, config: SNAP });
  const textOp = interpolate(frame, [10, 25], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill
      style={{
        backgroundColor: dark ? "#0A0A0A" : "#FAFAF8",
        alignItems: "center",
        justifyContent: "center",
        gap: 30,
      }}
    >
      <div style={{ transform: `scale(${logoSc})` }}>
        <NaqiyLogo size={140} />
      </div>
      <div
        style={{
          opacity: textOp,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 14,
        }}
      >
        <GoldText fontSize={48} letterSpacing={6}>NAQIY</GoldText>
        <span
          style={{
            fontFamily: fonts.body,
            fontSize: 24,
            color: dark ? "rgba(255,255,255,0.45)" : "rgba(0,0,0,0.45)",
          }}
        >
          Scanne. Comprends. Choisis.
        </span>
      </div>
    </AbsoluteFill>
  );
};
