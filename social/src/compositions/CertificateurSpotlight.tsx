import {
  AbsoluteFill,
  Audio,
  Sequence,
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  spring,
  Easing,
  staticFile,
} from "remotion";
import { z } from "zod";
import { NaqiyLogo, GoldText } from "../components";
import { colors, fonts, goldTextStyle } from "../theme";

/**
 * CertificateurSpotlight V4 — 15s educational certifier analysis.
 *
 * INTRO → NAME → SCORE → INDICATORS → END
 * Dark mode. Factual presentation of control practices.
 * Tone: Naqiy verbal identity — "Le score mesure la rigueur, pas le jugement."
 */

const SNAP = { damping: 25, stiffness: 400, mass: 0.3 };

export const certSpotlightSchema = z.object({
  name: z.string(),
  country: z.string(),
  founded: z.string().optional(),
  trustScore: z.number().min(0).max(100),
  tier: z.enum(["S", "A", "B", "C", "D", "F"]),
  controllersEmployees: z.boolean(),
  controllersPresentEach: z.boolean(),
  salariedSlaughterers: z.boolean(),
  acceptsMechanical: z.boolean(),
  acceptsElectronarcosis: z.boolean(),
  acceptsStunning: z.boolean(),
  mode: z.enum(["light", "dark"]).default("dark"),
});

type Props = z.infer<typeof certSpotlightSchema>;

export const CertificateurSpotlight: React.FC<Props> = ({
  name,
  country,
  founded,
  trustScore,
  tier,
  controllersEmployees,
  controllersPresentEach,
  salariedSlaughterers,
  acceptsMechanical,
  acceptsElectronarcosis,
  acceptsStunning,
  mode = "dark",
}) => {
  const frame = useCurrentFrame();
  const dark = mode !== "light";
  const bg = dark ? "#0A0A0A" : "#FAFAF8";

  const indicators = [
    { label: "Contrôleurs salariés", value: controllersEmployees, positive: true },
    { label: "Présence systématique", value: controllersPresentEach, positive: true },
    { label: "Sacrificateurs salariés", value: salariedSlaughterers, positive: true },
    { label: "Abattage mécanique", value: acceptsMechanical, positive: false },
    { label: "Électronarcose", value: acceptsElectronarcosis, positive: false },
    { label: "Étourdissement", value: acceptsStunning, positive: false },
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
      <Sequence from={0} durationInFrames={50}>
        <HookScene dark={dark} />
      </Sequence>

      {/* NAME + COUNTRY */}
      <Sequence from={30} durationInFrames={70}>
        <NameScene name={name} country={country} founded={founded} dark={dark} />
      </Sequence>

      {/* TRUST SCORE */}
      <Sequence from={90} durationInFrames={120}>
        <ScoreScene score={trustScore} tier={tier} dark={dark} />
      </Sequence>

      {/* 6 INDICATORS rapid */}
      {indicators.map((ind, i) => (
        <Sequence key={i} from={200 + i * 20} durationInFrames={200 - i * 20}>
          <IndicatorRow
            label={ind.label}
            value={ind.value}
            positive={ind.positive}
            index={i}
            dark={dark}
          />
        </Sequence>
      ))}

      {/* EXIT */}
      <Sequence from={380}>
        <AbsoluteFill
          style={{
            backgroundColor: bg,
            opacity: interpolate(frame - 380, [0, 25], [0, 1], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
            }),
          }}
        />
      </Sequence>

      {/* END */}
      <Sequence from={400}>
        <EndCard dark={dark} />
      </Sequence>
    </AbsoluteFill>
  );
};

// ── Sub-components ──

const HookScene: React.FC<{ dark: boolean }> = ({ dark }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const sc = spring({ frame, fps, config: SNAP });
  const scale = interpolate(sc, [0, 1], [1.2, 1]);
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
          fontSize: 48,
          fontWeight: 800,
          color: dark ? "#FFFFFF" : "#0d1b13",
          letterSpacing: 4,
        }}
      >
        Pratiques de contrôle
      </span>
    </AbsoluteFill>
  );
};

const NameScene: React.FC<{
  name: string;
  country: string;
  founded?: string;
  dark: boolean;
}> = ({ name, country, founded, dark }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const sc = spring({ frame, fps, config: SNAP });
  const scale = interpolate(sc, [0, 1], [1.15, 1]);
  const op = interpolate(frame, [0, 8], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill
      style={{
        alignItems: "center",
        justifyContent: "center",
        gap: 14,
        opacity: op,
        transform: `scale(${scale})`,
      }}
    >
      <span
        style={{
          ...goldTextStyle,
          fontFamily: fonts.heading,
          fontSize: 80,
          fontWeight: 900,
        }}
      >
        {name}
      </span>
      <span
        style={{
          fontFamily: fonts.body,
          fontSize: 26,
          color: dark ? "rgba(255,255,255,0.35)" : "rgba(0,0,0,0.35)",
        }}
      >
        {country}
        {founded ? ` · ${founded}` : ""}
      </span>
    </AbsoluteFill>
  );
};

const ScoreScene: React.FC<{
  score: number;
  tier: string;
  dark: boolean;
}> = ({ score, tier, dark }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const counter = Math.round(
    interpolate(frame, [0, 45], [0, score], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
      easing: Easing.out(Easing.cubic),
    })
  );

  const sc = spring({ frame, fps, config: SNAP });
  const scale = interpolate(sc, [0, 1], [1.1, 1]);
  const op = interpolate(frame, [0, 8], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const scoreColor =
    score >= 70 ? colors.halal : score >= 40 ? colors.doubtful : colors.haram;

  const tierOp = interpolate(frame, [30, 45], [0, 1], {
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
          fontFamily: fonts.heading,
          fontSize: 18,
          fontWeight: 600,
          color: dark ? "rgba(255,255,255,0.3)" : "rgba(0,0,0,0.3)",
          letterSpacing: 6,
        }}
      >
        TRUST SCORE
      </span>
      <span
        style={{
          fontFamily: fonts.heading,
          fontSize: 120,
          fontWeight: 900,
          color: scoreColor,
          lineHeight: 1,
        }}
      >
        {counter}
      </span>
      <span
        style={{
          fontFamily: fonts.heading,
          fontSize: 40,
          fontWeight: 800,
          color: scoreColor,
          opacity: tierOp,
          letterSpacing: 4,
          padding: "4px 20px",
          borderRadius: 10,
          border: `2px solid ${scoreColor}33`,
        }}
      >
        TIER {tier}
      </span>
    </AbsoluteFill>
  );
};

const IndicatorRow: React.FC<{
  label: string;
  value: boolean;
  positive: boolean;
  index: number;
  dark: boolean;
}> = ({ label, value, positive, index, dark }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const sc = spring({ frame, fps, config: SNAP });
  const tx = interpolate(sc, [0, 1], [40, 0]);
  const op = interpolate(frame, [0, 8], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // For positive indicators: true = green, false = red
  // For negative indicators (accepts...): true = red (bad), false = green (good)
  const isGood = positive ? value : !value;
  const color = isGood ? colors.halal : colors.haram;
  const icon = isGood ? "✓" : "✕";

  const y = 550 + index * 70;

  return (
    <div
      style={{
        position: "absolute",
        top: y,
        left: 100,
        right: 100,
        opacity: op,
        transform: `translateX(${tx}px)`,
        display: "flex",
        alignItems: "center",
        gap: 18,
      }}
    >
      <span
        style={{
          fontFamily: fonts.heading,
          fontSize: 28,
          fontWeight: 800,
          color,
          width: 36,
          textAlign: "center",
        }}
      >
        {icon}
      </span>
      <span
        style={{
          fontFamily: fonts.body,
          fontSize: 26,
          fontWeight: 400,
          color: dark ? "rgba(255,255,255,0.6)" : "rgba(0,0,0,0.6)",
        }}
      >
        {label}
      </span>
    </div>
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
        <GoldText fontSize={48} letterSpacing={6}>
          NAQIY
        </GoldText>
        <span
          style={{
            fontFamily: fonts.body,
            fontSize: 24,
            color: dark ? "rgba(255,255,255,0.45)" : "rgba(0,0,0,0.45)",
          }}
        >
          La transparence est un droit.
        </span>
      </div>
    </AbsoluteFill>
  );
};
