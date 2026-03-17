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
 * AyahWisdom V2 — 15s contemplative Quranic verse.
 *
 * BISMILLAH → ARABIC → TRANSLATION → REFERENCE → END
 * Dark mode. Gentle springs. Spiritual, minimal.
 */

const GENTLE = { damping: 20, stiffness: 80, mass: 0.8 };

export const ayahWisdomSchema = z.object({
  arabicText: z.string(),
  translationFr: z.string(),
  reference: z.string(),
  mode: z.enum(["light", "dark"]).default("dark"),
});

type Props = z.infer<typeof ayahWisdomSchema>;

export const AyahWisdom: React.FC<Props> = ({
  arabicText,
  translationFr,
  reference,
  mode = "dark",
}) => {
  const frame = useCurrentFrame();
  const dark = mode !== "light";
  const bg = dark ? "#0A0A0A" : "#FAFAF8";

  return (
    <AbsoluteFill style={{ backgroundColor: bg }}>
      <Audio
        src={staticFile("audio/wind-ambient.mp3")}
        volume={(f) =>
          interpolate(f, [0, 45, 390, 450], [0, 0.3, 0.3, 0], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          })
        }
      />

      {/* Bismillah */}
      <Sequence from={0} durationInFrames={400}>
        <Bismillah dark={dark} />
      </Sequence>

      {/* Arabic text */}
      <Sequence from={25} durationInFrames={375}>
        <ArabicText text={arabicText} dark={dark} />
      </Sequence>

      {/* Gold divider */}
      <Sequence from={80} durationInFrames={320}>
        <GoldLine />
      </Sequence>

      {/* Translation */}
      <Sequence from={90} durationInFrames={310}>
        <Translation text={translationFr} dark={dark} />
      </Sequence>

      {/* Reference */}
      <Sequence from={160} durationInFrames={240}>
        <Reference text={reference} dark={dark} />
      </Sequence>

      {/* Exit */}
      <Sequence from={380}>
        <AbsoluteFill
          style={{
            backgroundColor: bg,
            opacity: interpolate(frame - 380, [0, 35], [0, 1], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
            }),
          }}
        />
      </Sequence>

      {/* End */}
      <Sequence from={415}>
        <QuietEnd dark={dark} />
      </Sequence>
    </AbsoluteFill>
  );
};

// ── Sub-components ──

const Bismillah: React.FC<{ dark: boolean }> = ({ dark }) => {
  const frame = useCurrentFrame();
  const op = interpolate(frame, [0, 25], [0, 0.4], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <div
      style={{
        position: "absolute",
        top: 300,
        left: 0,
        right: 0,
        textAlign: "center",
        opacity: op,
      }}
    >
      <span
        style={{
          fontFamily: fonts.arabic,
          fontSize: 34,
          color: dark ? "rgba(255,255,255,0.25)" : "rgba(0,0,0,0.25)",
          letterSpacing: 2,
        }}
      >
        بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ
      </span>
    </div>
  );
};

const ArabicText: React.FC<{ text: string; dark: boolean }> = ({
  text,
  dark,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const sc = spring({ frame, fps, config: GENTLE });
  const scale = interpolate(sc, [0, 1], [0.96, 1]);
  const op = interpolate(frame, [0, 30], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <div
      style={{
        position: "absolute",
        top: 400,
        left: 80,
        right: 80,
        textAlign: "center",
        opacity: op,
        transform: `scale(${scale})`,
      }}
    >
      <span
        style={{
          fontFamily: fonts.arabic,
          fontSize: 52,
          fontWeight: 600,
          color: dark ? "#FFFFFF" : "#0d1b13",
          lineHeight: 2,
          direction: "rtl",
        }}
      >
        {text}
      </span>
    </div>
  );
};

const GoldLine: React.FC = () => {
  const frame = useCurrentFrame();
  const w = interpolate(frame, [0, 30], [0, 250], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const op = interpolate(frame, [0, 20], [0, 0.5], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <div
      style={{
        position: "absolute",
        top: 880,
        left: 540 - w / 2,
        width: w,
        height: 1,
        background: `linear-gradient(90deg, transparent, ${colors.gold}55, transparent)`,
        opacity: op,
      }}
    />
  );
};

const Translation: React.FC<{ text: string; dark: boolean }> = ({
  text,
  dark,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const sc = spring({ frame, fps, config: GENTLE });
  const ty = interpolate(sc, [0, 1], [20, 0]);
  const op = interpolate(frame, [0, 25], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <div
      style={{
        position: "absolute",
        top: 930,
        left: 80,
        right: 80,
        textAlign: "center",
        opacity: op,
        transform: `translateY(${ty}px)`,
      }}
    >
      <span
        style={{
          fontFamily: fonts.body,
          fontSize: 34,
          fontWeight: 400,
          fontStyle: "italic",
          color: dark ? "rgba(255,255,255,0.6)" : "rgba(0,0,0,0.6)",
          lineHeight: 1.6,
        }}
      >
        « {text} »
      </span>
    </div>
  );
};

const Reference: React.FC<{ text: string; dark: boolean }> = ({
  text,
  dark,
}) => {
  const frame = useCurrentFrame();
  const op = interpolate(frame, [0, 20], [0, 0.5], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <div
      style={{
        position: "absolute",
        bottom: 340,
        left: 0,
        right: 0,
        textAlign: "center",
        opacity: op,
      }}
    >
      <span
        style={{
          ...goldTextStyle,
          fontFamily: fonts.body,
          fontSize: 24,
          fontWeight: 600,
          letterSpacing: 3,
        }}
      >
        {text}
      </span>
    </div>
  );
};

const QuietEnd: React.FC<{ dark: boolean }> = ({ dark }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const sc = spring({ frame, fps, config: GENTLE });
  const op = interpolate(frame, [8, 20], [0, 0.6], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill
      style={{
        backgroundColor: dark ? "#0A0A0A" : "#FAFAF8",
        alignItems: "center",
        justifyContent: "center",
        gap: 24,
      }}
    >
      <div style={{ transform: `scale(${sc})` }}>
        <NaqiyLogo size={120} />
      </div>
      <div style={{ opacity: op }}>
        <GoldText fontSize={40} letterSpacing={6}>
          NAQIY
        </GoldText>
      </div>
    </AbsoluteFill>
  );
};
