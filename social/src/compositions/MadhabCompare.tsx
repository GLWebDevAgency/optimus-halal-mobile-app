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
 * MadhabCompare V4 — 15s educational scholarly comparison.
 *
 * TOPIC → SPLIT → 4x MADHAB → EVIDENCE → END
 * Each madhab gets 2s. Dark mode. Full scholarly detail, nothing truncated.
 * Tone: Naqiy verbal identity — "Chaque école a ses preuves."
 */

const SNAP = { damping: 25, stiffness: 400, mass: 0.3 };
const rulingEnum = z.enum(["halal", "haram", "doubtful", "unknown"]);

export const madhabCompareSchema = z.object({
  topic: z.string(),
  topicAr: z.string().optional(),
  hanafiRuling: rulingEnum,
  hanafiReason: z.string(),
  hanafiDalil: z.string().optional(),
  hanafiRef: z.string().optional(),
  shafiiRuling: rulingEnum,
  shafiiReason: z.string(),
  shafiiDalil: z.string().optional(),
  shafiiRef: z.string().optional(),
  malikiRuling: rulingEnum,
  malikiReason: z.string(),
  malikiDalil: z.string().optional(),
  malikiRef: z.string().optional(),
  hanbaliRuling: rulingEnum,
  hanbaliReason: z.string(),
  hanbaliDalil: z.string().optional(),
  hanbaliRef: z.string().optional(),
  commonEvidence: z.string().optional(),
  sourceText: z.string(),
  mode: z.enum(["light", "dark"]).default("dark"),
});

type Props = z.infer<typeof madhabCompareSchema>;

/** Show the first sentence — no truncation, nothing hidden. */
const firstSentence = (text: string): string => {
  const s = text.split(". ")[0];
  return s.endsWith(".") ? s : s + ".";
};

const RULING_LABELS: Record<string, string> = {
  halal: "HALAL",
  haram: "HARAM",
  doubtful: "DOUTEUX",
  unknown: "INCONNU",
};

export const MadhabCompare: React.FC<Props> = (props) => {
  const frame = useCurrentFrame();
  const dark = props.mode !== "light";
  const bg = dark ? "#0A0A0A" : "#FAFAF8";

  const madhabs = [
    { label: "HANAFITE", ruling: props.hanafiRuling, reason: props.hanafiReason },
    { label: "CHAFIITE", ruling: props.shafiiRuling, reason: props.shafiiReason },
    { label: "MALIKITE", ruling: props.malikiRuling, reason: props.malikiReason },
    { label: "HANBALITE", ruling: props.hanbaliRuling, reason: props.hanbaliReason },
  ];

  // Dynamic split text
  const verdicts = madhabs.map((m) => m.ruling);
  const counts: Record<string, number> = {};
  verdicts.forEach((v) => (counts[v] = (counts[v] || 0) + 1));
  const splitParts = Object.entries(counts).map(
    ([ruling, count]) => ({ ruling, count, label: RULING_LABELS[ruling] })
  );

  return (
    <AbsoluteFill style={{ backgroundColor: bg }}>
      <Audio
        src={staticFile("audio/wind-ambient.mp3")}
        volume={(f) =>
          interpolate(f, [0, 30, 400, 450], [0, 0.15, 0.15, 0], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          })
        }
      />

      {/* HOOK: Topic name */}
      <Sequence from={0} durationInFrames={90}>
        <Hook topic={props.topic} topicAr={props.topicAr} dark={dark} />
      </Sequence>

      {/* SPLIT: "2 HALAL · 2 DOUTEUX" */}
      <Sequence from={45} durationInFrames={50}>
        <SplitReveal parts={splitParts} dark={dark} />
      </Sequence>

      {/* 4x MADHAB CARDS */}
      {madhabs.map((m, i) => (
        <Sequence key={i} from={90 + i * 60} durationInFrames={60}>
          <MadhabSlide
            label={m.label}
            ruling={m.ruling}
            reason={firstSentence(m.reason)}
            index={i}
            dark={dark}
          />
        </Sequence>
      ))}

      {/* EVIDENCE */}
      {props.commonEvidence && (
        <Sequence from={330} durationInFrames={60}>
          <Evidence text={props.commonEvidence} dark={dark} />
        </Sequence>
      )}

      {/* END CARD */}
      <Sequence from={390}>
        <EndCard tagline="Chaque école a ses preuves." dark={dark} />
      </Sequence>
    </AbsoluteFill>
  );
};

// ── Sub-components ──

const Hook: React.FC<{ topic: string; topicAr?: string; dark: boolean }> = ({
  topic,
  topicAr,
  dark,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const sc = spring({ frame, fps, config: SNAP });
  const scale = interpolate(sc, [0, 1], [1.2, 1]);
  const op = interpolate(frame, [0, 8], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

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
      <span
        style={{
          ...goldTextStyle,
          fontFamily: fonts.heading,
          fontSize: 72,
          fontWeight: 900,
          textAlign: "center",
          lineHeight: 1.1,
          padding: "0 60px",
        }}
      >
        {topic}
      </span>
      {topicAr && (
        <span
          style={{
            fontFamily: fonts.arabic,
            fontSize: 36,
            color: dark ? "rgba(255,255,255,0.3)" : "rgba(0,0,0,0.3)",
            direction: "rtl",
          }}
        >
          {topicAr}
        </span>
      )}
      <span
        style={{
          fontFamily: fonts.heading,
          fontSize: 36,
          fontWeight: 700,
          color: dark ? "#FFFFFF" : "#0d1b13",
          letterSpacing: 3,
          marginTop: 20,
        }}
      >
        Avis des 4 écoles juridiques
      </span>
    </AbsoluteFill>
  );
};

const SplitReveal: React.FC<{
  parts: { ruling: string; count: number; label: string }[];
  dark: boolean;
}> = ({ parts, dark }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const sc = spring({ frame, fps, config: SNAP });
  const scale = interpolate(sc, [0, 1], [0.8, 1]);
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
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 30,
        }}
      >
        {parts.map((p, i) => (
          <div
            key={i}
            style={{
              display: "flex",
              alignItems: "baseline",
              gap: 10,
            }}
          >
            {i > 0 && (
              <span
                style={{
                  fontFamily: fonts.body,
                  fontSize: 30,
                  color: dark ? "rgba(255,255,255,0.2)" : "rgba(0,0,0,0.2)",
                }}
              >
                ·
              </span>
            )}
            <span
              style={{
                fontFamily: fonts.heading,
                fontSize: 64,
                fontWeight: 900,
                color: rulingColor(p.ruling),
              }}
            >
              {p.count}
            </span>
            <span
              style={{
                fontFamily: fonts.heading,
                fontSize: 28,
                fontWeight: 700,
                color: rulingColor(p.ruling),
                letterSpacing: 2,
              }}
            >
              {p.label}
            </span>
          </div>
        ))}
      </div>
    </AbsoluteFill>
  );
};

const MadhabSlide: React.FC<{
  label: string;
  ruling: string;
  reason: string;
  index: number;
  dark: boolean;
}> = ({ label, ruling, reason, index, dark }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const sc = spring({ frame, fps, config: SNAP });
  const scale = interpolate(sc, [0, 1], [1.12, 1]);
  const op = interpolate(frame, [0, 6], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const reasonOp = interpolate(frame, [8, 18], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const color = rulingColor(ruling);
  const rulingText = RULING_LABELS[ruling] ?? ruling.toUpperCase();

  // Progress dots
  const dots = [0, 1, 2, 3];

  return (
    <AbsoluteFill
      style={{
        alignItems: "center",
        justifyContent: "center",
        gap: 24,
        opacity: op,
        transform: `scale(${scale})`,
      }}
    >
      {/* Accent line */}
      <div
        style={{
          width: 60,
          height: 3,
          backgroundColor: color,
          borderRadius: 2,
        }}
      />

      {/* School name */}
      <span
        style={{
          fontFamily: fonts.heading,
          fontSize: 22,
          fontWeight: 600,
          color: dark ? "rgba(255,255,255,0.4)" : "rgba(0,0,0,0.4)",
          letterSpacing: 6,
        }}
      >
        {label}
      </span>

      {/* Ruling — BIG */}
      <span
        style={{
          fontFamily: fonts.heading,
          fontSize: 90,
          fontWeight: 900,
          color,
          letterSpacing: 4,
          lineHeight: 1,
        }}
      >
        {rulingText}
      </span>

      {/* Scholarly reason — full first sentence, nothing truncated */}
      <span
        style={{
          fontFamily: fonts.body,
          fontSize: 21,
          fontWeight: 400,
          color: dark ? "rgba(255,255,255,0.6)" : "rgba(0,0,0,0.6)",
          textAlign: "center",
          maxWidth: 860,
          lineHeight: 1.5,
          opacity: reasonOp,
          padding: "0 50px",
        }}
      >
        {reason}
      </span>

      {/* Progress dots */}
      <div
        style={{
          position: "absolute",
          bottom: 260,
          display: "flex",
          gap: 12,
        }}
      >
        {dots.map((d) => (
          <div
            key={d}
            style={{
              width: d === index ? 28 : 8,
              height: 8,
              borderRadius: 4,
              backgroundColor:
                d === index
                  ? colors.gold
                  : dark
                    ? "rgba(255,255,255,0.15)"
                    : "rgba(0,0,0,0.15)",
              transition: "width 0.3s",
            }}
          />
        ))}
      </div>
    </AbsoluteFill>
  );
};

const Evidence: React.FC<{ text: string; dark: boolean }> = ({ text, dark }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const sc = spring({ frame, fps, config: SNAP });
  const scale = interpolate(sc, [0, 1], [0.95, 1]);
  const op = interpolate(frame, [0, 12], [0, 1], {
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
        padding: "0 80px",
      }}
    >
      <span
        style={{
          ...goldTextStyle,
          fontFamily: fonts.body,
          fontSize: 28,
          fontWeight: 400,
          fontStyle: "italic",
          textAlign: "center",
          lineHeight: 1.6,
        }}
      >
        « {text} »
      </span>
    </AbsoluteFill>
  );
};

const EndCard: React.FC<{ tagline: string; dark: boolean }> = ({
  tagline,
  dark,
}) => {
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
          {tagline}
        </span>
      </div>
    </AbsoluteFill>
  );
};
