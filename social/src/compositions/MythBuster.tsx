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
import { colors, fonts, goldTextStyle } from "../theme";

/**
 * MythBuster V4 — 15s educational myth analysis.
 *
 * INTRO → STATEMENT → VERDICT → EXPLANATION → SOURCE → END
 * Dark mode. Calm presentation. No clickbait, no shock.
 * Tone: Naqiy verbal identity — Calme, Factuel, Inclusif, Humble.
 */

const SNAP = { damping: 25, stiffness: 400, mass: 0.3 };

export const mythBusterSchema = z.object({
  statement: z.string(),
  verdict: z.enum(["vrai", "faux", "nuance"]),
  explanation: z.string(),
  madhabs: z.string().optional(),
  sourceText: z.string(),
  mode: z.enum(["light", "dark"]).default("dark"),
});

type Props = z.infer<typeof mythBusterSchema>;

export const MythBuster: React.FC<Props> = ({
  statement,
  verdict,
  explanation,
  madhabs,
  sourceText,
  mode = "dark",
}) => {
  const frame = useCurrentFrame();
  const dark = mode !== "light";
  const bg = dark ? "#0A0A0A" : "#FAFAF8";

  const verdictColor =
    verdict === "vrai"
      ? colors.halal
      : verdict === "faux"
        ? colors.haram
        : colors.doubtful;

  const verdictLabel =
    verdict === "vrai" ? "VRAI" : verdict === "faux" ? "FAUX" : "NUANCÉ";

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

      {/* HOOK: "VRAI OU FAUX ?" */}
      <Sequence from={0} durationInFrames={30}>
        <HookFlash dark={dark} />
      </Sequence>

      {/* MYTH statement */}
      <Sequence from={10} durationInFrames={75}>
        <MythStatement text={statement} dark={dark} />
      </Sequence>

      {/* VERDICT slam */}
      <Sequence from={80} durationInFrames={60}>
        <VerdictSlam label={verdictLabel} color={verdictColor} dark={dark} />
      </Sequence>

      {/* EXPLANATION */}
      <Sequence from={130} durationInFrames={180}>
        <ExplanationScene
          text={explanation}
          madhabs={madhabs}
          dark={dark}
        />
      </Sequence>

      {/* SOURCE */}
      <Sequence from={310} durationInFrames={50}>
        <SourceScene text={sourceText} dark={dark} />
      </Sequence>

      {/* EXIT */}
      <Sequence from={360}>
        <AbsoluteFill
          style={{
            backgroundColor: bg,
            opacity: interpolate(frame - 360, [0, 30], [0, 1], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
            }),
          }}
        />
      </Sequence>

      {/* END */}
      <Sequence from={390}>
        <EndCard dark={dark} />
      </Sequence>
    </AbsoluteFill>
  );
};

// ── Sub-components ──

const HookFlash: React.FC<{ dark: boolean }> = ({ dark }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const sc = spring({ frame, fps, config: SNAP });
  const scale = interpolate(sc, [0, 1], [1.3, 1]);
  const op = interpolate(frame, [0, 5, 20, 30], [0, 1, 1, 0], {
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
          fontSize: 52,
          fontWeight: 900,
          color: colors.doubtful,
          letterSpacing: 5,
        }}
      >
        Idée reçue
      </span>
    </AbsoluteFill>
  );
};

const MythStatement: React.FC<{ text: string; dark: boolean }> = ({
  text,
  dark,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const sc = spring({ frame, fps, config: SNAP });
  const scale = interpolate(sc, [0, 1], [1.1, 1]);
  const op = interpolate(frame, [0, 10], [0, 1], {
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
        padding: "0 70px",
      }}
    >
      <span
        style={{
          fontFamily: fonts.body,
          fontSize: 44,
          fontWeight: 600,
          color: dark ? "#FFFFFF" : "#0d1b13",
          textAlign: "center",
          lineHeight: 1.4,
        }}
      >
        « {text} »
      </span>
    </AbsoluteFill>
  );
};

const VerdictSlam: React.FC<{
  label: string;
  color: string;
  dark: boolean;
}> = ({ label, color, dark }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const sc = spring({
    frame,
    fps,
    config: { damping: 12, stiffness: 300, mass: 0.3 },
  });
  const scale = interpolate(sc, [0, 1], [1.4, 1]);

  // Subtle accent glow — calm, not aggressive
  const flashOp = interpolate(frame, [0, 4, 15], [0.15, 0.08, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <>
      <AbsoluteFill
        style={{ backgroundColor: color, opacity: flashOp, pointerEvents: "none" }}
      />
      <AbsoluteFill
        style={{
          alignItems: "center",
          justifyContent: "center",
          transform: `scale(${scale})`,
        }}
      >
        <span
          style={{
            fontFamily: fonts.heading,
            fontSize: 110,
            fontWeight: 900,
            color,
            letterSpacing: 10,
          }}
        >
          {label}
        </span>
      </AbsoluteFill>
    </>
  );
};

const ExplanationScene: React.FC<{
  text: string;
  madhabs?: string;
  dark: boolean;
}> = ({ text, madhabs, dark }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const sc = spring({ frame, fps, config: SNAP });
  const ty = interpolate(sc, [0, 1], [30, 0]);
  const op = interpolate(frame, [0, 15], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const madhOp = interpolate(frame, [20, 35], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill
      style={{
        alignItems: "center",
        justifyContent: "center",
        gap: 30,
        opacity: op,
        transform: `translateY(${ty}px)`,
        padding: "0 70px",
      }}
    >
      <span
        style={{
          fontFamily: fonts.body,
          fontSize: 30,
          fontWeight: 400,
          color: dark ? "rgba(255,255,255,0.7)" : "rgba(0,0,0,0.7)",
          textAlign: "center",
          lineHeight: 1.55,
        }}
      >
        {text}
      </span>
      {madhabs && (
        <span
          style={{
            fontFamily: fonts.body,
            fontSize: 24,
            fontWeight: 400,
            fontStyle: "italic",
            color: dark ? "rgba(255,255,255,0.4)" : "rgba(0,0,0,0.4)",
            textAlign: "center",
            lineHeight: 1.5,
            opacity: madhOp,
          }}
        >
          {madhabs}
        </span>
      )}
    </AbsoluteFill>
  );
};

const SourceScene: React.FC<{ text: string; dark: boolean }> = ({
  text,
  dark,
}) => {
  const frame = useCurrentFrame();
  const op = interpolate(frame, [0, 12], [0, 0.4], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", opacity: op }}>
      <span
        style={{
          fontFamily: fonts.body,
          fontSize: 20,
          color: dark ? "rgba(255,255,255,0.35)" : "rgba(0,0,0,0.35)",
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
          Le savoir, pas les on-dit.
        </span>
      </div>
    </AbsoluteFill>
  );
};
